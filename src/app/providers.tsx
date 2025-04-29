"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { AuthProvider } from "@/components/providers/auth-provider"

export function Providers({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class" 
      defaultTheme="light"
      enableSystem={true}
    >
      <AuthProvider>{children}</AuthProvider>
    </NextThemesProvider>
  )
} 