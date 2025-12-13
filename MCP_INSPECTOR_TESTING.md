# MCP Inspector Testing Guide

This guide will help you test the Stock Valuation MCP Server using MCP Inspector, a command-line tool for interacting with MCP servers.

## Prerequisites

- Node.js 18+ installed
- MCP Inspector installed: `npm install -g @modelcontextprotocol/inspector`

## Running the Server with MCP Inspector

### 1. Start the MCP Inspector

```bash
# Navigate to your project directory
cd C:\Programing\ByAI\myMCPserver

# Start MCP Inspector with your server
npx @modelcontextprotocol/inspector node dist/index.js
```

Or if you have the inspector installed globally:

```bash
mcp-inspector node dist/index.js
```

This will start the inspector and open a browser interface, but you can also interact with it via the command line.

### 2. Interactive Testing in Browser

The inspector will open a web interface where you can:

- View available tools
- Test individual tools with parameters
- See real-time results
- Inspect tool schemas and responses

## Testing Scenarios

### Scenario 1: PE Band Analysis

In the inspector interface or CLI:

```json
{
  "tool": "calculate_pe_band",
  "arguments": {
    "symbol": "AAPL",
    "currentPrice": 170.50,
    "eps": 6.05,
    "historicalPEs": [25, 28, 30, 22, 20, 24, 26, 29, 31, 27, 23, 25]
  }
}
```

**Expected Output**: The tool will return:
- Current PE ratio (28.10)
- Historical min/max/average PE
- Fair value range
- Recommendation (Undervalued/Fairly Valued/Overvalued)

### Scenario 2: DDM Valuation (Dividend-Paying Stock)

```json
{
  "tool": "calculate_ddm",
  "arguments": {
    "symbol": "MSFT",
    "currentPrice": 378.85,
    "dividend": 2.72,
    "requiredReturn": 0.10,
    "growthRate": 0.05
  }
}
```

**Expected Output**:
- Intrinsic value: $57.12
- Margin of safety: 563.3% (significantly undervalued)
- Recommendation: Buy

### Scenario 3: DDM Valuation (Growth Stock with No Dividend)

```json
{
  "tool": "calculate_ddm",
  "arguments": {
    "symbol": "GOOGL",
    "currentPrice": 141.80,
    "dividend": 0,
    "requiredReturn": 0.10,
    "growthRate": 0.08
  }
}
```

**Expected Output**: Intrinsic value of $0 (since no dividends)

### Scenario 4: DCF Valuation

```json
{
  "tool": "calculate_dcf",
  "arguments": {
    "symbol": "NVDA",
    "currentPrice": 495.22,
    "freeCashFlow": 27000000000,
    "sharesOutstanding": 2470000000,
    "growthRate": 0.15,
    "discountRate": 0.10,
    "years": 5
  }
}
```

**Expected Output**:
- 5-year cash flow projections
- Present values of each projection
- Terminal value calculation
- Intrinsic value per share
- Recommendation based on margin of safety

### Scenario 5: DCF with Custom Terminal Growth

```json
{
  "tool": "calculate_dcf",
  "arguments": {
    "symbol": "JNJ",
    "currentPrice": 157.35,
    "freeCashFlow": 18000000000,
    "sharesOutstanding": 2700000000,
    "growthRate": 0.04,
    "discountRate": 0.08,
    "terminalGrowthRate": 0.025,
    "years": 10
  }
}
```

### Scenario 6: Fetch Thai Stock Data from SET Watch API

```json
{
  "tool": "fetch_stock_data",
  "arguments": {
    "symbol": "ADVANC"
  }
}
```

### Scenario 7: Complete Valuation for Thai Stock

```json
{
  "tool": "complete_valuation",
  "arguments": {
    "symbol": "PTT",
    "requiredReturn": 0.1,
    "growthRate": 0.05,
    "discountRate": 0.1,
    "years": 5
  }
}
```

### Scenario 8: Fetch Income Statement

```json
{
  "tool": "fetch_income_statement",
  "arguments": {
    "symbol": "AP",
    "period": "TTM"
  }
}
```

### Scenario 9: Fetch Balance Sheet

```json
{
  "tool": "fetch_balance_sheet",
  "arguments": {
    "symbol": "AP",
    "period": "TTM"
  }
}
```

### Scenario 10: Fetch Cash Flow Statement

```json
{
  "tool": "fetch_cash_flow_statement",
  "arguments": {
    "symbol": "AP",
    "period": "TTM"
  }
}
```

### Scenario 11: Fetch All Financial Statements with Analysis

```json
{
  "tool": "fetch_all_financial_statements",
  "arguments": {
    "symbol": "SCB",
    "period": "Quarterly"
  }
}
```

### Scenario 12: Fetch Historical Ratios

```json
{
  "tool": "fetch_historical_ratios",
  "arguments": {
    "symbol": "AP",
    "period": "TTM"
  }
}
```

### Scenario 13: Analyze Historical Ratios with Trends

```json
{
  "tool": "analyze_historical_ratios",
  "arguments": {
    "symbol": "SCB",
    "period": "Quarterly"
  }
}
```

**Expected Output**: Historical ratios with trend analysis and investment recommendation

## Command Line Testing with MCP Inspector

### Using CLI Commands

You can also test directly from the command line:

```bash
# List available tools
echo '{"method": "tools/list"}' | npx @modelcontextprotocol/inspector node dist/index.js

# Call PE Band tool
echo '{"method": "tools/call", "params": {"name": "calculate_pe_band", "arguments": {"symbol": "AAPL", "currentPrice": 170.5, "eps": 6.05}}}' | npx @modelcontextprotocol/inspector node dist/index.js

# Call DDM tool
echo '{"method": "tools/call", "params": {"name": "calculate_ddm", "arguments": {"symbol": "MSFT", "currentPrice": 378.85, "dividend": 2.72, "requiredReturn": 0.1, "growthRate": 0.05}}}' | npx @modelcontextprotocol/inspector node dist/index.js

# Call DCF tool
echo '{"method": "tools/call", "params": {"name": "calculate_dcf", "arguments": {"symbol": "GOOGL", "currentPrice": 141.8, "freeCashFlow": 60000000000, "sharesOutstanding": 15000000000, "growthRate": 0.08, "discountRate": 0.1}}}' | npx @modelcontextprotocol/inspector node dist/index.js
```

## Testing Edge Cases

### 1. Invalid PE (Zero EPS)

```json
{
  "tool": "calculate_pe_band",
  "arguments": {
    "symbol": "TEST",
    "currentPrice": 100,
    "eps": 0,
    "historicalPEs": [15, 20, 25]
  }
}
```

### 2. DDM with Invalid Parameters

```json
{
  "tool": "calculate_ddm",
  "arguments": {
    "symbol": "TEST",
    "currentPrice": 100,
    "dividend": 5,
    "requiredReturn": 0.05,
    "growthRate": 0.08
  }
}
```

**Expected Error**: "Required return must be greater than growth rate"

### 3. DCF with Negative Free Cash Flow

```json
{
  "tool": "calculate_dcf",
  "arguments": {
    "symbol": "TEST",
    "currentPrice": 50,
    "freeCashFlow": -1000000,
    "sharesOutstanding": 1000000,
    "growthRate": 0.05,
    "discountRate": 0.10
  }
}
```

**Expected Error**: "Free cash flow must be positive"

## Performance Testing

### Large Historical PE Array

```json
{
  "tool": "calculate_pe_band",
  "arguments": {
    "symbol": "SPY",
    "currentPrice": 450,
    "eps": 20,
    "historicalPEs": [15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100]
  }
}
```

### Extended DCF Projection (20 years)

```json
{
  "tool": "calculate_dcf",
  "arguments": {
    "symbol": "BRK.A",
    "currentPrice": 540000,
    "freeCashFlow": 100000000000,
    "sharesOutstanding": 1500000,
    "growthRate": 0.06,
    "discountRate": 0.08,
    "years": 20
  }
}
```

## Integration Testing with Claude Desktop

After verifying with MCP Inspector, add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "stock-valuation": {
      "command": "node",
      "args": ["C:/Programing/ByAI/myMCPserver/dist/index.js"]
    }
  }
}
```

Then test with Claude Desktop by asking questions like:
- "Analyze Apple's PE band with current price $170.50, EPS of $6.05, and historical PEs of [25,28,30,22,20,24]"
- "Calculate Microsoft's intrinsic value using DDM with current price $378.85, dividend $2.72, required return 10%, and growth rate 5%"
- "Run a DCF analysis on Google with current price $141.80, free cash flow of $60B, 15B shares, 8% growth, and 10% discount rate"

## Troubleshooting

### Common Issues

1. **Module not found errors**:
   - Ensure you've built the project: `npm run build`
   - Check that `dist/index.js` exists

2. **Tool execution errors**:
   - Verify all required parameters are provided
   - Check parameter types (numbers vs strings)
   - Ensure growth rates and returns are in decimal (0.05 for 5%)

3. **Inspector not starting**:
   - Check Node.js version (18+)
   - Ensure all dependencies installed: `npm install`
   - Try reinstalling inspector: `npm install -g @modelcontextprotocol/inspector`

### Debug Mode

Run with verbose logging:

```bash
DEBUG=mcp:* npx @modelcontextprotocol/inspector node dist/index.js
```

This will show detailed logs of all MCP protocol communications.