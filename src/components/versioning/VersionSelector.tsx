import React, { useState } from 'react';
import { Card, CardContent, Button, Badge } from '../ui';
import {
  ChevronDown,
  Code,
  Calendar,
  GitBranch,
  CheckCircle,
  AlertTriangle,
  FileText,
  Plus,
  Trash2
} from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import type { ContractVersion, FixSubmission } from '../../types';

interface VersionSelectorProps {
  versions: ContractVersion[];
  currentVersion: string | null;
  onVersionSelect: (version: string) => void;
  onNewVersionClick: () => void;
  onDeleteVersion?: (version: string) => void;
  activeFixSubmission?: FixSubmission | null;
}

export function VersionSelector({
  versions,
  currentVersion,
  onVersionSelect,
  onNewVersionClick,
  onDeleteVersion,
  activeFixSubmission
}: VersionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedVersion = versions.find(v => v.version === currentVersion);

  const getVersionStatusIcon = (version: ContractVersion) => {
    if (version.fixSubmission) {
      switch (version.fixSubmission.status) {
        case 'verified':
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'analyzing':
          return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
        case 'rejected':
        case 'partial':
          return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        default:
          return <FileText className="h-4 w-4 text-gray-400" />;
      }
    }
    return <Code className="h-4 w-4 text-blue-500" />;
  };

  const getVersionStatusText = (version: ContractVersion) => {
    if (version.fixSubmission) {
      switch (version.fixSubmission.status) {
        case 'verified':
          return 'Verified';
        case 'analyzing':
          return 'Analyzing...';
        case 'rejected':
          return 'Issues Remain';
        case 'partial':
          return 'Partially Fixed';
        default:
          return 'Pending Review';
      }
    }
    return 'Original Code';
  };

  const getScoreImprovement = (version: ContractVersion): number | null => {
    if (!version.fixSubmission?.verificationResult) return null;

    const originalScore = version.audit.score;
    const newScore = version.fixSubmission.verificationResult.globalCodeQualityScore;
    return newScore - originalScore;
  };

  return (
    <div className="relative">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GitBranch className="h-5 w-5 text-gray-400" />
              <div>
                <h3 className="text-sm font-medium text-gray-900">Contract Versions</h3>
                <p className="text-xs text-gray-500">
                  {versions.length} version{versions.length !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={onNewVersionClick}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>New Version</span>
              </Button>

              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {selectedVersion ? (
                  <>
                    <span>{selectedVersion.version}</span>
                    <Badge
                      variant={selectedVersion.fixSubmission?.status === 'verified' ? 'success' : 'secondary'}
                      size="sm"
                    >
                      {getVersionStatusText(selectedVersion)}
                    </Badge>
                  </>
                ) : (
                  <span>Select Version</span>
                )}
                <ChevronDown className={cn(
                  'h-4 w-4 transition-transform',
                  isOpen ? 'rotate-180' : ''
                )} />
              </button>
            </div>
          </div>

          {/* Current version quick stats */}
          {selectedVersion && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {selectedVersion.audit.score}
                  </div>
                  <div className="text-xs text-gray-500">Security Score</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {selectedVersion.audit.totalIssues}
                  </div>
                  <div className="text-xs text-gray-500">Total Issues</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatDate(selectedVersion.submissionDate)}
                  </div>
                  <div className="text-xs text-gray-500">Created</div>
                </div>
                <div>
                  {getScoreImprovement(selectedVersion) !== null && (
                    <>
                      <div className={cn(
                        'text-lg font-bold',
                        getScoreImprovement(selectedVersion)! > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {getScoreImprovement(selectedVersion)! > 0 ? '+' : ''}
                        {getScoreImprovement(selectedVersion)}
                      </div>
                      <div className="text-xs text-gray-500">Improvement</div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active fix submission indicator */}
          {activeFixSubmission && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-blue-800">
                  Fix verification in progress for {activeFixSubmission.version}
                </span>
              </div>
              {activeFixSubmission.progress && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                    <span>{activeFixSubmission.progress.message}</span>
                    <span>{Math.round(activeFixSubmission.progress.progress)}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${activeFixSubmission.progress.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-2">
            {versions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Code className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No versions available</p>
                <p className="text-xs text-gray-400">Upload a contract to get started</p>
              </div>
            ) : (
              versions.map((version) => {
                const isSelected = version.version === currentVersion;
                const scoreImprovement = getScoreImprovement(version);

                return (
                  <div
                    key={version.version}
                    className={cn(
                      'p-3 rounded-lg cursor-pointer transition-colors group',
                      isSelected
                        ? 'bg-brand-50 border border-brand-200'
                        : 'hover:bg-gray-50'
                    )}
                    onClick={() => {
                      onVersionSelect(version.version);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getVersionStatusIcon(version)}
                        <div>
                          <div className="font-medium text-gray-900">
                            {version.version}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDate(version.submissionDate)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={version.fixSubmission?.status === 'verified' ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {getVersionStatusText(version)}
                        </Badge>

                        {scoreImprovement !== null && (
                          <Badge
                            variant={scoreImprovement > 0 ? 'success' : 'destructive'}
                            size="sm"
                          >
                            {scoreImprovement > 0 ? '+' : ''}{scoreImprovement}
                          </Badge>
                        )}

                        {onDeleteVersion && versions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteVersion(version.version);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {version.submissionNotes && (
                      <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-gray-300">
                        {version.submissionNotes}
                      </div>
                    )}

                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Score: {version.audit.score}</span>
                      <span>Issues: {version.audit.totalIssues}</span>
                      {version.parentVersion && (
                        <span>Based on: {version.parentVersion}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}