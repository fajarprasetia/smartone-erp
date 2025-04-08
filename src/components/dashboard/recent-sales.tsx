"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDate, formatNumber } from "@/lib/utils"

const recentSales = [
  {
    id: "ORD001",
    customer: "John Doe",
    avatar: "/avatars/01.png",
    amount: 1250.00,
    status: "Completed",
    date: "2024-03-15",
  },
  {
    id: "ORD002",
    customer: "Jane Smith",
    avatar: "/avatars/02.png",
    amount: 850.50,
    status: "Processing",
    date: "2024-03-14",
  },
  {
    id: "ORD003",
    customer: "Bob Johnson",
    avatar: "/avatars/03.png",
    amount: 2100.00,
    status: "Completed",
    date: "2024-03-13",
  },
  {
    id: "ORD004",
    customer: "Alice Brown",
    avatar: "/avatars/04.png",
    amount: 750.25,
    status: "Pending",
    date: "2024-03-12",
  },
  {
    id: "ORD005",
    customer: "Charlie Wilson",
    avatar: "/avatars/05.png",
    amount: 1500.75,
    status: "Completed",
    date: "2024-03-11",
  },
]

export function RecentSales() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/01.png" alt="Avatar" />
          <AvatarFallback>OM</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Olivia Martin</p>
          <p className="text-sm text-muted-foreground">olivia.martin@email.com</p>
        </div>
        <div className="ml-auto font-medium text-right">
          <div>{formatNumber(1999000)}</div>
          <div className="text-xs text-green-700">Completed</div>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/02.png" alt="Avatar" />
          <AvatarFallback>JL</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Jackson Lee</p>
          <p className="text-sm text-muted-foreground">jackson.lee@email.com</p>
        </div>
        <div className="ml-auto font-medium text-right">
          <div>{formatNumber(3999000)}</div>
          <div className="text-xs text-green-700">Completed</div>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/03.png" alt="Avatar" />
          <AvatarFallback>IN</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Isabella Nguyen</p>
          <p className="text-sm text-muted-foreground">isabella.nguyen@email.com</p>
        </div>
        <div className="ml-auto font-medium text-right">
          <div>{formatNumber(2999000)}</div>
          <div className="text-xs text-yellow-700">Processing</div>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/04.png" alt="Avatar" />
          <AvatarFallback>WK</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">William Kim</p>
          <p className="text-sm text-muted-foreground">william.kim@email.com</p>
        </div>
        <div className="ml-auto font-medium text-right">
          <div>{formatNumber(4999000)}</div>
          <div className="text-xs text-green-700">Completed</div>
        </div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/05.png" alt="Avatar" />
          <AvatarFallback>SD</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Sofia Davis</p>
          <p className="text-sm text-muted-foreground">sofia.davis@email.com</p>
        </div>
        <div className="ml-auto font-medium text-right">
          <div>{formatNumber(1999000)}</div>
          <div className="text-xs text-red-700">Failed</div>
        </div>
      </div>
    </div>
  )
} 