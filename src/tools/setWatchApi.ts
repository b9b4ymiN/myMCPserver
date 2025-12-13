import axios from 'axios';
import { SetWatchData, Tool } from '../types/index.js';
import { API_CONFIG } from '../config/index.js';

// Fetch stock data from SET Watch API
export async function fetchSetWatchData(symbol: string): Promise<SetWatchData> {
  const url = `${API_CONFIG.SET_WATCH.HOST}/mypick/snapStatistics/${symbol}.BK`;

  try {
    const response = await axios.get<SetWatchData>(url, {
      timeout: API_CONFIG.SET_WATCH.TIMEOUT,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Stock symbol ${symbol} not found`);
      }
      throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`);
    }
    throw new Error(`Unexpected error fetching data for ${symbol}`);
  }
}

// Tool to fetch stock data
export const fetchStockDataTool: Tool = {
  name: 'fetch_stock_data',
  description: 'Fetch real-time stock data from SET Watch API for Thai stocks',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "ADVANC" for ADVANC.BK)'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol } = args;

    try {
      const data = await fetchSetWatchData(symbol);

      // Calculate current price from PE ratio and EPS
      const currentPrice = data.peRatio * data.eps;

      return {
        symbol: `${symbol}.BK`,
        currentPrice,
        eps: data.eps,
        dividend: data.dividendPerShare,
        freeCashFlow: data.freeCashFlow,
        sharesOutstanding: data.sharesOutstanding,
        marketCap: data.marketCap,
        peRatio: data.peRatio,
        pbRatio: data.pbRatio,
        psRatio: data.psRatio,
        dividendYield: data.dividendYield,
        roe: data.returnOnEquity,
        beta: data.beta5Y,
        debtToEquity: data.debtToEquity,
        currentRatio: data.currentRatio,
        quickRatio: data.quickRatio,
        grossMargin: data.grossMargin,
        operatingMargin: data.operatingMargin,
        profitMargin: data.profitMargin,
        altmanZScore: data.altmanZScore,
        piotroskiFScore: data.piotroskiFScore,
        rawData: data
      };
    } catch (error) {
      throw new Error(`Failed to fetch stock data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Tool to run complete valuation with fetched data
export const completeValuationTool: Tool = {
  name: 'complete_valuation',
  description: 'Fetch stock data and run all valuation models (PE Band, DDM, DCF)',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "ADVANC" for ADVANC.BK)'
      },
      requiredReturn: {
        type: 'number',
        description: 'Required rate of return for DDM (as decimal, e.g., 0.1 for 10%)',
        default: 0.1
      },
      growthRate: {
        type: 'number',
        description: 'Growth rate for DDM and DCF (as decimal, e.g., 0.05 for 5%)',
        default: 0.05
      },
      discountRate: {
        type: 'number',
        description: 'Discount rate/WACC for DCF (as decimal, e.g., 0.1 for 10%)',
        default: 0.1
      },
      years: {
        type: 'number',
        description: 'Number of years for DCF projection',
        default: 5
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const {
      symbol,
      requiredReturn = 0.1,
      growthRate = 0.05,
      discountRate = 0.1,
      years = 5
    } = args;

    try {
      // Fetch stock data
      const stockData = await fetchSetWatchData(symbol);
      const currentPrice = stockData.peRatio * stockData.eps;

      const results: any = {
        symbol: `${symbol}.BK`,
        currentPrice,
        lastUpdated: new Date().toISOString(),
        data: {
          marketCap: stockData.marketCap,
          eps: stockData.eps,
          peRatio: stockData.peRatio,
          pbRatio: stockData.pbRatio,
          dividendYield: stockData.dividendYield,
          roe: stockData.returnOnEquity,
          beta: stockData.beta5Y
        },
        valuations: {}
      };

      // 1. PE Band Analysis
      // Use default historical PEs for Thai market
      const historicalPEs = [8, 10, 12, 15, 18, 20, 22, 25, 15, 13, 11, 9];
      const currentPE = currentPrice / stockData.eps;
      const avgPE = historicalPEs.reduce((a, b) => a + b, 0) / historicalPEs.length;
      const minPE = Math.min(...historicalPEs);
      const maxPE = Math.max(...historicalPEs);

      const fairValueLower = minPE * stockData.eps;
      const fairValueUpper = maxPE * stockData.eps;

      let peRecommendation: 'Undervalued' | 'Fairly Valued' | 'Overvalued';
      if (currentPrice < fairValueLower) {
        peRecommendation = 'Undervalued';
      } else if (currentPrice > fairValueUpper) {
        peRecommendation = 'Overvalued';
      } else {
        peRecommendation = 'Fairly Valued';
      }

      results.valuations.peBand = {
        currentPE,
        averagePE: avgPE,
        minPE,
        maxPE,
        fairValueRange: { lower: fairValueLower, upper: fairValueUpper },
        recommendation: peRecommendation
      };

      // 2. DDM Valuation (if dividend > 0)
      if (stockData.dividendPerShare > 0) {
        const d1 = stockData.dividendPerShare * (1 + growthRate);
        const dcfIntrinsicValue = d1 / (requiredReturn - growthRate);
        const marginOfSafety = ((currentPrice - dcfIntrinsicValue) / dcfIntrinsicValue) * 100;

        let ddmRecommendation: 'Buy' | 'Hold' | 'Sell';
        if (marginOfSafety < -20) {
          ddmRecommendation = 'Buy';
        } else if (marginOfSafety > 20) {
          ddmRecommendation = 'Sell';
        } else {
          ddmRecommendation = 'Hold';
        }

        results.valuations.ddm = {
          dividend: stockData.dividendPerShare,
          requiredReturn,
          growthRate,
          intrinsicValue: dcfIntrinsicValue,
          marginOfSafety,
          recommendation: ddmRecommendation
        };
      } else {
        results.valuations.ddm = {
          note: 'No dividend - DDM not applicable',
          dividend: 0
        };
      }

      // 3. DCF Valuation
      const projections = [];
      let projectedFCF = stockData.freeCashFlow;
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

      const terminalGrowthRate = 0.025; // 2.5% terminal growth
      const terminalFCF = projectedFCF * (1 + terminalGrowthRate);
      const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);
      const terminalPresentValue = terminalValue / Math.pow(1 + discountRate, years);

      const totalNPV = npv + terminalPresentValue;
      const dcfIntrinsicValue = totalNPV / stockData.sharesOutstanding;
      const dcfMarginOfSafety = ((currentPrice - dcfIntrinsicValue) / dcfIntrinsicValue) * 100;

      let dcfRecommendation: 'Buy' | 'Hold' | 'Sell';
      if (dcfMarginOfSafety < -20) {
        dcfRecommendation = 'Buy';
      } else if (dcfMarginOfSafety > 20) {
        dcfRecommendation = 'Sell';
      } else {
        dcfRecommendation = 'Hold';
      }

      results.valuations.dcf = {
        freeCashFlow: stockData.freeCashFlow,
        growthRate,
        discountRate,
        terminalGrowthRate,
        intrinsicValue: dcfIntrinsicValue,
        marginOfSafety: dcfMarginOfSafety,
        npv: totalNPV,
        recommendation: dcfRecommendation,
        projections
      };

      // Overall Recommendation
      const recommendations = [];
      recommendations.push(peRecommendation === 'Undervalued' ? 'Buy' : peRecommendation === 'Overvalued' ? 'Sell' : 'Hold');

      if (stockData.dividendPerShare > 0 && results.valuations.ddm.recommendation) {
        recommendations.push(results.valuations.ddm.recommendation);
      }
      recommendations.push(dcfRecommendation);

      const buys = recommendations.filter(r => r === 'Buy').length;
      const sells = recommendations.filter(r => r === 'Sell').length;

      let overallRecommendation: 'Buy' | 'Hold' | 'Sell';
      if (buys > sells) {
        overallRecommendation = 'Buy';
      } else if (sells > buys) {
        overallRecommendation = 'Sell';
      } else {
        overallRecommendation = 'Hold';
      }

      results.overallRecommendation = overallRecommendation;
      results.summary = {
        peBand: peRecommendation,
        ddm: results.valuations.ddm.recommendation || 'N/A',
        dcf: dcfRecommendation,
        overall: overallRecommendation
      };

      return results;
    } catch (error) {
      throw new Error(`Failed to run complete valuation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};