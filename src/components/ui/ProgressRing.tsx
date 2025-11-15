import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressRingProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  className?: string;
  showValue?: boolean;
  label?: string;
}

export function ProgressRing({
  value,
  size = 'md',
  strokeWidth,
  className,
  showValue = true,
  label
}: ProgressRingProps) {
  const sizes = {
    sm: { width: 48, height: 48, stroke: 4 },
    md: { width: 64, height: 64, stroke: 6 },
    lg: { width: 96, height: 96, stroke: 8 },
    xl: { width: 128, height: 128, stroke: 10 }
  };

  const { width, height, stroke } = sizes[size];
  const finalStrokeWidth = strokeWidth || stroke;
  const radius = (width - finalStrokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getColorClass = (value: number) => {
    if (value >= 80) return 'text-green-500';
    if (value >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative">
        <svg
          width={width}
          height={height}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={finalStrokeWidth}
            fill="none"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx={width / 2}
            cy={height / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={finalStrokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn('transition-all duration-500 ease-in-out', getColorClass(value))}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('font-bold', getColorClass(value), {
              'text-sm': size === 'sm',
              'text-base': size === 'md',
              'text-lg': size === 'lg',
              'text-xl': size === 'xl'
            })}>
              {Math.round(value)}
            </span>
          </div>
        )}
      </div>
      {label && (
        <span className="mt-2 text-sm text-gray-600 text-center">{label}</span>
      )}
    </div>
  );
}