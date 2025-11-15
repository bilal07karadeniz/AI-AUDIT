export * from './audit';

export interface AppState {
  currentAudit: ContractAudit | null;
  contractVersions: ContractVersion[];
  currentVersion: string | null;
  activeFixSubmission: FixSubmission | null;
  auditHistory: ContractAudit[];
  isAnalyzing: boolean;
  progress: AnalysisProgress | null;
  cache: Map<string, CacheEntry>;
  settings: AppSettings;
}

export interface AppSettings {
  claudeApiKey: string;
  autoSave: boolean;
  theme: 'light' | 'dark';
  reportFormat: 'pdf' | 'json' | 'html';
  cacheEnabled: boolean;
  maxCacheSize: number;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
}

export interface DashboardStats {
  totalAudits: number;
  averageScore: number;
  totalIssuesFound: number;
  totalIssuesFixed: number;
  scoreImprovement: number;
}

import type { ContractAudit, AnalysisProgress, CacheEntry, ContractVersion, FixSubmission } from './audit';