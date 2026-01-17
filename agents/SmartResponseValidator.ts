/**
 * SmartResponse Validator
 *
 * Validates SmartResponse and SmartResponseV2 format compliance
 * Provides detailed scoring and recommendations
 */

// =====================================================
// TYPES
// =====================================================

export interface ValidationError {
  section: string;
  field: string;
  message: string;
  severity: 'critical' | 'error';
}

export interface ValidationWarning {
  section: string;
  field: string;
  message: string;
  suggestion: string;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  level: 'excellent' | 'good' | 'fair' | 'poor';
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
}

export interface SmartResponseV2 {
  summary: {
    title: string;
    what: string;
    keyFindings: Array<{
      metric: string;
      value: string | number;
      formatted?: string;
      assessment: 'excellent' | 'good' | 'neutral' | 'concerning' | 'critical';
      icon?: string;
      threshold?: {
        value: number;
        operator: '>' | '<' | '=' | '>=' | '<=';
      };
      weight?: number;
    }>;
    conclusion?: string;
    confidence: {
      level: string;
      score: number; // 0-1
      factors: string[];
    };
  };
  data: any;
  metadata: {
    tool: string;
    category: string;
    dataSource: string;
    lastUpdated: string;
    processingTime?: number;
    dataQuality: {
      completeness: {
        percentage: number;
        status: string;
      };
      accuracy?: {
        score: number;
        factors: any[];
      };
      freshness?: {
        timestamp: string;
        age: {
          value: number;
          unit: string;
        };
        status: string;
      };
    };
    warnings?: Array<{
      id: string;
      severity: 'critical' | 'warning' | 'info' | 'debug';
      category: string;
      message: string;
      field?: string;
      impact?: string;
      suggestion?: string;
    }>;
  };
  recommendations?: {
    primary?: {
      action: string;
      confidence?: number;
      priority: string;
      reasoning: string;
      drivers?: Array<{
        factor: string;
        value: string | number;
        weight: number;
        direction: string;
      }>;
    };
    scenarios?: Array<{
      condition: string;
      action: string;
      reasoning: string;
    }>;
    nextSteps?: Array<{
      action: string;
      tool?: string;
      params?: any;
      priority: string;
      reason: string;
    }>;
    risks?: Array<{
      what: string;
      likelihood: string;
      impact: string;
      mitigation?: string;
    }>;
  };
  context?: {
    relatedTools?: Array<{
      name: string;
      reason: string;
      suggestedParams?: any;
      expectedValue?: string;
      priority?: string;
    }>;
    alternativeTools?: Array<{
      name: string;
      whenToUse: string;
      tradeoffs: string[];
    }>;
    suggestedFollowUp?: Array<{
      question: string;
      why: string;
      options?: string[];
    }>;
  };
  presentation?: {
    headline?: string;
    highlights?: string[];
    tables?: any[];
    formatting?: any;
  };
}

// =====================================================
// VALIDATOR CLASS
// =====================================================

export class SmartResponseValidator {
  /**
   * Validate SmartResponseV2 format
   */
  static validateV2(response: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const recommendations: string[] = [];

    // Check if response exists
    if (!response || typeof response !== 'object') {
      errors.push({
        section: 'root',
        field: 'response',
        message: 'Response is not a valid object',
        severity: 'critical'
      });
      return this.createResult(false, 0, errors, warnings, recommendations);
    }

    // Validate required sections
    this.validateRequiredSections(response, errors, warnings, recommendations);

    // Validate summary section
    if (response.summary) {
      this.validateSummary(response.summary, errors, warnings, recommendations);
    }

    // Validate data section
    if (response.data) {
      this.validateData(response.data, errors, warnings, recommendations);
    }

    // Validate metadata section
    if (response.metadata) {
      this.validateMetadata(response.metadata, errors, warnings, recommendations);
    }

    // Validate recommendations section
    if (response.recommendations) {
      this.validateRecommendations(response.recommendations, errors, warnings, recommendations);
    }

    // Validate context section
    if (response.context) {
      this.validateContext(response.context, errors, warnings, recommendations);
    }

    // Validate presentation section (optional)
    if (response.presentation) {
      this.validatePresentation(response.presentation, errors, warnings, recommendations);
    }

    // Calculate score
    const score = this.calculateScore(errors, warnings, recommendations);
    const valid = errors.filter(e => e.severity === 'critical').length === 0;

    return this.createResult(valid, score, errors, warnings, recommendations);
  }

  /**
   * Validate required sections exist
   */
  private static validateRequiredSections(
    response: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    const requiredSections = ['summary', 'data', 'metadata'];

    requiredSections.forEach(section => {
      if (!response[section]) {
        errors.push({
          section: 'root',
          field: section,
          message: `Missing required section: ${section}`,
          severity: 'critical'
        });
      }
    });

    // Optional but recommended sections
    const recommendedSections = ['recommendations', 'context'];
    recommendedSections.forEach(section => {
      if (!response[section]) {
        warnings.push({
          section: 'root',
          field: section,
          message: `Missing recommended section: ${section}`,
          suggestion: `Add ${section} section for better AI comprehension`
        });
        recommendations.push(`Add ${section} section`);
      }
    });
  }

  /**
   * Validate summary section
   */
  private static validateSummary(
    summary: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    // Required fields
    if (!summary.title) {
      errors.push({
        section: 'summary',
        field: 'title',
        message: 'Missing required field: title',
        severity: 'error'
      });
    }

    if (!summary.what) {
      errors.push({
        section: 'summary',
        field: 'what',
        message: 'Missing required field: what',
        severity: 'error'
      });
    }

    if (!summary.keyFindings || !Array.isArray(summary.keyFindings)) {
      errors.push({
        section: 'summary',
        field: 'keyFindings',
        message: 'keyFindings must be an array',
        severity: 'error'
      });
    } else {
      this.validateKeyFindings(summary.keyFindings, errors, warnings, recommendations);
    }

    if (!summary.confidence) {
      warnings.push({
        section: 'summary',
        field: 'confidence',
        message: 'Missing confidence information',
        suggestion: 'Add confidence object with level, score (0-1), and factors'
      });
      recommendations.push('Add confidence scoring');
    } else {
      this.validateConfidence(summary.confidence, errors, warnings, recommendations);
    }

    // Optional but recommended
    if (!summary.conclusion) {
      recommendations.push('Add conclusion field for one-sentence takeaway');
    }
  }

  /**
   * Validate keyFindings array
   */
  private static validateKeyFindings(
    keyFindings: any[],
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    if (keyFindings.length === 0) {
      errors.push({
        section: 'summary',
        field: 'keyFindings',
        message: 'keyFindings array is empty',
        severity: 'error'
      });
      return;
    }

    // Check length (should be 3-7)
    if (keyFindings.length < 3 || keyFindings.length > 7) {
      warnings.push({
        section: 'summary',
        field: 'keyFindings',
        message: `keyFindings has ${keyFindings.length} items (recommended: 3-7)`,
        suggestion: 'Aim for 3-7 key findings for optimal AI comprehension'
      });
    }

    // Check if V1 (strings) or V2 (objects)
    const firstItem = keyFindings[0];

    if (typeof firstItem === 'string') {
      // V1 format
      warnings.push({
        section: 'summary',
        field: 'keyFindings',
        message: 'keyFindings are plain strings (V1 format)',
        suggestion: 'Convert to semantic objects with metric, value, assessment'
      });
      recommendations.push('Convert keyFindings to SmartResponseV2 format');
    } else if (typeof firstItem === 'object') {
      // V2 format - validate structure
      keyFindings.forEach((finding, index) => {
        if (!finding.metric) {
          errors.push({
            section: 'summary',
            field: `keyFindings[${index}].metric`,
            message: 'Missing required field: metric',
            severity: 'error'
          });
        }

        if (finding.value === undefined) {
          errors.push({
            section: 'summary',
            field: `keyFindings[${index}].value`,
            message: 'Missing required field: value',
            severity: 'error'
          });
        }

        if (!finding.assessment) {
          errors.push({
            section: 'summary',
            field: `keyFindings[${index}].assessment`,
            message: 'Missing required field: assessment',
            severity: 'error'
          });
        } else {
          const validAssessments = ['excellent', 'good', 'neutral', 'concerning', 'critical'];
          if (!validAssessments.includes(finding.assessment)) {
            warnings.push({
              section: 'summary',
              field: `keyFindings[${index}].assessment`,
              message: `Invalid assessment: ${finding.assessment}`,
              suggestion: `Use one of: ${validAssessments.join(', ')}`
            });
          }
        }
      });
    }
  }

  /**
   * Validate confidence object
   */
  private static validateConfidence(
    confidence: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    if (typeof confidence === 'string') {
      // V1 format - just level
      warnings.push({
        section: 'summary',
        field: 'confidence',
        message: 'Confidence is plain string (V1 format)',
        suggestion: 'Add confidence object with level, score, and factors'
      });
      recommendations.push('Upgrade confidence to V2 format with score');
    } else if (typeof confidence === 'object') {
      // V2 format
      if (!confidence.level) {
        warnings.push({
          section: 'summary',
          field: 'confidence.level',
          message: 'Missing confidence level',
          suggestion: 'Add level: Very High | High | Medium | Low | Very Low'
        });
      }

      if (confidence.score === undefined) {
        warnings.push({
          section: 'summary',
          field: 'confidence.score',
          message: 'Missing numerical confidence score',
          suggestion: 'Add score field (0-1) for precise confidence measurement'
        });
        recommendations.push('Add numerical confidence score (0-1)');
      } else if (typeof confidence.score !== 'number' || confidence.score < 0 || confidence.score > 1) {
        errors.push({
          section: 'summary',
          field: 'confidence.score',
          message: 'Score must be a number between 0 and 1',
          severity: 'error'
        });
      }

      if (!confidence.factors || confidence.factors.length === 0) {
        recommendations.push('Add confidence factors to explain score');
      }
    }
  }

  /**
   * Validate data section
   */
  private static validateData(
    data: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    // Check for V2 enhancements
    if (!data.validation && !data.dataQuality) {
      warnings.push({
        section: 'data',
        field: 'structure',
        message: 'Data section lacks V2 enhancements',
        suggestion: 'Add validation and dataQuality with freshness/accuracy/completeness'
      });
      recommendations.push('Enhance data section with validation and quality metrics');
    }

    if (data.dataQuality) {
      if (!data.dataQuality.freshness) {
        recommendations.push('Add data freshness tracking with age calculation');
      }

      if (!data.dataQuality.accuracy) {
        recommendations.push('Add data accuracy tracking with verification status');
      }

      if (!data.dataQuality.completeness) {
        recommendations.push('Add data completeness tracking');
      }
    }
  }

  /**
   * Validate metadata section
   */
  private static validateMetadata(
    metadata: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    if (!metadata.tool) {
      errors.push({
        section: 'metadata',
        field: 'tool',
        message: 'Missing required field: tool',
        severity: 'error'
      });
    }

    if (!metadata.category) {
      warnings.push({
        section: 'metadata',
        field: 'category',
        message: 'Missing tool category',
        suggestion: 'Add category: Data Fetching | Valuation | Analysis | Screening | Utility'
      });
    }

    // Check warnings format
    if (metadata.warnings && metadata.warnings.length > 0) {
      const firstWarning = metadata.warnings[0];

      if (typeof firstWarning === 'string') {
        warnings.push({
          section: 'metadata',
          field: 'warnings',
          message: 'Warnings are plain strings (V1 format)',
          suggestion: 'Convert to structured warnings with id, severity, category'
        });
        recommendations.push('Convert warnings to structured format');
      }
    }

    // Check for assumptions
    if (!metadata.assumptions || metadata.assumptions.length === 0) {
      recommendations.push('Document assumptions explicitly in metadata');
    }
  }

  /**
   * Validate recommendations section
   */
  private static validateRecommendations(
    recommendations: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations_out: string[]
  ): void {
    if (!recommendations.primary) {
      recommendations_out.push('Use recommendations.primary structure for main recommendation');
    } else {
      if (!recommendations.primary.drivers || recommendations.primary.drivers.length === 0) {
        recommendations_out.push('Add recommendation drivers to show decision factors');
      }

      if (recommendations.primary.confidence === undefined) {
        recommendations_out.push('Add numerical confidence to recommendation');
      }
    }

    if (!recommendations.risks || recommendations.risks.length === 0) {
      recommendations_out.push('Add risk assessment to recommendations');
    }

    if (!recommendations.scenarios || recommendations.scenarios.length === 0) {
      recommendations_out.push('Add conditional scenarios for different market conditions');
    }
  }

  /**
   * Validate context section
   */
  private static validateContext(
    context: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    if (!context.relatedTools || context.relatedTools.length === 0) {
      recommendations.push('Add related tools for intelligent tool chaining');
    } else if (context.relatedTools.length > 0 && typeof context.relatedTools[0] === 'string') {
      warnings.push({
        section: 'context',
        field: 'relatedTools',
        message: 'relatedTools are plain strings (V1 format)',
        suggestion: 'Convert to objects with name, reason, suggestedParams'
      });
      recommendations.push('Enhance related tools with parameter suggestions');
    }
  }

  /**
   * Validate presentation section
   */
  private static validatePresentation(
    presentation: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    if (!presentation.headline) {
      recommendations.push('Add headline for user-facing summary');
    }

    if (!presentation.highlights || presentation.highlights.length === 0) {
      recommendations.push('Add highlights (3-5 bullet points)');
    }
  }

  /**
   * Calculate validation score (0-100)
   */
  private static calculateScore(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): number {
    let score = 100;

    // Critical errors: -20 each
    score -= errors.filter(e => e.severity === 'critical').length * 20;

    // Regular errors: -10 each
    score -= errors.filter(e => e.severity === 'error').length * 10;

    // Warnings: -5 each
    score -= warnings.length * 5;

    // Missing recommendations: -2 each
    score -= recommendations.length * 2;

    return Math.max(0, score);
  }

  /**
   * Create validation result
   */
  private static createResult(
    valid: boolean,
    score: number,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): ValidationResult {
    let level: 'excellent' | 'good' | 'fair' | 'poor';

    if (score >= 90) level = 'excellent';
    else if (score >= 75) level = 'good';
    else if (score >= 60) level = 'fair';
    else level = 'poor';

    return {
      valid,
      score,
      level,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Generate validation report
   */
  static generateReport(validation: ValidationResult, toolName: string): string {
    const lines: string[] = [];

    lines.push(`\n${'='.repeat(60)}`);
    lines.push(`SmartResponse Validation Report: ${toolName}`);
    lines.push(`${'='.repeat(60)}\n`);

    // Overall status
    const status = validation.valid ? '✅ VALID' : '❌ INVALID';
    const scoreEmoji = validation.score >= 80 ? '🟢' : validation.score >= 60 ? '🟡' : '🔴';
    lines.push(`Status: ${status}`);
    lines.push(`Score: ${scoreEmoji} ${validation.score}/100 (${validation.level.toUpperCase()})`);
    lines.push(`Errors: ${validation.errors.length}`);
    lines.push(`Warnings: ${validation.warnings.length}`);
    lines.push(`Recommendations: ${validation.recommendations.length}\n`);

    // Errors
    if (validation.errors.length > 0) {
      lines.push('❌ ERRORS:');
      validation.errors.forEach(err => {
        lines.push(`  [${err.section}.${err.field}] ${err.message}`);
      });
      lines.push('');
    }

    // Warnings
    if (validation.warnings.length > 0) {
      lines.push('⚠️  WARNINGS:');
      validation.warnings.forEach(warn => {
        lines.push(`  [${warn.section}.${warn.field}] ${warn.message}`);
        if (warn.suggestion) {
          lines.push(`    💡 ${warn.suggestion}`);
        }
      });
      lines.push('');
    }

    // Recommendations
    if (validation.recommendations.length > 0) {
      lines.push('💡 RECOMMENDATIONS:');
      validation.recommendations.forEach(rec => {
        lines.push(`  • ${rec}`);
      });
      lines.push('');
    }

    // Next steps based on score
    lines.push('📋 NEXT STEPS:');
    if (validation.score >= 80) {
      lines.push('  ✅ SmartResponse format is excellent!');
      lines.push('  • Ready for production use');
    } else if (validation.score >= 60) {
      lines.push('  ⚠️  Good format with room for improvement');
      lines.push('  • Address warnings for better quality');
      lines.push('  • Implement recommendations for 10/10 score');
    } else {
      lines.push('  🔴 Format needs significant improvement');
      lines.push('  • Convert to SmartResponseV2 format');
      lines.push('  • Add semantic keyFindings');
      lines.push('  • Implement confidence scoring');
      lines.push('  • Add structured warnings');
    }

    lines.push('');
    lines.push(`${'='.repeat(60)}\n`);

    return lines.join('\n');
  }

  /**
   * Quick validation (just score and validity)
   */
  static quickValidate(response: any): { valid: boolean; score: number } {
    const result = this.validateV2(response);
    return {
      valid: result.valid,
      score: result.score
    };
  }
}

export default SmartResponseValidator;
