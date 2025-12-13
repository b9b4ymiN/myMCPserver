# 🏆 Professional Stock Analysis Tools Guide

As a professional stock master, I've created a comprehensive suite of 25 professional-grade tools for stock analysis, valuation, and portfolio management. This guide covers all the tools available in the Stock Valuation MCP Server.

## 📊 Tool Categories

### 1. **Core Valuation Tools** (4 tools)
- PE Band Analysis - Historical PE valuation
- Dividend Discount Model (DDM) - For dividend-paying stocks
- Discounted Cash Flow (DCF) - Intrinsic value calculation
- **Margin of Safety** - Risk-adjusted valuation

### 2. **Advanced Valuation Tools** (5 tools)
- **Graham Number** - Benjamin Graham's defensive stock formula
- **Discounted Earnings** - Earnings projection valuation
- **Asset-Based Valuation** - Book value and liquidation analysis
- **EV/EBITDA Valuation** - Enterprise value comparison
- **Dividend Safety Analysis** - Dividend sustainability assessment

### 3. **Data Fetching** (2 tools)
- Fetch real-time stock data from SET Watch API
- Complete valuation with all models

### 4. **Financial Statements** (4 tools)
- Income Statement analysis
- Balance Sheet analysis
- Cash Flow Statement analysis
- All statements with ratio calculation

### 5. **Financial Analysis** (4 tools)
- **Financial Health Score** - Altman Z-Score & Piotroski F-Score
- **DuPont Analysis** - ROE decomposition
- **Cash Flow Quality** - OCF quality assessment
- **Earnings Quality** - Accruals vs cash earnings

### 6. **Historical Analysis** (2 tools)
- Historical ratios data
- Trend analysis with recommendations

### 7. **Portfolio Management** (4 tools)
- **Position Sizing Calculator** - Risk-based position sizes
- **Portfolio Metrics** - Performance and risk metrics
- **Rebalancing Analysis** - Portfolio rebalancing recommendations
- **Correlation Analysis** - Diversification assessment

## 🛡️ Essential Professional Tools Every Investor Should Use

### 1. Graham Number Calculator
**Purpose**: Calculate Benjamin Graham's intrinsic value formula for defensive stocks

**Formula**: √(22.5 × EPS × Book Value per Share)

**When to Use**:
- For stable, dividend-paying companies
- When screening for defensive stocks
- As a quick sanity check on valuations

**Example**:
```json
{
  "tool": "calculate_graham_number",
  "arguments": {
    "symbol": "SCB",
    "eps": 14.57,
    "bookValue": 157.32,
    "currentPrice": 145.50
  }
}
```

**Interpretation**:
- Buy if price is at least 30% below Graham Number
- Hold if within 30% of Graham Number
- Sell if above Graham Number

### 2. Financial Health Score (Altman Z-Score + Piotroski F-Score)
**Purpose**: Comprehensive assessment of company's financial health and bankruptcy risk

**Components**:
- Altman Z-Score (5 factors for bankruptcy prediction)
- Piotroski F-Score (9-point fundamental strength indicator)

**When to Use**:
- Before any major investment
- For risk assessment
- During due diligence

### 3. Margin of Safety Calculator
**Purpose**: Calculate the difference between intrinsic value and current price

**Key Features**:
- Risk adjustment factors (0.8-1.5)
- 5-level recommendation system
- Value investing principles check

**Professional Usage**:
```json
{
  "tool": "calculate_margin_of_safety",
  "arguments": {
    "symbol": "SCB",
    "currentPrice": 145.50,
    "intrinsicValue": 220.00,
    "riskAdjustment": 0.9,
    "valuationMethod": "Multiple Methods Average"
  }
}
```

### 4. Position Sizing Calculator
**Purpose**: Calculate optimal position size based on risk management

**Formula**: Risk Amount ÷ Risk Per Share = Shares to Buy

**Risk Management Rules**:
- Never risk more than 2% of portfolio per trade
- Always use stop-loss orders
- Position size based on volatility

### 5. Cash Flow Quality Analysis
**Purpose**: Assess the quality of earnings by comparing cash flow to net income

**Key Metrics**:
- OCF to Net Income ratio
- Free Cash Flow to Operating Cash Flow
- Growth consistency

## 📈 Advanced Analysis Workflows

### Complete Investment Workflow
```bash
1. Fetch Stock Data
2. Calculate Financial Health Score (eliminate weak companies)
3. Run Multiple Valuations (PE Band, DCF, Graham Number, DDM)
4. Calculate Margin of Safety
5. Analyze Historical Ratios
6. Determine Position Size
7. Execute with stop-loss
```

### Portfolio Management Workflow
```bash
1. Calculate Portfolio Metrics (current state)
2. Analyze Correlation (diversification check)
3. Run Rebalancing Analysis
4. Adjust positions based on risk
5. Monitor Financial Health of holdings
```

### Risk Management Workflow
```bash
1. Calculate Altman Z-Score for all holdings
2. Analyze Cash Flow Quality
3. Check Dividend Safety for dividend stocks
4. Correlation Analysis for concentration risk
5. Position Sizing adjustments
```

## 🎯 Professional Tips

### For Value Investors
1. **Always use Margin of Safety**: Minimum 30% required
2. **Combine Multiple Valuations**: Don't rely on one method
3. **Focus on Financial Health**: Avoid companies with Z-Score < 1.8
4. **Check Cash Flow Quality**: OCF should be close to or exceed earnings

### For Growth Investors
1. **Use Discounted Earnings**: For growth projection
2. **Monitor Piotroski Score**: Should be 6-9
3. **Check Asset Turnover**: Improving trend is positive
4. **Validate Revenue Quality**: Look for consistent growth

### For Dividend Investors
1. **Dividend Safety Score**: Must be 70+
2. **Payout Ratio**: Should be < 60%
3. **Free Cash Flow Coverage**: Critical for sustainability
4. **Yield on Cost**: Focus on growing yield

### For Portfolio Managers
1. **Position Sizing**: Max 2% risk per position
2. **Correlation Analysis**: Target average correlation < 0.5
3. **Rebalancing**: Quarterly or when drift > 5%
4. **Risk Metrics**: Sharpe ratio > 1, max drawdown < 20%

## ⚠️ Common Mistakes to Avoid

1. **Ignoring Risk Adjustment**: Always adjust intrinsic value for company risk
2. **Single Valuation Method**: Use at least 3 methods
3. **No Stop-Loss**: Always define exit before entry
4. **Overconcentration**: No single stock > 20% of portfolio
5. **Ignoring Financial Health**: Z-Score below 1.8 is dangerous

## 📚 Best Practices

### Research Process
1. Start with Financial Health Score (eliminate risky stocks)
2. Use at least 3 valuation methods
3. Calculate comprehensive margin of safety
4. Check cash flow and earnings quality
5. Analyze historical trends
6. Determine appropriate position size

### Portfolio Construction
1. Diversify across sectors and styles
2. Maintain target allocations
3. Regular rebalancing
4. Risk-adjusted position sizing
5. Continuous monitoring

### Risk Management
1. Predefined exit strategies
2. Stop-loss orders on all positions
3. Maximum portfolio drawdown limits
4. Correlation monitoring
5. Regular health checks

## 🚀 Advanced Features

### Custom Valuation Blends
Create weighted averages of different valuation methods:
- Conservative: Higher weight to book value
- Aggressive: Higher weight to growth projections
- Balanced: Equal weights to all methods

### Risk Scenarios
Test investments under different scenarios:
- Economic recession
- Interest rate changes
- Sector-specific events
- Market volatility

### Tax Optimization
Consider tax implications:
- Long-term vs short-term gains
- Dividend tax treatment
- Loss harvesting strategies

## 📱 Quick Reference

### Key Thresholds
- **Altman Z-Score**: < 1.8 = High risk
- **Piotroski F-Score**: < 3 = Weak fundamentals
- **OCF/Net Income**: < 0.8 = Poor quality
- **Margin of Safety**: < 20% = No buy
- **Sharpe Ratio**: < 1 = Poor risk-adjusted return

### Golden Rules
1. Never buy without margin of safety
2. Always know your exit before entry
3. Diversify across uncorrelated assets
4. Continuous learning and adaptation
5. Emotional discipline over market noise

This professional toolkit provides everything needed for sophisticated stock analysis, portfolio management, and risk management. Use these tools to make informed, data-driven investment decisions.