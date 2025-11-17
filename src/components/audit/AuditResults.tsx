import React, { useState, useEffect } from 'react';
import { AuditWorkflow } from './AuditWorkflow';
import { Card, CardContent, Button } from '../ui';
import { ReportGenerator } from '../../lib/reports';
import { FixVerificationEngine } from '../../lib/fixVerification';
import { VersionManager } from '../../lib/versionManager';
import { useToast } from '../layout/Layout';
import { Download, FileText, Code, Globe } from 'lucide-react';
import type { ContractAudit, FixSubmission, ContractVersion, FixVerificationProgress as FixProgressType } from '../../types';

interface AuditResultsProps {
  audit: ContractAudit;
  onIssueClick?: (issue: any) => void;
  originalCode?: string;
  claudeApiKey?: string;
  onNewVersionCreated?: (version: ContractVersion) => void;
}

export function AuditResults({ audit, onIssueClick, originalCode, claudeApiKey, onNewVersionCreated }: AuditResultsProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportType, setReportType] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string | null>(null);
  const [activeFixSubmission, setActiveFixSubmission] = useState<FixSubmission | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const { showToast } = useToast();

  // Initialize versions and current version on component mount
  useEffect(() => {
    const loadedVersions = VersionManager.getAllVersions();
    setVersions(loadedVersions);

    if (loadedVersions.length === 0 && originalCode) {
      // Create first version from original audit
      const firstVersion = VersionManager.addVersion(originalCode, audit, 'Initial audit');
      setVersions([firstVersion]);
      setCurrentVersion(firstVersion.version);
    } else if (loadedVersions.length > 0) {
      // Set to the most recent version
      setCurrentVersion(loadedVersions[loadedVersions.length - 1].version);
    }

    // Load any active fix submission
    const activeSubmission = VersionManager.loadActiveFixSubmission();
    if (activeSubmission) {
      setActiveFixSubmission(activeSubmission);
      setShowProgress(activeSubmission.status === 'analyzing');
    }
  }, [originalCode, audit]);

  const handleReportGeneration = async (type: 'pdf' | 'json' | 'html') => {
    setIsGeneratingReport(true);
    setReportType(type);

    try {
      showToast({
        type: 'info',
        title: 'Generating Report',
        message: `Creating ${type.toUpperCase()} report...`
      });

      switch (type) {
        case 'pdf':
          await ReportGenerator.generatePDFReport(audit);
          break;
        case 'json':
          ReportGenerator.generateJSONReport(audit);
          break;
        case 'html':
          ReportGenerator.generateHTMLReport(audit);
          break;
      }

      showToast({
        type: 'success',
        title: 'Report Generated',
        message: `${type.toUpperCase()} report has been downloaded successfully`
      });
    } catch (error) {
      console.error('Report generation failed:', error);
      showToast({
        type: 'error',
        title: 'Report Generation Failed',
        message: 'Failed to generate report. Please try again.'
      });
    } finally {
      setIsGeneratingReport(false);
      setReportType(null);
    }
  };


  const handleFixSubmission = async (fixedCode: string, notes?: string): Promise<FixSubmission> => {
    if (!claudeApiKey) {
      showToast({
        type: 'error',
        title: 'API Key Required',
        message: 'Claude API key is required for fix verification'
      });
      throw new Error('Claude API key is required for fix verification');
    }

    if (!currentVersion) {
      showToast({
        type: 'error',
        title: 'No Current Version',
        message: 'Please select a version to submit fixes for'
      });
      throw new Error('No current version selected');
    }

    try {
      const nextVersion = VersionManager.generateNextVersion();

      showToast({
        type: 'info',
        title: 'Starting Verification',
        message: 'Initializing fix verification process...'
      });

      setShowProgress(true);

      const fixEngine = new FixVerificationEngine(claudeApiKey);
      const result = await fixEngine.submitFixVerification(
        audit,
        fixedCode,
        nextVersion,
        currentVersion,
        notes,
        (progress: FixProgressType) => {
          setActiveFixSubmission(prev => prev ? { ...prev, progress } : null);
          // Create a temporary submission for progress tracking
          const tempSubmission: FixSubmission = {
            id: `temp-${nextVersion}`,
            version: nextVersion,
            originalVersion: currentVersion,
            fixedCode,
            submissionDate: new Date().toISOString(),
            status: 'analyzing',
            submissionNotes: notes,
            progress
          };
          VersionManager.saveActiveFixSubmission(tempSubmission);
        }
      );

      // Save the active submission for persistence
      setActiveFixSubmission(result);
      VersionManager.saveActiveFixSubmission(result);

      console.log('Fix verification result:', result);

      // Create new version regardless of status to show the verification results
      if (result.verificationResult) {
        // Calculate remaining issues (issues that weren't fixed)
        const remainingIssues = audit.issues.filter(originalIssue => {
          const verification = result.verificationResult!.issueVerifications.find(
            v => v.originalIssueId === originalIssue.id
          );
          return !verification?.isFixed;
        });

        // Combine remaining issues with newly detected issues
        const allIssues = [
          ...remainingIssues,
          ...(result.verificationResult.newIssuesDetected || [])
        ];

        // Create audit for the new version
        const newAudit: ContractAudit = {
          ...audit,
          score: result.verificationResult.globalCodeQualityScore,
          timestamp: new Date().toISOString(),
          totalIssues: allIssues.length,
          issues: allIssues,
          highSeverityCount: allIssues.filter(i => i.severity === 'HIGH').length,
          mediumSeverityCount: allIssues.filter(i => i.severity === 'MEDIUM').length,
          lowSeverityCount: allIssues.filter(i => i.severity === 'LOW').length,
        };

        const newVersion = VersionManager.addVersion(fixedCode, newAudit, notes, currentVersion);
        VersionManager.updateVersionWithFixSubmission(newVersion.version, result);

        setVersions(VersionManager.getAllVersions());
        setCurrentVersion(newVersion.version);

        if (onNewVersionCreated) {
          onNewVersionCreated(newVersion);
        }

        showToast({
          type: result.status === 'verified' ? 'success' : 'warning',
          title: `Verification ${result.status === 'verified' ? 'Complete' : 'Complete with Issues'}`,
          message: `Created ${nextVersion} - ${allIssues.length} remaining issues`
        });
      }

      setShowProgress(false);
      VersionManager.saveActiveFixSubmission(null); // Clear active submission

      return result;
    } catch (error) {
      setShowProgress(false);
      VersionManager.saveActiveFixSubmission(null);

      showToast({
        type: 'error',
        title: 'Fix Verification Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Generation Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Report</h3>
              <p className="text-sm text-gray-600">Download the audit report in your preferred format</p>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleReportGeneration('pdf')}
                disabled={isGeneratingReport}
                loading={isGeneratingReport && reportType === 'pdf'}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                {isGeneratingReport && reportType === 'pdf' ? 'Generating...' : 'PDF'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleReportGeneration('json')}
                disabled={isGeneratingReport}
                loading={isGeneratingReport && reportType === 'json'}
                leftIcon={<Code className="w-4 h-4" />}
              >
                {isGeneratingReport && reportType === 'json' ? 'Generating...' : 'JSON'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleReportGeneration('html')}
                disabled={isGeneratingReport}
                loading={isGeneratingReport && reportType === 'html'}
                leftIcon={<Globe className="w-4 h-4" />}
              >
                {isGeneratingReport && reportType === 'html' ? 'Generating...' : 'HTML'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* New Audit Workflow */}
      <AuditWorkflow
        initialAudit={audit}
        originalCode={originalCode}
        claudeApiKey={claudeApiKey}
        onFixSubmit={handleFixSubmission}
        onNewVersionCreated={onNewVersionCreated}
      />
    </div>
  );
}