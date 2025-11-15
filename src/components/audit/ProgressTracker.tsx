import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';
import type { AnalysisProgress } from '../../types';

interface ProgressTrackerProps {
  progress: AnalysisProgress | null;
  isAnalyzing: boolean;
  startTime?: number;
}

export function ProgressTracker({ progress, isAnalyzing, startTime }: ProgressTrackerProps) {
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    if (isAnalyzing && startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAnalyzing, startTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const getEstimatedTimeRemaining = () => {
    if (!progress || progress.progress === 0) return null;
    const totalEstimated = (elapsedTime / progress.progress) * 100;
    const remaining = totalEstimated - elapsedTime;
    return remaining > 0 ? formatTime(remaining) : null;
  };
  const steps = [
    { id: 'init', name: 'Initialization', description: 'Starting contract analysis' },
    { id: 'validation', name: 'Validation', description: 'Validating contract syntax' },
    { id: 'normalize', name: 'Code Analysis', description: 'Analyzing contract structure' },
    { id: 'precheck', name: 'Pre-audit Checks', description: 'Running preliminary security checks' },
    { id: 'cache', name: 'Cache Check', description: 'Checking for cached results' },
    { id: 'analyze', name: 'AI Analysis', description: 'Running comprehensive AI security analysis' },
    { id: 'scoring', name: 'Scoring', description: 'Computing enhanced security score' },
    { id: 'complete', name: 'Complete', description: 'Analysis complete' }
  ];

  const getCurrentStepIndex = (stage: string) => {
    const stageMap: Record<string, number> = {
      'Initialization': 0,
      'Validation': 1,
      'Code Analysis': 2,
      'Pre-audit Security Checks': 3,
      'Checking cache': 4,
      'Cache hit': 7,
      'Preparing analysis': 4,
      'Analyzing contract': 5,
      'Processing results': 5,
      'Finalizing Results': 6,
      'Complete': 7
    };
    return stageMap[stage] ?? 0;
  };

  const currentStepIndex = progress ? getCurrentStepIndex(progress.stage) : -1;

  if (!isAnalyzing && !progress) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Analysis Progress</h3>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          {isAnalyzing && startTime && (
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          )}
          {progress && (
            <>
              <span>{Math.round(progress.progress)}%</span>
              {getEstimatedTimeRemaining() && (
                <span>ETA: {getEstimatedTimeRemaining()}</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress?.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                    isCompleted
                      ? 'bg-green-100 text-green-800'
                      : isCurrent
                      ? 'bg-brand-100 text-brand-800 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  {isCompleted ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCompleted
                      ? 'text-green-800'
                      : isCurrent
                      ? 'text-brand-800'
                      : 'text-gray-500'
                  )}
                >
                  {step.name}
                </p>
                <p className="text-xs text-gray-500">
                  {isCurrent && progress?.message ? progress.message : step.description}
                </p>
              </div>
              {isCurrent && (
                <div className="flex-shrink-0">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-600 border-t-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}