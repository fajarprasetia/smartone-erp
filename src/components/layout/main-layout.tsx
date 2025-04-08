"use client"

import React, { useState } from 'react';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { MainNav } from './main-nav';
import { UserAvatar } from '../user-avatar';
import { ThemeToggle } from '../theme-toggle';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "fixed top-4 left-4 z-50 p-2 rounded-full glass-effect",
          "lg:hidden"
        )}
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 glass-effect border-r border-white/30 dark:border-white/10",
          "transform transition-all duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "w-16" : "w-64",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/30 dark:border-white/10">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SmartOne ERP
              </h1>
            )}
            {/* Desktop Sidebar Collapse Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>
          <MainNav isCollapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-16 glass-effect border-b border-white/30 dark:border-white/10">
          <div className="flex items-center justify-end h-full px-4">
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <UserAvatar />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="glass-card h-full p-6 rounded-xl border border-white/30 dark:border-white/10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 