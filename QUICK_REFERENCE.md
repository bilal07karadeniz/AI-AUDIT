# AI-AUDIT: Quick Reference Guide

## File Locations

### Core Application Files
```
/src/App.tsx                          # Main app with tab routing (audit, history, reports, analytics, settings)
/src/main.tsx                         # React entry point
/src/types/index.ts                   # Global type definitions
/src/types/audit.ts                   # Audit-specific types
/src/lib/utils.ts                     # Utility functions (cn, formatDate, etc.)
```

### Authentication & Settings
```
/src/components/layout/Layout.tsx     # Layout wrapper with ErrorBoundary & ToastContext
/src/components/layout/Navigation.tsx # Tab navigation component
```

### Audit Workflow
```
/src/components/audit/CodeUpload.tsx              # File upload & code paste interface
/src/components/audit/AuditWorkflow.tsx           # Multi-step audit workflow (overview → issues → fix → results)
/src/components/audit/AuditResults.tsx            # Displays audit results (BROKEN - undefined state)
/src/components/audit/SecurityScore.tsx           # Security score visualization
/src/components/audit/IssueList.tsx               # Display security issues
/src/components/audit/GasOptimizations.tsx        # Gas optimization recommendations
/src/components/audit/ProgressTracker.tsx         # Real-time analysis progress
/src/lib/audit/index.ts                           # AuditEngine - core analysis logic
```

### Fix Verification
```
/src/components/fixVerification/EnhancedBulkFixModal.tsx        # Main fix submission UI
/src/components/fixVerification/BulkFixSubmissionModal.tsx       # Alternative modal
/src/components/fixVerification/FixSubmissionModal.tsx           # Legacy modal
/src/components/fixVerification/BulkFixResults.tsx               # Display fix verification results
/src/components/fixVerification/FixVerificationProgress.tsx      # Progress tracking
/src/lib/fixVerification/index.ts                                # FixVerificationEngine (BROKEN - undefined vars)
```

### Version Management
```
/src/lib/versionManager.ts                        # VersionManager - localStorage-based version tracking
/src/components/versioning/VersionSelector.tsx    # Select contract versions
/src/components/versioning/VersionComparison.tsx  # Compare versions
```

### Analytics & Reporting
```
/src/components/analytics/MetricsCards.tsx        # KPI cards
/src/components/analytics/TrendCharts.tsx         # Historical trends
/src/components/analytics/IssuePatterns.tsx       # Vulnerability patterns
/src/components/analytics/InsightsPanel.tsx       # AI insights
/src/components/analytics/ComparisonTable.tsx     # Multi-contract comparison
/src/lib/analytics/index.ts                       # AnalyticsEngine - metrics calculations
/src/lib/reports/index.ts                         # ReportGenerator - PDF/JSON/HTML generation (1159 lines)
```

### Security & Validation
```
/src/lib/security/index.ts                        # SecurityValidator, InputValidator
/src/lib/hash/index.ts                            # CodeNormalizer, DeterministicHasher
/src/lib/cache/index.ts                           # AuditCache - localStorage caching
/src/lib/claude/index.ts                          # ClaudeAPI (BROKEN - no backend)
```

### UI Components
```
/src/components/ui/Button.tsx                     # Reusable button
/src/components/ui/Card.tsx                       # Card layout component
/src/components/ui/Badge.tsx                      # Badge component
/src/components/ui/ProgressRing.tsx               # Circular progress indicator
/src/components/ui/LoadingSpinner.tsx             # Loading spinner
```

## Data Flow Diagrams

### Audit Flow
```
CodeUpload.tsx
  └─> App.tsx (handleFileUpload)
    └─> performAudit()
      └─> AuditEngine.auditContract()
        ├─> validateContract()
        ├─> CodeNormalizer.analyze()
        ├─> AuditCache.get() [Cache check]
        ├─> ClaudeAPI.analyzeContract() [❌ FAILS - no backend]
        ├─> calculateEnhancedSecurityScore()
        └─> AuditCache.set() [Cache store]
  └─> App state: currentAudit
    └─> AuditResults.tsx
      └─> AuditWorkflow.tsx [Multiple steps]
```

### Fix Verification Flow
```
EnhancedBulkFixModal.tsx
  └─> onSubmit(fixedCode)
    └─> handleFixSubmission()
      └─> FixVerificationEngine.submitFixVerification()
        ├─> buildBulkVerificationPrompt()
        ├─> ClaudeAPI.analyzeCode() [❌ FAILS - no backend]
        ├─> parseBulkVerificationResponse()
        └─> onProgressUpdate() callbacks
  └─> Create new version
    └─> VersionManager.addVersion()
    └─> VersionManager.updateVersionWithFixSubmission()
```

### State Persistence
```
localStorage
├─> audit-settings: { claudeApiKey, autoSave, theme, reportFormat, ... }
├─> audit-cache: Map<hash, CacheEntry>
├─> ai_audit_versions: ContractVersion[]
└─> ai_audit_active_fix: FixSubmission | null

App.tsx state
├─> currentAudit: ContractAudit
├─> auditHistory: ContractAudit[]
├─> isAnalyzing: boolean
├─> progress: AnalysisProgress
├─> cache: Map
└─> settings: AppSettings
```

## Critical Code Paths

### 1. File Upload → Analysis
```typescript
// File: CodeUpload.tsx
onDrop(acceptedFiles)
  → validateFile(name, size, content)
  → detectContractType()
  → onFileUpload(processedFiles)

// File: App.tsx
handleFileUpload(files)
  → performAudit(code, metadata)
  → AuditEngine.auditContract()

// File: lib/audit/index.ts
auditContract(code, metadata, onProgress)
  → validateContract()
  → CodeNormalizer.analyze()
  → AuditCache.get()
  → ClaudeAPI.analyzeContract() ❌ BROKEN HERE
  → calculateEnhancedSecurityScore()
```

### 2. Fix Submission → Verification
```typescript
// File: EnhancedBulkFixModal.tsx
handleSubmit()
  → onSubmit(fixedCode, notes)

// File: AuditResults.tsx
handleFixSubmission()
  → FixVerificationEngine.submitFixVerification() ❌ BROKEN HERE
  → (onProgressUpdate callback)
  → VersionManager.addVersion()
```

### 3. Dashboard Display
```typescript
// File: App.tsx
case 'analytics':
  → AnalyticsEngine.calculateMetrics(auditHistory)
  → AnalyticsEngine.generateTrendData()
  → AnalyticsEngine.analyzeIssuePatterns()
  → AnalyticsEngine.generateInsights()
  → AnalyticsEngine.generateComparisonData()
  → MetricsCards, TrendCharts, IssuePatterns, etc.
```

## API Contract Expected

### Claude API Endpoint (Missing!)
```
POST /api/claude/messages
Headers:
  Content-Type: application/json
  X-API-Key: sk-ant-...
  anthropic-dangerous-direct-browser-access: true

Request Body:
{
  model: "claude-opus-4-1-20250805",
  max_tokens: 32000,
  temperature: 0,
  seed: "contract-hash",
  messages: [
    {
      role: "user",
      content: "...analysis prompt..."
    }
  ]
}

Expected Response:
{
  content: [
    {
      text: "{\"issues\": [...], \"gasOptimizations\": [...], ...}"
    }
  ]
}
```

## Type Interfaces at a Glance

### ContractAudit
```typescript
interface ContractAudit {
  contractHash: string;
  score: number;                    // 0-100
  timestamp: string;                // ISO date
  issues: SecurityIssue[];          // Vulnerabilities found
  recommendations: string[];
  gasOptimizations: GasOptimization[];
  metadata: AuditMetadata;
  analysisTime: number;             // milliseconds
  totalIssues: number;
  highSeverityCount: number;
  mediumSeverityCount: number;
  lowSeverityCount: number;
  scoreBreakdown?: { ... };
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  confidenceLevel?: number;
}
```

### SecurityIssue
```typescript
interface SecurityIssue {
  id: string;
  type: string;                     // e.g., "reentrancy", "access_control"
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  line: number;
  function: string;
  description: string;
  impact: string;
  recommendation: string;
  proofOfConcept?: string;
  cweReference: string;             // e.g., "CWE-367"
  hash: string;                     // For tracking changes
  fixed: boolean;
  fixSubmission?: IndividualFixSubmission;
}
```

### ContractVersion
```typescript
interface ContractVersion {
  version: string;                  // "v1", "v2", "v3"
  code: string;                     // The contract code
  audit: ContractAudit;            // Audit results for this version
  submissionDate: string;           // ISO date
  submissionNotes?: string;
  fixSubmission?: FixSubmission;    // If fixes were submitted
  parentVersion?: string;           // Previous version (v1 → v2)
}
```

### FixSubmission
```typescript
interface FixSubmission {
  id: string;
  version: string;                  // e.g., "v2"
  originalVersion: string;          // e.g., "v1"
  fixedCode: string;               // The fixed contract code
  submissionDate: string;
  status: 'pending' | 'analyzing' | 'verified' | 'rejected' | 'partial';
  submissionNotes?: string;
  verificationResult?: BulkFixVerificationResult;
  progress?: FixVerificationProgress;
}
```

## Environment Setup Required

```typescript
// In settings tab, user must provide:
{
  claudeApiKey: "sk-ant-...",      // ⚠️ SECURITY ISSUE - shouldn't be client-side
  autoSave: true,
  theme: "light",
  reportFormat: "pdf",
  cacheEnabled: true,
  maxCacheSize: 100
}
```

## Configuration Files

```
/package.json                       # npm dependencies
/tsconfig.json                      # TypeScript config
/tsconfig.app.json                  # App-specific TypeScript
/vite.config.ts                     # Vite build config
/tailwind.config.js                 # Tailwind CSS config
/postcss.config.js                  # PostCSS config
/eslint.config.js                   # ESLint rules
```

## Build & Deployment

```bash
npm install                         # Install dependencies
npm run dev                         # Start dev server (Vite)
npm run build                       # Build for production
npm run preview                     # Preview production build
npm run lint                        # Run ESLint
```

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.1.1 | UI framework |
| typescript | 5.8.3 | Type safety |
| tailwindcss | 3.4.17 | CSS framework |
| vite | 7.1.2 | Build tool |
| jspdf | 3.0.2 | PDF generation |
| html2canvas | 1.4.1 | HTML to canvas |
| recharts | 3.2.1 | Charts |
| crypto-js | 4.2.0 | Hashing |
| react-dropzone | 14.3.8 | File upload |
| date-fns | 4.1.0 | Date formatting |
| lucide-react | 0.544.0 | Icons |

## Production Blockers

1. ❌ No backend server
2. ❌ No API endpoint implementation
3. ❌ No authentication system
4. ❌ No database (only localStorage)
5. ❌ API key exposed in client code
6. ❌ Undefined state variables
7. ❌ Broken fix verification
8. ❌ No error recovery

## Next Steps

1. **Create Backend Server** (Express.js / Node.js)
2. **Implement Claude API Proxy** on backend
3. **Add Authentication** (JWT or similar)
4. **Add Database** (PostgreSQL / MongoDB)
5. **Fix Component State Issues**
6. **Complete Error Handling**
7. **Add Unit Tests**
8. **Security Audit & Fixes**

## Debug Tips

### Check Cache
```typescript
// In browser console:
JSON.parse(localStorage.getItem('audit-cache'))
```

### Check Versions
```typescript
// In browser console:
JSON.parse(localStorage.getItem('ai_audit_versions'))
```

### Check Settings
```typescript
// In browser console:
JSON.parse(localStorage.getItem('audit-settings'))
```

### Clear All
```typescript
// In browser console:
localStorage.clear()
```
