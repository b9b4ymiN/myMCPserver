// =====================================================
// ENHANCED TOOL DESCRIPTION TYPES FOR LLM
// =====================================================
// This module defines types for creating LLM-optimized tool descriptions

/**
 * Enhanced input parameter description
 */
export interface ToolInputDescription {
  description: string;
  type: string;
  required: boolean;
  range?: string;
  example?: any;
  validation?: string;
}

/**
 * Enhanced output structure description
 */
export interface ToolOutputDescription {
  structure: Record<string, string>;
  example: any;
  format: string;
}

/**
 * Enhanced tool description for optimal LLM understanding
 */
export interface EnhancedToolDescription {
  // Core identification
  name: string;
  description: string;

  // LLM-specific context
  useCase: string;              // When to use this tool
  category: string;             // Tool category/group
  bestFor: string[];            // Best use cases

  // Input specifications
  inputs: Record<string, ToolInputDescription>;

  // Output specifications
  outputs: ToolOutputDescription;

  // Tool relationships
  relatedTools: string[];       // Tools to chain with
  alternatives?: string[];      // Alternative tools
  requires?: string[];          // Tools that should be called first

  // Execution context
  dataSource?: string;          // Where data comes from
  executionTime?: string;       // Expected execution time
  caching?: string;             // Cache behavior

  // Examples
  examples: Array<{
    input: Record<string, any>;
    output: any;
    scenario: string;
  }>;

  // Limitations
  limitations?: string[];       // Known limitations
  notes?: string;               // Additional notes
}

/**
 * Tool categories for organization
 */
export enum ToolCategory {
  VALUATION = 'Valuation',
  DATA_FETCHING = 'Data Fetching',
  FINANCIAL_STATEMENTS = 'Financial Statements',
  FINANCIAL_ANALYSIS = 'Financial Analysis',
  HISTORICAL_ANALYSIS = 'Historical Analysis',
  PORTFOLIO_MANAGEMENT = 'Portfolio Management',
  DIVIDEND_ANALYSIS = 'Dividend Analysis',
  WEB_RESEARCH = 'Web & Research',
  TIME_DATE = 'Time & Date',
  FILE_SYSTEM = 'File System',
  MATH_CALCULATIONS = 'Math & Calculations',
  UTILITY = 'Utility'
}

/**
 * Output format options
 */
export enum OutputFormat {
  SUMMARY = 'summary',      // Top key metrics + recommendation
  STANDARD = 'standard',    // Balanced detail (default)
  DETAILED = 'detailed',    // Full data with all fields
  MARKDOWN = 'markdown'     // Formatted markdown tables
}

/**
 * Response metadata
 */
export interface ResponseMetadata {
  toolVersion: string;
  dataSource: string;
  lastUpdated: string;
  confidence: number;
  dataQuality: 'high' | 'medium' | 'low';
  warnings?: string[];
  processingTime?: number;
}

/**
 * Enhanced tool response structure
 */
export interface EnhancedToolResponse<T = any> {
  summary?: {
    title: string;
    recommendation?: string;
    highlights: string[];
    confidence: number;
  };
  result: T;
  metadata: ResponseMetadata;
}

/**
 * Tool execution context
 */
export interface ToolExecutionContext {
  outputFormat?: OutputFormat;
  includeMetadata?: boolean;
  includeExamples?: boolean;
}
