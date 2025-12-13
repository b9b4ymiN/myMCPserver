import axios from 'axios';
import { IncomeStatement, BalanceSheet, CashFlowStatement, FinancialStatements, Tool } from '../types/index.js';
import { API_CONFIG } from '../config/index.js';

// Base URL for SET Watch financial statements API
const BASE_URL = `${API_CONFIG.SET_WATCH.HOST}/mypick/snapFinancials`;

// Fetch income statement
export async function fetchIncomeStatement(symbol: string, period: string = 'TTM'): Promise<IncomeStatement[]> {
  const url = `${BASE_URL}/${symbol}.BK/Income/${period}`;

  try {
    const response = await axios.get<IncomeStatement[]>(url, {
      timeout: API_CONFIG.SET_WATCH.TIMEOUT,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Income statement data not found for ${symbol}`);
      }
      throw new Error(`Failed to fetch income statement for ${symbol}: ${error.message}`);
    }
    throw new Error(`Unexpected error fetching income statement for ${symbol}`);
  }
}

// Fetch balance sheet
export async function fetchBalanceSheet(symbol: string, period: string = 'TTM'): Promise<BalanceSheet[]> {
  const url = `${BASE_URL}/${symbol}.BK/Balance Sheet/${period}`;

  try {
    const response = await axios.get<BalanceSheet[]>(url, {
      timeout: API_CONFIG.SET_WATCH.TIMEOUT,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Balance sheet data not found for ${symbol}`);
      }
      throw new Error(`Failed to fetch balance sheet for ${symbol}: ${error.message}`);
    }
    throw new Error(`Unexpected error fetching balance sheet for ${symbol}`);
  }
}

// Fetch cash flow statement
export async function fetchCashFlowStatement(symbol: string, period: string = 'TTM'): Promise<CashFlowStatement[]> {
  const url = `${BASE_URL}/${symbol}.BK/Cash Flow/${period}`;

  try {
    const response = await axios.get<CashFlowStatement[]>(url, {
      timeout: API_CONFIG.SET_WATCH.TIMEOUT,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Cash flow statement data not found for ${symbol}`);
      }
      throw new Error(`Failed to fetch cash flow statement for ${symbol}: ${error.message}`);
    }
    throw new Error(`Unexpected error fetching cash flow statement for ${symbol}`);
  }
}

// Fetch all financial statements
export async function fetchAllFinancialStatements(symbol: string, period: string = 'TTM'): Promise<FinancialStatements> {
  try {
    const [income, balanceSheet, cashFlow] = await Promise.all([
      fetchIncomeStatement(symbol, period),
      fetchBalanceSheet(symbol, period),
      fetchCashFlowStatement(symbol, period)
    ]);

    return {
      income,
      balanceSheet,
      cashFlow
    };
  } catch (error) {
    throw new Error(`Failed to fetch financial statements for ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Tool to fetch income statement
export const fetchIncomeStatementTool: Tool = {
  name: 'fetch_income_statement',
  description: 'Fetch income statement data from SET Watch API for Thai stocks',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "ADVANC" for ADVANC.BK)'
      },
      period: {
        type: 'string',
        description: 'Time period - TTM (Trailing Twelve Months), Quarterly, or Annual',
        enum: ['TTM', 'Quarterly', 'Annual'],
        default: 'TTM'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol, period = 'TTM' } = args;

    try {
      const statements = await fetchIncomeStatement(symbol, period);

      return {
        symbol: `${symbol}.BK`,
        period,
        statementType: 'Income Statement',
        data: statements,
        summary: statements.length > 0 ? {
          latestPeriod: statements[0].date,
          fiscalYear: statements[0].fiscalYear,
          fiscalQuarter: statements[0].fiscalQuarter,
          currency: statements[0].currency,
          totalPeriods: statements.length
        } : null
      };
    } catch (error) {
      throw new Error(`Failed to fetch income statement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Tool to fetch balance sheet
export const fetchBalanceSheetTool: Tool = {
  name: 'fetch_balance_sheet',
  description: 'Fetch balance sheet data from SET Watch API for Thai stocks',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "ADVANC" for ADVANC.BK)'
      },
      period: {
        type: 'string',
        description: 'Time period - TTM (Trailing Twelve Months), Quarterly, or Annual',
        enum: ['TTM', 'Quarterly', 'Annual'],
        default: 'TTM'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol, period = 'TTM' } = args;

    try {
      const statements = await fetchBalanceSheet(symbol, period);

      return {
        symbol: `${symbol}.BK`,
        period,
        statementType: 'Balance Sheet',
        data: statements,
        summary: statements.length > 0 ? {
          latestPeriod: statements[0].date,
          fiscalYear: statements[0].fiscalYear,
          fiscalQuarter: statements[0].fiscalQuarter,
          currency: statements[0].currency,
          totalPeriods: statements.length
        } : null
      };
    } catch (error) {
      throw new Error(`Failed to fetch balance sheet: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Tool to fetch cash flow statement
export const fetchCashFlowStatementTool: Tool = {
  name: 'fetch_cash_flow_statement',
  description: 'Fetch cash flow statement data from SET Watch API for Thai stocks',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "ADVANC" for ADVANC.BK)'
      },
      period: {
        type: 'string',
        description: 'Time period - TTM (Trailing Twelve Months), Quarterly, or Annual',
        enum: ['TTM', 'Quarterly', 'Annual'],
        default: 'TTM'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol, period = 'TTM' } = args;

    try {
      const statements = await fetchCashFlowStatement(symbol, period);

      return {
        symbol: `${symbol}.BK`,
        period,
        statementType: 'Cash Flow Statement',
        data: statements,
        summary: statements.length > 0 ? {
          latestPeriod: statements[0].date,
          fiscalYear: statements[0].fiscalYear,
          fiscalQuarter: statements[0].fiscalQuarter,
          currency: statements[0].currency,
          totalPeriods: statements.length
        } : null
      };
    } catch (error) {
      throw new Error(`Failed to fetch cash flow statement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// Tool to fetch all financial statements
export const fetchAllFinancialStatementsTool: Tool = {
  name: 'fetch_all_financial_statements',
  description: 'Fetch all financial statements (Income, Balance Sheet, Cash Flow) from SET Watch API',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol without .BK suffix (e.g., "ADVANC" for ADVANC.BK)'
      },
      period: {
        type: 'string',
        description: 'Time period - TTM (Trailing Twelve Months), Quarterly, or Annual',
        enum: ['TTM', 'Quarterly', 'Annual'],
        default: 'TTM'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol, period = 'TTM' } = args;

    try {
      const statements = await fetchAllFinancialStatements(symbol, period);

      // Calculate key financial ratios from the latest statements
      const latestIncome = statements.income[0];
      const latestBalanceSheet = statements.balanceSheet[0];
      const latestCashFlow = statements.cashFlow[0];

      const analysis: any = {
        profitability: {},
        liquidity: {},
        leverage: {},
        efficiency: {},
        cashFlow: {}
      };

      // Profitability ratios
      if (latestIncome?.data.revenue && latestIncome?.data.netIncome) {
        analysis.profitability.netMargin = (latestIncome.data.netIncome / latestIncome.data.revenue) * 100;
      }
      if (latestIncome?.data.operatingIncome && latestIncome?.data.revenue) {
        analysis.profitability.operatingMargin = (latestIncome.data.operatingIncome / latestIncome.data.revenue) * 100;
      }
      if (latestIncome?.data.grossProfit && latestIncome?.data.revenue) {
        analysis.profitability.grossMargin = (latestIncome.data.grossProfit / latestIncome.data.revenue) * 100;
      }

      // Liquidity ratios
      if (latestBalanceSheet?.data.totalCurrentAssets && latestBalanceSheet?.data.totalCurrentLiabilities) {
        analysis.liquidity.currentRatio = latestBalanceSheet.data.totalCurrentAssets / latestBalanceSheet.data.totalCurrentLiabilities;
      }

      // Leverage ratios
      if (latestBalanceSheet?.data.totalLiabilities && latestBalanceSheet?.data.totalShareholdersEquity) {
        analysis.leverage.debtToEquity = latestBalanceSheet.data.totalLiabilities / latestBalanceSheet.data.totalShareholdersEquity;
      }
      if (latestBalanceSheet?.data.totalLiabilities && latestBalanceSheet?.data.totalAssets) {
        analysis.leverage.debtToAssets = latestBalanceSheet.data.totalLiabilities / latestBalanceSheet.data.totalAssets;
      }

      // Cash flow ratios
      if (latestCashFlow?.data.operatingCashFlow && latestBalanceSheet?.data.totalCurrentLiabilities) {
        analysis.cashFlow.operatingCashFlowToCurrentLiabilities = latestCashFlow.data.operatingCashFlow / latestBalanceSheet.data.totalCurrentLiabilities;
      }
      if (latestCashFlow?.data.freeCashFlow && latestIncome?.data.revenue) {
        analysis.cashFlow.freeCashFlowMargin = (latestCashFlow.data.freeCashFlow / latestIncome.data.revenue) * 100;
      }

      return {
        symbol: `${symbol}.BK`,
        period,
        statements,
        analysis,
        summary: {
          incomeStatementCount: statements.income.length,
          balanceSheetCount: statements.balanceSheet.length,
          cashFlowStatementCount: statements.cashFlow.length,
          latestDate: latestIncome?.date || 'N/A',
          currency: latestIncome?.currency || 'N/A'
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch financial statements: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};