import { StockData, PEBandResult, DDMResult, DCFResult, MarginOfSafetyResult, Tool } from '../types/index.js';
import { ToolCategory } from '../types/tool-descriptions.js';
import {
  SmartResponse,
  DataQuality,
  Completeness
} from '../types/responses.js';

// Helper functions
function calculatePE(price: number, eps: number): number {
  return eps > 0 ? price / eps : 0;
}

function calculateAverage(arr: number[]): number {
  return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function calculatePercentile(value: number, array: number[]): number {
  const sorted = [...array].sort((a, b) => a - b);
  const index = sorted.indexOf(value);
  return (index / (sorted.length - 1)) * 100;
}

// =====================================================
// PE Band Calculation Tool
// Calculates PE band valuation using historical PE ratios
// Best for: Value investing, Thai stocks, PE-based valuation
// =====================================================
const peBandTool: Tool = {
  name: 'calculate_pe_band',
  description: `Calculate PE band valuation for a stock using historical PE ratios.

**Use Case:** ${ToolCategory.VALUATION} - Determine if a stock is undervalued, fairly valued, or overvalued based on historical PE ranges.

**Best For:**
- Thai stocks (SET market)
- Value investing decisions
- Quick PE-based valuation check
- Comparing current valuation to historical norms

**Inputs:**
- symbol: Stock ticker (e.g., "AAPL", "SCB")
- currentPrice: Current market price per share
- eps: Earnings per share (TTM)
- historicalPEs: Optional array of historical PE ratios (uses Thai market defaults if not provided)

**Outputs:**
- currentPE: Calculated PE ratio
- averagePE, minPE, maxPE: Historical PE statistics
- pePercentile: Current PE's percentile in historical range
- fairValueRange: Lower and upper fair value prices
- recommendation: "Undervalued" | "Fairly Valued" | "Overvalued"
- analysis: Text explanation of the valuation

**Related Tools:** calculate_margin_of_safety, calculate_dcf, fetch_stock_data
**DataSource:** Calculated from inputs
**ExecutionTime:** < 100ms`,
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol (e.g., AAPL)' },
      currentPrice: { type: 'number', description: 'Current stock price' },
      eps: { type: 'number', description: 'Earnings per share (EPS)' },
      historicalPEs: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of historical PE ratios (optional - will use defaults if not provided)'
      }
    },
    required: ['symbol', 'currentPrice', 'eps']
  },
  handler: async (args) => {
    const { symbol, currentPrice, eps, historicalPEs: inputPEs } = args;

    try {
      const currentPE = calculatePE(currentPrice, eps);

      // Use provided historical PEs or generate default ones
      const historicalPEs = inputPEs || [15, 18, 20, 22, 25, 23, 21, 19, 17, 16, 18, 20];

      if (historicalPEs.length === 0) {
        throw new Error('At least one historical PE value is required');
      }

      const avgPE = calculateAverage(historicalPEs);
      const minPE = Math.min(...historicalPEs);
      const maxPE = Math.max(...historicalPEs);
      const pePercentile = calculatePercentile(currentPE, historicalPEs);

      // Calculate fair value range
      const fairValueLower = minPE * eps;
      const fairValueUpper = maxPE * eps;

      // Determine recommendation
      let recommendation: 'Undervalued' | 'Fairly Valued' | 'Overvalued';
      let analysis: string;

      if (currentPrice < fairValueLower) {
        recommendation = 'Undervalued';
        analysis = `Stock is trading below its historical PE range. Current PE (${currentPE.toFixed(2)}) is lower than ${pePercentile.toFixed(1)}% of historical values.`;
      } else if (currentPrice > fairValueUpper) {
        recommendation = 'Overvalued';
        analysis = `Stock is trading above its historical PE range. Current PE (${currentPE.toFixed(2)}) is higher than ${pePercentile.toFixed(1)}% of historical values.`;
      } else {
        recommendation = 'Fairly Valued';
        analysis = `Stock is trading within its historical PE range. Current PE (${currentPE.toFixed(2)}) is at the ${pePercentile.toFixed(1)}th percentile of historical values.`;
      }

      const result: PEBandResult = {
        symbol,
        currentPE,
        averagePE: avgPE,
        minPE,
        maxPE,
        pePercentile,
        fairValueRange: {
          lower: fairValueLower,
          upper: fairValueUpper
        },
        recommendation,
        analysis
      };

      // Format as SmartResponse
      return formatSmartPEBandResult(result);
    } catch (error) {
      throw new Error(`Failed to calculate PE band for ${symbol}: ${error}`);
    }
  }
};

/**
 * Format PE Band result as SmartResponse
 */
export function formatSmartPEBandResult(result: PEBandResult): SmartResponse<PEBandResult> {
  const { symbol, currentPE, averagePE, minPE, maxPE, pePercentile, fairValueRange, recommendation, analysis } = result;
  const { lower: fairValueLower, upper: fairValueUpper } = fairValueRange;

  const keyFindings: string[] = [];
  const warnings: string[] = [];

  // Analyze position within historical range
  if (pePercentile <= 20) {
    keyFindings.push(`PE is in top ${pePercentile.toFixed(0)} percentile - very attractive`);
  } else if (pePercentile >= 80) {
    keyFindings.push(`PE is in bottom ${(100 - pePercentile).toFixed(0)} percentile - expensive`);
  }

  // Determine action and priority
  let action: 'Buy' | 'Sell' | 'Hold' = 'Hold';
  let priority: 'High' | 'Medium' | 'Low' = 'Medium';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

  if (recommendation === 'Undervalued') {
    action = 'Buy';
    priority = 'Medium';
    confidence = 'Medium';
  } else if (recommendation === 'Overvalued') {
    action = 'Sell';
    priority = 'Medium';
    confidence = 'Medium';
  } else {
    action = 'Hold';
    priority = 'Low';
    confidence = 'Low';
  }

  // Build key findings
  keyFindings.push(`PE ratio of ${currentPE.toFixed(2)} (historical average: ${averagePE.toFixed(2)})`);

  if (minPE && maxPE) {
    keyFindings.push(`PE range: ${minPE.toFixed(2)} - ${maxPE.toFixed(2)}`);
    keyFindings.push(`Fair value: ${formatCurrency(fairValueLower)} - ${formatCurrency(fairValueUpper)}`);
  }

  // Add to recommendations
  const recommendations = {
    investment: action,
    priority,
    reasoning: `${recommendation} based on PE analysis`,
    nextSteps: [] as string[]
  };

  if (action === 'Buy') {
    recommendations.nextSteps = [
      'Verify earnings quality',
      'Check financial health',
      'Consider position sizing'
    ];
  } else if (action === 'Sell') {
    recommendations.nextSteps = [
      'Take profits if available',
      'Reconsider thesis',
      'Wait for pullback'
    ];
  }

  return {
    summary: {
      title: `PE Band Valuation - ${symbol}`,
      what: `Price-to-earnings ratio analysis using historical PE range`,
      keyFindings,
      action,
      confidence
    },
    data: result,
    metadata: {
      tool: 'calculate_pe_band',
      category: 'Valuation',
      dataSource: 'Calculated from inputs',
      lastUpdated: new Date().toISOString(),
      processingTime: 0,
      dataQuality: DataQuality.HIGH,
      completeness: Completeness.COMPLETE,
      warnings
    },
    recommendations
  };
}

// =====================================================
// Helper Functions
// =====================================================
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number): string {
  return `฿${value.toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function status(shouldPass: boolean): string {
  return shouldPass ? '✓' : '✗';
}

function highlights(items: string[]): string {
  return items.map(item => `• ${item}`).join('\n');
}

function warnings(items: string[]): string {
  return items.map(w => `⚠️ ${w}`).join('\n');
}

function hasValue(value: any): boolean {
  return value !== null && value !== undefined && !isNaN(value);
}

// =====================================================
// DDM (Dividend Discount Model) Calculation Tool
// Calculates intrinsic value using Gordon Growth Model
// Best for: Dividend-paying stocks, income investing
// =====================================================
const ddmTool: Tool = {
  name: 'calculate_ddm',
  description: `Calculate Dividend Discount Model (DDM) valuation using the Gordon Growth Model.

**Use Case:** ${ToolCategory.VALUATION} - Estimate intrinsic value for dividend-paying stocks.

**Best For:**
- Dividend-paying stocks (companies with consistent dividends)
- Income investing analysis
- Stable, mature companies
- REITs and utilities

**Inputs:**
- symbol: Stock ticker (e.g., "AAPL", "SCB")
- currentPrice: Current market price per share
- dividend: Annual dividend per share
- requiredReturn: Required rate of return as decimal (e.g., 0.10 for 10%)
- growthRate: Expected dividend growth rate as decimal (e.g., 0.05 for 5%)

**Outputs:**
- intrinsicValue: Calculated fair value per share
- marginOfSafety: Percentage difference between price and intrinsic value
- recommendation: "Buy" | "Hold" | "Sell"
- analysis: Text explanation with margin of safety details

**Formula:** P = D1 / (r - g) where D1 = D * (1 + g)

**Important Notes:**
- Required return must be greater than growth rate
- Dividend cannot be negative
- Best for companies with stable dividend growth

**Related Tools:** calculate_margin_of_safety, calculate_pe_band, dividend_safety_analysis
**DataSource:** Calculated from inputs
**ExecutionTime:** < 50ms`,
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol (e.g., AAPL)' },
      currentPrice: { type: 'number', description: 'Current stock price' },
      dividend: { type: 'number', description: 'Annual dividend per share' },
      requiredReturn: { type: 'number', description: 'Required rate of return (as decimal, e.g., 0.1 for 10%)' },
      growthRate: { type: 'number', description: 'Expected dividend growth rate (as decimal, e.g., 0.05 for 5%)' }
    },
    required: ['symbol', 'currentPrice', 'dividend', 'requiredReturn', 'growthRate']
  },
  handler: async (args) => {
    const { symbol, currentPrice, dividend, requiredReturn, growthRate } = args;

    try {
      // Validate inputs
      if (requiredReturn <= growthRate) {
        throw new Error('Required return must be greater than growth rate');
      }

      if (dividend < 0) {
        throw new Error('Dividend cannot be negative');
      }

      // Gordon Growth Model: P = D1 / (r - g)
      const d1 = dividend * (1 + growthRate);
      const intrinsicValue = d1 / (requiredReturn - growthRate);

      const marginOfSafety = ((currentPrice - intrinsicValue) / intrinsicValue) * 100;

      let recommendation: 'Buy' | 'Hold' | 'Sell';
      let analysis: string;

      if (marginOfSafety < -20) {
        recommendation = 'Buy';
        analysis = `Stock appears significantly undervalued with ${Math.abs(marginOfSafety).toFixed(1)}% margin of safety. Intrinsic value: $${intrinsicValue.toFixed(2)}`;
      } else if (marginOfSafety > 20) {
        recommendation = 'Sell';
        analysis = `Stock appears overvalued with ${marginOfSafety.toFixed(1)}% premium. Intrinsic value: $${intrinsicValue.toFixed(2)}`;
      } else {
        recommendation = 'Hold';
        analysis = `Stock appears fairly valued with ${marginOfSafety.toFixed(1)}% deviation. Intrinsic value: $${intrinsicValue.toFixed(2)}`;
      }

      const result: DDMResult = {
        symbol,
        currentPrice,
        dividend,
        requiredReturn,
        growthRate,
        intrinsicValue,
        marginOfSafety,
        recommendation,
        analysis
      };

      return formatSmartDDMResult(result);
    } catch (error) {
      throw new Error(`Failed to calculate DDM for ${symbol}: ${error}`);
    }
  }
};

/**
 * Format DDM result as SmartResponse
 */
export function formatSmartDDMResult(result: DDMResult): SmartResponse<DDMResult> {
  const { symbol, currentPrice, dividend, requiredReturn, growthRate, intrinsicValue, marginOfSafety, recommendation } = result;

  const keyFindings: string[] = [];
  const warnings: string[] = [];

  // Build key findings
  keyFindings.push(`Intrinsic value: ${formatCurrency(intrinsicValue)} (current: ${formatCurrency(currentPrice)})`);
  keyFindings.push(`Margin of Safety: ${marginOfSafety >= 0 ? '+' : ''}${marginOfSafety.toFixed(1)}%`);
  keyFindings.push(`Dividend: ${formatCurrency(dividend)} growing at ${formatPercent(growthRate * 100)}`);

  // Determine action
  let action: 'Buy' | 'Sell' | 'Hold' = 'Hold';
  let priority: 'High' | 'Medium' | 'Low' = 'Medium';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

  if (recommendation === 'Buy') {
    action = 'Buy';
    priority = marginOfSafety <= -30 ? 'High' : 'Medium';
    confidence = marginOfSafety <= -30 ? 'High' : 'Medium';
  } else if (recommendation === 'Sell') {
    action = 'Sell';
    priority = 'Medium';
    confidence = 'Medium';
  } else {
    action = 'Hold';
    priority = 'Low';
    confidence = 'Low';
  }

  // Build recommendations
  const recommendations = {
    investment: action,
    priority,
    reasoning: `${recommendation} based on DDM valuation with ${marginOfSafety.toFixed(1)}% margin of safety`,
    nextSteps: [] as string[]
  };

  if (action === 'Buy') {
    recommendations.nextSteps = [
      'Verify dividend sustainability',
      'Check payout ratio',
      'Review dividend history'
    ];
  } else if (action === 'Sell') {
    recommendations.nextSteps = [
      'Consider taking profits',
      'Reassess dividend growth assumptions'
    ];
  } else {
    recommendations.nextSteps = [
      'Wait for better entry point',
      'Monitor dividend changes'
    ];
  }

  return {
    summary: {
      title: `DDM Valuation - ${symbol}`,
      what: `Dividend Discount Model (Gordon Growth) valuation analysis`,
      keyFindings,
      action,
      confidence
    },
    data: result,
    metadata: {
      tool: 'calculate_ddm',
      category: 'Valuation',
      dataSource: 'Calculated from inputs (Gordon Growth Model)',
      lastUpdated: new Date().toISOString(),
      processingTime: 0,
      dataQuality: DataQuality.HIGH,
      completeness: Completeness.COMPLETE,
      warnings
    },
    recommendations,
    context: {
      relatedTools: ['calculate_margin_of_safety', 'calculate_pe_band', 'calculate_dcf'],
      alternativeTools: ['calculate_dcf'],
      suggestedFollowUp: [
        'Compare with other valuation methods',
        'Check dividend payout ratio',
        'Verify dividend growth sustainability'
      ]
    }
  };
}

// =====================================================
// DCF (Discounted Cash Flow) Calculation Tool
// Projects future cash flows and discounts to present value
// Best for: Companies with predictable cash flows
// =====================================================
const dcfTool: Tool = {
  name: 'calculate_dcf',
  description: `Calculate Discounted Cash Flow (DCF) valuation by projecting future free cash flows and discounting to present value.

**Use Case:** ${ToolCategory.VALUATION} - Comprehensive intrinsic value calculation based on cash flow generation.

**Best For:**
- Companies with predictable cash flows
- Growth companies (non-dividend payers)
- Manufacturing, technology, service companies
- Long-term valuation analysis

**Inputs:**
- symbol: Stock ticker (e.g., "AAPL", "SCB")
- currentPrice: Current market price per share
- freeCashFlow: Annual free cash flow in base currency
- sharesOutstanding: Number of shares outstanding
- years: Projection period (default: 5 years, range: 3-10)
- growthRate: FCF growth rate during projection period as decimal (e.g., 0.05 for 5%)
- discountRate: WACC/discount rate as decimal (e.g., 0.10 for 10%)
- terminalGrowthRate: Terminal growth rate as decimal (default: 0.025 for 2.5%)

**Outputs:**
- intrinsicValue: Calculated fair value per share
- marginOfSafety: Percentage difference between price and intrinsic value
- npv: Net present value of projected cash flows
- recommendation: "Buy" | "Hold" | "Sell"
- projections: Year-by-year projection details
- analysis: Text explanation of the DCF valuation

**Validation Rules:**
- Free cash flow must be positive
- Shares outstanding must be positive
- Discount rate must be greater than terminal growth rate
- Growth rate should be reasonable (typically 0-20%)

**Related Tools:** calculate_margin_of_safety, fetch_stock_data, calculate_pe_band
**DataSource:** Calculated from inputs
**ExecutionTime:** < 100ms`,
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol (e.g., AAPL)' },
      currentPrice: { type: 'number', description: 'Current stock price' },
      freeCashFlow: { type: 'number', description: 'Annual free cash flow (in dollars)' },
      sharesOutstanding: { type: 'number', description: 'Number of shares outstanding' },
      years: { type: 'number', default: 5, description: 'Number of years to project' },
      growthRate: { type: 'number', description: 'FCF growth rate for projection period (as decimal)' },
      discountRate: { type: 'number', description: 'Discount rate/WACC (as decimal)' },
      terminalGrowthRate: { type: 'number', default: 0.025, description: 'Terminal growth rate (as decimal)' }
    },
    required: ['symbol', 'currentPrice', 'freeCashFlow', 'sharesOutstanding', 'growthRate', 'discountRate']
  },
  handler: async (args) => {
    const {
      symbol,
      currentPrice,
      freeCashFlow,
      sharesOutstanding,
      years = 5,
      growthRate,
      discountRate,
      terminalGrowthRate = 0.025
    } = args;

    try {
      // Validate inputs
      if (freeCashFlow <= 0) {
        throw new Error('Free cash flow must be positive');
      }

      if (sharesOutstanding <= 0) {
        throw new Error('Shares outstanding must be positive');
      }

      if (discountRate <= terminalGrowthRate) {
        throw new Error('Discount rate must be greater than terminal growth rate');
      }

      // Calculate projections
      const projections = [];
      let projectedFCF = freeCashFlow;
      let npv = 0;

      for (let year = 1; year <= years; year++) {
        projectedFCF *= (1 + growthRate);
        const presentValue = projectedFCF / Math.pow(1 + discountRate, year);
        npv += presentValue;

        projections.push({
          year,
          fcf: projectedFCF,
          presentValue
        });
      }

      // Terminal value
      const terminalFCF = projectedFCF * (1 + terminalGrowthRate);
      const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);
      const terminalPresentValue = terminalValue / Math.pow(1 + discountRate, years);

      const totalNPV = npv + terminalPresentValue;
      const intrinsicValue = totalNPV / sharesOutstanding;

      const marginOfSafety = ((currentPrice - intrinsicValue) / intrinsicValue) * 100;

      let recommendation: 'Buy' | 'Hold' | 'Sell';
      let analysis: string;

      if (marginOfSafety < -20) {
        recommendation = 'Buy';
        analysis = `DCF analysis suggests stock is undervalued with ${Math.abs(marginOfSafety).toFixed(1)}% margin of safety. Intrinsic value: $${intrinsicValue.toFixed(2)}`;
      } else if (marginOfSafety > 20) {
        recommendation = 'Sell';
        analysis = `DCF analysis suggests stock is overvalued with ${marginOfSafety.toFixed(1)}% premium. Intrinsic value: $${intrinsicValue.toFixed(2)}`;
      } else {
        recommendation = 'Hold';
        analysis = `DCF analysis suggests stock is fairly valued with ${marginOfSafety.toFixed(1)}% deviation. Intrinsic value: $${intrinsicValue.toFixed(2)}`;
      }

      const result: DCFResult = {
        symbol,
        currentPrice,
        freeCashFlow,
        growthRate,
        discountRate,
        terminalGrowthRate,
        intrinsicValue,
        marginOfSafety,
        npv: totalNPV,
        recommendation,
        analysis,
        projections
      };

      return formatSmartDCFResult(result);
    } catch (error) {
      throw new Error(`Failed to calculate DCF for ${symbol}: ${error}`);
    }
  }
};

/**
 * Format DCF result as SmartResponse
 */
export function formatSmartDCFResult(result: DCFResult): SmartResponse<DCFResult> {
  const { symbol, currentPrice, freeCashFlow, growthRate, discountRate, terminalGrowthRate, intrinsicValue, marginOfSafety, npv, recommendation, projections } = result;

  const keyFindings: string[] = [];
  const warnings: string[] = [];

  // Build key findings
  keyFindings.push(`Intrinsic value: ${formatCurrency(intrinsicValue)} (current: ${formatCurrency(currentPrice)})`);
  keyFindings.push(`Margin of Safety: ${marginOfSafety >= 0 ? '+' : ''}${marginOfSafety.toFixed(1)}%`);
  keyFindings.push(`NPV of future FCF: ${formatCurrency(npv)} over ${projections.length} years`);
  keyFindings.push(`FCF growth assumption: ${formatPercent(growthRate * 100)}`);

  // Determine action
  let action: 'Buy' | 'Sell' | 'Hold' = 'Hold';
  let priority: 'High' | 'Medium' | 'Low' = 'Medium';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

  if (recommendation === 'Buy') {
    action = 'Buy';
    priority = marginOfSafety <= -30 ? 'High' : 'Medium';
    confidence = marginOfSafety <= -30 ? 'High' : 'Medium';
  } else if (recommendation === 'Sell') {
    action = 'Sell';
    priority = 'Medium';
    confidence = 'Medium';
  } else {
    action = 'Hold';
    priority = 'Low';
    confidence = 'Low';
  }

  // Build recommendations
  const recommendations = {
    investment: action,
    priority,
    reasoning: `${recommendation} based on DCF valuation with ${marginOfSafety.toFixed(1)}% margin of safety`,
    nextSteps: [] as string[]
  };

  if (action === 'Buy') {
    recommendations.nextSteps = [
      'Verify FCF growth assumptions',
      'Check capital expenditure trends',
      'Review discount rate (WACC) assumptions'
    ];
  } else if (action === 'Sell') {
    recommendations.nextSteps = [
      'Consider taking profits',
      'Reassess growth assumptions'
    ];
  } else {
    recommendations.nextSteps = [
      'Wait for better entry point',
      'Monitor FCF trends'
    ];
  }

  return {
    summary: {
      title: `DCF Valuation - ${symbol}`,
      what: `Discounted Cash Flow valuation analysis with ${projections.length}-year projection`,
      keyFindings,
      action,
      confidence
    },
    data: result,
    metadata: {
      tool: 'calculate_dcf',
      category: 'Valuation',
      dataSource: 'Calculated from inputs (DCF Model)',
      lastUpdated: new Date().toISOString(),
      processingTime: 0,
      dataQuality: DataQuality.HIGH,
      completeness: Completeness.COMPLETE,
      warnings
    },
    recommendations,
    context: {
      relatedTools: ['calculate_margin_of_safety', 'calculate_pe_band', 'calculate_ddm'],
      alternativeTools: ['calculate_ddm'],
      suggestedFollowUp: [
        'Compare with other valuation methods',
        'Verify WACC assumptions',
        'Check historical FCF trends'
      ]
    }
  };
}

// =====================================================
// Margin of Safety Calculation Tool
// Assess downside protection for value investing
// Best for: All value investing decisions
// =====================================================
const marginOfSafetyTool: Tool = {
  name: 'calculate_margin_of_safety',
  description: `Calculate Margin of Safety (MoS) to assess downside protection - a key concept in value investing popularized by Benjamin Graham and Warren Buffett.

**Use Case:** ${ToolCategory.VALUATION} - Evaluate the buffer between current price and intrinsic value to protect against errors in analysis.

**Best For:**
- All value investing decisions
- Risk assessment and position sizing
- Determining appropriate entry points
- Portfolio risk management

**Inputs:**
- symbol: Stock ticker (e.g., "AAPL", "SCB")
- currentPrice: Current market price per share
- intrinsicValue: Calculated intrinsic value from valuation models
- valuationMethod: Method used (default: "Multiple Methods Average")
  Options: "DCF" | "DDM" | "PE Band" | "Asset-Based" | "Multiple Methods Average"
- riskAdjustment: Risk adjustment factor (default: 1.0, range: 0.5-1.5)
  - 0.8 = High risk (conservative)
  - 1.0 = Normal risk
  - 1.2 = Low risk (aggressive)

**Outputs:**
- marginOfSafety: Absolute price difference
- marginOfSafetyPercentage: Percentage margin of safety
- recommendation: "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell"
- riskLevel: "Very Low" | "Low" | "Medium" | "High" | "Very High"
- analysis: Detailed explanation with value investing context
- principlesCheck: Verification against value investing principles

**Interpretation:**
- ≥ 50% MoS: Strong Buy (Very Low risk)
- ≥ 30% MoS: Buy (Low risk)
- ≥ 10% MoS: Hold (Medium risk)
- ≥ -10% MoS: Sell (High risk)
- < -10% MoS: Strong Sell (Very High risk)

**Value Investing Principles:**
- Buy only when price is significantly below intrinsic value
- Margin of safety protects against analysis errors
- Larger margin = lower risk = higher potential returns

**Related Tools:** calculate_pe_band, calculate_dcf, calculate_ddm, fetch_stock_data
**DataSource:** Calculated from inputs
**ExecutionTime:** < 50ms`,
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol (e.g., AAPL)' },
      currentPrice: { type: 'number', description: 'Current stock price' },
      intrinsicValue: { type: 'number', description: 'Calculated intrinsic value of the stock' },
      valuationMethod: {
        type: 'string',
        description: 'Method used to calculate intrinsic value',
        enum: ['DCF', 'DDM', 'PE Band', 'Asset-Based', 'Multiple Methods Average'],
        default: 'Multiple Methods Average'
      },
      riskAdjustment: {
        type: 'number',
        description: 'Risk adjustment factor (0.8 for high risk, 1.0 for normal, 1.2 for low risk)',
        default: 1.0,
        minimum: 0.5,
        maximum: 1.5
      }
    },
    required: ['symbol', 'currentPrice', 'intrinsicValue']
  },
  handler: async (args) => {
    const { symbol, currentPrice, intrinsicValue, valuationMethod = 'Multiple Methods Average', riskAdjustment = 1.0 } = args;

    try {
      // Validate inputs
      if (currentPrice <= 0) {
        throw new Error('Current price must be positive');
      }

      if (intrinsicValue <= 0) {
        throw new Error('Intrinsic value must be positive');
      }

      // Calculate margin of safety
      const marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;
      const adjustedIntrinsicValue = intrinsicValue * riskAdjustment;
      const adjustedMarginOfSafety = ((adjustedIntrinsicValue - currentPrice) / adjustedIntrinsicValue) * 100;

      // Determine recommendation based on margin of safety
      let recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
      let riskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
      let analysis: string;

      if (adjustedMarginOfSafety >= 50) {
        recommendation = 'Strong Buy';
        riskLevel = 'Very Low';
        analysis = `Excellent margin of safety of ${adjustedMarginOfSafety.toFixed(1)}%. Stock is significantly undervalued with substantial downside protection.`;
      } else if (adjustedMarginOfSafety >= 30) {
        recommendation = 'Buy';
        riskLevel = 'Low';
        analysis = `Good margin of safety of ${adjustedMarginOfSafety.toFixed(1)}%. Stock appears undervalued with reasonable downside protection.`;
      } else if (adjustedMarginOfSafety >= 10) {
        recommendation = 'Hold';
        riskLevel = 'Medium';
        analysis = `Moderate margin of safety of ${adjustedMarginOfSafety.toFixed(1)}%. Stock is reasonably valued but may not provide sufficient margin for error.`;
      } else if (adjustedMarginOfSafety >= -10) {
        recommendation = 'Sell';
        riskLevel = 'High';
        analysis = `Negative margin of safety of ${adjustedMarginOfSafety.toFixed(1)}%. Stock appears overvalued with limited upside potential.`;
      } else {
        recommendation = 'Strong Sell';
        riskLevel = 'Very High';
        analysis = `Significant negative margin of safety of ${adjustedMarginOfSafety.toFixed(1)}%. Stock is substantially overvalued with high risk of loss.`;
      }

      // Add additional context
      const priceToIntrinsic = (currentPrice / intrinsicValue).toFixed(2);
      const adjustedPriceToIntrinsic = (currentPrice / adjustedIntrinsicValue).toFixed(2);

      analysis += ` Price is ${priceToIntrinsic}x intrinsic value. After risk adjustment (factor: ${riskAdjustment}), price is ${adjustedPriceToIntrinsic}x adjusted intrinsic value.`;

      // Value investing principles check
      const principlesCheck = {
        belowIntrinsicValue: currentPrice < intrinsicValue,
        adequateMargin: adjustedMarginOfSafety >= 20,
        reasonableRisk: riskLevel !== 'Very High'
      };

      const result: MarginOfSafetyResult = {
        symbol,
        currentPrice,
        intrinsicValue: adjustedIntrinsicValue,
        marginOfSafety: adjustedIntrinsicValue - currentPrice,
        marginOfSafetyPercentage: adjustedMarginOfSafety,
        valuationMethod,
        recommendation,
        analysis,
        riskLevel
      };

      // Add principles check to result
      (result as any).principlesCheck = principlesCheck;
      (result as any).unadjustedMarginOfSafety = marginOfSafety;
      (result as any).riskAdjustmentFactor = riskAdjustment;

      return formatSmartMarginOfSafetyResult(result);
    } catch (error) {
      throw new Error(`Failed to calculate margin of safety for ${symbol}: ${error}`);
    }
  }
};

/**
 * Format Margin of Safety result as SmartResponse
 */
export function formatSmartMarginOfSafetyResult(result: MarginOfSafetyResult): SmartResponse<MarginOfSafetyResult> {
  const { symbol, currentPrice, intrinsicValue, marginOfSafety, marginOfSafetyPercentage, valuationMethod, recommendation, analysis, riskLevel } = result;

  const keyFindings: string[] = [];
  const warnings: string[] = [];

  // Build key findings
  keyFindings.push(`Margin of Safety: ${marginOfSafetyPercentage >= 0 ? '+' : ''}${marginOfSafetyPercentage.toFixed(1)}%`);
  keyFindings.push(`Intrinsic value: ${formatCurrency(intrinsicValue)} (current: ${formatCurrency(currentPrice)})`);
  keyFindings.push(`Risk Level: ${riskLevel}`);
  keyFindings.push(`Valuation method: ${valuationMethod}`);

  // Add principles check if available
  const principlesCheck = (result as any).principlesCheck;
  if (principlesCheck) {
    if (principlesCheck.belowIntrinsicValue) {
      keyFindings.push('✓ Price below intrinsic value (value investing principle)');
    }
    if (principlesCheck.adequateMargin) {
      keyFindings.push('✓ Adequate margin of safety (≥20%)');
    }
  }

  // Determine action
  let action: 'Buy' | 'Sell' | 'Hold' | 'Avoid' = 'Hold';
  let priority: 'High' | 'Medium' | 'Low' = 'Medium';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

  if (recommendation === 'Strong Buy') {
    action = 'Buy';
    priority = 'High';
    confidence = 'High';
  } else if (recommendation === 'Buy') {
    action = 'Buy';
    priority = 'Medium';
    confidence = 'Medium';
  } else if (recommendation === 'Sell' || recommendation === 'Strong Sell') {
    action = 'Sell';
    priority = recommendation === 'Strong Sell' ? 'High' : 'Medium';
    confidence = 'Medium';
  } else {
    action = 'Hold';
    priority = 'Low';
    confidence = 'Low';
  }

  // Build recommendations
  const recommendations = {
    investment: action,
    priority,
    reasoning: `${recommendation} based on ${marginOfSafetyPercentage.toFixed(1)}% margin of safety (${riskLevel} risk)`,
    nextSteps: [] as string[]
  };

  if (action === 'Buy') {
    recommendations.nextSteps = [
      'Verify intrinsic value calculation',
      'Check financial health metrics',
      'Consider position sizing based on margin of safety'
    ];
  } else if (action === 'Sell') {
    recommendations.nextSteps = [
      'Consider taking profits or reducing position',
      'Reassess intrinsic value assumptions'
    ];
  } else {
    recommendations.nextSteps = [
      'Wait for better entry point',
      'Monitor for changes in intrinsic value'
    ];
  }

  return {
    summary: {
      title: `Margin of Safety Analysis - ${symbol}`,
      what: `Value investing risk assessment using Benjamin Graham's margin of safety principle`,
      keyFindings,
      action,
      confidence
    },
    data: result,
    metadata: {
      tool: 'calculate_margin_of_safety',
      category: 'Valuation',
      dataSource: `Calculated from inputs (${valuationMethod})`,
      lastUpdated: new Date().toISOString(),
      processingTime: 0,
      dataQuality: DataQuality.HIGH,
      completeness: Completeness.COMPLETE,
      warnings
    },
    recommendations,
    context: {
      relatedTools: ['calculate_pe_band', 'calculate_dcf', 'calculate_ddm', 'fetch_stock_data'],
      alternativeTools: ['calculate_pe_band'],
      suggestedFollowUp: [
        'Review intrinsic value calculation',
        'Check financial health (Altman Z-Score)',
        'Verify valuation assumptions'
      ]
    }
  };
}

// Export all tools
export const stockValuationTools: Tool[] = [
  peBandTool,
  ddmTool,
  dcfTool,
  marginOfSafetyTool
];