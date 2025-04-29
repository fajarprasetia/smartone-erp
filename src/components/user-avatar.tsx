"use client"

import * as React from "react"
import { LogOut, User, Settings } from "lucide-react"
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
    await signOut({ redirect: true, callbackUrl: "/auth/login" })
  }

  if (!session?.user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-10 w-10 rounded-full bg-white/20 dark:bg-black/20 backdrop-blur-sm hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-200"
        >
          <Avatar className="h-10 w-10 border-2 border-white/40 dark:border-white/10">
            {session.user.image ? (
              <AvatarImage src={session.user.image} alt={session.user.name || "User"} />
            ) : (
              <AvatarFallback className="bg-primary/20 text-foreground font-semibold">
                {session.user.name?.charAt(0) || "U"}
              </AvatarFallback>
            )}
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56 bg-white/30 dark:bg-black/30 backdrop-blur-md border-white/40 dark:border-white/10 rounded-lg shadow-lg" 
        align="end" 
        forceMount
      >
        <DropdownMenuLabel className="font-normal text-black dark:text-white">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-black dark:text-white">{session.user.name}</p>
            <p className="text-xs leading-none text-black/70 dark:text-white/70">
              {session.user.email}
            </p>
            {session.user.role?.name && (
              <p className="text-xs leading-none text-primary mt-1 font-medium">
                {session.user.role.name}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/30 dark:bg-white/10" />
        <DropdownMenuItem 
          className="cursor-pointer hover:bg-white/30 dark:hover:bg-white/10 focus:bg-white/30 dark:focus:bg-white/10 text-black dark:text-white"
          onClick={() => router.push('/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        {(session.user.role?.name === "System Administrator" || session.user.role?.name === "Administrator") && (
          <DropdownMenuItem 
            className="cursor-pointer hover:bg-white/30 dark:hover:bg-white/10 focus:bg-white/30 dark:focus:bg-white/10 text-black dark:text-white"
            onClick={() => router.push('/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-white/30 dark:bg-white/10" />
        <DropdownMenuItem 
          className="cursor-pointer text-red-500 hover:bg-red-500/10 hover:text-red-400 focus:bg-red-500/10 focus:text-red-400" 
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 