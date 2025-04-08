"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { AuthProvider } from "@/components/providers/auth-provider"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <AuthProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        {...props}
      >
        {children}
      </NextThemesProvider>
    </AuthProvider>
  )
} 