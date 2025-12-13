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

export interface Tool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}

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