import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  XMarkIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import { Button, Card, CardContent } from '../ui';
import { cn, formatBytes } from '../../lib/utils';
import type { UploadedFile } from '../../types';

interface CodeUploadProps {
  onFileUpload: (files: UploadedFile[]) => void;
  onCodePaste: (code: string) => void;
  isLoading?: boolean;
  allowMultiple?: boolean;
}

export function CodeUpload({
  onFileUpload,
  onCodePaste,
  isLoading = false,
  allowMultiple = false
}: CodeUploadProps) {
  const [pastedCode, setPastedCode] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [codeValidation, setCodeValidation] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>({ isValid: false, errors: [], warnings: [] });

  // Live validation for pasted code
  const validatePastedCode = (code: string) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (code.trim().length === 0) {
      setCodeValidation({ isValid: false, errors: [], warnings: [] });
      return;
    }

    if (code.length < 50) {
      errors.push('Code appears too short');
    }

    if (code.length > 100000) {
      errors.push('Code is too large (max 100KB)');
    }

    if (!code.includes('pragma solidity')) {
      errors.push('Missing pragma directive');
    }

    if (!code.includes('contract ') && !code.includes('library ') && !code.includes('interface ')) {
      errors.push('No contract declaration found');
    }

    if (!code.includes('{') || !code.includes('}')) {
      errors.push('Incomplete structure');
    }

    // Warnings for common issues
    if (code.includes('.call(')) {
      warnings.push('Low-level calls detected');
    }

    if (code.includes('tx.origin')) {
      warnings.push('tx.origin usage detected');
    }

    if (code.includes('block.timestamp')) {
      warnings.push('Timestamp dependency detected');
    }

    setCodeValidation({
      isValid: errors.length === 0,
      errors,
      warnings
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const processedFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (const file of acceptedFiles) {
      // Enhanced file validation
      if (!file.name.endsWith('.sol')) {
        errors.push(`${file.name}: Only Solidity (.sol) files are supported`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push(`${file.name}: File size exceeds 10MB limit`);
        continue;
      }

      if (file.size < 50) { // Minimum viable contract size
        errors.push(`${file.name}: File appears too small to be a valid contract`);
        continue;
      }

      try {
        const content = await file.text();

        // Basic content validation
        if (!content.trim()) {
          errors.push(`${file.name}: File is empty`);
          continue;
        }

        if (!content.includes('pragma solidity')) {
          errors.push(`${file.name}: Missing pragma directive`);
          continue;
        }

        if (!content.includes('contract ') && !content.includes('library ') && !content.includes('interface ')) {
          errors.push(`${file.name}: No contract, library, or interface found`);
          continue;
        }

        // Check for potentially malicious content
        const suspiciousPatterns = [
          /eval\(/, /Function\(/, /setTimeout\(/, /setInterval\(/,
          /<script/, /javascript:/, /data:text\/html/
        ];

        const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(content));
        if (hasSuspiciousContent) {
          errors.push(`${file.name}: Contains potentially unsafe content`);
          continue;
        }

        const uploadedFile: UploadedFile = {
          name: file.name,
          content,
          size: file.size,
          lastModified: file.lastModified,
          validated: true,
          contractType: detectContractType(content)
        };
        processedFiles.push(uploadedFile);
      } catch (error) {
        errors.push(`${file.name}: Failed to read file - ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Show validation errors if any
    if (errors.length > 0) {
      alert(`File validation errors:\n${errors.join('\n')}`);
    }

    if (processedFiles.length > 0) {
      setUploadedFiles(prev => allowMultiple ? [...prev, ...processedFiles] : processedFiles);
      onFileUpload(processedFiles);
    }
  }, [onFileUpload, allowMultiple]);

  const detectContractType = (content: string): string => {
    if (content.includes('interface ')) return 'Interface';
    if (content.includes('library ')) return 'Library';
    if (content.includes('abstract contract')) return 'Abstract Contract';
    if (content.includes('contract ')) return 'Contract';
    return 'Unknown';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.sol'],
      'application/x-solidity': ['.sol']
    },
    multiple: allowMultiple,
    disabled: isLoading
  });

  const handlePasteSubmit = () => {
    const code = pastedCode.trim();
    if (!code) return;

    // Validate pasted code
    const errors: string[] = [];

    if (code.length < 50) {
      errors.push('Code appears too short to be a valid Solidity contract');
    }

    if (code.length > 100000) {
      errors.push('Code is too large for analysis (max 100KB)');
    }

    if (!code.includes('pragma solidity')) {
      errors.push('Missing pragma directive');
    }

    if (!code.includes('contract ') && !code.includes('library ') && !code.includes('interface ')) {
      errors.push('No contract, library, or interface declaration found');
    }

    // Check for basic structure
    if (!code.includes('{') || !code.includes('}')) {
      errors.push('Contract has incomplete structure - missing braces');
    }

    // Check for potentially malicious content
    const suspiciousPatterns = [
      /eval\(/, /Function\(/, /setTimeout\(/, /setInterval\(/,
      /<script/, /javascript:/, /data:text\/html/
    ];

    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(code));
    if (hasSuspiciousContent) {
      errors.push('Contains potentially unsafe content');
    }

    if (errors.length > 0) {
      alert(`Code validation errors:\n${errors.join('\n')}`);
      return;
    }

    onCodePaste(code);
    setPastedCode('');
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('upload')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'upload'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <CloudArrowUpIcon className="h-4 w-4 inline mr-2" />
          Upload Files
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors',
            activeTab === 'paste'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <ClipboardDocumentIcon className="h-4 w-4 inline mr-2" />
          Paste Code
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-4">
          {/* Dropzone */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-300 hover:border-gray-400',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
              >
                <input {...getInputProps()} />
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive ? (
                    'Drop the files here...'
                  ) : (
                    <>
                      <span className="font-medium text-brand-600">Click to upload</span>
                      {' or drag and drop'}
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Solidity files (.sol) up to 10MB
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Uploaded files list */}
          {uploadedFiles.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Uploaded Files ({uploadedFiles.length})
                </h3>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">
                              {file.name}
                            </p>
                            {file.validated && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                ✓ Validated
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{formatBytes(file.size)}</span>
                            <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                            {file.contractType && (
                              <span className="text-brand-600 font-medium">{file.contractType}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'paste' && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="code-paste"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Paste your Solidity code
                </label>
                <textarea
                  id="code-paste"
                  rows={15}
                  value={pastedCode}
                  onChange={(e) => {
                    const value = e.target.value;
                    setPastedCode(value);
                    validatePastedCode(value);
                  }}
                  placeholder="pragma solidity ^0.8.0;&#10;&#10;contract MyContract {&#10;    // Your contract code here...&#10;}"
                  className={cn(
                    "w-full px-3 py-2 border rounded-md shadow-sm font-mono text-sm",
                    codeValidation.errors.length > 0
                      ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                      : codeValidation.isValid
                      ? "border-green-300 focus:ring-green-500 focus:border-green-500"
                      : "border-gray-300 focus:ring-brand-500 focus:border-brand-500"
                  )}
                  disabled={isLoading}
                />

                {/* Validation feedback */}
                {pastedCode.trim() && (
                  <div className="mt-2 space-y-1">
                    {codeValidation.errors.length > 0 && (
                      <div className="text-sm text-red-600">
                        <p className="font-medium">Validation Errors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {codeValidation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {codeValidation.warnings.length > 0 && (
                      <div className="text-sm text-orange-600">
                        <p className="font-medium">Warnings:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {codeValidation.warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {codeValidation.isValid && codeValidation.warnings.length === 0 && (
                      <div className="text-sm text-green-600">
                        <p className="font-medium">✓ Code validation passed</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handlePasteSubmit}
                  disabled={!pastedCode.trim() || !codeValidation.isValid || isLoading}
                  loading={isLoading}
                >
                  {codeValidation.isValid ? 'Analyze Code' : 'Fix Errors to Continue'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}