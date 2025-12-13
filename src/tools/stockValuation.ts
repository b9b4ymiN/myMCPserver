import { StockData, PEBandResult, DDMResult, DCFResult, MarginOfSafetyResult, Tool } from '../types/index.js';

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

// PE Band Calculation Tool
const peBandTool: Tool = {
  name: 'calculate_pe_band',
  description: 'Calculate PE band valuation for a stock',
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

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate PE band for ${symbol}: ${error}`);
    }
  }
};

// DDM Calculation Tool
const ddmTool: Tool = {
  name: 'calculate_ddm',
  description: 'Calculate Dividend Discount Model valuation',
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

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate DDM for ${symbol}: ${error}`);
    }
  }
};

// DCF Calculation Tool
const dcfTool: Tool = {
  name: 'calculate_dcf',
  description: 'Calculate Discounted Cash Flow valuation',
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

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate DCF for ${symbol}: ${error}`);
    }
  }
};

// Margin of Safety Calculation Tool
const marginOfSafetyTool: Tool = {
  name: 'calculate_margin_of_safety',
  description: 'Calculate Margin of Safety for value investing decisions',
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

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate margin of safety for ${symbol}: ${error}`);
    }
  }
};

// Export all tools
export const stockValuationTools: Tool[] = [
  peBandTool,
  ddmTool,
  dcfTool,
  marginOfSafetyTool
];