import {
  PortfolioMetrics,
  PositionSizingResult,
  Tool
} from '../types/index.js';

// 1. Position Sizing Calculator
const positionSizingTool: Tool = {
  name: 'calculate_position_size',
  description: 'Calculate optimal position size based on risk management principles',
  inputSchema: {
    type: 'object',
    properties: {
      symbol: { type: 'string', description: 'Stock symbol' },
      portfolioValue: { type: 'number', description: 'Total portfolio value' },
      currentPrice: { type: 'number', description: 'Current stock price' },
      riskPerTrade: { type: 'number', description: 'Risk per trade (% of portfolio)', default: 0.02 },
      stopLossPrice: { type: 'number', description: 'Stop loss price' },
      maxPositionPercent: { type: 'number', description: 'Maximum position size (% of portfolio)', default: 0.20 }
    },
    required: ['symbol', 'portfolioValue', 'currentPrice', 'stopLossPrice']
  },
  handler: async (args) => {
    const {
      symbol,
      portfolioValue,
      currentPrice,
      riskPerTrade = 0.02,
      stopLossPrice,
      maxPositionPercent = 0.20
    } = args;

    try {
      const riskAmount = portfolioValue * riskPerTrade;
      const riskPerShare = currentPrice - stopLossPrice;
      const sharesToBuy = Math.floor(riskAmount / riskPerShare);
      const positionValue = sharesToBuy * currentPrice;
      const positionPercent = positionValue / portfolioValue;

      const maxPositionSize = portfolioValue * maxPositionPercent;
      const finalShares = sharesToBuy * positionPercent > maxPositionPercent
        ? Math.floor(maxPositionSize / currentPrice)
        : sharesToBuy;

      const result: PositionSizingResult = {
        symbol,
        portfolioValue,
        riskPerTrade,
        stopLoss: stopLossPrice,
        maxPositionSize: maxPositionSize / currentPrice,
        sharesToBuy: finalShares,
        positionValue: finalShares * currentPrice,
        riskAmount: (finalShares * currentPrice - finalShares * stopLossPrice)
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to calculate position size: ${error}`);
    }
  }
};

// 2. Portfolio Metrics Calculator
const portfolioMetricsTool: Tool = {
  name: 'calculate_portfolio_metrics',
  description: 'Calculate portfolio performance metrics and risk measures',
  inputSchema: {
    type: 'object',
    properties: {
      positions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            shares: { type: 'number' },
            currentPrice: { type: 'number' },
            costBasis: { type: 'number' },
            beta: { type: 'number' },
            expectedReturn: { type: 'number' }
          }
        }
      },
      riskFreeRate: { type: 'number', description: 'Risk-free rate (decimal)', default: 0.03 },
      marketReturn: { type: 'number', description: 'Expected market return (decimal)', default: 0.08 }
    },
    required: ['positions']
  },
  handler: async (args) => {
    const { positions, riskFreeRate = 0.03, marketReturn = 0.08 } = args;

    try {
      let totalValue = 0;
      let totalCost = 0;
      let weightedBeta = 0;
      let weightedExpectedReturn = 0;
      let worstLoss = 0;
      let portfolioReturns: number[] = [];

      // Calculate weighted metrics
      positions.forEach((pos: any) => {
        const positionValue = pos.shares * pos.currentPrice;
        const positionCost = pos.shares * pos.costBasis;
        const positionReturn = (positionValue - positionCost) / positionCost;

        totalValue += positionValue;
        totalCost += positionCost;
        portfolioReturns.push(positionReturn);

        if (positionReturn < worstLoss) {
          worstLoss = positionReturn;
        }
      });

      // Calculate weights and weighted averages
      positions.forEach((pos: any) => {
        const weight = (pos.shares * pos.currentPrice) / totalValue;
        weightedBeta += weight * pos.beta;
        weightedExpectedReturn += weight * pos.expectedReturn;
      });

      // Simple portfolio volatility (simplified)
      const averageReturn = portfolioReturns.reduce((a, b) => a + b, 0) / portfolioReturns.length;
      const variance = portfolioReturns.reduce((sum, ret) => sum + Math.pow(ret - averageReturn, 2), 0) / portfolioReturns.length;
      const volatility = Math.sqrt(variance);

      // Sharpe Ratio
      const excessReturn = weightedExpectedReturn - riskFreeRate;
      const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

      // Max Drawdown
      const maxDrawdown = Math.abs(worstLoss);

      // Alpha (Jensen's Alpha)
      const alpha = weightedExpectedReturn - (riskFreeRate + weightedBeta * (marketReturn - riskFreeRate));

      // Value at Risk (simplified 95% VaR)
      const var95 = totalValue * (averageReturn - 1.96 * volatility);

      const result: PortfolioMetrics = {
        totalValue,
        expectedReturn: weightedExpectedReturn,
        volatility,
        sharpeRatio,
        maxDrawdown,
        var: var95,
        beta: weightedBeta,
        alpha
      };

      return {
        ...result,
        analysis: `Portfolio performance analysis:
                  Expected Return: ${(weightedExpectedReturn * 100).toFixed(2)}%
                  Volatility: ${(volatility * 100).toFixed(2)}%
                  Sharpe Ratio: ${sharpeRatio.toFixed(2)}
                  Alpha: ${(alpha * 100).toFixed(2)}%
                  Beta: ${weightedBeta.toFixed(2)}`
      };
    } catch (error) {
      throw new Error(`Failed to calculate portfolio metrics: ${error}`);
    }
  }
};

// 3. Rebalancing Recommendation
const rebalancingTool: Tool = {
  name: 'analyze_portfolio_rebalancing',
  description: 'Analyze and provide rebalancing recommendations for portfolio',
  inputSchema: {
    type: 'object',
    properties: {
      positions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            symbol: { type: 'string' },
            currentWeight: { type: 'number' },
            targetWeight: { type: 'number' },
            currentPrice: { type: 'number' }
          }
        }
      },
      portfolioValue: { type: 'number', description: 'Total portfolio value' },
      rebalancingThreshold: { type: 'number', description: 'Rebalancing threshold (%)', default: 0.05 }
    },
    required: ['positions', 'portfolioValue']
  },
  handler: async (args) => {
    const { positions, portfolioValue, rebalancingThreshold = 0.05 } = args;

    try {
      const recommendations: any[] = [];
      let totalDrift = 0;

      positions.forEach((pos: any) => {
        const drift = Math.abs(pos.currentWeight - pos.targetWeight);
        totalDrift += drift;

        if (drift > rebalancingThreshold) {
          const targetValue = portfolioValue * pos.targetWeight;
          const currentValue = portfolioValue * pos.currentWeight;
          const difference = targetValue - currentValue;
          const sharesToTrade = difference / pos.currentPrice;

          recommendations.push({
            symbol: pos.symbol,
            action: difference > 0 ? 'BUY' : 'SELL',
            shares: Math.abs(sharesToTrade),
            currentValue: currentValue.toFixed(2),
            targetValue: targetValue.toFixed(2),
            currentWeight: (pos.currentWeight * 100).toFixed(1),
            targetWeight: (pos.targetWeight * 100).toFixed(1),
            drift: (drift * 100).toFixed(1)
          });
        }
      });

      const needsRebalancing = totalDrift > rebalancingThreshold * positions.length;

      return {
        needsRebalancing,
        totalDrift: (totalDrift * 100).toFixed(2),
        recommendations,
        analysis: needsRebalancing
          ? `Portfolio needs rebalancing. Total drift: ${(totalDrift * 100).toFixed(2)}%`
          : `Portfolio is within target allocations. Total drift: ${(totalDrift * 100).toFixed(2)}%`
      };
    } catch (error) {
      throw new Error(`Failed to analyze rebalancing: ${error}`);
    }
  }
};

// 4. Correlation Analysis
const correlationTool: Tool = {
  name: 'analyze_correlation',
  description: 'Calculate correlation between portfolio positions for diversification analysis',
  inputSchema: {
    type: 'object',
    properties: {
      symbols: { type: 'array', items: { type: 'string' }, description: 'Stock symbols' },
      returns: {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'number' }
        },
        description: 'Historical returns matrix [symbol][period]'
      }
    },
    required: ['symbols', 'returns']
  },
  handler: async (args) => {
    const { symbols, returns } = args;

    try {
      const correlationMatrix: any[][] = [];
      const n = symbols.length;

      for (let i = 0; i < n; i++) {
        correlationMatrix[i] = [];
        for (let j = 0; j < n; j++) {
          correlationMatrix[i][j] = calculateCorrelation(returns[i], returns[j]);
        }
      }

      // Calculate portfolio correlation (average correlation)
      let totalCorrelation = 0;
      let count = 0;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          totalCorrelation += correlationMatrix[i][j];
          count++;
        }
      }
      const averageCorrelation = totalCorrelation / count;

      let diversificationScore: 'Excellent' | 'Good' | 'Average' | 'Poor';
      if (averageCorrelation < 0.3) diversificationScore = 'Excellent';
      else if (averageCorrelation < 0.5) diversificationScore = 'Good';
      else if (averageCorrelation < 0.7) diversificationScore = 'Average';
      else diversificationScore = 'Poor';

      return {
        correlationMatrix,
        averageCorrelation: averageCorrelation.toFixed(3),
        diversificationScore,
        analysis: `Portfolio diversification is ${diversificationScore.toLowerCase()}.
                   Average correlation: ${averageCorrelation.toFixed(3)}.
                   ${averageCorrelation > 0.7 ? 'Consider adding uncorrelated assets.' : 'Good diversification!'}`
      };
    } catch (error) {
      throw new Error(`Failed to analyze correlation: ${error}`);
    }
  }
};

// Helper function for correlation calculation
function calculateCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n === 0) return 0;

  const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let sumXSq = 0;
  let sumYSq = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    sumXSq += diffX * diffX;
    sumYSq += diffY * diffY;
  }

  const denominator = Math.sqrt(sumXSq * sumYSq);
  return denominator === 0 ? 0 : numerator / denominator;
}

// Export all portfolio management tools
export const portfolioManagementTools: Tool[] = [
  positionSizingTool,
  portfolioMetricsTool,
  rebalancingTool,
  correlationTool
];