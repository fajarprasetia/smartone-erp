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
          </div>
          <MainNav isCollapsed={sidebarCollapsed} />
        </div>
      </aside>

      {/* Desktop Sidebar Collapse Button - Repositioned to overlap sidebar and header */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          "absolute p-2 rounded-full glass-effect shadow-md border border-white/30 dark:border-white/10 z-50",
          "transition-all duration-300 ease-in-out",
          "hidden lg:flex items-center justify-center",
          sidebarCollapsed 
            ? "left-14" 
            : "left-[15.5rem]",
          "top-4"
        )}
      >
        {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-16 glass-effect border-b border-white/30 dark:border-white/10 relative z-10 shrink-0">
          <div className="flex items-center justify-end h-full px-4">
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <UserAvatar />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-0.75 relative z-0 overflow-hidden print:overflow-visible">
          <div className="glass-card h-full p-2 rounded-xl border border-white/10 dark:border-white/10 overflow-auto print:overflow-visible">
            {children}
          </div>
        </main>
      </div>

      {/* Add global print styles */}
      <style jsx global>{`
        @media print {
          .glass-card {
            background: white !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            height: auto !important;
            overflow: visible !important;
            padding: 0 !important;
          }
          
          html, body, .h-screen, .overflow-hidden {
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}</style>
      
      {/* Modal portal container - high z-index */}
      <div id="modal-root" style={{ position: 'fixed', zIndex: 9999 }} />
    </div>
  );
} 