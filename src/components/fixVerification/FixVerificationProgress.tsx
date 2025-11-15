import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui';
import {
  CheckCircle,
  Clock,
  Zap,
  Shield,
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { FixVerificationProgress } from '../../types';

interface FixVerificationProgressProps {
  progress: FixVerificationProgress;
  onComplete?: () => void;
}

const STAGE_ICONS = {
  initializing: Loader2,
  analyzing_fixes: Shield,
  checking_new_issues: AlertTriangle,
  generating_report: FileText,
  completed: CheckCircle,
};

const STAGE_COLORS = {
  initializing: 'text-blue-500',
  analyzing_fixes: 'text-yellow-500',
  checking_new_issues: 'text-orange-500',
  generating_report: 'text-purple-500',
  completed: 'text-green-500',
};

const STAGE_DESCRIPTIONS = {
  initializing: 'Setting up verification environment...',
  analyzing_fixes: 'Analyzing code changes against security issues...',
  checking_new_issues: 'Scanning for newly introduced vulnerabilities...',
  generating_report: 'Compiling comprehensive verification report...',
  completed: 'Verification complete!',
};

export function FixVerificationProgress({ progress, onComplete }: FixVerificationProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const startTime = new Date(progress.startTime).getTime();
    const interval = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.startTime]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress.progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress.progress]);

  useEffect(() => {
    if (progress.stage === 'completed' && onComplete) {
      const timer = setTimeout(onComplete, 2000);
      return () => clearTimeout(timer);
    }
  }, [progress.stage, onComplete]);

  const Icon = STAGE_ICONS[progress.stage];
  const iconColor = STAGE_COLORS[progress.stage];
  const isCompleted = progress.stage === 'completed';

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (): string => {
    if (progress.progress < 25) return 'bg-blue-500';
    if (progress.progress < 50) return 'bg-yellow-500';
    if (progress.progress < 75) return 'bg-orange-500';
    if (progress.progress < 100) return 'bg-purple-500';
    return 'bg-green-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Main Icon and Title */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className={cn(
                  'p-4 rounded-full',
                  isCompleted ? 'bg-green-100' : 'bg-gray-100'
                )}>
                  <Icon
                    className={cn(
                      'h-12 w-12',
                      iconColor,
                      !isCompleted && 'animate-spin'
                    )}
                  />
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isCompleted ? 'Verification Complete!' : 'Verifying Your Fixes'}
                </h2>
                <p className="text-gray-600">
                  {STAGE_DESCRIPTIONS[progress.stage]}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">
                  Progress: {Math.round(animatedProgress)}%
                </span>
                <span className="text-gray-500">
                  {elapsedTime > 0 && `${formatTime(elapsedTime)} elapsed`}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all duration-500 ease-out rounded-full',
                    getProgressColor()
                  )}
                  style={{ width: `${animatedProgress}%` }}
                />
              </div>

              {progress.estimatedTimeRemaining && progress.estimatedTimeRemaining > 0 && (
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>~{Math.ceil(progress.estimatedTimeRemaining / 1000)}s remaining</span>
                </div>
              )}
            </div>

            {/* Current Stage Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="text-sm font-medium text-gray-900">
                {progress.message}
              </div>

              {progress.currentIssue && (
                <div className="text-sm text-gray-600">
                  Currently analyzing: <span className="font-mono">{progress.currentIssue}</span>
                </div>
              )}

              {progress.processedIssues !== undefined && progress.totalIssues !== undefined && (
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-4 w-4" />
                    <span>Issues: {progress.processedIssues}/{progress.totalIssues}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stage Indicators */}
            <div className="flex justify-center space-x-1">
              {Object.keys(STAGE_ICONS).map((stage, index) => {
                const StageIcon = STAGE_ICONS[stage as keyof typeof STAGE_ICONS];
                const isCurrentStage = progress.stage === stage;
                const isCompletedStage = Object.keys(STAGE_ICONS).indexOf(progress.stage) > index;

                return (
                  <div
                    key={stage}
                    className={cn(
                      'p-2 rounded-full transition-all duration-300',
                      isCurrentStage
                        ? 'bg-blue-100 scale-110'
                        : isCompletedStage
                        ? 'bg-green-100'
                        : 'bg-gray-100'
                    )}
                  >
                    <StageIcon
                      className={cn(
                        'h-4 w-4',
                        isCurrentStage
                          ? 'text-blue-600'
                          : isCompletedStage
                          ? 'text-green-600'
                          : 'text-gray-400'
                      )}
                    />
                  </div>
                );
              })}
            </div>

            {/* Performance Stats */}
            {!isCompleted && elapsedTime > 30 && (
              <div className="flex justify-center space-x-6 text-sm text-gray-500 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-1">
                  <Zap className="h-4 w-4" />
                  <span>
                    {progress.processedIssues && elapsedTime > 0
                      ? `${(progress.processedIssues / elapsedTime * 60).toFixed(1)} issues/min`
                      : 'Calculating speed...'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}