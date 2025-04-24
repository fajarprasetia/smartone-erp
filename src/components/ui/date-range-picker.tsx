"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DatePickerWithRangeProps {
  className?: string
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date,
  setDate,
}: DatePickerWithRangeProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range)
    if (range?.from && range?.to) {
      setIsOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setDate(undefined)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Select date range</span>
            )}
            {date && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 w-5 p-0 ml-auto" 
                onClick={handleClear}
              >
                ×
              </Button>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b flex justify-between items-center">
            <span className="font-medium text-sm">Date Range</span>
            <Select
              defaultValue="custom"
              onValueChange={(value) => {
                if (value === "last7") {
                  const today = new Date()
                  const from = addDays(today, -7)
                  setDate({ from, to: today })
                } else if (value === "last30") {
                  const today = new Date()
                  const from = addDays(today, -30)
                  setDate({ from, to: today })
                } else if (value === "thisMonth") {
                  const today = new Date()
                  const from = new Date(today.getFullYear(), today.getMonth(), 1)
                  setDate({ from, to: today })
                } else if (value === "lastMonth") {
                  const today = new Date()
                  const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                  const to = new Date(today.getFullYear(), today.getMonth(), 0)
                  setDate({ from, to })
                }
              }}
            >
              <SelectTrigger className="h-8 w-auto text-xs">
                <SelectValue placeholder="Quick select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Range</SelectItem>
                <SelectItem value="last7">Last 7 days</SelectItem>
                <SelectItem value="last30">Last 30 days</SelectItem>
                <SelectItem value="thisMonth">This month</SelectItem>
                <SelectItem value="lastMonth">Last month</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 