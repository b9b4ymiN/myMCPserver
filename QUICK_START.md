# Quick Start Guide

## MCP Server for Stock Valuation

### 1. Build and Run Locally

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run the server
npm start
```

### 2. Run in Development Mode

```bash
npm run dev
```

### 3. Test the Tools

Run the test suite:

```bash
npm test
```

### 4. Docker Deployment

```bash
# Build the Docker image
docker build -t stock-valuation-mcp .

# Run with Docker
docker run -p 3000:3000 stock-valuation-mcp
```

### 5. Oracle Cloud Deployment

1. Update the configuration in `scripts/deploy-oracle.sh`
2. Run the deployment script:
   ```bash
   chmod +x scripts/deploy-oracle.sh
   ./scripts/deploy-oracle.sh
   ```

## Available Tools

### 1. PE Band Analysis
```json
{
  "tool": "calculate_pe_band",
  "arguments": {
    "symbol": "AAPL",
    "currentPrice": 150,
    "eps": 5,
    "historicalPEs": [15, 18, 20, 22, 25, 23, 21, 19, 17, 16, 18, 20]
  }
}
```

### 2. DDM Valuation
```json
{
  "tool": "calculate_ddm",
  "arguments": {
    "symbol": "MSFT",
    "currentPrice": 300,
    "dividend": 2.72,
    "requiredReturn": 0.1,
    "growthRate": 0.05
  }
}
```

### 3. DCF Valuation
```json
{
  "tool": "calculate_dcf",
  "arguments": {
    "symbol": "GOOGL",
    "currentPrice": 150,
    "freeCashFlow": 60000000000,
    "sharesOutstanding": 15000000000,
    "growthRate": 0.08,
    "discountRate": 0.1
  }
}
```

### 4. Fetch Thai Stock Data (SET)
```json
{
  "tool": "fetch_stock_data",
  "arguments": {
    "symbol": "ADVANC"
  }
}
```

### 5. Complete Valuation for Thai Stocks
```json
{
  "tool": "complete_valuation",
  "arguments": {
    "symbol": "PTT",
    "requiredReturn": 0.1,
    "growthRate": 0.05,
    "discountRate": 0.1
  }
}
```

### 6. Fetch Financial Statements

**Income Statement:**
```json
{
  "tool": "fetch_income_statement",
  "arguments": {
    "symbol": "AP",
    "period": "TTM"
  }
}
```

**All Statements with Analysis:**
```json
{
  "tool": "fetch_all_financial_statements",
  "arguments": {
    "symbol": "SCB",
    "period": "Quarterly"
  }
}
```

### 7. Historical Analysis

**Fetch Historical Ratios:**
```json
{
  "tool": "fetch_historical_ratios",
  "arguments": {
    "symbol": "AP",
    "period": "TTM"
  }
}
```

**Analyze with Trends and Recommendation:**
```json
{
  "tool": "analyze_historical_ratios",
  "arguments": {
    "symbol": "SCB",
    "period": "Quarterly"
  }
}
```

## Testing with MCP Inspector

### Quick Test
```bash
# Run the test script (Windows)
scripts\test-with-inspector.bat

# Or run manually
npx @modelcontextprotocol/inspector node dist/index.js
```

### Sample Test Cases
Open the generated test-cases.json file for pre-defined test examples.

## Integration with Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "stock-valuation": {
      "command": "node",
      "args": ["C:/Programing/ByAI/myMCPserver/dist/index.js"],
      "env": {}
    }
  }
}
```

Restart Claude Desktop to start using the stock valuation tools!

### For detailed testing instructions, see [MCP_INSPECTOR_TESTING.md](./MCP_INSPECTOR_TESTING.md)