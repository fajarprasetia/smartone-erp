import React from 'react';
import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('p-6 max-w-full mx-auto space-y-6', className)}>
      {children}
    </div>
  );
} 