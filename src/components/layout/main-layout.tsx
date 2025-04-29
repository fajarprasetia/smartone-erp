"use client"

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MainNav } from './main-nav';
import { UserAvatar } from '../user-avatar';
import { ThemeToggle } from '../theme-toggle';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Permission } from '@prisma/client';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session } = useSession();
  
  const userPermissions = session?.user?.role?.permissions;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "fixed top-4 left-4 z-50 p-2 rounded-full glass-effect",
          "lg:hidden"
        )}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 glass-effect border-r border-white/30 dark:border-white/10",
          "transform transition-all duration-300 ease-in-out",
          isCollapsed ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0 lg:static lg:z-auto"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-white/30 dark:border-white/10">
            {!isCollapsed && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                SmartOne ERP
              </h1>
            )}
          </div>
          <MainNav isCollapsed={isCollapsed} userPermissions={userPermissions} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-16 glass-effect border-b border-white/30 dark:border-white/10 relative z-10 shrink-0">
          <div className="flex items-center justify-end h-full px-4">
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* User Avatar */}
              <UserAvatar />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-0.75 relative z-0 overflow-hidden print:overflow-visible">
          <div className="glass-card h-full p-2 rounded-xl border border-white/10 dark:border-white/10 overflow-y-auto print:overflow-visible">
            {children}
          </div>
        </main>
      </div>

      {/* Add global print styles */}
      <style>{`
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