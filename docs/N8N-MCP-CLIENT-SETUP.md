# 🔌 Using MCP Server with n8n MCP Client Node

This guide explains how to use the Stock Valuation MCP Server with n8n's built-in MCP Client node.

## Prerequisites

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build the project**
   ```bash
   npm run build
   ```

3. **Start the MCP Server**
   ```bash
   # Option 1: Start with Docker
   docker run -d --name stock-valuation-mcp \
     -p 2901:2901 \
     -e SET_WATCH_API_HOST=https://set-watch-api.vercel.app \
     stock-valuation-mcp

   # Option 2: Start locally
   npm start
   ```

## Available Endpoints

### 1. Health Check
```bash
GET http://localhost:2901/health
```

Response:
```json
{
  "status": "healthy",
  "server": "stock-valuation-mcp",
  "version": "1.0.0",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### 2. List All Tools
```bash
GET http://localhost:2901/tools
```

Response:
```json
{
  "server": "stock-valuation-mcp",
  "count": 10,
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
    },
    ...
  ]
}
```

### 3. Get Specific Tool Info
```bash
GET http://localhost:2901/tools/calculate_pe_band
```

Response:
```json
{
  "name": "calculate_pe_band",
  "description": "Calculate PE band valuation with historical data",
  "inputSchema": {
    "type": "object",
    "properties": {
      "symbol": { "type": "string" },
      "currentPrice": { "type": "number" },
      "eps": { "type": "number" },
      "historicalPEs": { "type": "array" }
    }
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

## n8n MCP Client Setup

### Method 1: Using n8n MCP Client Node (Recommended)

1. **Add MCP Client Node** to your n8n workflow

2. **Configure the node**:
   - **Server URL**: `http://localhost:2901/mcp`
   - **Transport**: `HTTP`
   - **Protocol Version**: `2024-11-05` (or leave default)

3. **Select Tool**:
   - Choose from the dropdown list of available tools
   - Or enter tool name manually

4. **Provide Arguments**:
   - Enter required parameters based on the selected tool
   - Use n8n expressions for dynamic values

### Method 2: Using HTTP Request Node

1. **Add HTTP Request Node**

2. **Configure**:
   - Method: `POST`
   - URL: `http://localhost:2901/mcp`
   - Headers:
     - Content-Type: application/json

3. **Body** (JSON):
   ```json
   {
     "jsonrpc": "2.0",
     "id": 1,
     "method": "tools/call",
     "params": {
       "name": "fetch_stock_data",
       "arguments": {
         "symbol": "ADVANC"
       }
     }
   }
   ```

## Example Workflows

### 1. Single Stock Analysis

```
Manual Trigger → MCP Client (fetch_stock_data) → Code (Parse Response) → Display Results
```

**MCP Client Configuration**:
- Tool: `fetch_stock_data`
- Arguments: `{"symbol": "ADVANC"}`

### 2. Complete Stock Valuation

```
Manual Trigger → MCP Client (complete_valuation) → Code (Parse Results) → Slack Notification
```

**MCP Client Configuration**:
- Tool: `complete_valuation`
- Arguments:
  ```json
  {
    "symbol": "PTT",
    "requiredReturn": 0.10,
    "growthRate": 0.05,
    "discountRate": 0.10
  }
  ```

### 3. Batch Stock Analysis

```
Cron Trigger → Code (Generate Symbols) → Split In Batches → MCP Client (fetch_stock_data) → Google Sheets → Email Report
```

## Tool Reference

### Valuation Tools

| Tool | Description | Required Parameters |
|------|-------------|---------------------|
| `calculate_pe_band` | PE band valuation | symbol, currentPrice, eps |
| `calculate_ddm` | Dividend Discount Model | symbol, currentPrice, dividend |
| `calculate_dcf` | Discounted Cash Flow | symbol, currentPrice, freeCashFlow, sharesOutstanding |
| `complete_valuation` | Run all valuations | symbol, requiredReturn, growthRate, discountRate |

### Data Fetching Tools

| Tool | Description | Required Parameters |
|------|-------------|---------------------|
| `fetch_stock_data` | Get current stock data | symbol |
| `fetch_income_statement` | Get income statement | symbol, period (optional) |
| `fetch_balance_sheet` | Get balance sheet | symbol, period (optional) |
| `fetch_cash_flow_statement` | Get cash flow | symbol, period (optional) |
| `fetch_all_financial_statements` | Get all statements | symbol, period (optional) |

### Historical Analysis Tools

| Tool | Description | Required Parameters |
|------|-------------|---------------------|
| `fetch_historical_ratios` | Get historical ratios | symbol |
| `analyze_historical_ratios` | Analyze trends | symbol, period (optional) |

## Testing the Connection

1. **Test with curl**:
   ```bash
   curl -X POST http://localhost:2901/mcp \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/list"
     }'
   ```

2. **Test specific tool**:
   ```bash
   curl -X POST http://localhost:2901/mcp \
     -H "Content-Type: application/json" \
     -d '{
       "jsonrpc": "2.0",
       "id": 2,
       "method": "tools/call",
       "params": {
         "name": "fetch_stock_data",
         "arguments": {
           "symbol": "ADVANC"
         }
       }
     }'
   ```

## Troubleshooting

### Issue: MCP Client can't connect
- Verify server is running: `curl http://localhost:2901/health`
- Check port 2901 is not blocked by firewall
- Ensure using HTTP not HTTPS in local testing

### Issue: Tool not found
- Check spelling of tool name
- Verify tool exists: `curl http://localhost:2901/tools`
- Check if all required parameters are provided

### Issue: Invalid response format
- Ensure proper JSON format in request body
- Include all required fields: jsonrpc, id, method, params

## Best Practices

1. **Use the `/tools` endpoint** to discover available tools
2. **Check tool examples** using `/tools/:toolName` endpoint
3. **Handle errors gracefully** in your workflows
4. **Use n8n expressions** for dynamic parameter values
5. **Test with curl first** before creating complex workflows

## Example n8n Workflow JSON

```json
{
  "name": "Stock Analysis",
  "nodes": [
    {
      "name": "MCP Client",
      "type": "n8n-nodes-base.mcpClient",
      "parameters": {
        "serverUrl": "http://localhost:2901/mcp",
        "toolName": "fetch_stock_data",
        "toolArguments": {
          "symbol": "ADVANC"
        }
      },
      "position": [240, 300]
    }
  ]
}
```

## Production Deployment

For production use with n8n:

1. **Deploy MCP Server** on cloud (Oracle Cloud, AWS, etc.)
2. **Use HTTPS** with proper SSL certificates
3. **Set up authentication** if needed
4. **Configure rate limiting** to prevent abuse
5. **Monitor server health** with the `/health` endpoint

## Support

For issues:
1. Check the server logs: `docker logs stock-valuation-mcp`
2. Test with curl to isolate the problem
3. Check n8n execution logs
4. Review tool documentation at `/tools` endpoint