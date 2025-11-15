import CryptoJS from 'crypto-js';
import type { ContractAnalysis } from '../../types';

export class CodeNormalizer {
  private static removeComments(code: string): string {
    // Remove single-line comments
    code = code.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');

    return code;
  }

  private static standardizeWhitespace(code: string): string {
    // Normalize line endings
    code = code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove trailing whitespace
    code = code.replace(/[ \t]+$/gm, '');

    // Normalize indentation (convert tabs to spaces)
    code = code.replace(/\t/g, '    ');

    // Remove excessive empty lines (more than 2 consecutive)
    code = code.replace(/\n{3,}/g, '\n\n');

    // Trim start and end
    code = code.trim();

    return code;
  }

  private static extractFunctions(code: string): string[] {
    const functionRegex = /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    const functions: string[] = [];
    let match;

    while ((match = functionRegex.exec(code)) !== null) {
      functions.push(match[1]);
    }

    return [...new Set(functions)]; // Remove duplicates
  }

  private static extractEvents(code: string): string[] {
    const eventRegex = /event\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    const events: string[] = [];
    let match;

    while ((match = eventRegex.exec(code)) !== null) {
      events.push(match[1]);
    }

    return [...new Set(events)];
  }

  private static extractModifiers(code: string): string[] {
    const modifierRegex = /modifier\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    const modifiers: string[] = [];
    let match;

    while ((match = modifierRegex.exec(code)) !== null) {
      modifiers.push(match[1]);
    }

    return [...new Set(modifiers)];
  }

  private static extractImports(code: string): string[] {
    const importRegex = /import\s+(?:.*from\s+)?["']([^"']+)["']/g;
    const imports: string[] = [];
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return [...new Set(imports)];
  }

  private static calculateComplexity(code: string): number {
    // Simple complexity calculation based on:
    // - Number of functions
    // - Number of conditionals (if, while, for)
    // - Number of nested blocks
    // - Lines of code

    const functionCount = (code.match(/function\s+/g) || []).length;
    const conditionalCount = (code.match(/\b(if|while|for|do)\b/g) || []).length;
    const nestedBlockCount = (code.match(/\{/g) || []).length;
    const linesOfCode = code.split('\n').filter(line => line.trim().length > 0).length;

    // Weighted complexity score
    return (functionCount * 2) + conditionalCount + (nestedBlockCount * 0.5) + (linesOfCode * 0.1);
  }

  public static normalize(code: string): string {
    let normalized = code;

    // Remove comments
    normalized = this.removeComments(normalized);

    // Standardize whitespace
    normalized = this.standardizeWhitespace(normalized);

    return normalized;
  }

  public static analyze(code: string): ContractAnalysis {
    const normalizedCode = this.normalize(code);
    const hash = this.generateHash(normalizedCode);

    return {
      normalizedCode,
      hash,
      functions: this.extractFunctions(code),
      events: this.extractEvents(code),
      modifiers: this.extractModifiers(code),
      imports: this.extractImports(code),
      complexity: this.calculateComplexity(normalizedCode)
    };
  }

  public static generateHash(code: string): string {
    const normalized = this.normalize(code);
    return CryptoJS.SHA256(normalized).toString(CryptoJS.enc.Hex);
  }
}

export class DeterministicHasher {
  public static generateContractHash(code: string, metadata?: Record<string, any>): string {
    const normalizedCode = CodeNormalizer.normalize(code);

    // Create a deterministic string that includes code and relevant metadata
    const dataToHash = JSON.stringify({
      code: normalizedCode,
      metadata: metadata ? this.sortObjectKeys(metadata) : {}
    });

    return CryptoJS.SHA256(dataToHash).toString(CryptoJS.enc.Hex);
  }

  public static generateIssueHash(issue: {
    type: string;
    line: number;
    function: string;
    description: string;
  }): string {
    const dataToHash = JSON.stringify(this.sortObjectKeys(issue));
    return CryptoJS.SHA256(dataToHash).toString(CryptoJS.enc.Hex);
  }

  private static sortObjectKeys(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObjectKeys(item));
    }

    const sortedKeys = Object.keys(obj).sort();
    const sortedObj: any = {};

    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObjectKeys(obj[key]);
    }

    return sortedObj;
  }

  public static validateHash(code: string, expectedHash: string): boolean {
    const actualHash = this.generateContractHash(code);
    return actualHash === expectedHash;
  }

  public static generateHash(input: string): string {
    return CryptoJS.SHA256(input).toString(CryptoJS.enc.Hex);
  }
}