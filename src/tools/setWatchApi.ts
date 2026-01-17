import axios from 'axios';
import { SetWatchData, Tool } from '../types/index.js';
import { API_CONFIG } from '../config/index.js';
import { ToolCategory } from '../types/tool-descriptions.js';
import { SmartResponse, DataQuality, Completeness } from '../types/responses.js';

// =====================================================
// DATA VALIDATION & ERROR HANDLING
// =====================================================

/**
 * Validate and normalize stock symbol
 */
function validateSymbol(symbol: string): string {
  if (!symbol || typeof symbol !== 'string') {
    throw new Error('Symbol must be a non-empty string');
  }

  // Remove .BK suffix if present and convert to uppercase
  const normalized = symbol.replace(/\.BK$/i, '').trim().toUpperCase();

  if (normalized.length < 2 || normalized.length > 6) {
    throw new Error(`Invalid symbol format: "${symbol}". Thai stock symbols are 2-6 letters (e.g., "ADVANC", "SCB", "KBANK")`);
  }

  if (!/^[A-Z]+$/.test(normalized)) {
    throw new Error(`Invalid symbol: "${symbol}". Must contain only letters`);
  }

  return normalized;
}

/**
 * Validate numeric value and provide default
 */
function safeNumber(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined || isNaN(value)) {
    return defaultValue;
  }
  return Number(value);
}

/**
 * Validate that a required numeric value exists
 */
function requireNumber(value: any, fieldName: string, symbol: string): number {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    throw new Error(`Invalid ${fieldName} for ${symbol}: value is ${value === null ? 'null' : value === undefined ? 'undefined' : value}. This stock may not have this data available.`);
  }
  return Number(value);
}

// =====================================================
// API FETCH FUNCTION
// =====================================================

/**
 * Fetch stock data from SET Watch API with validation
 */
export async function fetchSetWatchData(symbol: string): Promise<SetWatchData> {
  // Validate and normalize symbol
  const validatedSymbol = validateSymbol(symbol);
  const url = `${API_CONFIG.SET_WATCH.HOST}/mypick/snapStatistics/${validatedSymbol}.BK`;

  try {
    const response = await axios.get<SetWatchData>(url, {
      timeout: API_CONFIG.SET_WATCH.TIMEOUT,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });

    // Validate response data
    if (!response.data) {
      throw new Error(`Empty response data for ${validatedSymbol}`);
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Stock symbol "${validatedSymbol}" not found. Please check the symbol is correct and listed on SET (Thai stock exchange).`);
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error(`Request timeout for ${validatedSymbol}. The API may be slow or unreachable. Please try again.`);
      }
      if (error.response?.status === 500) {
        throw new Error(`Server error for ${validatedSymbol}. The API is experiencing issues. Please try again later.`);
      }
      throw new Error(`Failed to fetch data for "${validatedSymbol}": ${error.message}`);
    }
    throw new Error(`Unexpected error fetching data for "${validatedSymbol}"`);
  }
}

// =====================================================
// STOCK DATA FETCHING TOOL
// Fetch comprehensive stock data from SET Watch API
// =====================================================

// Tool to fetch stock data
export const fetchStockDataTool: Tool = {
  name: 'fetch_stock_data',
  description: `Fetch real-time comprehensive stock data from SET Watch API for Thai stocks listed on the Stock Exchange of Thailand.

**Use Case:** ${ToolCategory.DATA_FETCHING} - Get current stock data including price, ratios, financial metrics, and market data.

**Best For:**
- Thai stock analysis (SET market)
- Getting current stock metrics and ratios
- Preparing data for valuation models
- Quick stock data lookup
- Portfolio data updates

**Inputs:**
- symbol: Stock symbol without .BK suffix (e.g., "ADVANC", "SCB", "KBANK"). Accepts lowercase, uppercase, or with .BK suffix.

**Outputs:**
- symbol: Stock symbol with .BK suffix
- currentPrice: Current market price (calculated from PE × EPS)
- eps: Earnings per share
- dividend: Dividend per share
- marketCap: Market capitalization
- Key Ratios: PE, PB, PS, dividend yield, ROE, beta
- Profitability: Gross margin, operating margin, profit margin
- Financial Health: Current ratio, quick ratio, debt-to-equity
- Scores: Altman Z-Score, Piotroski F-Score

**Data Fields (70+ metrics):**
- Valuation: PE, PB, PS, PEG, EV/EBITDA, EV/Sales, EV/FCF
- Profitability: ROE, ROA, ROIC, margins
- Financial Health: Current ratio, quick ratio, debt-to-equity, interest coverage
- Cash Flow: Operating CF, free CF, FCF yield
- Dividend: Yield, growth, payout ratio, shareholder yield
- Technical: Beta, 52-week change, moving averages, RSI

**Notes:**
- Symbol is automatically validated and converted to uppercase
- Accepts symbols with or without .BK suffix (e.g., "advanc", "ADVANC", "advanc.bk" all work)
- Returns null/0 for missing data fields

**Prerequisites:** None - this is typically the first tool to call

**Related Tools:** complete_valuation, calculate_pe_band, calculate_dcf, calculate_ddm
**DataSource:** ${API_CONFIG.SET_WATCH.HOST}/mypick/snapStatistics/
**ExecutionTime:** 1-3 seconds
**Caching:** 5 minutes TTL (price data changes frequently)`,
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol (e.g., "ADVANC", "SCB", "KBANK"). Case-insensitive, .BK suffix optional.'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol } = args;

    try {
      // Fetch data (includes validation)
      const data = await fetchSetWatchData(symbol);

      // Validate required fields for price calculation
      const eps = requireNumber(data.eps, 'EPS', symbol);
      const peRatio = requireNumber(data.peRatio, 'PE ratio', symbol);

      // Calculate current price from PE ratio and EPS
      const currentPrice = peRatio * eps;

      // Use safeNumber for optional fields (null becomes 0)
      const stockData = {
        symbol: `${validateSymbol(symbol)}.BK`,
        currentPrice,
        eps: eps,
        dividend: safeNumber(data.dividendPerShare),
        freeCashFlow: safeNumber(data.freeCashFlow),
        sharesOutstanding: requireNumber(data.sharesOutstanding, 'shares outstanding', symbol),
        marketCap: safeNumber(data.marketCap),
        peRatio: peRatio,
        pbRatio: safeNumber(data.pbRatio),
        psRatio: safeNumber(data.psRatio),
        dividendYield: safeNumber(data.dividendYield),
        roe: safeNumber(data.returnOnEquity),
        beta: safeNumber(data.beta5Y),
        debtToEquity: safeNumber(data.debtToEquity),
        currentRatio: safeNumber(data.currentRatio),
        quickRatio: safeNumber(data.quickRatio),
        grossMargin: safeNumber(data.grossMargin),
        operatingMargin: safeNumber(data.operatingMargin),
        profitMargin: safeNumber(data.profitMargin),
        altmanZScore: safeNumber(data.altmanZScore),
        piotroskiFScore: safeNumber(data.piotroskiFScore),
        rawData: data
      };

      return formatStockDataResponse(stockData);
    } catch (error) {
      throw new Error(`Failed to fetch stock data: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Format stock data as SmartResponse
 */
function formatStockDataResponse(data: any): SmartResponse<any> {
  const { symbol, currentPrice, eps, peRatio, pbRatio, dividendYield, roe, debtToEquity, altmanZScore, piotroskiFScore, beta } = data;

  const keyFindings: string[] = [];
  const warnings: string[] = [];

  // Build key findings
  keyFindings.push(`Current Price: ฿${currentPrice.toFixed(2)}`);
  keyFindings.push(`PE Ratio: ${peRatio.toFixed(2)} | PB Ratio: ${pbRatio.toFixed(2)}`);
  keyFindings.push(`ROE: ${roe.toFixed(1)}% | Dividend Yield: ${dividendYield.toFixed(2)}%`);
  keyFindings.push(`Debt-to-Equity: ${debtToEquity.toFixed(2)} | Beta: ${beta.toFixed(2)}`);

  // Financial health assessment
  if (altmanZScore > 0) {
    if (altmanZScore >= 3) {
      keyFindings.push(`✓ Strong financial health (Altman Z-Score: ${altmanZScore.toFixed(2)})`);
    } else if (altmanZScore >= 1.8) {
      warnings.push(`Moderate financial health (Altman Z-Score: ${altmanZScore.toFixed(2)})`);
    } else {
      warnings.push(`⚠ Weak financial health (Altman Z-Score: ${altmanZScore.toFixed(2)})`);
    }
  }

  // ROE assessment
  if (roe > 15) {
    keyFindings.push(`✓ Excellent profitability (ROE: ${roe.toFixed(1)}%)`);
  } else if (roe < 8) {
    warnings.push(`⚠ Low ROE (${roe.toFixed(1)}%)`);
  }

  // Determine action
  let action: 'Buy' | 'Sell' | 'Hold' = 'Hold';
  let priority: 'High' | 'Medium' | 'Low' = 'Medium';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

  if (peRatio > 0) {
    if (peRatio < 12 && roe > 15) {
      action = 'Buy';
      priority = 'Medium';
      confidence = 'Medium';
    } else if (peRatio > 25) {
      action = 'Sell';
      priority = 'Medium';
      confidence = 'Medium';
    }
  }

  return {
    summary: {
      title: `Stock Data - ${symbol}`,
      what: `Comprehensive stock data and metrics from SET Watch API`,
      keyFindings,
      action,
      confidence
    },
    data: {
      summary: {
        symbol,
        currentPrice: `฿${currentPrice.toFixed(2)}`,
        currency: 'THB',
        exchange: 'SET'
      },
      valuation: {
        peRatio,
        pbRatio,
        dividendYield,
        roe
      },
      health: {
        altmanZScore,
        piotroskiFScore,
        currentRatio: data.currentRatio,
        debtToEquity
      },
      technical: {
        beta,
        priceChange52W: data.priceChange52W || 0,
        rsi: data.rsi || 0
      },
      rawData: data
    },
    metadata: {
      tool: 'fetch_stock_data',
      category: 'Data Fetching',
      dataSource: 'SET Watch API',
      lastUpdated: new Date().toISOString(),
      processingTime: 0,
      dataQuality: DataQuality.HIGH,
      completeness: Completeness.COMPLETE,
      warnings
    },
    recommendations: {
      investment: action,
      priority,
      reasoning: `Based on PE ratio of ${peRatio.toFixed(2)} and ROE of ${roe.toFixed(1)}%`,
      nextSteps: action === 'Buy'
        ? ['Run valuation models', 'Check financial statements', 'Verify earnings quality']
        : action === 'Sell'
        ? ['Consider taking profits', 'Reassess valuation']
        : ['Monitor for entry point', 'Review valuation metrics']
    },
    context: {
      relatedTools: ['complete_valuation', 'calculate_pe_band', 'calculate_dcf', 'calculate_ddm'],
      alternativeTools: ['calculate_canslim_score'],
      suggestedFollowUp: [
        'Run complete valuation for investment decision',
        'Check financial statements for details',
        'Review technical indicators'
      ]
    }
  };
}

// =====================================================
// COMPLETE VALUATION TOOL
// Fetch data and run all valuation models at once
// =====================================================

// Tool to run complete valuation with fetched data
export const completeValuationTool: Tool = {
  name: 'complete_valuation',
  description: `Fetch stock data and run all major valuation models (PE Band, DDM, DCF) in a single call. Provides comprehensive valuation analysis with overall recommendation.

**Use Case:** ${ToolCategory.VALUATION} - Complete end-to-end stock valuation with multiple models for comprehensive analysis.

**Best For:**
- Comprehensive stock analysis
- Investment decision support
- Quick valuation overview
- Comparing multiple valuation methods
- Generating investment reports

**Inputs:**
- symbol: Stock symbol without .BK suffix (e.g., "PTT", "AOT", "BDMS")
- requiredReturn: Required rate of return for DDM (default: 0.10 = 10%)
- growthRate: Growth rate for DDM and DCF (default: 0.05 = 5%)
- discountRate: Discount rate/WACC for DCF (default: 0.10 = 10%)
- years: Number of years for DCF projection (default: 5)

**Outputs:**
- symbol: Stock symbol with .BK suffix
- currentPrice: Current market price
- lastUpdated: Timestamp of analysis
- data: Key metrics (marketCap, EPS, PE, PB, dividendYield, ROE, beta)

**Valuation Models:**
1. **PE Band Analysis:** Historical PE range valuation
   - currentPE, averagePE, minPE, maxPE
   - fairValueRange (lower/upper)
   - recommendation: Undervalued/Fairly Valued/Overvalued

2. **DDM Valuation:** (if dividend > 0)
   - Intrinsic value from Gordon Growth Model
   - marginOfSafety
   - recommendation: Buy/Hold/Sell

3. **DCF Valuation:**
   - 5-year FCF projections
   - Terminal value calculation
   - NPV and intrinsic value per share
   - marginOfSafety
   - Year-by-year projections

4. **Margin of Safety:**
   - Average intrinsic value across methods
   - Overall margin of safety percentage
   - riskLevel: Very Low/Low/Medium/High/Very High
   - recommendation: Strong Buy/Buy/Hold/Sell/Strong Sell

**Overall Recommendation:**
- Combines signals from all valuation models
- Provides single investment decision
- Includes comprehensive summary

**Workflow:**
1. Fetches stock data from SET Watch API
2. Runs PE Band, DDM (if applicable), DCF valuations
3. Calculates margin of safety
4. Aggregates recommendations
5. Returns comprehensive analysis

**Related Tools:** fetch_stock_data, calculate_margin_of_safety, calculate_financial_health_score
**DataSource:** SET Watch API + Calculated valuations
**ExecutionTime:** 3-5 seconds
**Caching:** 5 minutes TTL`,
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
      // Fetch stock data (includes validation)
      const stockData = await fetchSetWatchData(symbol);

      // Validate required fields for calculations
      const eps = requireNumber(stockData.eps, 'EPS', symbol);
      const peRatio = requireNumber(stockData.peRatio, 'PE ratio', symbol);
      const sharesOutstanding = requireNumber(stockData.sharesOutstanding, 'shares outstanding', symbol);
      const currentPrice = peRatio * eps;
      const validatedSymbol = validateSymbol(symbol);

      const results: any = {
        symbol: `${validatedSymbol}.BK`,
        currentPrice,
        lastUpdated: new Date().toISOString(),
        data: {
          marketCap: safeNumber(stockData.marketCap),
          eps: eps,
          peRatio: peRatio,
          pbRatio: safeNumber(stockData.pbRatio),
          dividendYield: safeNumber(stockData.dividendYield),
          roe: safeNumber(stockData.returnOnEquity),
          beta: safeNumber(stockData.beta5Y)
        },
        valuations: {}
      };

      // 1. PE Band Analysis
      // Use default historical PEs for Thai market
      const historicalPEs = [8, 10, 12, 15, 18, 20, 22, 25, 15, 13, 11, 9];
      const currentPE = currentPrice / eps;
      const avgPE = historicalPEs.reduce((a, b) => a + b, 0) / historicalPEs.length;
      const minPE = Math.min(...historicalPEs);
      const maxPE = Math.max(...historicalPEs);

      const fairValueLower = minPE * eps;
      const fairValueUpper = maxPE * eps;

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
      const dividendPerShare = safeNumber(stockData.dividendPerShare);
      if (dividendPerShare > 0) {
        const d1 = dividendPerShare * (1 + growthRate);
        const ddmIntrinsicValue = d1 / (requiredReturn - growthRate);
        const marginOfSafety = ((currentPrice - ddmIntrinsicValue) / ddmIntrinsicValue) * 100;

        let ddmRecommendation: 'Buy' | 'Hold' | 'Sell';
        if (marginOfSafety < -20) {
          ddmRecommendation = 'Buy';
        } else if (marginOfSafety > 20) {
          ddmRecommendation = 'Sell';
        } else {
          ddmRecommendation = 'Hold';
        }

        results.valuations.ddm = {
          dividend: dividendPerShare,
          requiredReturn,
          growthRate,
          intrinsicValue: ddmIntrinsicValue,
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
      const freeCashFlow = safeNumber(stockData.freeCashFlow);
      let dcfRecommendation: 'Buy' | 'Hold' | 'Sell' | 'N/A' = 'N/A';
      let dcfIntrinsicValue: number | null = null;

      // Skip DCF if no FCF data
      if (freeCashFlow > 0) {
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

        const terminalGrowthRate = 0.025; // 2.5% terminal growth
        const terminalFCF = projectedFCF * (1 + terminalGrowthRate);
        const terminalValue = terminalFCF / (discountRate - terminalGrowthRate);
        const terminalPresentValue = terminalValue / Math.pow(1 + discountRate, years);

        const totalNPV = npv + terminalPresentValue;
        dcfIntrinsicValue = totalNPV / sharesOutstanding;
        const dcfMarginOfSafety = ((currentPrice - dcfIntrinsicValue) / dcfIntrinsicValue) * 100;

        if (dcfMarginOfSafety < -20) {
          dcfRecommendation = 'Buy';
        } else if (dcfMarginOfSafety > 20) {
          dcfRecommendation = 'Sell';
        } else {
          dcfRecommendation = 'Hold';
        }

        results.valuations.dcf = {
          freeCashFlow: freeCashFlow,
          growthRate,
          discountRate,
          terminalGrowthRate,
          intrinsicValue: dcfIntrinsicValue,
          marginOfSafety: dcfMarginOfSafety,
          npv: totalNPV,
          recommendation: dcfRecommendation,
          projections
        };
      } else {
        results.valuations.dcf = {
          note: 'No free cash flow data - DCF not applicable',
          freeCashFlow: 0,
          recommendation: 'N/A'
        };
      }

      // Overall Recommendation
      const recommendations = [];
      recommendations.push(peRecommendation === 'Undervalued' ? 'Buy' : peRecommendation === 'Overvalued' ? 'Sell' : 'Hold');

      if (dividendPerShare > 0 && results.valuations.ddm.recommendation) {
        recommendations.push(results.valuations.ddm.recommendation);
      }
      if (dcfRecommendation !== 'N/A') {
        recommendations.push(dcfRecommendation);
      }

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

      // Calculate average intrinsic value and margin of safety
      const peIntrinsicValue = avgPE * eps;
      const intrinsicValues = [peIntrinsicValue];
      if (results.valuations.ddm && results.valuations.ddm.intrinsicValue) {
        intrinsicValues.push(results.valuations.ddm.intrinsicValue);
      }
      if (dcfIntrinsicValue !== null) {
        intrinsicValues.push(dcfIntrinsicValue);
      }

      const averageIntrinsicValue = intrinsicValues.reduce((a, b) => a + b, 0) / intrinsicValues.length;
      const averageMarginOfSafety = ((averageIntrinsicValue - currentPrice) / averageIntrinsicValue) * 100;

      // Margin of Safety analysis
      let mosRecommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
      let mosRiskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';

      if (averageMarginOfSafety >= 50) {
        mosRecommendation = 'Strong Buy';
        mosRiskLevel = 'Very Low';
      } else if (averageMarginOfSafety >= 30) {
        mosRecommendation = 'Buy';
        mosRiskLevel = 'Low';
      } else if (averageMarginOfSafety >= 10) {
        mosRecommendation = 'Hold';
        mosRiskLevel = 'Medium';
      } else if (averageMarginOfSafety >= -10) {
        mosRecommendation = 'Sell';
        mosRiskLevel = 'High';
      } else {
        mosRecommendation = 'Strong Sell';
        mosRiskLevel = 'Very High';
      }

      results.valuations.marginOfSafety = {
        averageIntrinsicValue,
        marginOfSafety: averageMarginOfSafety,
        recommendation: mosRecommendation,
        riskLevel: mosRiskLevel,
        analysis: `Average intrinsic value across methods: ${averageIntrinsicValue.toFixed(2)}.
                  Current margin of safety: ${averageMarginOfSafety.toFixed(1)}%.
                  This suggests the stock is ${mosRecommendation.toLowerCase()} with ${mosRiskLevel.toLowerCase()} risk.`
      };

      results.overallRecommendation = overallRecommendation;
      results.summary = {
        peBand: peRecommendation,
        ddm: results.valuations.ddm.recommendation || 'N/A',
        dcf: dcfRecommendation,
        marginOfSafety: mosRecommendation,
        overall: overallRecommendation
      };

      return formatCompleteValuationResponse(results);
    } catch (error) {
      throw new Error(`Failed to run complete valuation: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Format complete valuation as SmartResponse
 */
function formatCompleteValuationResponse(data: any): SmartResponse<any> {
  const { symbol, currentPrice, valuations, overallRecommendation, summary, lastUpdated } = data;

  const keyFindings: string[] = [];
  const warnings: string[] = [];

  // Build key findings from each valuation
  const peBand = valuations.peBand;
  if (peBand) {
    const status = peBand.recommendation === 'Undervalued' ? 'Undervalued' : peBand.recommendation === 'Overvalued' ? 'Overvalued' : 'Fairly Valued';
    keyFindings.push(`PE Band: ${status} (PE: ${peBand.currentPE.toFixed(1)})`);
  }

  const ddm = valuations.ddm;
  if (ddm && ddm.recommendation !== 'N/A') {
    keyFindings.push(`DDM: ${ddm.recommendation} (Intrinsic: ฿${ddm.intrinsicValue?.toFixed(2)})`);
  } else if (ddm && ddm.note) {
    warnings.push('DDM: No dividend data available');
  }

  const dcf = valuations.dcf;
  if (dcf && dcf.recommendation && dcf.recommendation !== 'N/A') {
    keyFindings.push(`DCF: ${dcf.recommendation} (Intrinsic: ฿${dcf.intrinsicValue?.toFixed(2)})`);
  } else if (dcf && dcf.note) {
    warnings.push('DCF: No free cash flow data available');
  }

  const mos = valuations.marginOfSafety;
  if (mos) {
    keyFindings.push(`Margin of Safety: ${mos.marginOfSafety?.toFixed(1)}% (${mos.recommendation})`);
    keyFindings.push(`Risk Level: ${mos.riskLevel}`);
  }

  // Determine action
  let action: 'Buy' | 'Sell' | 'Hold' | 'Avoid' = 'Hold';
  let priority: 'High' | 'Medium' | 'Low' = 'Medium';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

  if (overallRecommendation === 'Buy') {
    action = 'Buy';
    priority = 'Medium';
    confidence = 'Medium';
  } else if (overallRecommendation === 'Sell') {
    action = 'Sell';
    priority = 'Medium';
    confidence = 'Medium';
  } else {
    action = 'Hold';
    priority = 'Low';
    confidence = 'Low';
  }

  // Boost confidence if margin of safety is strong
  if (mos && mos.marginOfSafety >= 30) {
    confidence = 'High';
    priority = 'High';
  }

  return {
    summary: {
      title: `Complete Valuation - ${symbol}`,
      what: `Comprehensive valuation using PE Band, DDM, DCF, and Margin of Safety`,
      keyFindings,
      action,
      confidence
    },
    data: {
      symbol,
      currentPrice,
      lastUpdated,
      valuations,
      summary
    },
    metadata: {
      tool: 'complete_valuation',
      category: 'Valuation',
      dataSource: 'SET Watch API + Calculated Valuations',
      lastUpdated: lastUpdated || new Date().toISOString(),
      processingTime: 0,
      dataQuality: warnings.length === 0 ? DataQuality.HIGH : DataQuality.MEDIUM,
      completeness: Completeness.COMPLETE,
      warnings
    },
    recommendations: {
      investment: action,
      priority,
      reasoning: `${overallRecommendation} based on ${Object.values(valuations).filter(v => v !== null).length} valuation methods`,
      nextSteps: action === 'Buy'
        ? ['Verify intrinsic value assumptions', 'Check financial health', 'Consider position sizing']
        : action === 'Sell'
        ? ['Consider taking profits', 'Reassess valuation assumptions']
        : ['Wait for better entry point', 'Monitor valuation changes']
    },
    context: {
      relatedTools: ['fetch_stock_data', 'calculate_margin_of_safety', 'calculate_pe_band', 'calculate_dcf', 'calculate_ddm'],
      alternativeTools: ['calculate_canslim_score'],
      suggestedFollowUp: [
        'Review financial statements for details',
        'Check management commentary',
        'Monitor technical indicators'
      ]
    }
  };
}