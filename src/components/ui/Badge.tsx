import React from 'react';
import { cn } from '../../lib/utils';
import type { SeverityLevel } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
  severity?: SeverityLevel;
  className?: string;
}

export function Badge({ children, variant = 'default', severity, className }: BadgeProps) {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  const variants = {
    default: 'bg-gray-100 text-gray-800',
    secondary: 'bg-gray-100 text-gray-600',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800'
  };

  const severityVariants = {
    HIGH: 'bg-red-100 text-red-800 border border-red-200',
    MEDIUM: 'bg-orange-100 text-orange-800 border border-orange-200',
    LOW: 'bg-green-100 text-green-800 border border-green-200'
  };

  const variantClass = severity ? severityVariants[severity] : variants[variant];

  return (
    <span className={cn(baseClasses, variantClass, className)}>
      {children}
    </span>
  );
}