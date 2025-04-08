"use client"

import * as React from "react"
import { LogOut, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserAvatar() {
  const router = useRouter()
  const { data: session } = useSession()
  
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" })
  }

  if (!session?.user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full bg-white/10 dark:bg-black/20 backdrop-blur-sm hover:bg-white/20 dark:hover:bg-black/30">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-white">
              {session.user.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white/20 dark:bg-black/90 backdrop-blur-md border-white/30 dark:border-white/10" align="end" forceMount>
        <DropdownMenuLabel className="font-normal text-white">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-white">{session.user.name}</p>
            <p className="text-xs leading-none text-white/70">
              {session.user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/20 dark:bg-white/10" />
        <DropdownMenuItem className="cursor-pointer hover:bg-white/20 dark:hover:bg-white/10 focus:bg-white/20 dark:focus:bg-white/10 text-white">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="cursor-pointer text-red-300 hover:bg-red-500/10 hover:text-red-200 focus:bg-red-500/10 focus:text-red-200" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 