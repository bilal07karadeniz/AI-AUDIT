import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatDate } from '../utils';
import type { ContractAudit, AuditReport, ReportSection } from '../../types';

export class ReportGenerator {

  /**
   * Generate enhanced PDF report from audit data
   */
  public static async generatePDFReport(audit: ContractAudit): Promise<void> {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Enhanced color scheme
    const colors = {
      primary: [71, 85, 105],    // brand-600
      secondary: [148, 163, 184], // brand-300
      success: [34, 197, 94],     // green-500
      warning: [245, 158, 11],    // orange-500
      danger: [239, 68, 68],      // red-500
      text: [55, 65, 81],         // gray-700
      lightBg: [248, 250, 252]    // gray-50
    };

    // Helper function to add text with word wrapping
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        pdf.addPage();
        yPosition = 20;
      }
    };

    // Enhanced header with branding
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SolidAudit', 20, 20);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Professional Smart Contract Security Report', 20, 28);

    // Date and report ID on the right
    pdf.setFontSize(10);
    pdf.text(`Generated: ${formatDate(new Date().toISOString())}`, pageWidth - 20, 20, { align: 'right' });
    pdf.text(`Report ID: ${audit.contractHash.slice(0, 8)}`, pageWidth - 20, 26, { align: 'right' });

    yPosition = 50;
    pdf.setTextColor(...colors.text);

    // Executive Summary Box
    checkNewPage(60);
    pdf.setFillColor(...colors.lightBg);
    pdf.roundedRect(20, yPosition, pageWidth - 40, 50, 3, 3, 'F');
    pdf.setDrawColor(...colors.secondary);
    pdf.roundedRect(20, yPosition, pageWidth - 40, 50, 3, 3, 'S');

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('Executive Summary', 25, yPosition + 8);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.text);

    const summaryRiskLevel = audit.score >= 80 ? 'LOW' : audit.score >= 60 ? 'MEDIUM' : audit.score >= 40 ? 'HIGH' : 'CRITICAL';
    const riskColor = audit.score >= 80 ? colors.success : audit.score >= 60 ? colors.warning : colors.danger;

    yPosition = addWrappedText(`Contract: ${audit.metadata.contractName}`, 25, yPosition + 18, pageWidth - 50, 11);
    yPosition = addWrappedText(`Security Score: ${audit.score}/100 (${summaryRiskLevel} Risk)`, 25, yPosition + 2, pageWidth - 50, 11);
    yPosition = addWrappedText(`Total Issues: ${audit.totalIssues} (${audit.highSeverityCount} High, ${audit.mediumSeverityCount} Medium, ${audit.lowSeverityCount} Low)`, 25, yPosition + 2, pageWidth - 50, 11);
    yPosition = addWrappedText(`Analysis Time: ${Math.round(audit.analysisTime / 1000)}s`, 25, yPosition + 2, pageWidth - 50, 11);

    yPosition += 15;

    // Enhanced Contract Metrics in a grid layout
    checkNewPage(80);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('Contract Metrics', 20, yPosition);
    yPosition += 15;

    // Create a metrics grid
    const metrics = [
      { label: 'Contract Name', value: audit.metadata.contractName },
      { label: 'Compiler', value: audit.metadata.compiler },
      { label: 'Functions', value: audit.metadata.functions.length.toString() },
      { label: 'Lines of Code', value: audit.metadata.linesOfCode.toString() },
      { label: 'Complexity Score', value: audit.metadata.complexity.toString() },
      { label: 'Analysis Duration', value: `${Math.round(audit.analysisTime / 1000)}s` }
    ];

    const colWidth = (pageWidth - 60) / 2;
    let col = 0;
    let row = 0;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    for (const metric of metrics) {
      const x = 20 + (col * colWidth);
      const y = yPosition + (row * 12);

      // Draw metric box
      pdf.setFillColor(250, 250, 250);
      pdf.roundedRect(x, y - 2, colWidth - 10, 10, 1, 1, 'F');

      pdf.setTextColor(...colors.text);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${metric.label}:`, x + 2, y + 4);

      pdf.setFont('helvetica', 'normal');
      const labelWidth = pdf.getTextWidth(`${metric.label}: `);
      pdf.text(metric.value, x + 2 + labelWidth, y + 4);

      col++;
      if (col >= 2) {
        col = 0;
        row++;
      }
    }

    yPosition += (Math.ceil(metrics.length / 2) * 12) + 10;

    // Score breakdown if available
    if (audit.scoreBreakdown) {
      checkNewPage(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.primary);
      pdf.text('Score Breakdown', 20, yPosition);
      yPosition += 12;

      const breakdown = audit.scoreBreakdown;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.text);

      yPosition = addWrappedText(`Security Issues Deduction: -${breakdown.securityIssues}`, 25, yPosition, pageWidth - 50);
      yPosition = addWrappedText(`Gas Efficiency Deduction: -${breakdown.gasEfficiency}`, 25, yPosition, pageWidth - 50);
      yPosition = addWrappedText(`Code Quality Deduction: -${breakdown.codeQuality}`, 25, yPosition, pageWidth - 50);
      yPosition = addWrappedText(`Pre-audit Warnings Deduction: -${breakdown.preAuditWarnings}`, 25, yPosition, pageWidth - 50);
      yPosition += 10;
    }

    // Enhanced Security Issues with priority sorting
    if (audit.issues.length > 0) {
      checkNewPage(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.primary);
      pdf.text(`Security Issues (${audit.issues.length} Found)`, 20, yPosition);
      yPosition += 15;

      // Sort issues by severity for better organization
      const sortedIssues = [...audit.issues].sort((a, b) => {
        const severityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      sortedIssues.forEach((issue, index) => {
        checkNewPage(60);

        // Issue header with severity badge
        const severityColors = {
          'HIGH': colors.danger,
          'MEDIUM': colors.warning,
          'LOW': [59, 130, 246] // blue
        };

        // Draw severity badge
        pdf.setFillColor(...severityColors[issue.severity]);
        pdf.roundedRect(20, yPosition - 3, 40, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(issue.severity, 40, yPosition + 1, { align: 'center' });

        // Issue title
        pdf.setTextColor(...colors.text);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText(`${index + 1}. ${issue.type}`, 70, yPosition, pageWidth - 90, 12);

        // Issue details in a structured format
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);

        // Location info
        pdf.setFillColor(248, 250, 252);
        pdf.rect(25, yPosition, pageWidth - 50, 8, 'F');
        pdf.setTextColor(...colors.text);
        yPosition = addWrappedText(`📍 Location: ${issue.function} (Line ${issue.line}) | CWE: ${issue.cweReference}`, 27, yPosition + 4, pageWidth - 54, 9);
        yPosition += 6;

        // Description
        pdf.setTextColor(...colors.text);
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText('Description:', 25, yPosition, pageWidth - 50, 9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(issue.description, 25, yPosition + 2, pageWidth - 50, 9);
        yPosition += 3;

        // Impact
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText('Impact:', 25, yPosition, pageWidth - 50, 9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(issue.impact, 25, yPosition + 2, pageWidth - 50, 9);
        yPosition += 3;

        // Recommendation
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText('Recommendation:', 25, yPosition, pageWidth - 50, 9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(issue.recommendation, 25, yPosition + 2, pageWidth - 50, 9);

        // Proof of concept if available
        if (issue.proofOfConcept) {
          yPosition += 3;
          pdf.setFont('helvetica', 'bold');
          yPosition = addWrappedText('Proof of Concept:', 25, yPosition, pageWidth - 50, 9);
          pdf.setFont('helvetica', 'normal');
          pdf.setFillColor(245, 245, 245);
          const pocLines = issue.proofOfConcept.split('\n');
          const pocHeight = pocLines.length * 3.5 + 4;
          pdf.rect(25, yPosition + 1, pageWidth - 50, pocHeight, 'F');
          yPosition = addWrappedText(issue.proofOfConcept, 27, yPosition + 3, pageWidth - 54, 8);
        }

        yPosition += 8;

        // Add separator line
        pdf.setDrawColor(...colors.secondary);
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 5;
      });
    }

    // Enhanced Gas Optimizations
    if (audit.gasOptimizations.length > 0) {
      checkNewPage(30);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.primary);
      pdf.text(`Gas Optimizations (${audit.gasOptimizations.length} Found)`, 20, yPosition);
      yPosition += 15;

      // Calculate total potential savings
      const totalSavings = audit.gasOptimizations.reduce((sum, opt) => sum + opt.gasSavings, 0);
      pdf.setFillColor(...colors.success);
      pdf.roundedRect(20, yPosition - 3, pageWidth - 40, 12, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Potential Gas Savings: ~${totalSavings.toLocaleString()} gas`, pageWidth / 2, yPosition + 4, { align: 'center' });
      yPosition += 18;

      audit.gasOptimizations.forEach((opt, index) => {
        checkNewPage(50);

        // Gas savings badge
        pdf.setFillColor(...colors.success);
        pdf.roundedRect(20, yPosition - 3, 60, 8, 2, 2, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`~${opt.gasSavings} gas`, 50, yPosition + 1, { align: 'center' });

        // Optimization title
        pdf.setTextColor(...colors.text);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText(`${index + 1}. ${opt.location}`, 90, yPosition, pageWidth - 110, 12);

        // Details
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);

        // Description
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText('Description:', 25, yPosition + 2, pageWidth - 50, 9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(opt.description, 25, yPosition + 2, pageWidth - 50, 9);
        yPosition += 3;

        // Impact
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText('Impact:', 25, yPosition, pageWidth - 50, 9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(opt.impact, 25, yPosition + 2, pageWidth - 50, 9);
        yPosition += 3;

        // Recommendation
        pdf.setFont('helvetica', 'bold');
        yPosition = addWrappedText('Implementation:', 25, yPosition, pageWidth - 50, 9);
        pdf.setFont('helvetica', 'normal');
        yPosition = addWrappedText(opt.recommendation, 25, yPosition + 2, pageWidth - 50, 9);

        // Code example if available
        if (opt.codeExample) {
          yPosition += 3;
          pdf.setFont('helvetica', 'bold');
          yPosition = addWrappedText('Code Example:', 25, yPosition, pageWidth - 50, 9);
          pdf.setFont('courier', 'normal');
          pdf.setFillColor(245, 245, 245);
          const codeLines = opt.codeExample.split('\n');
          const codeHeight = codeLines.length * 3.5 + 4;
          pdf.rect(25, yPosition + 1, pageWidth - 50, codeHeight, 'F');
          yPosition = addWrappedText(opt.codeExample, 27, yPosition + 3, pageWidth - 54, 8);
        }

        yPosition += 8;

        // Add separator line
        pdf.setDrawColor(...colors.secondary);
        pdf.line(20, yPosition, pageWidth - 20, yPosition);
        yPosition += 5;
      });
    }

    // Enhanced Recommendations Section
    if (audit.recommendations.length > 0) {
      checkNewPage(40);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...colors.primary);
      pdf.text('Recommendations & Best Practices', 20, yPosition);
      yPosition += 15;

      // Separate pre-audit warnings from general recommendations
      const preAuditRecs = audit.recommendations.filter(rec => rec.startsWith('Pre-analysis Warning:'));
      const generalRecs = audit.recommendations.filter(rec => !rec.startsWith('Pre-analysis Warning:'));

      if (preAuditRecs.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.warning);
        pdf.text('Pre-Analysis Warnings', 25, yPosition);
        yPosition += 10;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);

        preAuditRecs.forEach((rec) => {
          checkNewPage(15);
          const cleanRec = rec.replace('Pre-analysis Warning: ', '');
          yPosition = addWrappedText(`⚠️ ${cleanRec}`, 30, yPosition, pageWidth - 60, 9);
          yPosition += 4;
        });
        yPosition += 5;
      }

      if (generalRecs.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.primary);
        pdf.text('General Security Recommendations', 25, yPosition);
        yPosition += 10;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);

        generalRecs.forEach((rec, index) => {
          checkNewPage(15);
          yPosition = addWrappedText(`${index + 1}. ${rec}`, 30, yPosition, pageWidth - 60, 9);
          yPosition += 4;
        });
      }
    }

    // Conclusion and Risk Assessment
    checkNewPage(40);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text('Conclusion & Risk Assessment', 20, yPosition);
    yPosition += 15;

    const conclusionRiskLevel = audit.score >= 80 ? 'LOW' : audit.score >= 60 ? 'MEDIUM' : audit.score >= 40 ? 'HIGH' : 'CRITICAL';
    const riskDescription = {
      'LOW': 'The contract demonstrates good security practices with minimal issues.',
      'MEDIUM': 'The contract has some security concerns that should be addressed.',
      'HIGH': 'The contract has significant security issues requiring immediate attention.',
      'CRITICAL': 'The contract has critical security vulnerabilities and should not be deployed.'
    };

    pdf.setFillColor(...colors.lightBg);
    pdf.roundedRect(20, yPosition - 5, pageWidth - 40, 30, 3, 3, 'F');
    pdf.setDrawColor(...colors.secondary);
    pdf.roundedRect(20, yPosition - 5, pageWidth - 40, 30, 3, 3, 'S');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.text);
    yPosition = addWrappedText(`Overall Risk Level: ${conclusionRiskLevel}`, 25, yPosition, pageWidth - 50, 11);
    yPosition += 3;

    pdf.setFont('helvetica', 'normal');
    yPosition = addWrappedText(riskDescription[conclusionRiskLevel], 25, yPosition, pageWidth - 50, 11);
    yPosition += 8;

    if (audit.highSeverityCount > 0) {
      yPosition = addWrappedText(`Priority: Address ${audit.highSeverityCount} high-severity issues immediately.`, 25, yPosition, pageWidth - 50, 11);
    } else if (audit.mediumSeverityCount > 0) {
      yPosition = addWrappedText(`Priority: Review and address ${audit.mediumSeverityCount} medium-severity issues.`, 25, yPosition, pageWidth - 50, 11);
    } else {
      yPosition = addWrappedText('Priority: Consider implementing gas optimizations and best practices.', 25, yPosition, pageWidth - 50, 11);
    }

    yPosition += 20;

    // Enhanced Footer with branding and disclaimer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);

      // Footer separator line
      pdf.setDrawColor(...colors.secondary);
      pdf.line(20, pageHeight - 25, pageWidth - 20, pageHeight - 25);

      // Footer content
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...colors.text);

      // Left side - generation info
      pdf.text(`Generated by SolidAudit v1.0 on ${formatDate(new Date().toISOString())}`, 20, pageHeight - 18);
      pdf.text(`Contract Hash: ${audit.contractHash}`, 20, pageHeight - 12);

      // Center - disclaimer
      pdf.setTextColor(...colors.secondary);
      pdf.text('This report is for informational purposes only. Always conduct manual reviews.', pageWidth / 2, pageHeight - 18, { align: 'center' });

      // Right side - page info
      pdf.setTextColor(...colors.text);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 20, pageHeight - 18, { align: 'right' });
      pdf.text('solidaudit.io', pageWidth - 20, pageHeight - 12, { align: 'right' });
    }

    // Save the PDF
    const fileName = `${audit.metadata.contractName}_audit_report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  }

  /**
   * Generate enhanced JSON report with comprehensive data
   */
  public static generateJSONReport(audit: ContractAudit): void {
    const report = {
      reportMetadata: {
        generatedBy: 'SolidAudit v1.0',
        generatedAt: new Date().toISOString(),
        reportId: audit.contractHash.slice(0, 16),
        domain: 'solidaudit.io'
      },
      contractInfo: {
        name: audit.metadata.contractName,
        hash: audit.contractHash,
        analysisDate: audit.timestamp,
        compiler: audit.metadata.compiler,
        functionsCount: audit.metadata.functions.length,
        linesOfCode: audit.metadata.linesOfCode,
        complexity: audit.metadata.complexity,
        version: audit.metadata.version,
        deploymentNetwork: audit.metadata.deploymentNetwork
      },
      securityAssessment: {
        overallScore: audit.score,
        riskLevel: audit.score >= 80 ? 'LOW' : audit.score >= 60 ? 'MEDIUM' : audit.score >= 40 ? 'HIGH' : 'CRITICAL',
        confidenceLevel: audit.confidenceLevel || 95,
        scoreBreakdown: audit.scoreBreakdown || {},
        preAuditWarnings: audit.preAuditWarnings || []
      },
      summary: {
        totalIssues: audit.totalIssues,
        issuesByCategory: {
          high: audit.highSeverityCount,
          medium: audit.mediumSeverityCount,
          low: audit.lowSeverityCount
        },
        gasOptimizations: audit.gasOptimizations.length,
        totalPotentialGasSavings: audit.gasOptimizations.reduce((sum, opt) => sum + opt.gasSavings, 0),
        analysisTime: audit.analysisTime,
        analysisTimeFormatted: `${Math.round(audit.analysisTime / 1000)}s`
      },
      securityIssues: audit.issues.map(issue => ({
        id: issue.id,
        type: issue.type,
        severity: issue.severity,
        location: {
          function: issue.function,
          line: issue.line
        },
        description: issue.description,
        impact: issue.impact,
        recommendation: issue.recommendation,
        proofOfConcept: issue.proofOfConcept,
        cweReference: issue.cweReference,
        fixed: issue.fixed
      })),
      gasOptimizations: audit.gasOptimizations.map(opt => ({
        id: opt.id,
        location: opt.location,
        description: opt.description,
        impact: opt.impact,
        estimatedGasSavings: opt.gasSavings,
        recommendation: opt.recommendation,
        codeExample: opt.codeExample
      })),
      generalRecommendations: audit.recommendations,
      contractAnalysis: {
        functions: audit.metadata.functions,
        totalFunctions: audit.metadata.functions.length,
        codeComplexity: audit.metadata.complexity,
        structuralMetrics: {
          linesOfCode: audit.metadata.linesOfCode,
          functionsPerContract: audit.metadata.functions.length,
          estimatedGasOptimizationPotential: audit.gasOptimizations.reduce((sum, opt) => sum + opt.gasSavings, 0)
        }
      },
      auditTrail: {
        generatedAt: new Date().toISOString(),
        auditDuration: audit.analysisTime,
        toolVersion: '1.0.0',
        analysisEngine: 'Claude-4 + SolidAudit Engine'
      }
    };

    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${audit.metadata.contractName}_audit_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate HTML report
   */
  public static generateHTMLReport(audit: ContractAudit): void {
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'HIGH': return '#dc2626';
        case 'MEDIUM': return '#f59e0b';
        case 'LOW': return '#3b82f6';
        default: return '#6b7280';
      }
    };

    const getSeverityBadge = (severity: string) => {
      const color = getSeverityColor(severity);
      return `<span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">${severity}</span>`;
    };

    const htmlRiskLevel = audit.score >= 80 ? 'LOW' : audit.score >= 60 ? 'MEDIUM' : audit.score >= 40 ? 'HIGH' : 'CRITICAL';
    const totalGasSavings = audit.gasOptimizations.reduce((sum, opt) => sum + opt.gasSavings, 0);

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SolidAudit Report - ${audit.metadata.contractName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #374151;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .print-hidden {
            display: block;
        }
        @media print {
            .print-hidden { display: none; }
            body { background: white; }
        }
        .header {
            background: linear-gradient(135deg, #475569 0%, #334155 100%);
            color: white;
            padding: 60px 40px;
            border-radius: 16px;
            margin-bottom: 40px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            opacity: 0.3;
        }
        .header-content {
            position: relative;
            z-index: 1;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 3em;
            font-weight: 700;
            letter-spacing: -0.025em;
        }
        .header .subtitle {
            margin: 0 0 20px 0;
            opacity: 0.9;
            font-size: 1.25em;
            font-weight: 400;
        }
        .header-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .header-stat {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        .header-stat-value {
            font-size: 2em;
            font-weight: 700;
            margin-bottom: 5px;
        }
        .header-stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .score-circle {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 2em;
            font-weight: bold;
            color: white;
        }
        .score-high { background: linear-gradient(135deg, #10b981, #059669); }
        .score-medium { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .score-low { background: linear-gradient(135deg, #ef4444, #dc2626); }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
        }
        .info-label {
            font-size: 0.9em;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .info-value {
            font-weight: 600;
            color: #1f2937;
        }
        .issue {
            border-left: 4px solid #e5e7eb;
            padding: 20px;
            margin-bottom: 20px;
            background: #f9fafb;
            border-radius: 0 8px 8px 0;
        }
        .issue-high { border-left-color: #dc2626; }
        .issue-medium { border-left-color: #f59e0b; }
        .issue-low { border-left-color: #3b82f6; }
        .issue-title {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .issue-meta {
            color: #6b7280;
            font-size: 0.9em;
            margin-bottom: 15px;
        }
        .issue-section {
            margin-bottom: 15px;
        }
        .issue-section-title {
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
        }
        .optimization {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 0 8px 8px 0;
        }
        .gas-savings {
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.9em;
            font-weight: 600;
        }
        .function-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .function-tag {
            background: #e5e7eb;
            padding: 4px 12px;
            border-radius: 16px;
            font-size: 0.9em;
            font-family: monospace;
        }
        .recommendations ul {
            list-style-type: none;
            padding: 0;
        }
        .recommendations li {
            background: #eff6ff;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 8px;
            position: relative;
            padding-left: 30px;
        }
        .recommendations li::before {
            content: "💡";
            position: absolute;
            left: 10px;
            top: 15px;
        }
        .footer {
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
    </style>
        .tabs {
            display: flex;
            background: white;
            border-radius: 12px;
            padding: 8px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .tab {
            flex: 1;
            padding: 12px 24px;
            text-align: center;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }
        .tab.active {
            background: #475569;
            color: white;
        }
        .tab:hover:not(.active) {
            background: #f1f5f9;
        }
        .tab-content {
            display: none;
        }
        .tab-content.active {
            display: block;
        }
        .risk-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .risk-low { background: #dcfce7; color: #166534; }
        .risk-medium { background: #fef3c7; color: #92400e; }
        .risk-high { background: #fee2e2; color: #991b1b; }
        .risk-critical { background: #fecaca; color: #7f1d1d; }
    </style>
    <script>
        function switchTab(tabName) {
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            document.getElementById(tabName + '-content').classList.add('active');
            document.querySelector('[onclick="switchTab(\'' + tabName + '\')]").classList.add('active');
        }

        function printReport() {
            window.print();
        }

        document.addEventListener('DOMContentLoaded', function() {
            switchTab('overview');
        });
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>SolidAudit</h1>
                <p class="subtitle">Professional Smart Contract Security Report</p>
                <div class="header-stats">
                    <div class="header-stat">
                        <div class="header-stat-value">${audit.score}</div>
                        <div class="header-stat-label">Security Score</div>
                    </div>
                    <div class="header-stat">
                        <div class="header-stat-value">${audit.totalIssues}</div>
                        <div class="header-stat-label">Issues Found</div>
                    </div>
                    <div class="header-stat">
                        <div class="header-stat-value">${audit.gasOptimizations.length}</div>
                        <div class="header-stat-label">Optimizations</div>
                    </div>
                    <div class="header-stat">
                        <div class="header-stat-value">${Math.round(audit.analysisTime / 1000)}s</div>
                        <div class="header-stat-label">Analysis Time</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="tabs print-hidden">
            <div class="tab active" onclick="switchTab('overview')">Overview</div>
            <div class="tab" onclick="switchTab('issues')">Security Issues</div>
            <div class="tab" onclick="switchTab('optimizations')">Gas Optimizations</div>
            <div class="tab" onclick="switchTab('recommendations')">Recommendations</div>
        </div>

        <div class="print-hidden" style="text-align: right; margin-bottom: 20px;">
            <button onclick="printReport()" style="background: #475569; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500;">Print Report</button>
        </div>

        <!-- Overview Tab -->
        <div id="overview-content" class="tab-content active">
            <!-- Security Score -->
            <div class="card">
                <div style="text-align: center;">
                    <div class="score-circle ${audit.score >= 80 ? 'score-high' : audit.score >= 60 ? 'score-medium' : 'score-low'}">
                        ${audit.score}/100
                    </div>
                    <h2>Security Score</h2>
                    <p style="margin-top: 10px;">
                        <span class="risk-badge risk-${htmlRiskLevel.toLowerCase()}">${htmlRiskLevel} Risk</span>
                    </p>
                </div>
            </div>

    <!-- Contract Information -->
    <div class="card">
        <h2>Contract Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Contract Name</div>
                <div class="info-value">${audit.metadata.contractName}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Analysis Date</div>
                <div class="info-value">${formatDate(audit.timestamp)}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Total Issues</div>
                <div class="info-value">${audit.totalIssues}</div>
            </div>
            <div class="info-item">
                <div class="info-label">High Severity</div>
                <div class="info-value">${audit.highSeverityCount}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Medium Severity</div>
                <div class="info-value">${audit.mediumSeverityCount}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Low Severity</div>
                <div class="info-value">${audit.lowSeverityCount}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Functions</div>
                <div class="info-value">${audit.metadata.functions.length}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Lines of Code</div>
                <div class="info-value">${audit.metadata.linesOfCode}</div>
            </div>
        </div>
    </div>

    <!-- Security Issues -->
    ${audit.issues.length > 0 ? `
    <div class="card">
        <h2>Security Issues (${audit.issues.length})</h2>
        ${audit.issues.map(issue => `
            <div class="issue issue-${issue.severity.toLowerCase()}">
                <div class="issue-title">
                    ${getSeverityBadge(issue.severity)}
                    ${issue.type}
                </div>
                <div class="issue-meta">
                    Function: <strong>${issue.function}</strong> | Line: <strong>${issue.line}</strong> | CWE: <strong>${issue.cweReference}</strong>
                </div>
                <div class="issue-section">
                    <div class="issue-section-title">Description</div>
                    <div>${issue.description}</div>
                </div>
                <div class="issue-section">
                    <div class="issue-section-title">Impact</div>
                    <div>${issue.impact}</div>
                </div>
                <div class="issue-section">
                    <div class="issue-section-title">Recommendation</div>
                    <div>${issue.recommendation}</div>
                </div>
                ${issue.proofOfConcept ? `
                <div class="issue-section">
                    <div class="issue-section-title">Proof of Concept</div>
                    <div style="background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 6px; font-family: monospace; white-space: pre-wrap;">${issue.proofOfConcept}</div>
                </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <!-- Gas Optimizations -->
    ${audit.gasOptimizations.length > 0 ? `
    <div class="card">
        <h2>Gas Optimizations (${audit.gasOptimizations.length})</h2>
        ${audit.gasOptimizations.map(opt => `
            <div class="optimization">
                <div class="issue-title">
                    <span class="gas-savings">~${opt.gasSavings} gas</span>
                    ${opt.location}
                </div>
                <div class="issue-section">
                    <div class="issue-section-title">Description</div>
                    <div>${opt.description}</div>
                </div>
                <div class="issue-section">
                    <div class="issue-section-title">Impact</div>
                    <div>${opt.impact}</div>
                </div>
                <div class="issue-section">
                    <div class="issue-section-title">Recommendation</div>
                    <div>${opt.recommendation}</div>
                </div>
                ${opt.codeExample ? `
                <div class="issue-section">
                    <div class="issue-section-title">Code Example</div>
                    <div style="background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 6px; font-family: monospace; white-space: pre-wrap;">${opt.codeExample}</div>
                </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    <!-- General Recommendations -->
    ${audit.recommendations.length > 0 ? `
    <div class="card recommendations">
        <h2>General Recommendations</h2>
        <ul>
            ${audit.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
    ` : ''}
        </div>

        <!-- Issues Tab -->
        <div id="issues-content" class="tab-content">
            ${audit.issues.length > 0 ? `
            <div class="card">
                <h2>Security Issues (${audit.issues.length})</h2>
                ${audit.issues.map(issue => `
                    <div class="issue issue-${issue.severity.toLowerCase()}">
                        <div class="issue-title">
                            ${getSeverityBadge(issue.severity)}
                            ${issue.type}
                        </div>
                        <div class="issue-meta">
                            Function: <strong>${issue.function}</strong> | Line: <strong>${issue.line}</strong> | CWE: <strong>${issue.cweReference}</strong>
                        </div>
                        <div class="issue-section">
                            <div class="issue-section-title">Description</div>
                            <div>${issue.description}</div>
                        </div>
                        <div class="issue-section">
                            <div class="issue-section-title">Impact</div>
                            <div>${issue.impact}</div>
                        </div>
                        <div class="issue-section">
                            <div class="issue-section-title">Recommendation</div>
                            <div>${issue.recommendation}</div>
                        </div>
                        ${issue.proofOfConcept ? `
                        <div class="issue-section">
                            <div class="issue-section-title">Proof of Concept</div>
                            <div style="background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 6px; font-family: monospace; white-space: pre-wrap;">${issue.proofOfConcept}</div>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : '<div class="card"><p>No security issues found.</p></div>'}
        </div>

        <!-- Optimizations Tab -->
        <div id="optimizations-content" class="tab-content">
            ${audit.gasOptimizations.length > 0 ? `
            <div class="card">
                <h2>Gas Optimizations (${audit.gasOptimizations.length})</h2>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                    <strong>Total Potential Savings: ~${totalGasSavings.toLocaleString()} gas</strong>
                </div>
                ${audit.gasOptimizations.map(opt => `
                    <div class="optimization">
                        <div class="issue-title">
                            <span class="gas-savings">~${opt.gasSavings} gas</span>
                            ${opt.location}
                        </div>
                        <div class="issue-section">
                            <div class="issue-section-title">Description</div>
                            <div>${opt.description}</div>
                        </div>
                        <div class="issue-section">
                            <div class="issue-section-title">Impact</div>
                            <div>${opt.impact}</div>
                        </div>
                        <div class="issue-section">
                            <div class="issue-section-title">Recommendation</div>
                            <div>${opt.recommendation}</div>
                        </div>
                        ${opt.codeExample ? `
                        <div class="issue-section">
                            <div class="issue-section-title">Code Example</div>
                            <div style="background: #1f2937; color: #f9fafb; padding: 15px; border-radius: 6px; font-family: monospace; white-space: pre-wrap;">${opt.codeExample}</div>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            ` : '<div class="card"><p>No gas optimizations identified.</p></div>'}
        </div>

        <!-- Recommendations Tab -->
        <div id="recommendations-content" class="tab-content">
            ${audit.recommendations.length > 0 ? `
            <div class="card recommendations">
                <h2>Recommendations & Best Practices</h2>
                <ul>
                    ${audit.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            ` : '<div class="card"><p>No additional recommendations.</p></div>'}

            <!-- Functions -->
            ${audit.metadata.functions.length > 0 ? `
            <div class="card">
                <h2>Functions (${audit.metadata.functions.length})</h2>
                <div class="function-list">
                    ${audit.metadata.functions.map(func => `<span class="function-tag">${func}</span>`).join('')}
                </div>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <div style="text-align: center; padding: 40px 20px; border-top: 1px solid #e5e7eb; margin-top: 40px; background: white; border-radius: 12px;">
                <p style="margin: 0 0 10px 0; font-weight: 600; color: #475569;">Generated by SolidAudit v1.0</p>
                <p style="margin: 0 0 5px 0; color: #6b7280;">Professional Smart Contract Security Analysis</p>
                <p style="margin: 0 0 15px 0; font-size: 0.9em; color: #9ca3af;">Generated on ${formatDate(new Date().toISOString())}</p>
                <p style="margin: 0; font-size: 0.8em; color: #9ca3af;">Contract Hash: ${audit.contractHash}</p>
                <p style="margin: 10px 0 0 0; font-size: 0.8em; color: #9ca3af;">Visit us at solidaudit.io</p>
            </div>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${audit.metadata.contractName}_audit_report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}