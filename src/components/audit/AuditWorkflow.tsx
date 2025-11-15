import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button } from '../ui';
import { VersionSelector, VersionComparison } from '../versioning';
import { BulkFixResults, FixVerificationProgress } from '../fixVerification';
import { SecurityScore } from './SecurityScore';
import { IssueList } from './IssueList';
import { GasOptimizations } from './GasOptimizations';
import { formatDate } from '../../lib/utils';
import { VersionManager } from '../../lib/versionManager';
import {
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Upload,
  Eye,
  FileText,
  Settings,
  Zap,
  Target,
  TrendingUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ContractVersion, FixSubmission, FixVerificationProgress as FixProgressType, ContractAudit } from '../../types';

interface AuditWorkflowProps {
  initialAudit: ContractAudit;
  originalCode?: string;
  claudeApiKey?: string;
  onFixSubmit?: (fixedCode: string, notes?: string) => Promise<FixSubmission>;
  onNewVersionCreated?: (version: ContractVersion) => void;
}

type WorkflowStep = 'overview' | 'issues' | 'fix' | 'verification' | 'results';

const STEPS: Array<{
  id: WorkflowStep;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}> = [
  {
    id: 'overview',
    title: 'Security Overview',
    description: 'Review your contract security score and metrics',
    icon: Eye
  },
  {
    id: 'issues',
    title: 'Security Issues',
    description: 'Examine detailed security vulnerabilities',
    icon: AlertTriangle
  },
  {
    id: 'fix',
    title: 'Submit Fixes',
    description: 'Upload your improved contract version',
    icon: Upload
  },
  {
    id: 'verification',
    title: 'Verification',
    description: 'AI analysis of your security improvements',
    icon: Settings
  },
  {
    id: 'results',
    title: 'Results & Comparison',
    description: 'View improvements and next steps',
    icon: TrendingUp
  }
];

export function AuditWorkflow({
  initialAudit,
  originalCode,
  claudeApiKey,
  onFixSubmit,
  onNewVersionCreated
}: AuditWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('overview');
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [activeFixSubmission, setActiveFixSubmission] = useState<FixSubmission | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  // Load versions and active submission on mount
  useEffect(() => {
    const loadedVersions = VersionManager.loadVersions();
    const loadedActiveFix = VersionManager.loadActiveFixSubmission();

    setVersions(loadedVersions);
    setActiveFixSubmission(loadedActiveFix);

    // If no versions exist, create the first one
    if (loadedVersions.length === 0 && originalCode) {
      const firstVersion = VersionManager.addVersion(originalCode, initialAudit, 'Initial contract analysis');
      setVersions([firstVersion]);
      setCurrentVersion(firstVersion.version);
      if (onNewVersionCreated) {
        onNewVersionCreated(firstVersion);
      }
    } else if (loadedVersions.length > 0) {
      const latest = VersionManager.getLatestVersion();
      if (latest) {
        setCurrentVersion(latest.version);
        // If we have multiple versions, show comparison by default
        if (loadedVersions.length > 1) {
          setCurrentStep('results');
        }
      }
    }

    // If there's an active fix submission, go to verification step
    if (loadedActiveFix && loadedActiveFix.status === 'analyzing') {
      setCurrentStep('verification');
      setShowProgress(true);
    }
  }, [initialAudit, originalCode, onNewVersionCreated]);

  const selectedVersion = versions.find(v => v.version === currentVersion);
  const currentAudit = selectedVersion?.audit || initialAudit;
  const originalVersion = versions.find(v => v.version === 'v1');

  const getStepStatus = (stepId: WorkflowStep): 'completed' | 'current' | 'pending' => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const canProceedToStep = (stepId: WorkflowStep): boolean => {
    switch (stepId) {
      case 'overview':
        return true;
      case 'issues':
        return currentAudit.totalIssues > 0;
      case 'fix':
        // Allow fix submission if we have API key, regardless of current issues
        // (user might want to submit another improved version)
        return !!claudeApiKey;
      case 'verification':
        return !!activeFixSubmission;
      case 'results':
        return versions.length > 1;
      default:
        return false;
    }
  };

  const handleFixSubmission = async (fixedCode: string, notes?: string) => {
    if (onFixSubmit) {
      setCurrentStep('verification');
      setShowProgress(true);
      try {
        const result = await onFixSubmit(fixedCode, notes);
        setActiveFixSubmission(result);
        // Progress will handle moving to results
      } catch (error) {
        setShowProgress(false);
        setCurrentStep('fix');
      }
    }
  };

  const handleVerificationComplete = () => {
    setShowProgress(false);
    setCurrentStep('results');
    setVersions(VersionManager.getAllVersions());
    const latest = VersionManager.getLatestVersion();
    if (latest) {
      setCurrentVersion(latest.version);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'overview':
        return (
          <div className="space-y-6">
            <SecurityScore audit={currentAudit} />

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{currentAudit.score}</div>
                    <div className="text-sm text-gray-600">Security Score</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{currentAudit.totalIssues}</div>
                    <div className="text-sm text-gray-600">Security Issues</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{currentAudit.gasOptimizations?.length || 0}</div>
                    <div className="text-sm text-gray-600">Gas Optimizations</div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Next Steps</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {currentAudit.totalIssues > 0 && (
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                        <span>Review {currentAudit.totalIssues} security issues in detail</span>
                      </li>
                    )}
                    {claudeApiKey && currentAudit.totalIssues > 0 && (
                      <li className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-blue-500" />
                        <span>Submit improved contract for automated verification</span>
                      </li>
                    )}
                    <li className="flex items-center space-x-2">
                      <ArrowRight className="h-4 w-4 text-blue-500" />
                      <span>Export detailed audit report</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'issues':
        return (
          <div className="space-y-6">
            <IssueList
              issues={currentAudit.issues}
              originalCode={selectedVersion?.code || originalCode}
              showFixVerification={false} // Hide individual fix verification in workflow
              originalAudit={currentAudit}
            />

            <GasOptimizations optimizations={currentAudit.gasOptimizations} />
          </div>
        );

      case 'fix':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <Upload className="h-16 w-16 text-blue-500 mx-auto" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Submit Your Fixed Contract</h3>
                    <p className="text-gray-600 mt-2">
                      {currentAudit.totalIssues > 0
                        ? `Upload your improved contract to get automated verification against all ${currentAudit.totalIssues} issues`
                        : 'Upload an enhanced version of your contract for additional verification'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {currentAudit.totalIssues > 0 ? (
              <IssueList
                issues={currentAudit.issues}
                originalCode={selectedVersion?.code || originalCode}
                showFixVerification={!!(claudeApiKey && (selectedVersion?.code || originalCode))}
                originalAudit={currentAudit}
                onFixSubmit={handleFixSubmission}
              />
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">All Issues Resolved!</h3>
                      <p className="text-gray-600 mt-2">
                        Great job! Your contract has no outstanding security issues. You can still submit
                        additional improvements or optimizations.
                      </p>
                    </div>

                    {/* Direct upload for when no issues remain */}
                    <IssueList
                      issues={[]} // Empty issues array since all are resolved
                      originalCode={selectedVersion?.code || originalCode}
                      showFixVerification={!!(claudeApiKey && (selectedVersion?.code || originalCode))}
                      originalAudit={currentAudit}
                      onFixSubmit={handleFixSubmission}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'verification':
        return (
          <div className="space-y-6">
            {showProgress && activeFixSubmission?.progress ? (
              <FixVerificationProgress
                progress={activeFixSubmission.progress}
                onComplete={handleVerificationComplete}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Settings className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Verification in Progress</h3>
                  <p className="text-gray-600">
                    Your contract fixes are being analyzed...
                  </p>
                </CardContent>
              </Card>
            )}

            {activeFixSubmission && (
              <BulkFixResults bulkSubmission={activeFixSubmission} />
            )}
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            {selectedVersion && originalVersion && selectedVersion.version !== originalVersion.version && (
              <VersionComparison
                originalVersion={originalVersion}
                currentVersion={selectedVersion}
              />
            )}

            {selectedVersion?.fixSubmission && (
              <BulkFixResults bulkSubmission={selectedVersion.fixSubmission} />
            )}

            <SecurityScore audit={currentAudit} />

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentAudit.totalIssues > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Continue Improving</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        {currentAudit.totalIssues} issues remaining. Submit another improved version.
                      </p>
                    </div>
                  )}

                  {currentAudit.totalIssues === 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">All Clear!</span>
                      </div>
                      <p className="text-sm text-green-700">
                        No security issues detected. Your contract is ready for deployment.
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Export Report</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Download comprehensive audit documentation for your records.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Version Selector */}
      <VersionSelector
        versions={versions}
        currentVersion={currentVersion}
        onVersionSelect={(version) => {
          setCurrentVersion(version);
          // Auto-navigate to appropriate step based on version
          const selectedVer = versions.find(v => v.version === version);
          if (selectedVer?.fixSubmission) {
            setCurrentStep('results');
          } else if (versions.length > 1) {
            setCurrentStep('results');
          } else {
            setCurrentStep('overview');
          }
        }}
        onNewVersionClick={() => setCurrentStep('fix')}
        activeFixSubmission={activeFixSubmission}
      />

      {/* Step Navigation */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Security Audit Workflow</h2>
            <div className="text-sm text-gray-500">
              Step {STEPS.findIndex(s => s.id === currentStep) + 1} of {STEPS.length}
            </div>
          </div>

          <div className="flex items-center space-x-4 mb-6 overflow-x-auto">
            {STEPS.map((step, index) => {
              const status = getStepStatus(step.id);
              const canProceed = canProceedToStep(step.id);
              const Icon = step.icon;

              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => canProceed && setCurrentStep(step.id)}
                    disabled={!canProceed}
                    className={cn(
                      'flex flex-col items-center space-y-2 p-3 rounded-lg transition-all min-w-0 flex-shrink-0',
                      status === 'current'
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                        : status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : canProceed
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-full',
                      status === 'current'
                        ? 'bg-blue-500 text-white'
                        : status === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    )}>
                      {status === 'completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium">{step.title}</div>
                      <div className="text-xs opacity-75 hidden sm:block">{step.description}</div>
                    </div>
                  </button>

                  {index < STEPS.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={() => {
                const currentIndex = STEPS.findIndex(s => s.id === currentStep);
                if (currentIndex > 0) {
                  const prevStep = STEPS[currentIndex - 1];
                  if (canProceedToStep(prevStep.id)) {
                    setCurrentStep(prevStep.id);
                  }
                }
              }}
              disabled={STEPS.findIndex(s => s.id === currentStep) === 0}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Previous
            </Button>

            <Button
              onClick={() => {
                const currentIndex = STEPS.findIndex(s => s.id === currentStep);
                if (currentIndex < STEPS.length - 1) {
                  const nextStep = STEPS[currentIndex + 1];
                  if (canProceedToStep(nextStep.id)) {
                    setCurrentStep(nextStep.id);
                  }
                }
              }}
              disabled={STEPS.findIndex(s => s.id === currentStep) === STEPS.length - 1 ||
                        !canProceedToStep(STEPS[STEPS.findIndex(s => s.id === currentStep) + 1]?.id)}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
}