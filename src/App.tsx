import React, { useState, useCallback } from 'react';
import { Layout } from './components/layout';
import { CodeUpload, ProgressTracker, AuditResults } from './components/audit';
import { MetricsCards, TrendCharts, IssuePatterns, InsightsPanel, ComparisonTable } from './components/analytics';
import { Button, Card, CardContent } from './components/ui';
import { AuditEngine } from './lib/audit';
import { AnalyticsEngine } from './lib/analytics';
import { formatDate } from './lib/utils';
import { ReportGenerator } from './lib/reports';
import { FileText, Code, Globe } from 'lucide-react';
import type {
  ContractAudit,
  UploadedFile,
  AnalysisProgress,
  AppState
} from './types';

function App() {
  const [currentTab, setCurrentTab] = useState('audit');
  const [currentAuditCode, setCurrentAuditCode] = useState<string>('');
  const [auditStartTime, setAuditStartTime] = useState<number | null>(null);
  const [appState, setAppState] = useState<AppState>(() => {
    const savedSettings = localStorage.getItem('audit-settings');
    const settings = savedSettings ? JSON.parse(savedSettings) : {
      claudeApiKey: '',
      autoSave: true,
      theme: 'light',
      reportFormat: 'pdf',
      cacheEnabled: true,
      maxCacheSize: 100
    };

    return {
      currentAudit: null,
      auditHistory: [],
      isAnalyzing: false,
      progress: null,
      cache: new Map(),
      settings
    };
  });
  const [saveMessage, setSaveMessage] = useState('');

  const saveSettings = () => {
    localStorage.setItem('audit-settings', JSON.stringify(appState.settings));
    setSaveMessage('Settings saved successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleFileUpload = useCallback(async (files: UploadedFile[]) => {
    if (files.length === 0) return;

    const file = files[0]; // For now, handle single file
    await performAudit(file.content, { contractName: file.name });
  }, [appState.settings.claudeApiKey]);

  const handleCodePaste = useCallback(async (code: string) => {
    await performAudit(code, { contractName: 'Pasted Contract' });
  }, [appState.settings.claudeApiKey]);

  const performAudit = async (code: string, metadata: any) => {
    if (!appState.settings.claudeApiKey || !appState.settings.claudeApiKey.trim()) {
      alert('Please configure your Claude API key in settings');
      setCurrentTab('settings');
      return;
    }

    // Store the original code for fix verification
    setCurrentAuditCode(code);
    const startTime = Date.now();
    setAuditStartTime(startTime);

    setAppState(prev => ({
      ...prev,
      isAnalyzing: true,
      progress: {
        stage: 'Initialization',
        progress: 0,
        message: 'Starting analysis...'
      }
    }));

    try {
      const auditEngine = new AuditEngine(appState.settings.claudeApiKey);

      const audit = await auditEngine.auditContract(
        code,
        metadata,
        (progress: AnalysisProgress) => {
          setAppState(prev => ({
            ...prev,
            progress
          }));
        }
      );

      setAppState(prev => ({
        ...prev,
        currentAudit: audit,
        auditHistory: [audit, ...prev.auditHistory],
        isAnalyzing: false,
        progress: null
      }));
      setAuditStartTime(null);
    } catch (error) {
      console.error('Audit failed:', error);
      alert(`Audit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      setAppState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: null
      }));
      setAuditStartTime(null);
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'audit':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                SolidAudit
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Professional smart contract security auditing powered by AI
              </p>
            </div>

            <ProgressTracker
              progress={appState.progress}
              isAnalyzing={appState.isAnalyzing}
              startTime={auditStartTime || undefined}
            />

            {!appState.currentAudit && !appState.isAnalyzing && (
              <CodeUpload
                onFileUpload={handleFileUpload}
                onCodePaste={handleCodePaste}
                isLoading={appState.isAnalyzing}
              />
            )}

            {appState.currentAudit && !appState.isAnalyzing && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Audit Results
                  </h2>
                  <Button
                    variant="secondary"
                    onClick={() => setAppState(prev => ({ ...prev, currentAudit: null }))}
                  >
                    New Audit
                  </Button>
                </div>
                <AuditResults
                  audit={appState.currentAudit}
                  originalCode={currentAuditCode}
                  claudeApiKey={appState.settings.claudeApiKey}
                />
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>

            {appState.auditHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No audits performed yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {appState.auditHistory.map((audit, index) => (
                  <Card key={audit.contractHash} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {audit.metadata.contractName}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(audit.timestamp)} • Score: {audit.score}/100
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {audit.totalIssues} issues found
                          </span>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setAppState(prev => ({ ...prev, currentAudit: audit }));
                              setCurrentTab('audit');
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Claude API Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
                      API Key
                    </label>
                    <input
                      id="api-key"
                      type="password"
                      value={appState.settings.claudeApiKey}
                      onChange={(e) => setAppState(prev => ({
                        ...prev,
                        settings: { ...prev.settings, claudeApiKey: e.target.value }
                      }))}
                      placeholder="sk-ant-api03-..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-500 focus:border-brand-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your API key is stored locally and never sent to our servers
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Button
                      onClick={saveSettings}
                      disabled={!appState.settings.claudeApiKey.trim()}
                    >
                      Save Settings
                    </Button>
                    {saveMessage && (
                      <span className="text-sm text-green-600 font-medium">
                        {saveMessage}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'reports':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

            {appState.auditHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No audits available to generate reports from</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Complete an audit to generate comprehensive reports
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Generate Reports from Previous Audits
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Select an audit from your history to generate detailed reports in PDF, JSON, or HTML format.
                    </p>
                  </CardContent>
                </Card>

                {appState.auditHistory.map((audit, index) => (
                  <Card key={audit.contractHash} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-2">
                            <h4 className="font-semibold text-gray-900">
                              {audit.metadata.contractName}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              audit.score >= 80
                                ? 'bg-green-100 text-green-800'
                                : audit.score >= 60
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              Score: {audit.score}/100
                            </span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span>{formatDate(audit.timestamp)}</span>
                            <span>{audit.totalIssues} issues found</span>
                            <span>{audit.gasOptimizations.length} optimizations</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              try {
                                ReportGenerator.generatePDFReport(audit);
                              } catch (error) {
                                console.error('PDF generation failed:', error);
                                alert('Failed to generate PDF report');
                              }
                            }}
                            className="flex items-center space-x-1"
                          >
                            <FileText className="w-4 h-4" />
                            <span>PDF</span>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              try {
                                ReportGenerator.generateJSONReport(audit);
                              } catch (error) {
                                console.error('JSON generation failed:', error);
                                alert('Failed to generate JSON report');
                              }
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Code className="w-4 h-4" />
                            <span>JSON</span>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              try {
                                ReportGenerator.generateHTMLReport(audit);
                              } catch (error) {
                                console.error('HTML generation failed:', error);
                                alert('Failed to generate HTML report');
                              }
                            }}
                            className="flex items-center space-x-1"
                          >
                            <Globe className="w-4 h-4" />
                            <span>HTML</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'analytics':
        const analyticsData = {
          metrics: AnalyticsEngine.calculateMetrics(appState.auditHistory),
          trendData: AnalyticsEngine.generateTrendData(appState.auditHistory),
          patterns: AnalyticsEngine.analyzeIssuePatterns(appState.auditHistory),
          insights: AnalyticsEngine.generateInsights(appState.auditHistory),
          comparisons: AnalyticsEngine.generateComparisonData(appState.auditHistory)
        };

        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive insights from your audit history</p>
            </div>

            {appState.auditHistory.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">No analytics data available</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Complete at least one audit to start seeing analytics and insights
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Metrics Overview */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview Metrics</h2>
                  <MetricsCards metrics={analyticsData.metrics} />
                </div>

                {/* Trend Analysis */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h2>
                  <TrendCharts
                    trendData={analyticsData.trendData}
                    metrics={analyticsData.metrics}
                  />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* Issue Patterns */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Vulnerability Patterns</h2>
                    <IssuePatterns patterns={analyticsData.patterns} />
                  </div>

                  {/* Insights */}
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Insights</h2>
                    <InsightsPanel insights={analyticsData.insights} />
                  </div>
                </div>

                {/* Contract Comparison */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Comparison</h2>
                  <ComparisonTable comparisons={analyticsData.comparisons} />
                </div>
              </>
            )}
          </div>
        );

      default:
        return (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">Feature coming soon...</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
}

export default App;