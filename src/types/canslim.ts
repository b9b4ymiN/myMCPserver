// =====================================================
// CANSLIM / CANSLIME TYPES
// William O'Neil's Growth Stock Screening Methodology
// =====================================================

/**
 * Individual CANSLIM criterion score
 */
export interface CriterionScore {
  score: number;           // 0 or 1 point
  maxScore: number;        // Always 1 for each criterion
  pass: boolean;           // Whether criterion passed
  criteria: string;        // Description of what was checked
  value: number | string;  // Actual value from data
  threshold: string;       // Required threshold
  note?: string;           // Additional notes or data availability status
  dataSource?: string;     // Where the data came from
}

/**
 * Complete CANSLIM scoring result
 */
export interface CANSLIMResult {
  symbol: string;
  scores: {
    C: CriterionScore;  // Current Quarterly Earnings
    A: CriterionScore;  // Annual Earnings Growth
    N: CriterionScore;  // New
    S: CriterionScore;  // Supply and Demand
    L: CriterionScore;  // Leader
    I: CriterionScore;  // Institutional Sponsorship
    M: CriterionScore;  // Market Direction
    E: CriterionScore;  // Earnings Consistency
    E2: CriterionScore; // External Factors
  };
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Avoid';
  analysis: string;
  summary: {
    passed: string[];
    failed: string[];
    missingData: string[];
    suggestedInputs: string[];
  };
  dataSource: {
    available: string[];
    requiresManualInput: string[];
  };
}

/**
 * Input options for CANSLIM calculation
 */
export interface CANSLIMInput {
  symbol: string;
  // Current Quarterly Earnings (C)
  currentQuarterlyEPS?: number;
  priorYearQuarterEPS?: number;
  // Annual Earnings (A)
  annualEarnings3YearsAgo?: number;
  annualEarningsCurrentYear?: number;
  // New (N) - will use priceChange52W from API
  // Supply (S) - will use sharesChangeYoY/QoQ from API
  // Leader (L) - will use ROE from API
  // Institutional (I) - will use ownedByInstitutions from API
  // Market (M) - requires manual input
  marketDirection?: 'bull' | 'bear' | 'neutral';
  marketTrend?: string;  // e.g., "SET Index up 5% in 3 months"
}
