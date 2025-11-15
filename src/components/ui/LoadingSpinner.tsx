import React from 'react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white';
  className?: string;
  text?: string;
}

export function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className,
  text
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'text-brand-600',
    secondary: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <svg
          className={cn(
            'animate-spin',
            sizeClasses[size],
            colorClasses[color]
          )}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {text && (
          <p className={cn(
            'text-sm font-medium',
            color === 'white' ? 'text-white' : 'text-gray-600'
          )}>
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
  lines?: number;
  width?: 'full' | 'half' | 'quarter' | 'three-quarters';
}

export function Skeleton({ className, lines = 1, width = 'full' }: SkeletonProps) {
  const widthClasses = {
    full: 'w-full',
    half: 'w-1/2',
    quarter: 'w-1/4',
    'three-quarters': 'w-3/4'
  };

  return (
    <div className={cn('animate-pulse space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-4 bg-gray-200 rounded loading-skeleton',
            index === lines - 1 && lines > 1 ? widthClasses[width] : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({
  progress,
  size = 'md',
  color = 'primary',
  showPercentage = false,
  className
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-brand-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between mb-1">
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className={cn('progress-bar', sizeClasses[size])}>
        <div
          className={cn('progress-fill', colorClasses[color])}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

interface PulsingDotProps {
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulsingDot({
  color = 'primary',
  size = 'md',
  className
}: PulsingDotProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    primary: 'bg-brand-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color]
        )}
      />
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  text?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({ isVisible, text, children }: LoadingOverlayProps) {
  if (!isVisible) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" />
          {text && (
            <p className="text-lg font-medium text-gray-700">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}