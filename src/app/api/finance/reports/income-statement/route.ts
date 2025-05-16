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
        isActive: true
      },
      select: {
        id: true,
        code: true,
        name: true,
        type: true,
        subtype: true
      },
      orderBy: [
        { type: "asc" },
        { code: "asc" }
      ]
    })

    // Initialize an array to categorize accounts
    const accountsWithValues = accounts.map(account => {
      // Add the transactions field to all accounts
      return {
        ...account,
        transactions: [],
        balance: 0,
        children: []
      }
    })

    // Organize accounts by type
    const revenueAccounts = accountsWithValues.filter(account => account.type === "REVENUE")
    const expenseAccounts = accountsWithValues.filter(account => account.type === "EXPENSE")

    // Define date filter
    const dateFilter = {
      date: {
        gte: new Date(queryStartDate),
        lte: new Date(queryEndDate)
      }
    }

    // Find all journal entries with matching criteria
    const journalEntries = await db.journalEntry.findMany({
      where: {
        status: "POSTED",
        ...dateFilter
      },
      include: {
        items: {
          include: {
            account: true
          }
        }
      }
    })

    // Calculate account balances
    let totalRevenue = 0
    let totalExpenses = 0

    journalEntries.forEach(entry => {
      entry.items.forEach(item => {
        if (!accountsWithValues.some(account => account.id === item.accountId)) return

        const account = accountsWithValues.find(account => account.id === item.accountId)
        if (!account) return
        
        const isRevenue = account.type === "REVENUE"
        
        // For revenue accounts: credits increase, debits decrease
        // For expense accounts: debits increase, credits decrease
        if (isRevenue) {
          account.balance += item.credit - item.debit
        } else {
          account.balance += item.debit - item.credit
        }
      })
    })

    // Calculate totals and handle rollups for parent accounts
    const calculateTotals = (accounts: any[], isRevenue = true) => {
      let total = 0
      
      accounts.forEach(account => {
        if (account.children && account.children.length > 0) {
          account.balance = calculateTotals(account.children, isRevenue)
        }
        
        total += account.balance
      })
      
      return total
    }

    totalRevenue = calculateTotals(revenueAccounts, true)
    totalExpenses = calculateTotals(expenseAccounts, false)

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
      const prevJournalEntries = await db.journalEntry.findMany({
        where: {
          status: "POSTED",
          date: {
            gte: previousStartDate,
            lte: previousEndDate
          }
        },
        include: {
          items: {
            include: {
              account: true
            }
          }
        }
      })

      // Calculate previous period totals
      let prevTotalRevenue = 0
      let prevTotalExpenses = 0

      // Create temporary map for previous period calculations
      const prevAccountsWithValues = accountsWithValues.map(account => ({ ...account, balance: 0 }))

      prevJournalEntries.forEach(entry => {
        entry.items.forEach(item => {
          if (!prevAccountsWithValues.some(account => account.id === item.accountId)) return

          const account = prevAccountsWithValues.find(account => account.id === item.accountId)
          if (!account) return
          
          const isRevenue = account.type === "REVENUE"
          
          if (isRevenue) {
            prevTotalRevenue += item.credit - item.debit
          } else {
            prevTotalExpenses += item.debit - item.credit
          }
        })
      })

      previousPeriodData = {
        totalRevenue: prevTotalRevenue,
        totalExpenses: prevTotalExpenses,
        netIncome: prevTotalRevenue - prevTotalExpenses
      }
    }

    // Prepare response data
    const incomeStatementData: any = {
      revenues: revenueAccounts,
      expenses: expenseAccounts,
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