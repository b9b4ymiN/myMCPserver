import {
  FinancialHealthScore,
  DuPontAnalysisResult,
  Tool
} from '../types/index.js';

// 1. Financial Health Score (Altman Z-Score + Piotroski F-Score)
const financialHealthTool: Tool = {
  name: 'calculate_financial_health_score',
  description: 'Calculate comprehensive financial health score using Altman Z-Score and Piotroski F-Score',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      workingCapital: { type: 'number', description: 'Working capital' },
      totalAssets: { type: 'number', description: 'Total assets' },
      retainedEarnings: { type: 'number', description: 'Retained earnings' },
      ebit: { type: 'number', description: 'EBIT (Earnings Before Interest and Taxes)' },
      marketValueEquity: { type: 'number', description: 'Market value of equity' },
      totalLiabilities: { type: 'number', description: 'Total liabilities' },
      sales: { type: 'number', description: 'Sales/Revenue' },
      netIncome: { type: 'number', description: 'Net income' },
      operatingCashFlow: { type: 'number', description: 'Operating cash flow' },
      // Piotroski components
      currentRatio: { type: 'number', description: 'Current ratio' },
      grossMargin: { type: 'number', description: 'Gross margin (%)' },
      assetTurnover: { type: 'number', description: 'Asset turnover ratio' },
      longTermDebt: { type: 'number', description: 'Long-term debt' },
      commonSharesOutstanding: { type: 'number', description: 'Common shares outstanding' }
    },
    required: ['symbol', 'workingCapital', 'totalAssets', 'retainedEarnings', 'ebit',
               'marketValueEquity', 'totalLiabilities', 'sales', 'netIncome', 'operatingCashFlow']
  },
  handler: async (args) => {
    const {
      symbol,
      workingCapital,
      totalAssets,
      retainedEarnings,
      ebit,
      marketValueEquity,
      totalLiabilities,
      sales,
      netIncome,
      operatingCashFlow,
      currentRatio,
      grossMargin,
      assetTurnover,
      longTermDebt,
      commonSharesOutstanding
    } = args;

    try {
      // Altman Z-Score (Private Company Model)
      const z1 = (workingCapital / totalAssets) * 1.2;
      const z2 = (retainedEarnings / totalAssets) * 1.4;
      const z3 = (ebit / totalAssets) * 3.3;
      const z4 = (marketValueEquity / totalLiabilities) * 0.6;
      const z5 = (sales / totalAssets) * 1.0;
      const altmanZScore = z1 + z2 + z3 + z4 + z5;

      // Piotroski F-Score calculation (simplified)
      let piotroskiScore = 0;

      // Profitability
      if (netIncome > 0) piotroskiScore += 1; // Positive ROA
      if (operatingCashFlow > 0) piotroskiScore += 1; // Positive CFO
      if (operatingCashFlow > netIncome) piotroskiScore += 1; // CFO > Net Income
      if ((netIncome / totalAssets) > (retainedEarnings / totalAssets - (netIncome / totalAssets))) {
        piotroskiScore += 1; // Accrual <= CFO
      }

      // Leverage, Liquidity, and Source of Funds
      if ((longTermDebt || 0) + totalLiabilities < (longTermDebt || 0) + totalLiabilities - (longTermDebt || 0)) {
        piotroskiScore += 1; // Lower long-term debt
      }
      if (currentRatio > 1.5) piotroskiScore += 1; // Good current ratio
      if (commonSharesOutstanding <= commonSharesOutstanding) piotroskiScore += 1; // No dilution

      // Operating Efficiency
      if (grossMargin > (grossMargin || 0)) piotroskiScore += 1; // Improving gross margin
      if (assetTurnover > (assetTurnover || 0)) piotroskiScore += 1; // Improving asset turnover

      // Determine bankruptcy risk
      let bankruptcyRisk: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
      if (altmanZScore >= 3) bankruptcyRisk = 'Very Low';
      else if (altmanZScore >= 2.5) bankruptcyRisk = 'Low';
      else if (altmanZScore >= 1.8) bankruptcyRisk = 'Medium';
      else if (altmanZScore >= 1) bankruptcyRisk = 'High';
      else bankruptcyRisk = 'Very High';

      // Determine financial strength
      let financialStrength: 'Excellent' | 'Good' | 'Average' | 'Weak' | 'Poor';
      if (piotroskiScore >= 8) financialStrength = 'Excellent';
      else if (piotroskiScore >= 6) financialStrength = 'Good';
      else if (piotroskiScore >= 4) financialStrength = 'Average';
      else if (piotroskiScore >= 2) financialStrength = 'Weak';
      else financialStrength = 'Poor';

      // Overall score (normalized 0-100)
      const overallScore = Math.round(((altmanZScore / 5) * 50) + ((piotroskiScore / 9) * 50));

      const result: FinancialHealthScore = {
        symbol,
        altmanZScore: Math.round(altmanZScore * 100) / 100,
        piotroskiFScore: piotroskiScore,
        bankruptcyRisk,
        financialStrength,
        overallScore,
        recommendation: `${financialStrength} financial health with ${bankruptcyRisk.toLowerCase()} bankruptcy risk.
                        Overall score: ${overallScore}/100. Altman Z-Score: ${altmanZScore.toFixed(2)}.`
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate financial health score: ${error}`);
    }
  }
};

// 2. DuPont Analysis
const duPontAnalysisTool: Tool = {
  name: 'analyze_dupont',
  description: 'Decompose ROE using DuPont analysis to identify sources of profitability',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      netIncome: { type: 'number', description: 'Net income' },
      revenue: { type: 'number', description: 'Revenue/Sales' },
      totalAssets: { type: 'number', description: 'Total assets' },
      shareholdersEquity: { type: 'number', description: 'Shareholders equity' },
      previousROE: { type: 'number', description: 'Previous period ROE (%)' }
    },
    required: ['symbol', 'netIncome', 'revenue', 'totalAssets', 'shareholdersEquity']
  },
  handler: async (args) => {
    const {
      symbol,
      netIncome,
      revenue,
      totalAssets,
      shareholdersEquity,
      previousROE
    } = args;

    try {
      // Calculate DuPont components
      const netProfitMargin = netIncome / revenue;
      const assetTurnover = revenue / totalAssets;
      const financialLeverage = totalAssets / shareholdersEquity;

      // ROE = Net Profit Margin × Asset Turnover × Financial Leverage
      const roe = netProfitMargin * assetTurnover * financialLeverage;

      // Determine trend
      let trend: 'Improving' | 'Declining' | 'Stable';
      if (previousROE) {
        const change = (roe - previousROE) / Math.abs(previousROE);
        if (change > 0.05) trend = 'Improving';
        else if (change < -0.05) trend = 'Declining';
        else trend = 'Stable';
      } else {
        trend = 'Stable';
      }

      // Generate analysis
      let analysis = `ROE: ${(roe * 100).toFixed(2)}% breakdown:\n`;
      analysis += `- Net Profit Margin: ${(netProfitMargin * 100).toFixed(2)}% (${netProfitMargin > 0.1 ? 'Strong' : netProfitMargin > 0.05 ? 'Good' : 'Weak'})\n`;
      analysis += `- Asset Turnover: ${assetTurnover.toFixed(2)}x (${assetTurnover > 1 ? 'Efficient' : 'Needs improvement'})\n`;
      analysis += `- Financial Leverage: ${financialLeverage.toFixed(2)}x (${financialLeverage < 2 ? 'Conservative' : 'Aggressive'})`;

      if (trend !== 'Stable') {
        analysis += `\nROE is ${trend.toLowerCase()} compared to previous period.`;
      }

      const result: DuPontAnalysisResult = {
        symbol,
        roe: roe * 100,
        components: {
          netProfitMargin: netProfitMargin * 100,
          assetTurnover,
          financialLeverage
        },
        analysis,
        trend
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to perform DuPont analysis: ${error}`);
    }
  }
};

// 3. Cash Flow Quality Analysis
const cashFlowQualityTool: Tool = {
  name: 'analyze_cash_flow_quality',
  description: 'Analyze cash flow quality and sustainability of earnings',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      netIncome: { type: 'number', description: 'Net income' },
      operatingCashFlow: { type: 'number', description: 'Operating cash flow' },
      capitalExpenditures: { type: 'number', description: 'Capital expenditures' },
      depreciation: { type: 'number', description: 'Depreciation & amortization' },
      changesInWorkingCapital: { type: 'number', description: 'Changes in working capital' },
      previousYearOCF: { type: 'number', description: 'Previous year operating cash flow' }
    },
    required: ['symbol', 'netIncome', 'operatingCashFlow', 'capitalExpenditures']
  },
  handler: async (args) => {
    const {
      symbol,
      netIncome,
      operatingCashFlow,
      capitalExpenditures,
      depreciation,
      changesInWorkingCapital,
      previousYearOCF
    } = args;

    try {
      const freeCashFlow = operatingCashFlow - capitalExpenditures;
      const ocfToNetIncome = operatingCashFlow / Math.abs(netIncome);
      const fcfToOcf = freeCashFlow / operatingCashFlow;

      // Cash flow quality score
      let qualityScore = 100;

      // OCF should be positive and > net income
      if (ocfToNetIncome < 1) qualityScore -= 30;
      if (ocfToNetIncome < 0.8) qualityScore -= 20;

      // FCF should be positive
      if (fcfToOcf < 0.7) qualityScore -= 25;
      if (fcfToOcf < 0.5) qualityScore -= 15;

      // Growth check
      if (previousYearOCF) {
        const growth = (operatingCashFlow - previousYearOCF) / Math.abs(previousYearOCF);
        if (growth < 0) qualityScore -= 20;
        else if (growth > 0.1) qualityScore += 10;
      }

      let quality: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor';
      if (qualityScore >= 80) quality = 'Excellent';
      else if (qualityScore >= 60) quality = 'Good';
      else if (qualityScore >= 40) quality = 'Average';
      else if (qualityScore >= 20) quality = 'Poor';
      else quality = 'Very Poor';

      return {
        symbol,
        operatingCashFlow,
        freeCashFlow,
        ocfToNetIncome: ocfToNetIncome.toFixed(2),
        fcfToOcf: fcfToOcf.toFixed(2),
        qualityScore,
        quality,
        analysis: `Cash flow quality is ${quality.toLowerCase()} with score ${qualityScore}/100.
                   OCF/Net Income ratio: ${ocfToNetIncome.toFixed(2)}, FCF/OCF ratio: ${fcfToOcf.toFixed(2)}.`
      };
    } catch (error) {
      throw new Error(`Failed to analyze cash flow quality: ${error}`);
    }
  }
};

// 4. Earnings Quality Analysis
const earningsQualityTool: Tool = {
  name: 'analyze_earnings_quality',
  description: 'Assess earnings quality by comparing accrual vs cash earnings',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      netIncome: { type: 'number', description: 'Net income' },
      operatingCashFlow: { type: 'number', description: 'Operating cash flow' },
      revenue: { type: 'number', description: 'Revenue' },
      accountsReceivable: { type: 'number', description: 'Accounts receivable' },
      inventory: { type: 'number', description: 'Inventory' },
      previousYearAR: { type: 'number', description: 'Previous year accounts receivable' },
      previousYearRevenue: { type: 'number', description: 'Previous year revenue' }
    },
    required: ['symbol', 'netIncome', 'operatingCashFlow', 'revenue']
  },
  handler: async (args) => {
    const {
      symbol,
      netIncome,
      operatingCashFlow,
      revenue,
      accountsReceivable,
      inventory,
      previousYearAR,
      previousYearRevenue
    } = args;

    try {
      // Calculate accruals
      const accruals = (netIncome - operatingCashFlow) / Math.abs(operatingCashFlow);

      // Revenue quality
      let revenueQuality = 100;
      if (previousYearAR && previousYearRevenue) {
        const arGrowth = (accountsReceivable - previousYearAR) / previousYearAR;
        const revenueGrowth = (revenue - previousYearRevenue) / previousYearRevenue;
        if (arGrowth > revenueGrowth * 1.5) revenueQuality -= 30;
      }

      // Quality score
      let qualityScore = 100;
      if (accruals > 0.1) qualityScore -= 40;
      if (accruals > 0.05) qualityScore -= 20;
      if (accruals < -0.05) qualityScore += 20;

      qualityScore = (qualityScore + revenueQuality) / 2;

      let quality: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Very Poor';
      if (qualityScore >= 80) quality = 'Excellent';
      else if (qualityScore >= 60) quality = 'Good';
      else if (qualityScore >= 40) quality = 'Average';
      else if (qualityScore >= 20) quality = 'Poor';
      else quality = 'Very Poor';

      return {
        symbol,
        accruals: accruals.toFixed(3),
        ocfToEarnings: (operatingCashFlow / netIncome).toFixed(2),
        qualityScore: qualityScore.toFixed(0),
        quality,
        analysis: `Earnings quality is ${quality.toLowerCase()} (${qualityScore.toFixed(0)}/100).
                   Accruals ratio: ${accruals.toFixed(3)}. ${accruals > 0 ? 'Watch for high accruals' : 'Good cash conversion'}`
      };
    } catch (error) {
      throw new Error(`Failed to analyze earnings quality: ${error}`);
    }
  }
};

// Export all financial analysis tools
export const financialAnalysisTools: Tool[] = [
  financialHealthTool,
  duPontAnalysisTool,
  cashFlowQualityTool,
  earningsQualityTool
];