// =====================================================
// SMART RESPONSE TYPES FOR LLM CONSUMPTION
// =====================================================
// This module defines standardized response formats to make output
// "smart" and easy for LLMs to understand and act upon.

/**
 * Main smart response structure
 * All tools should return data in this format for optimal LLM understanding
 */
export interface SmartResponse<T = any> {
  // Executive summary for quick LLM comprehension
  summary: {
    title: string;           // One-line summary
    what: string;             // What was requested
    keyFindings: string[];     // 3-7 key bullet points
    action: string;            // Recommended action
    confidence: 'High' | 'Medium' | 'Low'; // How certain is this data
  };

  // Core data (the "meat" of the response)
  data: T;

  // Context for better understanding
  metadata: {
    tool: string;             // Name of the tool/function
    category: 'Data Fetching' | 'Valuation' | 'Analysis' | 'Screening' | 'Utility';
    dataSource: string;        // Where data came from
    lastUpdated: string;        // When data was fetched
    processingTime: number;     // How long it took to process
    dataQuality: 'high' | 'medium' | 'low';
    completeness: 'complete' | 'partial' | 'minimal';
    warnings?: string[];      // Any data quality issues
  };

  // Structured recommendations
  recommendations?: {
    investment?: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'Avoid';
    priority?: 'High' | 'Medium' | 'Low';
    reasoning?: string;
    nextSteps?: string[];
  };

  // Additional context for AI decision-making
  context?: {
    relatedTools?: string[];  // Tools to call next
    alternativeTools?: string[]; // Tools that could also help
    suggestedFollowUp?: string[]; // Follow-up questions to ask user
  };
}

/**
 * Stock data summary type
 */
export interface StockDataSummary {
  symbol: string;
  companyName?: string;
  currentPrice: number;
  currency: string;
  exchange: string;

  // Quick metrics
  valuation: {
    peRatio: number;
    pbRatio: number;
    dividendYield: number;
    roe: number;
  };

  // Financial health
  health: {
    altmanZScore: number;
    piotroskiFScore: number;
    currentRatio: number;
    debtToEquity: number;
  };

  // Technicals
  technical: {
    beta: number;
    priceChange52Week: number;
    rsi: number;
  };
}

/**
 * Valuation result summary
 */
export interface ValuationSummary {
  symbol: string;
  currentPrice: number;
  intrinsicValue?: number;

  // Multiple valuation views
  valuations: {
    peBand?: {
      status: 'Undervalued' | 'Fairly Valued' | 'Overvalued';
      fairValueRange: { lower: number; upper: number };
    };
    ddm?: {
      intrinsicValue: number;
      marginOfSafety: number;
      recommendation: 'Buy' | 'Hold' | 'Sell';
    };
    dcf?: {
      intrinsicValue: number;
      marginOfSafety: number;
      recommendation: 'Buy' | 'Hold' | 'Sell';
    };
    marginOfSafety?: {
      percentage: number;
      riskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
      recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    };
  };

  // Consensus view
  consensus: {
    recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
    confidence: 'High' | 'Medium' | 'Low';
    agreement: 'High' | 'Medium' | 'Low'; // How aligned are the valuations
  };
}

/**
 * Financial statement summary
 */
export interface FinancialStatementSummary {
  symbol: string;
  period: 'TTM' | 'Quarterly' | 'Annual';
  date: string;
  fiscalYear?: number;
  fiscalQuarter?: number;

  // Key metrics extracted
  metrics: {
    // Revenue & Earnings
    revenue?: number;
    revenueGrowth?: number;
    netIncome?: number;
    eps?: number;

    // Margins
    grossMargin?: number;
    operatingMargin?: number;
    netMargin?: number;

    // Balance Sheet
    totalAssets?: number;
    totalDebt?: number;
    bookValue?: number;
    cash?: number;

    // Cash Flow
    operatingCashFlow?: number;
    freeCashFlow?: number;
    capitalExpenditure?: number;
  };

  // Financial health assessment
  health?: {
    currentRatio?: number;
    quickRatio?: number;
    debtToEquity?: number;
    altmanZScore?: number;
  };

  // Year-over-year comparisons
  comparisons?: {
    revenueChange?: number;
    earningsChange?: number;
    marginChange?: number;
  };
}

/**
 * CANSLIM summary for growth screening
 */
export interface CANSLIMSummary {
  symbol: string;

  // Overall grade
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

  // Score breakdown
  scores: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    breakdown: {
      C: { score: number; pass: boolean; note: string; };
      A: { score: number; pass: boolean; note: string; };
      N: { score: number; pass: boolean; note: string; };
      S: { score: number; pass: boolean; note: string; };
      L: { score: number; pass: boolean; note: string; };
      I: { score: number; pass: boolean; note: string; };
      M: { score: number; pass: boolean; note: string; };
      E: { score: number; pass: boolean; note: string; };
    };
  }

  // Final recommendation
  recommendation: {
    action: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Avoid';
    reasoning: string;
    confidence: number;
    riskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  };

  // What to watch out for
  warnings?: string[];
  opportunities?: string[];
}

/**
 * Helper to create a smart response from raw data
 */
export function createSmartResponse<T>(
  toolName: string,
  category: SmartResponse<T>['metadata']['category'],
  dataSource: string,
  data: T
): SmartResponse<T> {
  // Default implementation - can be overridden per tool type
  return {
    summary: {
      title: `${toolName} completed`,
      what: `Data retrieval and processing`,
      keyFindings: [],
      action: 'Data available for analysis',
      confidence: 'Medium'
    },
    data,
    metadata: {
      tool: toolName,
      category,
      dataSource,
      lastUpdated: new Date().toISOString(),
      processingTime: 0,
      dataQuality: 'high',
      completeness: 'complete',
      warnings: []
    }
  };
}

/**
 * Format data as Markdown table for LLM readability
 */
export interface TableContent {
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
  title?: string;
}

/**
 * Rich content types for enhanced responses
 */
export interface RichResponse<T = any> extends SmartResponse<T> {
  // Additional rich content for LLMs
  content?: {
    tables?: TableContent[];
    charts?: any[];
    lists?: Record<string, string[]>;
    highlights?: string[];
  };
}

/**
 * Type guards and utilities
 */
export function isStockData(obj: any): obj is SmartResponse<StockDataSummary> {
  return obj && typeof obj === 'object' && 'summary' in obj && 'data' in obj;
}

export function isValuationResult(obj: any): obj is SmartResponse<ValuationSummary> {
  return obj && typeof obj === 'object' && 'summary' in obj && 'data' in obj && 'valuations' in obj.data;
}

export function isCANSLIMResult(obj: any): obj is SmartResponse<CANSLIMSummary> {
  return obj && typeof obj === 'object' && 'summary' in obj && 'data' in obj && 'grades' in obj.data;
}

/**
 * Response formatting utilities
 */
export namespace ResponseFormatter {

  /**
   * Format a number as currency string
   */
  export function currency(value: number, currency: string = 'THB'): string {
    return `${currency} ${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  /**
   * Format a percentage with color indicator
   */
  export function percentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
  }

  /**
   * Create a colored status indicator
   */
  export function status(
    value: number,
    type: 'pass' | 'fail' | 'warning' | 'info'
  ): string {
    const indicators = {
      pass: '✓',
      fail: '✗',
      warning: '⚠',
      info: '○'
    };
    return indicators[type] || indicators.info;
  }

  /**
   * Create a table from object data
   */
  export function tableFromObject<T extends Record<string, any>>(
    obj: T,
    options: {
      include?: (keyof T)[];
      format?: 'markdown' | 'json' | 'csv';
      title?: string;
    } = {}
  ): string | TableContent {
    const include = options.include || Object.keys(obj) as (keyof T)[];
    const rows = include.map(key => [
      key,
      typeof obj[key] === 'number'
        ? obj[key].toFixed(2)
        : obj[key]?.toString() || 'N/A'
    ]);

    return {
      title: options.title || 'Data Table',
      headers: ['Metric', 'Value'],
      rows,
      caption: `Total: ${rows.length} metrics`
    };
  }

  /**
   * Create a highlight list for key findings
   */
  export function highlights(items: string[], icon: string = '•'): string {
    return items.map(item => `${icon} ${item}`).join('\n');
  }

  /**
   * Create a bulleted list for warnings
   */
  export function warnings(items: string[]): string {
    return items.map(w => `⚠️ ${w}`).join('\n');
  }
}

/**
 * Category descriptions for tool metadata
 */
export enum ToolCategory {
  DATA_FETCHING = 'Data Fetching',
  VALUATION = 'Valuation',
  ANALYSIS = 'Financial Analysis',
  SCREENING = 'Growth Screening',
  UTILITY = 'Utility',
  RESEARCH = 'Web & Research',
  TIME_DATE = 'Time & Date',
  MATH = 'Math & Calculations',
  FILE_SYSTEM = 'File System'
}

/**
 * Data quality indicators
 */
export enum DataQuality {
  HIGH = 'high',           // All data available, no issues
  MEDIUM = 'medium',       // Most data available, some fields null
  LOW = 'low',             // Partial data, many fields null
  UNAVAILABLE = 'unavailable' // No data or all fields null
}

/**
 * Completeness indicators
 */
export enum Completeness {
  COMPLETE = 'complete',     // All requested data available
  PARTIAL = 'partial',       // Some data missing or null
  MINIMAL = 'minimal'         // Only basic data available
}
