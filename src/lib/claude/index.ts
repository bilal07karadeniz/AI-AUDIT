import type {
  ClaudeAPIConfig,
  ClaudeResponse,
  SecurityIssue,
  GasOptimization,
  ContractAnalysis,
  AnalysisProgress
} from '../../types';
import { DeterministicHasher } from '../hash';

export class ClaudeAPI {
  private apiKey: string;
  private baseConfig: ClaudeAPIConfig;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseConfig = {
      model: 'claude-opus-4-1-20250805',
      temperature: 0,
      max_tokens: 32000
    };
  }

  public async analyzeContract(
    analysis: ContractAnalysis,
    onProgress?: (progress: AnalysisProgress) => void
  ): Promise<ClaudeResponse> {
    if (onProgress) {
      onProgress({
        stage: 'Preparing analysis',
        progress: 10,
        message: 'Generating deterministic configuration...'
      });
    }

    const config: ClaudeAPIConfig = {
      ...this.baseConfig,
      seed: analysis.hash // Use contract hash as seed for deterministic results
    };

    const prompt = this.buildPrompt(analysis);

    if (onProgress) {
      onProgress({
        stage: 'Analyzing contract',
        progress: 30,
        message: 'Sending to Claude API...'
      });
    }

    try {
      const response = await this.makeAPICall(prompt, config);

      if (onProgress) {
        onProgress({
          stage: 'Processing results',
          progress: 80,
          message: 'Parsing and validating response...'
        });
      }

      const parsed = this.parseResponse(response);

      if (onProgress) {
        onProgress({
          stage: 'Complete',
          progress: 100,
          message: 'Analysis complete'
        });
      }

      return parsed;
    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildPrompt(analysis: ContractAnalysis): string {
    return `
You are SolidAudit, an expert smart contract security auditor. Analyze the following Solidity contract code and provide a comprehensive security assessment.

CRITICAL REQUIREMENTS:
1. Your analysis must be DETERMINISTIC - identical code should always produce identical results
2. Use the contract hash as a seed for consistent analysis: ${analysis.hash}
3. Provide specific line numbers and function names for each issue
4. Follow the exact JSON schema provided below

CONTRACT ANALYSIS:
- Hash: ${analysis.hash}
- Functions: ${analysis.functions.join(', ')}
- Complexity Score: ${analysis.complexity}
- Lines of Code: ${analysis.normalizedCode.split('\n').length}

CONTRACT CODE:
\`\`\`solidity
${analysis.normalizedCode}
\`\`\`

SECURITY FOCUS AREAS:
1. Reentrancy attacks (CWE-367)
2. Integer overflow/underflow (CWE-190/CWE-191)
3. Access control issues (CWE-284)
4. Unchecked external calls (CWE-252)
5. Front-running vulnerabilities (CWE-362)
6. Timestamp dependency (CWE-829)
7. Gas optimization opportunities
8. Best practices compliance

RESPONSE FORMAT (JSON only):
{
  "issues": [
    {
      "id": "unique-id",
      "type": "issue-type",
      "severity": "HIGH|MEDIUM|LOW",
      "line": number,
      "function": "function-name",
      "description": "detailed description",
      "impact": "impact assessment",
      "recommendation": "specific fix recommendation",
      "proofOfConcept": "optional exploit code",
      "cweReference": "CWE-XXX"
    }
  ],
  "gasOptimizations": [
    {
      "id": "unique-id",
      "location": "location description",
      "description": "optimization description",
      "impact": "gas impact",
      "gasSavings": estimated_gas_savings_number,
      "recommendation": "implementation recommendation",
      "codeExample": "optimized code example"
    }
  ],
  "recommendations": [
    "general recommendation 1",
    "general recommendation 2"
  ],
  "score": number_between_0_and_100
}

IMPORTANT: Respond with valid JSON only. No additional text or explanations.
`;
  }

  private async makeAPICall(prompt: string, config: ClaudeAPIConfig, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch('/api/claude/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey,
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: config.model,
            max_tokens: config.max_tokens,
            temperature: config.temperature,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.content[0].text;
        }

        const errorData = await response.json().catch(() => ({}));

        // If it's a 529 (overloaded) error and we have retries left, wait and retry
        if (response.status === 529 && attempt < retries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff, max 10s
          console.log(`API overloaded, retrying in ${waitTime}ms (attempt ${attempt}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // For other errors or if we've exhausted retries
        throw new Error(`API request failed: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`);

      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        // Wait before retrying on network errors
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Network error, retrying in ${waitTime}ms (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw new Error('Max retries exceeded');
  }

  private parseResponse(responseText: string): ClaudeResponse {
    try {
      // Clean the response to extract only JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and enhance the response
      const issues: SecurityIssue[] = (parsed.issues || []).map((issue: any) => ({
        ...issue,
        id: issue.id || DeterministicHasher.generateIssueHash(issue),
        hash: DeterministicHasher.generateIssueHash(issue),
        fixed: false
      }));

      const gasOptimizations: GasOptimization[] = (parsed.gasOptimizations || []).map((opt: any) => ({
        ...opt,
        id: opt.id || `gas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));

      return {
        issues,
        gasOptimizations,
        recommendations: parsed.recommendations || [],
        score: Math.max(0, Math.min(100, parsed.score || 0))
      };
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      console.error('Raw response:', responseText);
      throw new Error('Failed to parse analysis results');
    }
  }

  public validateAPIKey(): boolean {
    return this.apiKey.startsWith('sk-ant-') && this.apiKey.length > 20;
  }

  public async analyzeCode(prompt: string, config?: Partial<ClaudeAPIConfig>): Promise<string> {
    const finalConfig = { ...this.baseConfig, ...config };
    return await this.makeAPICall(prompt, finalConfig);
  }

  public async testConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/claude/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-1-20250805',
          max_tokens: 100,
          temperature: 0,
          messages: [
            {
              role: 'user',
              content: 'Test'
            }
          ]
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}