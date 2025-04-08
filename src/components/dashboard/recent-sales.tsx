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
import { formatCurrency } from "@/lib/utils"

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
          <p className="text-sm font-medium leading-none text-white">Olivia Martin</p>
          <p className="text-sm text-white/70">olivia.martin@email.com</p>
        </div>
        <div className="ml-auto font-medium text-white">{formatCurrency(1999000)}</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/02.png" alt="Avatar" />
          <AvatarFallback>JL</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none text-white">Jackson Lee</p>
          <p className="text-sm text-white/70">jackson.lee@email.com</p>
        </div>
        <div className="ml-auto font-medium text-white">{formatCurrency(3999000)}</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/03.png" alt="Avatar" />
          <AvatarFallback>IN</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none text-white">Isabella Nguyen</p>
          <p className="text-sm text-white/70">isabella.nguyen@email.com</p>
        </div>
        <div className="ml-auto font-medium text-white">{formatCurrency(2999000)}</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/04.png" alt="Avatar" />
          <AvatarFallback>WK</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none text-white">William Kim</p>
          <p className="text-sm text-white/70">will@email.com</p>
        </div>
        <div className="ml-auto font-medium text-white">{formatCurrency(4999000)}</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/05.png" alt="Avatar" />
          <AvatarFallback>SD</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none text-white">Sofia Davis</p>
          <p className="text-sm text-white/70">sofia.davis@email.com</p>
        </div>
        <div className="ml-auto font-medium text-white">{formatCurrency(1999000)}</div>
      </div>
    </div>
  )
} 