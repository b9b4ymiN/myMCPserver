# 🌐 MCP Server HTTP Endpoints Guide

## Overview

The Stock Valuation MCP Server now supports HTTP endpoints, making it compatible with n8n's MCP Client node and other HTTP-based integrations.

## Server Modes

### 1. HTTP Mode (Default for n8n)
```bash
npm start
# or
docker run -p 2901:2901 stock-valuation-mcp
```

### 2. Stdio Mode (for Claude Desktop)
```bash
npm run start:stdio
# or
node dist/index.js --stdio
```

## HTTP Endpoints

### 1. Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "server": "stock-valuation-mcp",
  "version": "1.0.0",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### 2. List All Tools
```http
GET /tools
```

**Response:**
```json
{
  "server": "stock-valuation-mcp",
  "count": 11,
  "tools": [
    {
      "name": "fetch_stock_data",
      "description": "Fetch real-time stock data from SET Watch API",
      "inputSchema": {
        "type": "object",
        "properties": {
          "symbol": { "type": "string" }
        }
      },
      "category": "Data Fetching"
    }
    // ... more tools
  ]
}
```

### 3. Get Specific Tool Info
```http
GET /tools/:toolName
```

**Example:**
```http
GET /tools/calculate_pe_band
```

**Response:**
```json
{
  "name": "calculate_pe_band",
  "description": "Calculate PE band valuation for a stock",
  "inputSchema": {
    "type": "object",
    "properties": {
      "symbol": { "type": "string" },
      "currentPrice": { "type": "number" },
      "eps": { "type": "number" },
      "historicalPEs": { "type": "array", "items": { "type": "number" } }
    },
    "required": ["symbol", "currentPrice", "eps"]
  },
  "category": "Valuation",
  "example": {
    "arguments": {
      "symbol": "SCB",
      "currentPrice": 145.50,
      "eps": 8.5,
      "historicalPEs": [15.2, 16.8, 17.3, 18.1, 19.5, 18.7, 17.9]
    }
  }
}
```

### 4. MCP JSON-RPC Endpoint
```http
POST /mcp
```

**Request Body:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      // Array of tools
    ]
  },
  "id": 1
}
```

#### Calling a Tool
```http
POST /mcp
```

**Request Body:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "fetch_stock_data",
    "arguments": {
      "symbol": "ADVANC"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"symbol\":\"ADVANC.BK\",\"currentPrice\":185.5,\"pe\":18.23,\"pbv\":2.45,\"eps\":10.18,\"dividendYield\":3.12,\"roe\":15.6,\"roa\":8.2,\"timestamp\":\"2024-01-20T10:30:00Z\"}"
      }
    ]
  },
  "id": 2
}
```

## Available Tools by Category

### Valuation Tools
- `calculate_pe_band` - PE band valuation
- `calculate_ddm` - Dividend Discount Model
- `calculate_dcf` - Discounted Cash Flow

### Data Fetching
- `fetch_stock_data` - Get current stock data
- `complete_valuation` - Run all valuations

### Financial Statements
- `fetch_income_statement` - Income statement data
- `fetch_balance_sheet` - Balance sheet data
- `fetch_cash_flow_statement` - Cash flow data
- `fetch_all_financial_statements` - All statements

### Historical Analysis
- `fetch_historical_ratios` - Historical PE, PBV, ROE, ROA, ROIC
- `analyze_historical_ratios` - Trend analysis

## n8n Integration

### Using MCP Client Node

1. **Server URL**: `http://localhost:2901/mcp`
2. **Tool Selection**: Choose from dropdown or manual entry
3. **Arguments**: Provide required parameters

### Using HTTP Request Node

```json
{
  "method": "POST",
  "url": "http://localhost:2901/mcp",
  "headers": { "Content-Type": "application/json" },
  "body": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "fetch_stock_data",
      "arguments": { "symbol": "ADVANC" }
    }
  }
}
```

## Testing with curl

```bash
# Health check
curl http://localhost:2901/health

# List tools
curl http://localhost:2901/tools

# Get specific tool
curl http://localhost:2901/tools/fetch_stock_data

# Call tool via MCP
curl -X POST http://localhost:2901/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "fetch_stock_data",
      "arguments": { "symbol": "ADVANC" }
    }
  }'
```

## Docker Deployment

```bash
# Build and run
docker build -t stock-valuation-mcp .
docker run -d --name stock-valuation-mcp -p 2901:2901 \
  -e SET_WATCH_API_HOST=https://set-watch-api.vercel.app \
  stock-valuation-mcp

# Check logs
docker logs stock-valuation-mcp
```

## Common Errors

### 502 Bad Gateway
- Server not running: Start with `npm start` or Docker
- Wrong port: Use 2901 not 3000
- Firewall blocked: Check firewall settings

### Tool Not Found
- Check spelling: Use exact tool name
- List tools: `curl http://localhost:2901/tools`

### Invalid Parameters
- Check required fields: `curl http://localhost:2901/tools/:name`
- Validate data types: Ensure numbers, not strings

## Best Practices

1. **Always test with curl** before n8n integration
2. **Use /tools endpoint** to discover available tools
3. **Handle JSON parsing** of response text field
4. **Check health endpoint** to verify server status
5. **Use proper error handling** in workflows