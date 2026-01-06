import { Tool } from '../types/index.js';

// =====================================================
// MATH & CALCULATION TOOLS
// =====================================================

interface StatisticsResult {
  data: number[];
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number[];
  range: {
    min: number;
    max: number;
    spread: number;
  };
  variance: number;
  standardDeviation: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
    iqr: number;
  };
  outliers: number[];
}

const calculateStatisticsTool: Tool = {
  name: 'calculate_statistics',
  description: 'Calculate comprehensive statistics for a dataset including mean, median, mode, standard deviation, variance, quartiles, and outliers',
  inputSchema: {
    type: 'object',
    properties: {
      data: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of numbers to analyze'
      },
      sample: {
        type: 'boolean',
        description: 'Use sample standard deviation (n-1) instead of population (n)',
        default: false
      }
    },
    required: ['data']
  },
  handler: async (args) => {
    const { data, sample = false } = args;

    try {
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Data must be a non-empty array of numbers');
      }

      const validData = data.filter(n => typeof n === 'number' && !isNaN(n));

      if (validData.length === 0) {
        throw new Error('No valid numbers found in data');
      }

      const sorted = [...validData].sort((a, b) => a - b);
      const count = sorted.length;

      // Sum
      const sum = sorted.reduce((a, b) => a + b, 0);

      // Mean
      const mean = sum / count;

      // Median
      const mid = Math.floor(count / 2);
      const median = count % 2 !== 0
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;

      // Mode
      const frequency = new Map<number, number>();
      sorted.forEach(n => frequency.set(n, (frequency.get(n) || 0) + 1));
      const maxFreq = Math.max(...frequency.values());
      const mode = Array.from(frequency.entries())
        .filter(([_, freq]) => freq === maxFreq)
        .map(([n]) => n);

      // Range
      const min = sorted[0];
      const max = sorted[count - 1];
      const spread = max - min;

      // Variance & Standard Deviation
      const divisor = sample ? count - 1 : count;
      const squaredDiffs = sorted.map(n => Math.pow(n - mean, 2));
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / divisor;
      const standardDeviation = Math.sqrt(variance);

      // Quartiles
      const q1Index = Math.floor(count * 0.25);
      const q3Index = Math.floor(count * 0.75);
      const q1 = sorted[q1Index];
      const q2 = median;
      const q3 = sorted[q3Index];
      const iqr = q3 - q1;

      // Outliers (using IQR method)
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      const outliers = sorted.filter(n => n < lowerBound || n > upperBound);

      const result: StatisticsResult = {
        data: validData,
        count,
        sum,
        mean,
        median,
        mode,
        range: { min, max, spread },
        variance,
        standardDeviation,
        quartiles: { q1, q2, q3, iqr },
        outliers
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate statistics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

interface LinearRegressionResult {
  slope: number;
  intercept: number;
  correlation: number;
  rSquared: number;
  equation: string;
  predictions?: number[];
  trend: 'increasing' | 'decreasing' | 'neutral';
}

const linearRegressionTool: Tool = {
  name: 'linear_regression',
  description: 'Perform linear regression analysis on paired data points (x, y) to find trend line and correlation',
  inputSchema: {
    type: 'object',
    properties: {
      x: {
        type: 'array',
        items: { type: 'number' },
        description: 'X values (independent variable)'
      },
      y: {
        type: 'array',
        items: { type: 'number' },
        description: 'Y values (dependent variable)'
      },
      predict: {
        type: 'array',
        items: { type: 'number' },
        description: 'X values to predict Y for (optional)'
      }
    },
    required: ['x', 'y']
  },
  handler: async (args) => {
    const { x, y, predict } = args;

    try {
      if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length < 2) {
        throw new Error('X and Y must be arrays of equal length with at least 2 points');
      }

      const n = x.length;

      // Calculate sums
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
      const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

      // Calculate slope and intercept
      const denominator = n * sumXX - sumX * sumX;
      if (denominator === 0) {
        throw new Error('Cannot calculate regression: all X values are the same');
      }

      const slope = (n * sumXY - sumX * sumY) / denominator;
      const intercept = (sumY - slope * sumX) / n;

      // Calculate correlation coefficient
      const numerator = n * sumXY - sumX * sumY;
      const denomX = Math.sqrt(n * sumXX - sumX * sumX);
      const denomY = Math.sqrt(n * sumYY - sumY * sumY);
      const correlation = numerator / (denomX * denomY);
      const rSquared = correlation * correlation;

      // Generate equation
      const sign = intercept >= 0 ? '+' : '-';
      const equation = `y = ${slope.toFixed(4)}x ${sign} ${Math.abs(intercept).toFixed(4)}`;

      // Determine trend
      const trend = Math.abs(slope) < 0.0001 ? 'neutral' : slope > 0 ? 'increasing' : 'decreasing';

      const result: LinearRegressionResult = {
        slope,
        intercept,
        correlation,
        rSquared,
        equation,
        trend
      };

      // Make predictions if requested
      if (predict && Array.isArray(predict)) {
        result.predictions = predict.map(xi => slope * xi + intercept);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to perform linear regression: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

interface CompoundInterestResult {
  principal: number;
  rate: number;
  time: number;
  frequency: number;
  finalAmount: number;
  totalInterest: number;
  effectiveRate: number;
  schedule?: Array<{
    period: number;
    balance: number;
    interest: number;
  }>;
}

const compoundInterestTool: Tool = {
  name: 'calculate_compound_interest',
  description: 'Calculate compound interest with various compounding frequencies and generate amortization schedule',
  inputSchema: {
    type: 'object',
    properties: {
      principal: {
        type: 'number',
        description: 'Initial investment amount (positive number)'
      },
      rate: {
        type: 'number',
        description: 'Annual interest rate as decimal (e.g., 0.05 for 5%)'
      },
      time: {
        type: 'number',
        description: 'Time period in years'
      },
      frequency: {
        type: 'number',
        description: 'Compounding frequency per year (1=annual, 2=semi-annual, 4=quarterly, 12=monthly, 365=daily)',
        default: 12
      },
      showSchedule: {
        type: 'boolean',
        description: 'Include detailed amortization schedule (useful for small time periods)',
        default: false
      }
    },
    required: ['principal', 'rate', 'time']
  },
  handler: async (args) => {
    const { principal, rate, time, frequency = 12, showSchedule = false } = args;

    try {
      if (principal <= 0) throw new Error('Principal must be positive');
      if (rate < 0) throw new Error('Rate cannot be negative');
      if (time <= 0) throw new Error('Time must be positive');
      if (frequency <= 0) throw new Error('Frequency must be positive');

      // Calculate compound interest: A = P(1 + r/n)^(nt)
      const n = frequency;
      const t = time;
      const r = rate;

      const finalAmount = principal * Math.pow(1 + r / n, n * t);
      const totalInterest = finalAmount - principal;

      // Effective annual rate
      const effectiveRate = Math.pow(1 + r / n, n) - 1;

      const result: CompoundInterestResult = {
        principal,
        rate,
        time,
        frequency,
        finalAmount,
        totalInterest,
        effectiveRate
      };

      // Generate schedule if requested (limit to reasonable size)
      if (showSchedule && time * frequency <= 120) {
        const schedule: Array<{ period: number; balance: number; interest: number }> = [];
        let balance = principal;
        const totalPeriods = Math.ceil(time * frequency);

        for (let period = 1; period <= totalPeriods; period++) {
          const interest = balance * (r / n);
          balance += interest;
          schedule.push({
            period,
            balance: Math.round(balance * 100) / 100,
            interest: Math.round(interest * 100) / 100
          });
        }

        result.schedule = schedule;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate compound interest: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

interface CurrencyConvertResult {
  amount: number;
  from: string;
  to: string;
  rate?: number;
  converted?: number;
  note: string;
}

const currencyConvertTool: Tool = {
  name: 'convert_currency',
  description: 'Convert between currencies using approximate exchange rates (note: rates are estimates, not real-time)',
  inputSchema: {
    type: 'object',
    properties: {
      amount: {
        type: 'number',
        description: 'Amount to convert'
      },
      from: {
        type: 'string',
        description: 'Source currency code (e.g., USD, EUR, THB, JPY, GBP)',
        default: 'USD'
      },
      to: {
        type: 'string',
        description: 'Target currency code (e.g., USD, EUR, THB, JPY, GBP)'
      }
    },
    required: ['amount', 'to']
  },
  handler: async (args) => {
    const { amount, from = 'USD', to } = args;

    try {
      // Approximate exchange rates to USD (as of 2024)
      // Note: These are estimates, not real-time rates
      const ratesToUSD: Record<string, number> = {
        USD: 1,
        EUR: 0.92,
        GBP: 0.79,
        JPY: 149.50,
        CHF: 0.88,
        CAD: 1.36,
        AUD: 1.53,
        CNY: 7.24,
        HKD: 7.83,
        SGD: 1.34,
        THB: 32.00,
        MYR: 4.75,
        INR: 83.12,
        KRW: 1320.00,
        PHP: 56.00,
        IDR: 15650.00,
        VND: 24350.00
      };

      const fromUpper = from.toUpperCase();
      const toUpper = to.toUpperCase();

      if (!(fromUpper in ratesToUSD)) {
        return {
          amount,
          from: fromUpper,
          to: toUpper,
          note: `Currency ${fromUpper} not supported. Supported currencies: ${Object.keys(ratesToUSD).join(', ')}`
        };
      }

      if (!(toUpper in ratesToUSD)) {
        return {
          amount,
          from: fromUpper,
          to: toUpper,
          note: `Currency ${toUpper} not supported. Supported currencies: ${Object.keys(ratesToUSD).join(', ')}`
        };
      }

      // Convert: amount in from -> USD -> to
      const amountInUSD = amount / ratesToUSD[fromUpper];
      const rate = ratesToUSD[toUpper] / ratesToUSD[fromUpper];
      const converted = amountInUSD * ratesToUSD[toUpper];

      const result: CurrencyConvertResult = {
        amount,
        from: fromUpper,
        to: toUpper,
        rate,
        converted,
        note: 'Exchange rates are approximate estimates, not real-time rates. For financial transactions, use a real-time API.'
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to convert currency: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

interface LoanCalculatorResult {
  principal: number;
  annualRate: number;
  years: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  schedule?: Array<{
    month: number;
    payment: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

const loanCalculatorTool: Tool = {
  name: 'calculate_loan',
  description: 'Calculate loan monthly payment, total interest, and generate amortization schedule',
  inputSchema: {
    type: 'object',
    properties: {
      principal: {
        type: 'number',
        description: 'Loan amount (principal)'
      },
      annualRate: {
        type: 'number',
        description: 'Annual interest rate as decimal (e.g., 0.05 for 5%)'
      },
      years: {
        type: 'number',
        description: 'Loan term in years'
      },
      showSchedule: {
        type: 'boolean',
        description: 'Include amortization schedule',
        default: false
      }
    },
    required: ['principal', 'annualRate', 'years']
  },
  handler: async (args) => {
    const { principal, annualRate, years, showSchedule = false } = args;

    try {
      if (principal <= 0) throw new Error('Principal must be positive');
      if (annualRate < 0) throw new Error('Rate cannot be negative');
      if (years <= 0) throw new Error('Years must be positive');

      // Calculate monthly payment
      const monthlyRate = annualRate / 12;
      const numberOfPayments = years * 12;

      let monthlyPayment: number;
      if (annualRate === 0) {
        monthlyPayment = principal / numberOfPayments;
      } else {
        monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
      }

      const totalPayment = monthlyPayment * numberOfPayments;
      const totalInterest = totalPayment - principal;

      const result: LoanCalculatorResult = {
        principal,
        annualRate,
        years,
        monthlyPayment,
        totalPayment,
        totalInterest
      };

      // Generate schedule if requested
      if (showSchedule && numberOfPayments <= 360) {
        const schedule: Array<{
          month: number;
          payment: number;
          principal: number;
          interest: number;
          balance: number;
        }> = [];

        let balance = principal;

        for (let month = 1; month <= numberOfPayments; month++) {
          const interestPayment = balance * monthlyRate;
          const principalPayment = monthlyPayment - interestPayment;
          balance -= principalPayment;

          if (balance < 0) balance = 0;

          schedule.push({
            month,
            payment: monthlyPayment,
            principal: principalPayment,
            interest: interestPayment,
            balance: Math.round(balance * 100) / 100
          });
        }

        result.schedule = schedule;
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate loan: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
};

// =====================================================
// EXPORT ALL MATH TOOLS
// =====================================================

export const mathTools: Tool[] = [
  calculateStatisticsTool,
  linearRegressionTool,
  compoundInterestTool,
  currencyConvertTool,
  loanCalculatorTool
];

export {
  calculateStatisticsTool,
  linearRegressionTool,
  compoundInterestTool,
  currencyConvertTool,
  loanCalculatorTool
};
