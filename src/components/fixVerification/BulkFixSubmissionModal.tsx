import React, { useState } from 'react';
import { Card, CardContent, Button } from '../ui';
import { Upload, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ContractAudit, BulkFixSubmission } from '../../types';

interface BulkFixSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalAudit: ContractAudit;
  originalCode: string;
  onSubmit: (fixedCode: string, notes?: string) => Promise<BulkFixSubmission>;
}

export function BulkFixSubmissionModal({
  isOpen,
  onClose,
  originalAudit,
  originalCode,
  onSubmit
}: BulkFixSubmissionModalProps) {
  const [fixedCode, setFixedCode] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!fixedCode.trim()) {
      setError('Please provide the fixed contract code');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(fixedCode, submissionNotes || undefined);
      // Modal will be closed by parent component
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit fix');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith('.sol')) {
      setError('Please upload a Solidity (.sol) file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFixedCode(content);
      setError(null);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const issuesSummary = {
    total: originalAudit.totalIssues,
    high: originalAudit.highSeverityCount,
    medium: originalAudit.mediumSeverityCount,
    low: originalAudit.lowSeverityCount
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Submit Fixed Contract
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload your fixed contract for comprehensive verification against all {issuesSummary.total} original issues
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Original Issues Summary */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Original Issues to Address</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{issuesSummary.total}</div>
                    <div className="text-xs text-gray-500">Total Issues</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{issuesSummary.high}</div>
                    <div className="text-xs text-gray-500">High Severity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{issuesSummary.medium}</div>
                    <div className="text-xs text-gray-500">Medium Severity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{issuesSummary.low}</div>
                    <div className="text-xs text-gray-500">Low Severity</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fixed Contract Code
              </label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 transition-colors',
                  dragActive
                    ? 'border-brand-400 bg-brand-50'
                    : 'border-gray-300 hover:border-gray-400'
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">
                      Drop your fixed .sol file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept=".sol"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Choose File
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Code Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or paste your fixed code here:
              </label>
              <textarea
                value={fixedCode}
                onChange={(e) => setFixedCode(e.target.value)}
                placeholder="// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract YourFixedContract {
    // Your fixed contract code here...
}"
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 font-mono text-sm"
                disabled={isSubmitting}
              />
            </div>

            {/* Submission Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Notes (Optional)
              </label>
              <textarea
                value={submissionNotes}
                onChange={(e) => setSubmissionNotes(e.target.value)}
                placeholder="Describe the changes you made, approaches used, or any specific considerations..."
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500 text-sm"
                disabled={isSubmitting}
              />
            </div>

            {/* What happens next */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">What happens next?</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>AI will analyze your complete fixed contract against all original issues</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Each individual issue will be verified for proper resolution</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>New security issues will be detected if introduced by fixes</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Comprehensive verification report will be generated</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col space-y-4 p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500 text-center">
            This will perform comprehensive verification against all {issuesSummary.total} original issues
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6b7280',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSubmit}
              disabled={!fixedCode.trim() || isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: !fixedCode.trim() || isSubmitting ? '#9ca3af' : '#2563eb',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: '500',
                minWidth: '200px',
                cursor: !fixedCode.trim() || isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Verifying...' : 'Submit for Verification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}