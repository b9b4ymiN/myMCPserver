import {
  GrahamNumberResult,
  DiscountedEarningsResult,
  AssetBasedValuationResult,
  EVEBITDAResult,
  FinancialHealthScore,
  DuPontAnalysisResult,
  DividendSafetyAnalysis,
  DividendAristocratScore,
  Tool
} from '../types/index.js';

// 1. Graham Number Calculator
const grahamNumberTool: Tool = {
  name: 'calculate_graham_number',
  description: 'Calculate Benjamin Graham\'s intrinsic value formula for defensive stocks',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      eps: { type: 'number', description: 'Earnings per share (EPS)' },
      bookValue: { type: 'number', description: 'Book value per share' },
      currentPrice: { type: 'number', description: 'Current market price' }
    },
    required: ['symbol', 'eps', 'bookValue', 'currentPrice']
  },
  handler: async (args) => {
    const { symbol, eps, bookValue, currentPrice } = args;

    try {
      // Graham Number: sqrt(22.5 * EPS * Book Value)
      // 22.5 = (PE ratio of 15) * (P/B ratio of 1.5)
      const grahamNumber = Math.sqrt(22.5 * eps * bookValue);
      const marginOfSafety = ((grahamNumber - currentPrice) / grahamNumber) * 100;

      let recommendation: 'Buy' | 'Hold' | 'Sell';
      let analysis: string;

      if (marginOfSafety >= 30) {
        recommendation = 'Buy';
        analysis = `Stock is significantly undervalued according to Graham's formula. Current price represents ${Math.abs(marginOfSafety).toFixed(1)}% margin of safety.`;
      } else if (marginOfSafety >= 0) {
        recommendation = 'Hold';
        analysis = `Stock is fairly valued according to Graham's formula with ${marginOfSafety.toFixed(1)}% margin of safety.`;
      } else {
        recommendation = 'Sell';
        analysis = `Stock is overvalued according to Graham's formula by ${Math.abs(marginOfSafety).toFixed(1)}%.`;
      }

      const result: GrahamNumberResult = {
        symbol,
        currentPrice,
        grahamNumber,
        marginOfSafety,
        recommendation,
        analysis
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate Graham number: ${error}`);
    }
  }
};

// 2. Discounted Earnings Model
const discountedEarningsTool: Tool = {
  name: 'calculate_discounted_earnings',
  description: 'Calculate intrinsic value using discounted earnings projection method',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      currentPrice: { type: 'number', description: 'Current market price' },
      eps: { type: 'number', description: 'Current earnings per share' },
      growthRate: { type: 'number', description: 'Expected EPS growth rate (decimal)' },
      discountRate: { type: 'number', description: 'Discount rate (decimal)' },
      years: { type: 'number', default: 10, description: 'Years to project' },
      terminalPE: { type: 'number', description: 'Terminal PE multiple' }
    },
    required: ['symbol', 'currentPrice', 'eps', 'growthRate', 'discountRate']
  },
  handler: async (args) => {
    const {
      symbol,
      currentPrice,
      eps,
      growthRate,
      discountRate,
      years = 10,
      terminalPE = 15
    } = args;

    try {
      const projectedEPS: number[] = [];
      let presentValueSum = 0;
      let currentEPS = eps;

      // Project earnings and discount to present
      for (let year = 1; year <= years; year++) {
        currentEPS *= (1 + growthRate);
        projectedEPS.push(currentEPS);
        presentValueSum += currentEPS / Math.pow(1 + discountRate, year);
      }

      // Terminal value
      const terminalValue = currentEPS * terminalPE;
      const presentTerminalValue = terminalValue / Math.pow(1 + discountRate, years);

      const intrinsicValue = presentValueSum + presentTerminalValue;
      const marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;

      let recommendation: 'Buy' | 'Hold' | 'Sell';
      if (marginOfSafety >= 20) {
        recommendation = 'Buy';
      } else if (marginOfSafety >= -20) {
        recommendation = 'Hold';
      } else {
        recommendation = 'Sell';
      }

      const result: DiscountedEarningsResult = {
        symbol,
        currentPrice,
        eps,
        growthRate,
        discountRate,
        years,
        projectedEPS,
        intrinsicValue,
        marginOfSafety,
        recommendation,
        analysis: `Discounted earnings model suggests ${recommendation} with ${marginOfSafety.toFixed(1)}% margin of safety.
                  Projected EPS in ${years} years: $${currentEPS.toFixed(2)}`
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate discounted earnings: ${error}`);
    }
  }
};

// 3. Asset-Based Valuation
const assetBasedValuationTool: Tool = {
  name: 'calculate_asset_based_valuation',
  description: 'Calculate intrinsic value based on company assets and liquidation value',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      currentPrice: { type: 'number', description: 'Current market price' },
      bookValuePerShare: { type: 'number', description: 'Book value per share' },
      totalAssets: { type: 'number', description: 'Total assets' },
      totalLiabilities: { type: 'number', description: 'Total liabilities' },
      sharesOutstanding: { type: 'number', description: 'Shares outstanding' },
      liquidationDiscount: { type: 'number', default: 0.3, description: 'Liquidation discount (decimal)' }
    },
    required: ['symbol', 'currentPrice', 'bookValuePerShare']
  },
  handler: async (args) => {
    const {
      symbol,
      currentPrice,
      bookValuePerShare,
      totalAssets,
      totalLiabilities,
      sharesOutstanding,
      liquidationDiscount = 0.3
    } = args;

    try {
      // Calculate liquidation value
      let liquidationValue = bookValuePerShare * (1 - liquidationDiscount);

      // Calculate Net-Net Working Capital (Ben Graham's formula)
      let netNetWorkingCapital = 0;
      if (totalAssets && totalLiabilities && sharesOutstanding) {
        // Net-Net = (Cash + 0.75*Receivables + 0.5*Inventory - Total Liabilities) / Shares
        netNetWorkingCapital = (totalAssets * 0.5 - totalLiabilities) / sharesOutstanding;
      }

      // Conservative intrinsic value (minimum of methods)
      const intrinsicValue = Math.min(
        bookValuePerShare,
        liquidationValue,
        netNetWorkingCapital > 0 ? netNetWorkingCapital : bookValuePerShare
      );

      const marginOfSafety = ((intrinsicValue - currentPrice) / intrinsicValue) * 100;

      let recommendation: 'Buy' | 'Hold' | 'Sell';
      if (marginOfSafety >= 50) {
        recommendation = 'Buy';
      } else if (marginOfSafety >= 0) {
        recommendation = 'Hold';
      } else {
        recommendation = 'Sell';
      }

      const result: AssetBasedValuationResult = {
        symbol,
        currentPrice,
        bookValuePerShare,
        liquidationValue,
        netNetWorkingCapital,
        intrinsicValue,
        marginOfSafety,
        recommendation,
        analysis: `Asset-based valuation indicates ${recommendation}.
                  Conservative liquidation value: $${liquidationValue.toFixed(2)}.
                  Current P/B: ${(currentPrice / bookValuePerShare).toFixed(2)}x`
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate asset-based valuation: ${error}`);
    }
  }
};

// 4. EV/EBITDA Comparison
const evEbitdaTool: Tool = {
  name: 'calculate_ev_ebitda_valuation',
  description: 'Compare EV/EBITDA ratio across peers and historical values',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      currentPrice: { type: 'number', description: 'Current market price' },
      enterpriseValue: { type: 'number', description: 'Enterprise value' },
      ebitda: { type: 'number', description: 'EBITDA' },
      industryAverage: { type: 'number', description: 'Industry average EV/EBITDA' },
      sharesOutstanding: { type: 'number', description: 'Shares outstanding' },
      debt: { type: 'number', description: 'Total debt' },
      cash: { type: 'number', description: 'Cash and cash equivalents' }
    },
    required: ['symbol', 'currentPrice', 'enterpriseValue', 'ebitda']
  },
  handler: async (args) => {
    const {
      symbol,
      currentPrice,
      enterpriseValue,
      ebitda,
      industryAverage,
      sharesOutstanding,
      debt,
      cash
    } = args;

    try {
      const evEbitdaRatio = enterpriseValue / ebitda;

      let relativeValuation: 'Undervalued' | 'Fairly Valued' | 'Overvalued';
      let recommendation: 'Buy' | 'Hold' | 'Sell';
      let analysis: string;

      if (industryAverage) {
        const discount = ((industryAverage - evEbitdaRatio) / industryAverage) * 100;

        if (evEbitdaRatio < industryAverage * 0.8) {
          relativeValuation = 'Undervalued';
          recommendation = 'Buy';
          analysis = `EV/EBITDA of ${evEbitdaRatio.toFixed(2)}x is ${Math.abs(discount).toFixed(1)}% below industry average of ${industryAverage}x`;
        } else if (evEbitdaRatio > industryAverage * 1.2) {
          relativeValuation = 'Overvalued';
          recommendation = 'Sell';
          analysis = `EV/EBITDA of ${evEbitdaRatio.toFixed(2)}x is ${discount.toFixed(1)}% above industry average of ${industryAverage}x`;
        } else {
          relativeValuation = 'Fairly Valued';
          recommendation = 'Hold';
          analysis = `EV/EBITDA of ${evEbitdaRatio.toFixed(2)}x is close to industry average of ${industryAverage}x`;
        }
      } else {
        // Without industry comparison, use absolute thresholds
        if (evEbitdaRatio < 6) {
          relativeValuation = 'Undervalued';
          recommendation = 'Buy';
        } else if (evEbitdaRatio > 12) {
          relativeValuation = 'Overvalued';
          recommendation = 'Sell';
        } else {
          relativeValuation = 'Fairly Valued';
          recommendation = 'Hold';
        }
        analysis = `EV/EBITDA ratio of ${evEbitdaRatio.toFixed(2)}x ${relativeValuation.toLowerCase()} on absolute basis`;
      }

      const result: EVEBITDAResult = {
        symbol,
        currentPrice,
        enterpriseValue,
        ebitda,
        evEbitdaRatio,
        industryAverage: industryAverage || 0,
        relativeValuation,
        recommendation,
        analysis
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate EV/EBITDA valuation: ${error}`);
    }
  }
};

// 5. Dividend Safety Analysis
const dividendSafetyTool: Tool = {
  name: 'analyze_dividend_safety',
  description: 'Analyze dividend safety and sustainability',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      currentPrice: { type: 'number', description: 'Current market price' },
      dividend: { type: 'number', description: 'Annual dividend per share' },
      eps: { type: 'number', description: 'Earnings per share' },
      freeCashFlow: { type: 'number', description: 'Free cash flow' },
      sharesOutstanding: { type: 'number', description: 'Shares outstanding' },
      historicalDividends: { type: 'array', items: { type: 'number' }, description: 'Historical dividends (last 5 years)' }
    },
    required: ['symbol', 'currentPrice', 'dividend', 'eps', 'freeCashFlow', 'sharesOutstanding']
  },
  handler: async (args) => {
    const {
      symbol,
      currentPrice,
      dividend,
      eps,
      freeCashFlow,
      sharesOutstanding,
      historicalDividends = []
    } = args;

    try {
      const currentYield = (dividend / currentPrice) * 100;
      const payoutRatio = (dividend / eps) * 100;
      const freeCashFlowPerShare = freeCashFlow / sharesOutstanding;
      const freeCashFlowPayout = (dividend / freeCashFlowPerShare) * 100;

      // Calculate dividend growth rate
      let dividendGrowthRate = 0;
      let yearsOfGrowth = 0;
      if (historicalDividends.length >= 2) {
        const firstDividend = historicalDividends[0];
        const lastDividend = historicalDividends[historicalDividends.length - 1];
        yearsOfGrowth = historicalDividends.length - 1;
        dividendGrowthRate = Math.pow(lastDividend / firstDividend, 1 / yearsOfGrowth) - 1;
      }

      // Calculate safety score (0-100)
      let safetyScore = 100;

      // Payout ratio penalty
      if (payoutRatio > 80) safetyScore -= 40;
      else if (payoutRatio > 60) safetyScore -= 20;
      else if (payoutRatio > 50) safetyScore -= 10;

      // FCF payout penalty
      if (freeCashFlowPayout > 70) safetyScore -= 30;
      else if (freeCashFlowPayout > 50) safetyScore -= 15;
      else if (freeCashFlowPayout > 40) safetyScore -= 5;

      // Growth bonus
      if (dividendGrowthRate > 0.10) safetyScore += 10;
      else if (dividendGrowthRate > 0.05) safetyScore += 5;

      // Consistency bonus
      if (yearsOfGrowth >= 5) safetyScore += 10;
      else if (yearsOfGrowth >= 3) safetyScore += 5;

      safetyScore = Math.max(0, Math.min(100, safetyScore));

      let riskLevel: 'Very Safe' | 'Safe' | 'Moderate' | 'Risky' | 'Very Risky';
      if (safetyScore >= 80) riskLevel = 'Very Safe';
      else if (safetyScore >= 60) riskLevel = 'Safe';
      else if (safetyScore >= 40) riskLevel = 'Moderate';
      else if (safetyScore >= 20) riskLevel = 'Risky';
      else riskLevel = 'Very Risky';

      const result: DividendSafetyAnalysis = {
        symbol,
        currentYield,
        payoutRatio,
        freeCashFlowPayout,
        dividendGrowthRate,
        yearsOfGrowth,
        safetyScore,
        riskLevel,
        recommendation: `Dividend appears ${riskLevel.toLowerCase()} with ${safetyScore}/100 safety score.
                       Current yield: ${currentYield.toFixed(2)}%, Payout ratio: ${payoutRatio.toFixed(1)}%`
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to analyze dividend safety: ${error}`);
    }
  }
};

// Export all advanced valuation tools
export const advancedValuationTools: Tool[] = [
  grahamNumberTool,
  discountedEarningsTool,
  assetBasedValuationTool,
  evEbitdaTool,
  dividendSafetyTool
];