import axios from 'axios';
import { HistoricalRatios, HistoricalRatiosAnalysis, Tool } from '../types/index.js';
import { API_CONFIG } from '../config/index.js';

// Fetch historical ratios from SET Watch API
export async function fetchHistoricalRatios(symbol: string, period: string = 'TTM'): Promise<HistoricalRatios[]> {
  const url = `${API_CONFIG.SET_WATCH.HOST}/mypick/Ratio4Chart/${symbol}.BK/${period}`;

  try {
    const response = await axios.get<HistoricalRatios[]>(url, {
      timeout: API_CONFIG.SET_WATCH.TIMEOUT,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Historical ratios data not found for ${symbol}`);
      }
      throw new Error(`Failed to fetch historical ratios for ${symbol}: ${error.message}`);
    }
    throw new Error(`Unexpected error fetching historical ratios for ${symbol}`);
  }
}

// Calculate trend
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) return 'stable';

  const recentValues = values.slice(-3); // Last 3 periods
  const averageChange = (recentValues[recentValues.length - 1] - recentValues[0]) / recentValues[0];

  if (Math.abs(averageChange) < 0.05) return 'stable'; // Less than 5% change
  return averageChange > 0 ? 'increasing' : 'decreasing';
}

// Calculate profitability trend (higher is better)
function calculateProfitabilityTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';

  const recentValues = values.slice(-3); // Last 3 periods
  const averageChange = (recentValues[recentValues.length - 1] - recentValues[0]) / recentValues[0];

  if (Math.abs(averageChange) < 0.05) return 'stable'; // Less than 5% change
  return averageChange > 0 ? 'improving' : 'declining';
}

// Calculate percentile
function calculatePercentile(value: number, array: number[]): number {
  const sorted = [...array].sort((a, b) => a - b);
  const index = sorted.indexOf(value);
  if (index === -1) return 50; // Value not found, return median
  return (index / (sorted.length - 1)) * 100;
}

// Analyze historical ratios
export function analyzeHistoricalRatios(symbol: string, data: HistoricalRatios[]): HistoricalRatiosAnalysis {
  // Get current values
  const currentData = data[0];
  const currentPE = currentData.PE;
  const currentPBV = currentData.PBV;
  const currentROE = currentData.ROE;

  // Extract historical arrays
  const historicalPEs = data.map(d => d.PE).filter(pe => pe > 0);
  const historicalPBVs = data.map(d => d.PBV).filter(pbv => pbv > 0);
  const historicalROEs = data.map(d => d.ROE).filter(roe => roe !== null && roe !== undefined);
  const historicalROAs = data.map(d => d.ROA).filter(roa => roa !== null && roa !== undefined);
  const historicalROICs = data.map(d => d.ROIC).filter(roic => roic !== null && roic !== undefined);

  // Calculate statistics
  const averagePE = historicalPEs.length > 0 ? historicalPEs.reduce((a, b) => a + b, 0) / historicalPEs.length : 0;
  const minPE = historicalPEs.length > 0 ? Math.min(...historicalPEs) : 0;
  const maxPE = historicalPEs.length > 0 ? Math.max(...historicalPEs) : 0;

  const averagePBV = historicalPBVs.length > 0 ? historicalPBVs.reduce((a, b) => a + b, 0) / historicalPBVs.length : 0;
  const minPBV = historicalPBVs.length > 0 ? Math.min(...historicalPBVs) : 0;
  const maxPBV = historicalPBVs.length > 0 ? Math.max(...historicalPBVs) : 0;

  const averageROE = historicalROEs.length > 0 ? historicalROEs.reduce((a, b) => a + b, 0) / historicalROEs.length : 0;

  // Calculate percentiles
  const pePercentile = historicalPEs.length > 1 ? calculatePercentile(currentPE, historicalPEs) : 50;
  const pbvPercentile = historicalPBVs.length > 1 ? calculatePercentile(currentPBV, historicalPBVs) : 50;

  // Calculate trends
  const trend = {
    pe: calculateTrend(historicalPEs),
    pbv: calculateTrend(historicalPBVs),
    roe: calculateProfitabilityTrend(historicalROEs),
    roa: calculateProfitabilityTrend(historicalROAs),
    roic: calculateProfitabilityTrend(historicalROICs)
  };

  // Generate summaries
  let peStatus = '';
  if (currentPE < averagePE * 0.8) {
    peStatus = 'PE is low compared to historical average (potentially undervalued)';
  } else if (currentPE > averagePE * 1.2) {
    peStatus = 'PE is high compared to historical average (potentially overvalued)';
  } else {
    peStatus = 'PE is within normal historical range';
  }

  let pbvStatus = '';
  if (currentPBV < averagePBV * 0.8) {
    pbvStatus = 'P/B is low compared to historical average (potentially undervalued)';
  } else if (currentPBV > averagePBV * 1.2) {
    pbvStatus = 'P/B is high compared to historical average (potentially overvalued)';
  } else {
    pbvStatus = 'P/B is within normal historical range';
  }

  let profitabilityStatus = '';
  if (currentROE > 15) {
    profitabilityStatus = 'Excellent profitability (ROE > 15%)';
  } else if (currentROE > 10) {
    profitabilityStatus = 'Good profitability (ROE > 10%)';
  } else if (currentROE > 5) {
    profitabilityStatus = 'Moderate profitability (ROE > 5%)';
  } else {
    profitabilityStatus = 'Low profitability (ROE < 5%)';
  }

  // Overall trend assessment
  let overallTrend = '';
  const positiveTrends = [trend.pe === 'decreasing', trend.pbv === 'decreasing', trend.roe === 'improving'].filter(Boolean).length;
  const negativeTrends = [trend.pe === 'increasing', trend.pbv === 'increasing', trend.roe === 'declining'].filter(Boolean).length;

  if (positiveTrends > negativeTrends) {
    overallTrend = 'Positive trend: Valuation becoming more attractive while profitability improving';
  } else if (negativeTrends > positiveTrends) {
    overallTrend = 'Negative trend: Valuation becoming less attractive or profitability declining';
  } else {
    overallTrend = 'Mixed trend: No clear direction in valuation and profitability';
  }

  return {
    symbol: `${symbol}.BK`,
    period: 'TTM',
    data,
    currentPE,
    historicalPEs,
    averagePE,
    minPE,
    maxPE,
    pePercentile,
    currentPBV,
    historicalPBVs,
    averagePBV,
    minPBV,
    maxPBV,
    pbvPercentile,
    currentROE,
    historicalROEs,
    averageROE,
    trend,
    summary: {
      peStatus,
      pbvStatus,
      profitabilityStatus,
      overallTrend
    }
  };
}

// Tool to fetch historical ratios
export const fetchHistoricalRatiosTool: Tool = {
  name: 'fetch_historical_ratios',
  description: 'Fetch historical financial ratios (PE, PBV, ROE, ROA, ROIC) from SET Watch API',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "AP" for AP.BK)'
      },
      period: {
        type: 'string',
        description: 'Time period - TTM (Trailing Twelve Months) or Quarterly',
        enum: ['TTM', 'Quarterly'],
        default: 'TTM'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol, period = 'TTM' } = args;

    try {
      const data = await fetchHistoricalRatios(symbol, period);

      return {
        symbol: `${symbol}.BK`,
        period,
        data,
        summary: {
          totalPeriods: data.length,
          latestPeriod: data[0]?.fiscalYear || 'N/A',
          currentPE: data[0]?.PE || 0,
          currentPBV: data[0]?.PBV || 0,
          currentROE: data[0]?.ROE || 0,
          forwardPE: data[0]?.forwordPE || 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch historical ratios: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Tool to analyze historical ratios with trend analysis
export const analyzeHistoricalRatiosTool: Tool = {
  name: 'analyze_historical_ratios',
  description: 'Fetch and analyze historical financial ratios with trend analysis and valuation assessment',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "AP" for AP.BK)'
      },
      period: {
        type: 'string',
        description: 'Time period - TTM (Trailing Twelve Months) or Quarterly',
        enum: ['TTM', 'Quarterly'],
        default: 'TTM'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol, period = 'TTM' } = args;

    try {
      const data = await fetchHistoricalRatios(symbol, period);
      const analysis = analyzeHistoricalRatios(symbol, data);

      // Generate investment recommendation based on analysis
      let recommendation: 'Buy' | 'Hold' | 'Sell' | 'Neutral';
      let reasons: string[] = [];

      // Check valuation (PE and PBV)
      if (analysis.currentPE < analysis.averagePE * 0.8 && analysis.currentPBV < analysis.averagePBV * 0.8) {
        reasons.push('Both PE and P/B are below historical averages - potentially undervalued');
      } else if (analysis.currentPE > analysis.averagePE * 1.2 || analysis.currentPBV > analysis.averagePBV * 1.2) {
        reasons.push('PE or P/B is above historical averages - potentially overvalued');
      }

      // Check profitability trend
      if (analysis.trend.roe === 'improving' && analysis.currentROE > 10) {
        reasons.push('ROE is improving and above 10% - strong profitability');
      } else if (analysis.trend.roe === 'declining') {
        reasons.push('ROE is declining - profitability weakening');
      }

      // Check overall trend
      if (analysis.summary.overallTrend.includes('Positive')) {
        reasons.push('Overall positive trend detected');
      } else if (analysis.summary.overallTrend.includes('Negative')) {
        reasons.push('Overall negative trend detected');
      }

      // Determine recommendation
      const buySignals = reasons.filter(r =>
        r.includes('undervalued') || r.includes('improving') || r.includes('Positive') || r.includes('strong')
      ).length;
      const sellSignals = reasons.filter(r =>
        r.includes('overvalued') || r.includes('declining') || r.includes('Negative') || r.includes('weakening')
      ).length;

      if (buySignals > sellSignals) {
        recommendation = 'Buy';
      } else if (sellSignals > buySignals) {
        recommendation = 'Sell';
      } else {
        recommendation = 'Hold';
      }

      return {
        ...analysis,
        recommendation,
        reasons,
        investmentSummary: `${recommendation} - ${reasons.join('; ')}`
      };
    } catch (error) {
      throw new Error(`Failed to analyze historical ratios: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};