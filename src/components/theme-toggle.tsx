"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch by rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70">
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-white/20 dark:hover:bg-black/20"
        >
          {theme === "light" ? (
            <Sun className="h-4 w-4 text-orange-500 transition-transform duration-200" />
          ) : theme === "dark" ? (
            <Moon className="h-4 w-4 text-blue-300 transition-transform duration-200" />
          ) : (
            <Laptop className="h-4 w-4 transition-transform duration-200" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-white/30 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-lg shadow-lg"
      >
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className="flex items-center gap-2 cursor-pointer text-black dark:text-white hover:bg-white/30 dark:hover:bg-white/10"
        >
          <Sun className="h-4 w-4 text-orange-500" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className="flex items-center gap-2 cursor-pointer text-black dark:text-white hover:bg-white/30 dark:hover:bg-white/10"
        >
          <Moon className="h-4 w-4 text-blue-300" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className="flex items-center gap-2 cursor-pointer text-black dark:text-white hover:bg-white/30 dark:hover:bg-white/10"
        >
          <Laptop className="h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 