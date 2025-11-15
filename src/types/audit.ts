export type SeverityLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface SecurityIssue {
  id: string;
  type: string;
  severity: SeverityLevel;
  line: number;
  function: string;
  description: string;
  impact: string;
  recommendation: string;
  proofOfConcept?: string;
  cweReference: string;
  hash: string;
  fixed: boolean;
  fixSubmission?: IndividualFixSubmission;
}

export interface IndividualFixSubmission {
  id: string;
  issueId: string;
  submittedCode: string;
  originalCode: string;
  submissionDate: string;
  status: 'pending' | 'verified' | 'rejected' | 'partial';
  verificationResult?: FixVerificationResult;
  submissionNotes?: string;
}

export interface FixVerificationResult {
  isFixed: boolean;
  confidence: number;
  explanation: string;
  remainingIssues: string[];
  newIssuesIntroduced: string[];
  improvementSuggestions: string[];
  codeQualityScore: number;
  verifiedAt: string;
}

export interface ContractVersion {
  version: string; // v1, v2, v3, etc.
  code: string;
  audit: ContractAudit;
  submissionDate: string;
  submissionNotes?: string;
  fixSubmission?: FixSubmission;
  parentVersion?: string; // Previous version this was based on
}

export interface FixSubmission {
  id: string;
  version: string;
  originalVersion: string;
  fixedCode: string;
  submissionDate: string;
  status: 'pending' | 'analyzing' | 'verified' | 'rejected' | 'partial';
  submissionNotes?: string;
  verificationResult?: BulkFixVerificationResult;
  progress?: FixVerificationProgress;
}

export interface FixVerificationProgress {
  stage: 'initializing' | 'analyzing_fixes' | 'checking_new_issues' | 'generating_report' | 'completed';
  progress: number; // 0-100
  message: string;
  currentIssue?: string;
  processedIssues?: number;
  totalIssues?: number;
  startTime: string;
  estimatedTimeRemaining?: number;
}

export interface BulkFixVerificationResult {
  overallStatus: 'all_fixed' | 'partial_fixes' | 'insufficient_fixes' | 'new_issues_introduced';
  confidence: number;
  globalCodeQualityScore: number;
  issueVerifications: IndividualIssueVerification[];
  newIssuesDetected: SecurityIssue[];
  overallRecommendations: string[];
  verifiedAt: string;
  improvementSummary: string;
}

export interface IndividualIssueVerification {
  originalIssueId: string;
  isFixed: boolean;
  confidence: number;
  explanation: string;
  remainingConcerns: string[];
}

export interface GasOptimization {
  id: string;
  location: string;
  description: string;
  impact: string;
  gasSavings: number;
  recommendation: string;
  codeExample?: string;
}

export interface AuditMetadata {
  contractName?: string;
  compiler: string;
  linesOfCode: number;
  functions: string[];
  complexity: number;
  version?: string;
  deploymentNetwork?: string;
}

export interface ContractAudit {
  contractHash: string;
  score: number;
  timestamp: string;
  issues: SecurityIssue[];
  recommendations: string[];
  gasOptimizations: GasOptimization[];
  metadata: AuditMetadata;
  analysisTime: number;
  totalIssues: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  scoreBreakdown?: {
    securityIssues: number;
    gasEfficiency: number;
    codeQuality: number;
    preAuditWarnings: number;
  };
  preAuditWarnings?: string[];
  confidenceLevel?: number;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  securityValidation?: any;
}

export interface AuditComparison {
  previousAudit: ContractAudit | null;
  currentAudit: ContractAudit;
  scoreImprovement: number;
  fixedIssues: SecurityIssue[];
  newIssues: SecurityIssue[];
  persistentIssues: SecurityIssue[];
}

export interface ClaudeAPIConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  seed?: string;
}

export interface ClaudeResponse {
  issues: SecurityIssue[];
  gasOptimizations: GasOptimization[];
  recommendations: string[];
  score: number;
  metadata?: Partial<AuditMetadata>;
}

export interface AnalysisProgress {
  stage: string;
  progress: number;
  message: string;
}

export interface CacheEntry {
  contractHash: string;
  result: ContractAudit;
  timestamp: string;
  expiresAt: string;
}

export interface UploadedFile {
  name: string;
  content: string;
  size: number;
  lastModified: number;
  validated?: boolean;
  contractType?: string;
  errors?: string[];
  validationStatus?: 'pending' | 'valid' | 'invalid';
  validationErrors?: string[];
  validationWarnings?: string[];
  securityValidation?: any;
  complexity?: any;
}

export interface ContractAnalysis {
  normalizedCode: string;
  hash: string;
  functions: string[];
  complexity: number;
  imports: string[];
  events: string[];
  modifiers: string[];
}

export interface ReportSection {
  title: string;
  content: string;
  type: 'text' | 'chart' | 'code' | 'table';
  data?: any;
}

export interface AuditReport {
  id: string;
  contractName: string;
  audit: ContractAudit;
  comparison?: AuditComparison;
  sections: ReportSection[];
  generatedAt: string;
  format: 'pdf' | 'json' | 'html';
}