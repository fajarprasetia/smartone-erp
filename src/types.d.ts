// React and React DOM type declarations
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Lucide React type declarations
declare module 'lucide-react' {
  export const Menu: React.FC<{ size?: number; className?: string }>;
  export const X: React.FC<{ size?: number; className?: string }>;
  export const ChevronLeft: React.FC<{ size?: number; className?: string }>;
  export const ChevronRight: React.FC<{ size?: number; className?: string }>;
  // Add other icons as needed
} 