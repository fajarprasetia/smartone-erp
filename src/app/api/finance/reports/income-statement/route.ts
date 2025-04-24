import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { db } from "@/lib/db"
import { addMonths, format, parseISO, subMonths } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    // Validate session
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get query parameters
    const url = new URL(req.url)
    const startDate = url.searchParams.get("startDate")
    const endDate = url.searchParams.get("endDate")
    const periodId = url.searchParams.get("periodId")
    const compareToPrevious = url.searchParams.get("compareToPrevious") === "true"

    // Validate inputs - need either date range or period
    if (!startDate && !endDate && !periodId) {
      return NextResponse.json(
        { error: "Either date range or period ID must be provided" },
        { status: 400 }
      )
    }

    // If using periodId, fetch period dates
    let periodStartDate: string | null = null
    let periodEndDate: string | null = null
    let periodName: string | null = null

    if (periodId) {
      const period = await db.financialPeriod.findUnique({
        where: { id: periodId },
        select: { 
          name: true,
          startDate: true, 
          endDate: true
        }
      })

      if (!period) {
        return NextResponse.json(
          { error: "Invalid period ID" },
          { status: 400 }
        )
      }

      periodStartDate = format(period.startDate, "yyyy-MM-dd")
      periodEndDate = format(period.endDate, "yyyy-MM-dd")
      periodName = period.name
    }

    // Set the date range for the query
    const queryStartDate = periodStartDate || startDate
    const queryEndDate = periodEndDate || endDate

    if (!queryStartDate || !queryEndDate) {
      return NextResponse.json(
        { error: "Invalid date range" },
        { status: 400 }
      )
    }

    // Fetch accounts for income statement (Revenue and Expense accounts)
    const accounts = await db.chartOfAccount.findMany({
      where: {
        OR: [
          { type: "REVENUE" },
          { type: "EXPENSE" }
        ],
        active: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        subtype: true,
        parentId: true
      },
      orderBy: [
        { type: "asc" },
        { code: "asc" }
      ]
    })

    // Create account hierarchy
    const accountMap = new Map()
    const topLevelAccounts = {
      REVENUE: [],
      EXPENSE: []
    }

    // First, map all accounts by ID
    accounts.forEach(account => {
      accountMap.set(account.id, {
        ...account,
        balance: 0,
        children: []
      })
    })

    // Then, build the hierarchy
    accounts.forEach(account => {
      if (account.parentId && accountMap.has(account.parentId)) {
        const parent = accountMap.get(account.parentId)
        parent.children.push(accountMap.get(account.id))
      } else {
        // Top-level account
        topLevelAccounts[account.type].push(accountMap.get(account.id))
      }
    })

    // Fetch journal entry items for the specified date range
    const journalItems = await db.journalEntryItem.findMany({
      where: {
        journalEntry: {
          date: {
            gte: new Date(queryStartDate),
            lte: new Date(queryEndDate)
          },
          status: "POSTED"
        },
        account: {
          OR: [
            { type: "REVENUE" },
            { type: "EXPENSE" }
          ]
        }
      },
      select: {
        accountId: true,
        debit: true,
        credit: true,
        account: {
          select: {
            type: true
          }
        }
      }
    })

    // Calculate account balances
    let totalRevenue = 0
    let totalExpenses = 0

    journalItems.forEach(item => {
      if (!accountMap.has(item.accountId)) return

      const account = accountMap.get(item.accountId)
      const isRevenue = account.type === "REVENUE"
      
      // For revenue accounts: credits increase, debits decrease
      // For expense accounts: debits increase, credits decrease
      if (isRevenue) {
        account.balance += item.credit - item.debit
      } else {
        account.balance += item.debit - item.credit
      }
    })

    // Calculate totals and handle rollups for parent accounts
    const calculateTotals = (accounts, isRevenue = true) => {
      let total = 0
      
      accounts.forEach(account => {
        if (account.children && account.children.length > 0) {
          account.balance = calculateTotals(account.children, isRevenue)
        }
        
        total += account.balance
      })
      
      return total
    }

    totalRevenue = calculateTotals(topLevelAccounts.REVENUE, true)
    totalExpenses = calculateTotals(topLevelAccounts.EXPENSE, false)

    // If comparing to previous period, calculate previous period data
    let previousPeriodData = null
    if (compareToPrevious) {
      // Calculate previous period date range (same length as current period)
      const currentStartDate = new Date(queryStartDate)
      const currentEndDate = new Date(queryEndDate)
      const periodLengthMs = currentEndDate.getTime() - currentStartDate.getTime()
      
      const previousStartDate = new Date(currentStartDate.getTime() - periodLengthMs)
      const previousEndDate = new Date(currentEndDate.getTime() - periodLengthMs)
      
      const formattedPrevStart = format(previousStartDate, "yyyy-MM-dd")
      const formattedPrevEnd = format(previousEndDate, "yyyy-MM-dd")

      // Fetch journal entries for previous period
      const prevJournalItems = await db.journalEntryItem.findMany({
        where: {
          journalEntry: {
            date: {
              gte: previousStartDate,
              lte: previousEndDate
            },
            status: "POSTED"
          },
          account: {
            OR: [
              { type: "REVENUE" },
              { type: "EXPENSE" }
            ]
          }
        },
        select: {
          accountId: true,
          debit: true,
          credit: true,
          account: {
            select: {
              type: true
            }
          }
        }
      })

      // Calculate previous period totals
      let prevTotalRevenue = 0
      let prevTotalExpenses = 0

      // Create temporary map for previous period calculations
      const prevAccountMap = new Map()
      accounts.forEach(account => {
        prevAccountMap.set(account.id, { ...account, balance: 0 })
      })

      prevJournalItems.forEach(item => {
        if (!prevAccountMap.has(item.accountId)) return

        const account = prevAccountMap.get(item.accountId)
        const isRevenue = account.type === "REVENUE"
        
        if (isRevenue) {
          prevTotalRevenue += item.credit - item.debit
        } else {
          prevTotalExpenses += item.debit - item.credit
        }
      })

      previousPeriodData = {
        totalRevenue: prevTotalRevenue,
        totalExpenses: prevTotalExpenses,
        netIncome: prevTotalRevenue - prevTotalExpenses
      }
    }

    // Prepare response data
    const incomeStatementData = {
      revenues: topLevelAccounts.REVENUE,
      expenses: topLevelAccounts.EXPENSE,
      totalRevenue,
      totalExpenses,
      netIncome: totalRevenue - totalExpenses,
      startDate: queryStartDate,
      endDate: queryEndDate,
      previousPeriodData
    }

    // Add period info if applicable
    if (periodId && periodName) {
      incomeStatementData.periodId = periodId
      incomeStatementData.periodName = periodName
    }

    return NextResponse.json(incomeStatementData)
  } catch (error) {
    console.error("Income statement report error:", error)
    return NextResponse.json(
      { error: "Failed to generate income statement" },
      { status: 500 }
    )
  }
} 