import React from 'react';
import { cn } from '@/lib/utils';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  children: React.ReactNode;
}

export function Chip({ selected, children, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
        selected
          ? "bg-accent text-white border-accent shadow-md hover:bg-accent hover:border-accent"
          : "bg-white text-foreground border-border hover:bg-accent/10 hover:border-accent",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

