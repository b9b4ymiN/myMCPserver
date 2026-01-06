export interface StockData {
  symbol: string;
  currentPrice: number;
  eps: number;
  dividend: number;
  dividendYield?: number;
  bookValue?: number;
  roe?: number;
  payoutRatio?: number;
  growthRate?: number;
  historicalPEs?: number[];
  sector?: string;
  industry?: string;
}

export interface PEBandResult {
  symbol: string;
  currentPE: number;
  averagePE: number;
  minPE: number;
  maxPE: number;
  pePercentile: number;
  fairValueRange: {
    lower: number;
    upper: number;
  };
  recommendation: 'Undervalued' | 'Fairly Valued' | 'Overvalued';
  analysis: string;
}

export interface DDMResult {
  symbol: string;
  currentPrice: number;
  dividend: number;
  requiredReturn: number;
  growthRate: number;
  intrinsicValue: number;
  marginOfSafety: number;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  analysis: string;
}

export interface DCFResult {
  symbol: string;
  currentPrice: number;
  freeCashFlow: number;
  growthRate: number;
  discountRate: number;
  terminalGrowthRate: number;
  intrinsicValue: number;
  marginOfSafety: number;
  npv: number;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  analysis: string;
  projections: {
    year: number;
    fcf: number;
    presentValue: number;
  }[];
}

export interface MarginOfSafetyResult {
  symbol: string;
  currentPrice: number;
  intrinsicValue: number;
  marginOfSafety: number;
  marginOfSafetyPercentage: number;
  valuationMethod: string;
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  analysis: string;
  riskLevel: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
}

// New valuation tools
export interface GrahamNumberResult {
  symbol: string;
  currentPrice: number;
  grahamNumber: number;
  marginOfSafety: number;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  analysis: string;
}

export interface DiscountedEarningsResult {
  symbol: string;
  currentPrice: number;
  eps: number;
  growthRate: number;
  discountRate: number;
  years: number;
  projectedEPS: number[];
  intrinsicValue: number;
  marginOfSafety: number;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  analysis: string;
}

export interface AssetBasedValuationResult {
  symbol: string;
  currentPrice: number;
  bookValuePerShare: number;
  liquidationValue: number;
  netNetWorkingCapital: number;
  intrinsicValue: number;
  marginOfSafety: number;
  recommendation: 'Buy' | 'Hold' | 'Sell';
  analysis: string;
}

export interface EVEBITDAResult {
  symbol: string;
  currentPrice: number;
  enterpriseValue: number;
  ebitda: number;
  evEbitdaRatio: number;
  industryAverage: number;
  relativeValuation: 'Undervalued' | 'Fairly Valued' | 'Overvalued';
  recommendation: 'Buy' | 'Hold' | 'Sell';
  analysis: string;
}

// Financial quality tools
export interface FinancialHealthScore {
  symbol: string;
  altmanZScore: number;
  piotroskiFScore: number;
  bankruptcyRisk: 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
  financialStrength: 'Excellent' | 'Good' | 'Average' | 'Weak' | 'Poor';
  overallScore: number;
  recommendation: string;
}

export interface DuPontAnalysisResult {
  symbol: string;
  roe: number;
  components: {
    netProfitMargin: number;
    assetTurnover: number;
    financialLeverage: number;
  };
  analysis: string;
  trend: 'Improving' | 'Declining' | 'Stable';
}

// Technical analysis tools
export interface TechnicalIndicators {
  symbol: string;
  price: number;
  movingAverages: {
    sma20: number;
    sma50: number;
    sma200: number;
    ema12: number;
    ema26: number;
  };
  signals: {
    goldenCross: boolean;
    deathCross: boolean;
    bullishMACD: boolean;
    bearishMACD: boolean;
  };
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
}

export interface RSITrendAnalysis {
  symbol: string;
  rsi: number;
  trend: 'Oversold' | 'Undervalued' | 'Neutral' | 'Overvalued' | 'Overbought';
  signal: 'Buy' | 'Sell' | 'Hold';
  divergence: {
    bullish: boolean;
    bearish: boolean;
  };
}

// Portfolio management tools
export interface PortfolioMetrics {
  totalValue: number;
  expectedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  var: number; // Value at Risk
  beta: number;
  alpha: number;
}

export interface PositionSizingResult {
  symbol: string;
  portfolioValue: number;
  riskPerTrade: number;
  stopLoss: number;
  maxPositionSize: number;
  sharesToBuy: number;
  positionValue: number;
  riskAmount: number;
}

// Market sentiment tools
export interface MarketSentiment {
  symbol: string;
  institutionalOwnership: number;
  insiderTransactions: 'Buying' | 'Selling' | 'Neutral';
  analystRatings: {
    strongBuy: number;
    buy: number;
    hold: number;
    sell: number;
    strongSell: number;
  };
  shortInterest: number;
  sentimentScore: number;
  contrarianSignal: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
}

// Dividend analysis tools
export interface DividendSafetyAnalysis {
  symbol: string;
  currentYield: number;
  payoutRatio: number;
  freeCashFlowPayout: number;
  dividendGrowthRate: number;
  yearsOfGrowth: number;
  safetyScore: number;
  riskLevel: 'Very Safe' | 'Safe' | 'Moderate' | 'Risky' | 'Very Risky';
  recommendation: string;
}

export interface DividendAristocratScore {
  symbol: string;
  yearsOfDividendGrowth: number;
  averageGrowthRate: number;
  yieldOnCost: number;
  dividendCoverageRatio: number;
  aristocratScore: number;
  qualified: boolean;
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}

// Re-add missing exports from original types
export interface SetWatchData {
  marketCap: number;
  enterpriseValue: number;
  earningsDate: string;
  exDividendDate: string;
  sharesOutstanding: number;
  sharesChangeYoY: number | null;
  sharesChangeQoQ: number | null;
  ownedByInstitutions: number;
  peRatio: number;
  forwardPERatio: number;
  psRatio: number;
  pbRatio: number;
  ptbvRatio: number;
  pfcfRatio: number;
  pocfRatio: number;
  pegRatio: number | null;
  evEarnings: number;
  evSales: number;
  evEbitda: number;
  evEbit: number;
  evFcf: number;
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  debtToEbitda: number;
  debtToFcf: number;
  interestCoverage: number;
  returnOnEquity: number;
  returnOnAssets: number;
  returnOnInvestedCapital: number;
  returnOnCapitalEmployed: number;
  beta5Y: number;
  priceChange52W: number;
  movingAverage50D: number;
  movingAverage200D: number;
  rsi: number;
  averageVolume20D: number;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  pretaxIncome: number;
  netIncome: number;
  ebitda: number;
  ebit: number;
  eps: number;
  cash: number;
  totalDebt: number;
  netCash: number;
  netCashPerShare: number;
  bookValue: number;
  bookValuePerShare: number;
  workingCapital: number;
  operatingCashFlow: number;
  capitalExpenditures: number;
  freeCashFlow: number;
  freeCashFlowPerShare: number;
  grossMargin: number;
  operatingMargin: number;
  pretaxMargin: number;
  profitMargin: number;
  ebitdaMargin: number;
  ebitMargin: number;
  fcfMargin: number;
  dividendPerShare: number;
  dividendYield: number;
  dividendGrowth: number;
  payoutRatio: number;
  buybackYield: number | null;
  shareholderYield: number;
  earningsYield: number;
  fcfYield: number;
  altmanZScore: number;
  piotroskiFScore: number;
}

export interface FinancialStatement {
  fiscalYear: number;
  fiscalQuarter: number;
  date: string;
  period: string;
  currency: string;
  data: Record<string, number | null | undefined>;
}

export interface IncomeStatement extends FinancialStatement {
  data: {
    revenue?: number;
    costOfRevenue?: number;
    grossProfit?: number;
    operatingExpenses?: number;
    operatingIncome?: number;
    interestExpense?: number;
    pretaxIncome?: number;
    taxExpense?: number;
    netIncome?: number;
    eps?: number;
    [key: string]: number | null | undefined;
  };
}

export interface BalanceSheet extends FinancialStatement {
  data: {
    cashAndCashEquivalents?: number;
    shortTermInvestments?: number;
    totalCurrentAssets?: number;
    totalNonCurrentAssets?: number;
    totalAssets?: number;
    totalCurrentLiabilities?: number;
    totalNonCurrentLiabilities?: number;
    totalLiabilities?: number;
    totalShareholdersEquity?: number;
    totalLiabilitiesAndEquity?: number;
    [key: string]: number | null | undefined;
  };
}

export interface CashFlowStatement extends FinancialStatement {
  data: {
    netIncome?: number;
    depreciation?: number;
    changeInWorkingCapital?: number;
    operatingCashFlow?: number;
    capitalExpenditures?: number;
    acquisitions?: number;
    investingCashFlow?: number;
    dividendsPaid?: number;
    financingCashFlow?: number;
    freeCashFlow?: number;
    [key: string]: number | null | undefined;
  };
}

export interface FinancialStatements {
  income: IncomeStatement[];
  balanceSheet: BalanceSheet[];
  cashFlow: CashFlowStatement[];
}

export interface HistoricalRatios {
  year: string;
  fiscalYear: string;
  PE: number;
  PBV: number;
  forwordPE: number;
  ROE: number;
  ROA: number;
  ROIC: number;
}

export interface HistoricalRatiosAnalysis {
  symbol: string;
  period: string;
  data: HistoricalRatios[];
  currentPE: number;
  historicalPEs: number[];
  averagePE: number;
  minPE: number;
  maxPE: number;
  pePercentile: number;
  currentPBV: number;
  historicalPBVs: number[];
  averagePBV: number;
  minPBV: number;
  maxPBV: number;
  pbvPercentile: number;
  currentROE: number;
  historicalROEs: number[];
  averageROE: number;
  trend: {
    pe: 'increasing' | 'decreasing' | 'stable';
    pbv: 'increasing' | 'decreasing' | 'stable';
    roe: 'improving' | 'declining' | 'stable';
    roa: 'improving' | 'declining' | 'stable';
    roic: 'improving' | 'declining' | 'stable';
  };
  summary: {
    peStatus: string;
    pbvStatus: string;
    profitabilityStatus: string;
    overallTrend: string;
  };
}

// =====================================================
// WEB TOOLS INTERFACES
// =====================================================

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source?: string;
  publishedDate?: string;
}

export interface WebSearchResponse {
  query: string;
  totalResults: number;
  results: WebSearchResult[];
  searchTime: number;
}

export interface WebFetchResult {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string;
    author?: string;
    publishedDate?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    wordCount: number;
    fetchedAt: string;
  };
  links: {
    internal: string[];
    external: string[];
  };
  images: string[];
}

export interface NewsArticle {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  snippet: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
}

export interface NewsSearchResponse {
  query: string;
  totalResults: number;
  articles: NewsArticle[];
  searchTime: number;
  sources: string[];
}