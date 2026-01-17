// =====================================================
// CANSLIM / CANSLIME SCORING TOOL
// William O'Neil's Growth Stock Screening Methodology
// =====================================================
// This tool implements the CANSLIM system for growth stock screening.

import axios from 'axios';
import { Tool } from '../types/index.js';
import { CANSLIMResult, CANSLIMInput, CriterionScore } from '../types/canslim.js';
import { API_CONFIG } from '../config/index.js';
import { ToolCategory } from '../types/tool-descriptions.js';
import { fetchIncomeStatement } from './financialStatements.js';
import { SmartResponse, DataQuality, Completeness } from '../types/responses.js';

// =====================================================
// DATA FETCHING
// =====================================================

/**
 * Fetch quarterly income statement to get EPS data
 */
async function fetchQuarterlyEPS(symbol: string): Promise<{ current: number; priorYear: number } | null> {
  try {
    const url = `${API_CONFIG.SET_WATCH.HOST}/mypick/snapFinancials/${symbol}.BK/Income/Quarterly`;
    const response = await axios.get(url, {
      timeout: API_CONFIG.SET_WATCH.TIMEOUT,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });

    const data = response.data;
    if (!data || data.length < 2) return null;

    // Get most recent quarter and same quarter from previous year
    const current = data[0]?.data?.eps || 0;
    const priorYear = data[4]?.data?.eps || 0; // Assuming 4 quarters back = same quarter last year

    if (current > 0 && priorYear > 0) {
      return { current, priorYear };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch annual income statement to get annual earnings growth
 */
async function fetchAnnualEarnings(symbol: string): Promise<{ threeYearsAgo: number; current: number } | null> {
  try {
    const url = `${API_CONFIG.SET_WATCH.HOST}/mypick/snapFinancials/${symbol}.BK/Income/Annual`;
    const response = await axios.get(url, {
      timeout: API_CONFIG.SET_WATCH.TIMEOUT,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });

    const data = response.data;
    if (!data || data.length < 3) return null;

    const current = data[0]?.data?.netIncome || 0;
    const threeYearsAgo = data[2]?.data?.netIncome || 0;

    if (current > 0 && threeYearsAgo > 0) {
      return { current, threeYearsAgo };
    }
    return null;
  } catch {
    return null;
  }
}

// =====================================================
// SCORING FUNCTIONS
// =====================================================

/**
 * Score C - Current Quarterly Earnings
 * Criteria: Quarterly earnings up at least 18-20% vs same quarter last year
 */
function scoreC(
  currentQuarterlyEPS: number | undefined,
  priorYearQuarterEPS: number | undefined,
  fetchedData: { current: number; priorYear: number } | null
): CriterionScore {
  const current = currentQuarterlyEPS ?? fetchedData?.current ?? 0;
  const prior = priorYearQuarterEPS ?? fetchedData?.priorYear ?? 0;

  if (current <= 0 || prior <= 0) {
    return {
      score: 0,
      maxScore: 1,
      pass: false,
      criteria: 'Current Quarterly Earnings growth (minimum 18% YoY)',
      value: 'Data not available',
      threshold: '≥ 18% growth',
      note: 'MISSING DATA: Please provide currentQuarterlyEPS and priorYearQuarterEPS, or ensure Quarterly income statement data is available.'
    };
  }

  const growth = ((current - prior) / prior) * 100;
  const pass = growth >= 18;

  return {
    score: pass ? 1 : 0,
    maxScore: 1,
    pass,
    criteria: 'Current Quarterly Earnings growth (minimum 18% YoY)',
    value: `${growth.toFixed(1)}%`,
    threshold: '≥ 18%',
    note: pass ? `Strong quarterly earnings growth of ${growth.toFixed(1)}%` : `Quarterly earnings growth of ${growth.toFixed(1)}% is below 18% threshold`
  };
}

/**
 * Score A - Annual Earnings Growth
 * Criteria: Annual earnings growth of 25%+ over the past 3 years
 */
function scoreA(
  annualEarnings3YearsAgo: number | undefined,
  annualEarningsCurrentYear: number | undefined,
  fetchedData: { current: number; threeYearsAgo: number } | null
): CriterionScore {
  const threeYearsAgo = annualEarnings3YearsAgo ?? fetchedData?.threeYearsAgo ?? 0;
  const current = annualEarningsCurrentYear ?? fetchedData?.current ?? 0;

  if (current <= 0 || threeYearsAgo <= 0) {
    return {
      score: 0,
      maxScore: 1,
      pass: false,
      criteria: 'Annual Earnings growth (25%+ over 3 years)',
      value: 'Data not available',
      threshold: '≥ 25% CAGR over 3 years',
      note: 'MISSING DATA: Please provide annualEarnings3YearsAgo and annualEarningsCurrentYear (net income), or ensure Annual income statement data is available.'
    };
  }

  // Calculate CAGR: (current / 3 years ago)^(1/3) - 1
  const cagr = (Math.pow(current / threeYearsAgo, 1 / 3) - 1) * 100;
  const pass = cagr >= 25;

  return {
    score: pass ? 1 : 0,
    maxScore: 1,
    pass,
    criteria: 'Annual Earnings growth (25%+ over 3 years)',
    value: `${cagr.toFixed(1)}% CAGR`,
    threshold: '≥ 25% CAGR',
    note: pass ? `Excellent annual earnings growth of ${cagr.toFixed(1)}% CAGR` : `Annual earnings growth of ${cagr.toFixed(1)}% CAGR is below 25% threshold`
  };
}

/**
 * Score N - New (New Products, Management, Price Highs)
 * Criteria: Trading near 52-week highs or positive momentum
 */
function scoreN(priceChange52W: number): CriterionScore {
  const pass = priceChange52W > 0;

  return {
    score: pass ? 1 : 0,
    maxScore: 1,
    pass,
    criteria: 'New - Trading near 52-week highs with positive momentum',
    value: `${priceChange52W.toFixed(1)}%`,
    threshold: '> 0%',
    note: pass ? `Positive 52-week momentum of ${priceChange52W.toFixed(1)}%` : `Negative 52-week momentum of ${priceChange52W.toFixed(1)}%`,
    dataSource: 'Automatic from API'
  };
}

/**
 * Score S - Supply and Demand
 * Criteria: Shares outstanding decreasing (buybacks) or manageable supply
 */
function scoreS(sharesChangeYoY: number | null, sharesChangeQoQ: number | null): CriterionScore {
  const yoyChange = sharesChangeYoY ?? 0;
  const qoqChange = sharesChangeQoQ ?? 0;

  // Pass if shares are decreasing (buyback) or increasing less than 5%
  const pass = yoyChange < 0 || (yoyChange < 5 && qoqChange < 5);

  return {
    score: pass ? 1 : 0,
    maxScore: 1,
    pass,
    criteria: 'Supply and Demand - Decreasing shares (buyback) or manageable supply',
    value: `YoY: ${yoyChange.toFixed(1)}%, QoQ: ${qoqChange.toFixed(1)}%`,
    threshold: 'Negative (buyback) or < 5% increase',
    note: pass ? `Positive: Shares ${yoyChange < 0 ? 'decreasing' : 'stable'} (potential buyback)` : `Concern: Shares increasing significantly (${yoyChange.toFixed(1)}% YoY)`,
    dataSource: 'Automatic from API'
  };
}

/**
 * Score L - Leader
 * Criteria: ROE > 15% (industry leader profitability)
 */
function scoreL(roe: number): CriterionScore {
  const pass = roe >= 15;

  return {
    score: pass ? 1 : 0,
    maxScore: 1,
    pass,
    criteria: 'Leader - High ROE indicating industry leadership',
    value: `${roe.toFixed(1)}%`,
    threshold: '≥ 15%',
    note: pass ? `Strong profitability with ROE of ${roe.toFixed(1)}%` : `ROE of ${roe.toFixed(1)}% is below leadership threshold of 15%`,
    dataSource: 'Automatic from API'
  };
}

/**
 * Score I - Institutional Sponsorship
 * Criteria: Institutional ownership between 5% and 80%
 */
function scoreI(institutionalOwnership: number): CriterionScore {
  const pass = institutionalOwnership >= 5 && institutionalOwnership <= 80;

  return {
    score: pass ? 1 : 0,
    maxScore: 1,
    pass,
    criteria: 'Institutional Sponsorship (5-80% ownership)',
    value: `${institutionalOwnership.toFixed(1)}%`,
    threshold: '5% - 80%',
    note: pass ? `Healthy institutional ownership of ${institutionalOwnership.toFixed(1)}%` : institutionalOwnership < 5
      ? `Low institutional ownership (${institutionalOwnership.toFixed(1)}%) - may lack support`
      : `Very high institutional ownership (${institutionalOwnership.toFixed(1)}%) - may be over-owned`,
    dataSource: 'Automatic from API'
  };
}

/**
 * Score M - Market Direction
 * Criteria: Market in confirmed uptrend (bull market)
 */
function scoreM(marketDirection?: 'bull' | 'bear' | 'neutral', marketTrend?: string): CriterionScore {
  if (!marketDirection && !marketTrend) {
    return {
      score: 0,
      maxScore: 1,
      pass: false,
      criteria: 'Market Direction - Overall market trend',
      value: 'Not provided',
      threshold: 'Bull market (uptrend)',
      note: 'MISSING DATA: Please provide marketDirection ("bull", "bear", or "neutral") or marketTrend description. Check SET Index or market news for current direction.',
      dataSource: 'Requires manual input'
    };
  }

  const pass = marketDirection === 'bull';

  return {
    score: pass ? 1 : 0,
    maxScore: 1,
    pass,
    criteria: 'Market Direction - Overall market in uptrend',
    value: marketDirection || marketTrend || 'Unknown',
    threshold: 'Bull market',
    note: marketTrend || `Market direction: ${marketDirection}`,
    dataSource: 'Manual input required'
  };
}

/**
 * Score E - Earnings Consistency
 * Criteria: Consistent earnings with positive dividend growth
 */
function scoreE(dividendGrowth: number, profitMargin: number): CriterionScore {
  // Pass if dividend growth is positive AND profit margin is healthy (> 5%)
  const pass = dividendGrowth >= 0 && profitMargin > 5;

  return {
    score: pass ? 1 : 0,
    maxScore: 1,
    pass,
    criteria: 'Earnings Consistency - Consistent earnings growth',
    value: `Dividend Growth: ${dividendGrowth.toFixed(1)}%, Margin: ${profitMargin.toFixed(1)}%`,
    threshold: 'Dividend growth ≥ 0% and Margin > 5%',
    note: pass ? `Consistent earnings with positive dividend growth` : dividendGrowth < 0
      ? `Declining dividend growth (${dividendGrowth.toFixed(1)}%)`
      : `Low profit margin (${profitMargin.toFixed(1)}%)`,
    dataSource: 'Automatic from API'
  };
}

/**
 * Score E2 - External Factors
 * Criteria: Favorable macroeconomic conditions
 */
function scoreE2(): CriterionScore {
  return {
    score: 0,
    maxScore: 1,
    pass: false,
    criteria: 'External Factors - Macro conditions (interest rates, inflation, GDP)',
    value: 'Not assessed',
    threshold: 'Favorable macro conditions',
    note: 'NOT ASSESSED: This criterion requires manual assessment of macroeconomic factors such as interest rates, inflation, GDP growth, and sector-specific conditions. Please consider these factors separately.',
    dataSource: 'Requires manual assessment'
  };
}

// =====================================================
// MAIN TOOL
// =====================================================

export const canslimTool: Tool = {
  name: 'calculate_canslim_score',
  description: `Calculate CANSLIM/CANSLIME score for growth stock screening using William O'Neil's methodology.

**Use Case:** ${ToolCategory.FINANCIAL_ANALYSIS} - Screen growth stocks using CANSLIM methodology (C-A-N-S-L-I-M).

**Best For:**
- Growth stock screening and selection
- Identifying stocks with strong earnings momentum
- Growth investing strategies
- Combining growth and quality factors

**Inputs:**
- symbol: Stock symbol (e.g., "AAPL", "SCB")
- currentQuarterlyEPS: Optional - Most recent quarter EPS (if API data unavailable)
- priorYearQuarterEPS: Optional - Same quarter from previous year EPS
- annualEarnings3YearsAgo: Optional - Net income from 3 years ago
- annualEarningsCurrentYear: Optional - Current year net income
- marketDirection: Optional - "bull" | "bear" | "neutral"
- marketTrend: Optional - Text description of market trend

**Outputs:**
- Individual scores for each letter (C-A-N-S-L-I-M-E-E)
- Total score and percentage
- Grade: A+ to F
- Recommendation: Strong Buy | Buy | Hold | Sell | Avoid
- Analysis with details on what passed/failed
- Missing data indicators with suggested inputs

**CANSLIM Criteria:**
- **C**: Current Quarterly Earnings growth ≥ 18% YoY
- **A**: Annual Earnings growth ≥ 25% CAGR over 3 years
- **N**: New - Positive momentum (52-week price change > 0%)
- **S**: Supply - Decreasing shares (buyback) or < 5% increase
- **L**: Leader - ROE ≥ 15%
- **I**: Institutional - Ownership 5-80%
- **M**: Market - Bull market direction
- **E**: Earnings - Consistent growth (dividend growth ≥ 0%, margin > 5%)
- **E**: External - Macro conditions (manual assessment)

**Scoring:**
- Each criterion: 1 point if passed, 0 if failed
- Maximum score: 7 points (M and E2 excluded from main score)
- Grade: A+ (7pts), A (6pts), B (5pts), C (4pts), D (3pts), F (0-2pts)

**Data Sources:**
- Automatic: SET Watch API for most criteria
- Manual input: Market direction, External factors
- Fallback: Manual EPS inputs if API data unavailable

**ExecutionTime:** 3-6 seconds (fetches multiple data sources)
**Caching:** 5 minutes TTL`,
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "ADVANC", "SCB")'
      },
      currentQuarterlyEPS: {
        type: 'number',
        description: 'Optional: Most recent quarter EPS (if API data unavailable)'
      },
      priorYearQuarterEPS: {
        type: 'number',
        description: 'Optional: Same quarter from previous year EPS'
      },
      annualEarnings3YearsAgo: {
        type: 'number',
        description: 'Optional: Net income from 3 years ago (for annual growth calculation)'
      },
      annualEarningsCurrentYear: {
        type: 'number',
        description: 'Optional: Current year net income'
      },
      marketDirection: {
        type: 'string',
        enum: ['bull', 'bear', 'neutral'],
        description: 'Optional: Overall market direction'
      },
      marketTrend: {
        type: 'string',
        description: 'Optional: Market trend description (e.g., "SET Index up 5% in 3 months")'
      }
    },
    required: ['symbol']
  },
  handler: async (args: CANSLIMInput) => {
    const {
      symbol,
      currentQuarterlyEPS,
      priorYearQuarterEPS,
      annualEarnings3YearsAgo,
      annualEarningsCurrentYear,
      marketDirection,
      marketTrend
    } = args;

    // Normalize symbol
    const normalizedSymbol = symbol.replace(/\.BK$/i, '').toUpperCase();

    try {
      // Fetch stock data from SET Watch API
      const url = `${API_CONFIG.SET_WATCH.HOST}/mypick/snapStatistics/${normalizedSymbol}.BK`;
      const response = await axios.get(url, {
        timeout: API_CONFIG.SET_WATCH.TIMEOUT,
        headers: API_CONFIG.SET_WATCH.HEADERS
      });

      const data = response.data;
      if (!data) {
        throw new Error(`No data found for symbol ${normalizedSymbol}`);
      }

      // Fetch quarterly and annual earnings data
      const [quarterlyEPS, annualEarnings] = await Promise.all([
        fetchQuarterlyEPS(normalizedSymbol),
        fetchAnnualEarnings(normalizedSymbol)
      ]);

      // Score each criterion
      const C = scoreC(currentQuarterlyEPS, priorYearQuarterEPS, quarterlyEPS);
      const A = scoreA(annualEarnings3YearsAgo, annualEarningsCurrentYear, annualEarnings);
      const N = scoreN(data.priceChange52W || 0);
      const S = scoreS(data.sharesChangeYoY, data.sharesChangeQoQ);
      const L = scoreL(data.returnOnEquity || 0);
      const I = scoreI(data.ownedByInstitutions || 0);
      const M = scoreM(marketDirection, marketTrend);
      const E = scoreE(data.dividendGrowth || 0, data.profitMargin || 0);
      const E2 = scoreE2();

      // Calculate total score (excluding M and E2 which are informational)
      const mainScores = [C, A, N, S, L, I, E];
      const totalScore = mainScores.reduce((sum, s) => sum + s.score, 0);
      const maxScore = 7; // 7 main criteria

      // Determine grade
      let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
      if (totalScore >= 7) grade = 'A+';
      else if (totalScore >= 6) grade = 'A';
      else if (totalScore >= 5) grade = 'B';
      else if (totalScore >= 4) grade = 'C';
      else if (totalScore >= 3) grade = 'D';
      else grade = 'F';

      // Determine recommendation
      let recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Avoid';
      if (grade === 'A+' || grade === 'A') {
        recommendation = totalScore >= 7 ? 'Strong Buy' : 'Buy';
      } else if (grade === 'B') {
        recommendation = 'Hold';
      } else if (grade === 'C') {
        recommendation = 'Hold';
      } else {
        recommendation = grade === 'D' ? 'Sell' : 'Avoid';
      }

      // Build summary
      const passed: string[] = [];
      const failed: string[] = [];
      const missingData: string[] = [];
      const suggestedInputs: string[] = [];

      mainScores.forEach((s, i) => {
        const letter = ['C', 'A', 'N', 'S', 'L', 'I', 'E'][i];
        if (s.value === 'Data not available' || s.value === 'Not provided') {
          missingData.push(`${letter}: ${s.note || 'Data unavailable'}`);
          if (letter === 'C') suggestedInputs.push('currentQuarterlyEPS, priorYearQuarterEPS');
          if (letter === 'A') suggestedInputs.push('annualEarnings3YearsAgo, annualEarningsCurrentYear');
        } else if (s.pass) {
          passed.push(`${letter}: ${s.criteria} ✓`);
        } else {
          failed.push(`${letter}: ${s.criteria} ✗`);
        }
      });

      // Add M and E2 to missing data if needed
      if (M.value === 'Not provided') {
        missingData.push('M: Market direction not provided');
        suggestedInputs.push('marketDirection ("bull", "bear", "neutral")');
      }
      if (E2.value === 'Not assessed') {
        missingData.push('E2: External factors not assessed');
      }

      // Build analysis
      const percentage = (totalScore / maxScore) * 100;
      const analysis = `CANSLIM Analysis for ${normalizedSymbol}.BK

**Overall Score: ${totalScore}/${maxScore} (${percentage.toFixed(0)}%) - Grade: ${grade}**
${grade === 'A+' || grade === 'A' ? '✓ Excellent growth stock characteristics' :
  grade === 'B' ? '○ Good growth stock with some concerns' :
  grade === 'C' ? '△ Average growth stock' :
  '✗ Poor growth stock characteristics'}

**Passed Criteria (${passed.length}):**
${passed.length > 0 ? passed.map(p => `  • ${p}`).join('\n') : '  None'}

**Failed Criteria (${failed.length}):**
${failed.length > 0 ? failed.map(f => `  • ${f}`).join('\n') : '  None'}

**Missing Data:**
${missingData.length > 0 ? missingData.map(m => `  • ${m}`).join('\n') : '  None (all criteria assessed)'}

${suggestedInputs.length > 0 ? `
**To improve accuracy, provide these inputs:**
${suggestedInputs.map(s => `  - ${s}`).join('\n')}
` : ''}

**Detailed Scores:**
C (${C.score}/1): ${C.criteria} - ${C.note}
A (${A.score}/1): ${A.criteria} - ${A.note}
N (${N.score}/1): ${N.criteria} - ${N.note}
S (${S.score}/1): ${S.criteria} - ${S.note}
L (${L.score}/1): ${L.criteria} - ${L.note}
I (${I.score}/1): ${I.criteria} - ${I.note}
M (${M.score}/1): ${M.criteria} - ${M.note}
E (${E.score}/1): ${E.criteria} - ${E.note}
E2 (${E2.score}/1): ${E2.criteria} - ${E2.note}`;

      const result: CANSLIMResult = {
        symbol: `${normalizedSymbol}.BK`,
        scores: { C, A, N, S, L, I, M, E, E2 },
        totalScore,
        maxScore,
        percentage,
        grade,
        recommendation,
        analysis,
        summary: {
          passed,
          failed,
          missingData,
          suggestedInputs: [...new Set(suggestedInputs)] // Remove duplicates
        },
        dataSource: {
          available: [
            'priceChange52W (from API)',
            'sharesChangeYoY/QoQ (from API)',
            'returnOnEquity (from API)',
            'ownedByInstitutions (from API)',
            'dividendGrowth (from API)',
            'profitMargin (from API)'
          ],
          requiresManualInput: suggestedInputs.length > 0 || !marketDirection
            ? ['Market direction (bull/bear/neutral)', ...[...new Set(suggestedInputs)]]
            : []
        }
      };

      return formatCANSLIMResponse(result);

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Stock symbol "${normalizedSymbol}" not found. Please check the symbol is correct and listed on SET.`);
        }
        throw new Error(`Failed to fetch data for "${normalizedSymbol}": ${error.message}`);
      }
      throw new Error(`Unexpected error calculating CANSLIM score: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

/**
 * Format CANSLIM result as SmartResponse
 */
function formatCANSLIMResponse(data: CANSLIMResult): SmartResponse<CANSLIMResult> {
  const { symbol, scores, totalScore, maxScore, percentage, grade, recommendation, summary } = data;

  const keyFindings: string[] = [];
  const warnings: string[] = [];

  // Build key findings
  keyFindings.push(`Overall Score: ${totalScore}/${maxScore} (${percentage.toFixed(0)}%) - Grade: ${grade}`);
  keyFindings.push(`Recommendation: ${recommendation}`);

  // Add passed criteria
  if (summary.passed.length > 0) {
    keyFindings.push(`Passed (${summary.passed.length}): ${summary.passed.slice(0, 3).join(', ')}`);
  }

  // Add failed criteria
  if (summary.failed.length > 0) {
    warnings.push(`Failed (${summary.failed.length}): ${summary.failed.join(', ')}`);
  }

  // Add missing data warnings
  if (summary.missingData.length > 0) {
    warnings.push(`Missing Data: ${summary.missingData.join('; ')}`);
  }

  // Determine action
  let action: 'Buy' | 'Sell' | 'Hold' | 'Avoid' = 'Hold';
  let priority: 'High' | 'Medium' | 'Low' = 'Medium';
  let confidence: 'High' | 'Medium' | 'Low' = 'Medium';

  if (recommendation === 'Strong Buy' || recommendation === 'Buy') {
    action = 'Buy';
    priority = grade === 'A+' ? 'High' : 'Medium';
    confidence = grade === 'A+' ? 'High' : 'Medium';
  } else if (recommendation === 'Sell' || recommendation === 'Avoid') {
    action = recommendation === 'Avoid' ? 'Avoid' : 'Sell';
    priority = 'Medium';
    confidence = 'Medium';
  } else {
    action = 'Hold';
    priority = 'Low';
    confidence = 'Low';
  }

  return {
    summary: {
      title: `CANSLIM Analysis - ${symbol}`,
      what: `Growth stock screening using William O'Neil's CANSLIM methodology`,
      keyFindings,
      action,
      confidence
    },
    data,
    metadata: {
      tool: 'calculate_canslim_score',
      category: 'Screening',
      dataSource: 'SET Watch API + Financial Statements API',
      lastUpdated: new Date().toISOString(),
      processingTime: 0,
      dataQuality: summary.missingData.length === 0 ? DataQuality.HIGH : DataQuality.MEDIUM,
      completeness: percentage >= 70 ? Completeness.COMPLETE : percentage >= 40 ? Completeness.PARTIAL : Completeness.MINIMAL,
      warnings
    },
    recommendations: {
      investment: action,
      priority,
      reasoning: `${grade} grade based on ${totalScore}/${maxScore} criteria passed`,
      nextSteps: action === 'Buy'
        ? ['Verify growth sustainability', 'Check industry trends', 'Consider position sizing']
        : action === 'Sell' || action === 'Avoid'
        ? ['Consider better alternatives', 'Review failed criteria']
        : ['Wait for improvement in earnings', 'Monitor for better entry point']
    },
    context: {
      relatedTools: ['fetch_stock_data', 'calculate_pe_band', 'calculate_dcf'],
      alternativeTools: ['complete_valuation'],
      suggestedFollowUp: [
        'Review detailed scores for each criterion',
        'Compare with industry peers',
        'Check technical indicators'
      ]
    }
  };
}

export const canslimTools: Tool[] = [canslimTool];
