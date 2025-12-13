# 📚 n8n API Examples for MCP Server

## Table of Contents
1. [Basic API Calls](#basic-api-calls)
2. [Complete Workflow Examples](#complete-workflow-examples)
3. [Advanced Use Cases](#advanced-use-cases)
4. [Error Handling Examples](#error-handling-examples)
5. [Batch Processing](#batch-processing)
6. [Data Transformation](#data-transformation)

## Basic API Calls

### 1. Fetch Stock Data

#### HTTP Request Node Configuration
```json
{
  "method": "POST",
  "url": "http://YOUR-MCP-SERVER:2901/mcp",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "fetch_stock_data",
      "arguments": {
        "symbol": "ADVANC"
      }
    }
  },
  "options": {
    "timeout": 30000
  }
}
```

#### Expected Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"symbol\":\"ADVANC.BK\",\"currentPrice\":185.5,\"pe\":18.23,\"pbv\":2.45,\"eps\":10.18,\"dividendYield\":3.12,\"roe\":15.6,\"roa\":8.2,\"timestamp\":\"2024-01-20T10:30:00Z\"}"
      }
    ]
  }
}
```

### 2. Calculate PE Band

#### HTTP Request Node Configuration
```json
{
  "method": "POST",
  "url": "http://YOUR-MCP-SERVER:2901/mcp",
  "body": {
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "calculate_pe_band",
      "arguments": {
        "symbol": "SCB",
        "currentPrice": 145.50,
        "eps": 8.5,
        "historicalPEs": [15.2, 16.8, 17.3, 18.1, 19.5, 18.7, 17.9]
      }
    }
  }
}
```

### 3. Complete Valuation

#### HTTP Request Node Configuration
```json
{
  "method": "POST",
  "url": "http://YOUR-MCP-SERVER:2901/mcp",
  "body": {
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "complete_valuation",
      "arguments": {
        "symbol": "PTT",
        "requiredReturn": 0.10,
        "growthRate": 0.05,
        "discountRate": 0.10
      }
    }
  }
}
```

## Complete Workflow Examples

### 1. Daily Market Analysis Workflow

#### Workflow JSON
```json
{
  "name": "Daily Market Analysis",
  "nodes": [
    {
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "cronExpression": "0 9 * * 1-5"
      },
      "position": [200, 300]
    },
    {
      "name": "Stock List",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "return [{\n  json: {\n    stocks: [\n      'ADVANC', 'SCB', 'KBANK', 'PTT', 'AOT',\n      'CPALL', 'MINT', 'TU', 'BTS', 'ERW'\n    ]\n  }\n}];"
      },
      "position": [400, 300]
    },
    {
      "name": "Split In Batches",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 5,
        "options": {}
      },
      "position": [600, 300]
    },
    {
      "name": "Fetch Stock Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://MCP-SERVER:2901/mcp",
        "body": {
          "jsonrpc": "2.0",
          "id": "={{$json.batchIndex}}",
          "method": "tools/call",
          "params": {
            "name": "fetch_stock_data",
            "arguments": {
              "symbol": "={{$json}}"
            }
          }
        }
      },
      "position": [800, 200]
    },
    {
      "name": "Calculate Valuations",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://MCP-SERVER:2901/mcp",
        "body": {
          "jsonrpc": "2.0",
          "id": "={{$json.batchIndex}}_valuation",
          "method": "tools/call",
          "params": {
            "name": "complete_valuation",
            "arguments": {
              "symbol": "={{$json}}",
              "requiredReturn": 0.10,
              "growthRate": 0.05,
              "discountRate": 0.10
            }
          }
        }
      },
      "position": [1000, 200]
    },
    {
      "name": "Process Results",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Process and combine results\nconst stockData = $input.first().json.result.content[0].text;\nconst valuationData = $input.last().json.result.content[0].text;\n\nconst stock = JSON.parse(stockData);\nconst valuation = JSON.parse(valuationData);\n\nconst result = {\n  symbol: stock.symbol,\n  timestamp: new Date().toISOString(),\n  currentPrice: stock.currentPrice,\n  pe: stock.pe,\n  pbv: stock.pbv,\n  dividendYield: stock.dividendYield,\n  roe: stock.roe,\n  valuations: valuation.valuations,\n  consensus: valuation.recommendation\n};\n\nreturn [{ json: result }];"
      },
      "position": [1200, 300]
    },
    {
      "name": "Save to Database",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "insert",
        "table": "daily_analyses",
        "columns": "symbol,timestamp,current_price,pe,pbv,dividend_yield,roe,consensus,recommendation_data",
        "additionalFields": {}
      },
      "position": [1400, 300]
    },
    {
      "name": "Send Email Report",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "analyst@company.com",
        "subject": "Daily Stock Analysis Report - {{new Date().toLocaleDateString()}}",
        "text": "Daily analysis complete. Processed {{$json.stocks.length}} stocks.",
        "attachments": "data:application/json;base64,{{base64($json)}}"
      },
      "position": [1600, 200]
    }
  ],
  "connections": {
    "Cron Trigger": {
      "main": [
        [
          {
            "node": "Stock List",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### 2. Alert on Price Changes

#### Workflow JSON
```json
{
  "name": "Price Alert System",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "price-alert",
        "httpMethod": "POST"
      },
      "position": [200, 300]
    },
    {
      "name": "Validate Input",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Validate webhook input\nconst { symbol, targetPrice, threshold = 0.05 } = $json;\n\nif (!symbol || !targetPrice) {\n  throw new Error('Symbol and targetPrice are required');\n}\n\nreturn [{\n  json: {\n    symbol: symbol.toUpperCase(),\n    targetPrice: parseFloat(targetPrice),\n    threshold: parseFloat(threshold),\n    timestamp: new Date().toISOString()\n  }\n}];"
      },
      "position": [400, 300]
    },
    {
      "name": "Fetch Current Price",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://MCP-SERVER:2901/mcp",
        "body": {
          "jsonrpc": "2.0",
          "id": "{{$json.symbol}}",
          "method": "tools/call",
          "params": {
            "name": "fetch_stock_data",
            "arguments": {
              "symbol": "={{$json.symbol}}"
            }
          }
        }
      },
      "position": [600, 300]
    },
    {
      "name": "Calculate Change",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Calculate price change\nconst targetData = $input.first().json;\nconst stockData = JSON.parse($input.last().json.result.content[0].text);\n\nconst currentPrice = stockData.currentPrice;\nconst targetPrice = targetData.targetPrice;\nconst threshold = targetData.threshold;\n\nconst change = (currentPrice - targetPrice) / targetPrice;\nconst changePercent = (change * 100).toFixed(2);\n\nconst alertData = {\n  symbol: targetData.symbol,\n  currentPrice: currentPrice,\n  targetPrice: targetPrice,\n  changePercent: changePercent,\n  threshold: (threshold * 100).toFixed(2),\n  alertTriggered: Math.abs(change) >= threshold,\n  direction: change > 0 ? 'UP' : 'DOWN',\n  timestamp: new Date().toISOString(),\n  stockInfo: stockData\n};\n\nreturn [{ json: alertData }];"
      },
      "position": [800, 300]
    },
    {
      "name": "Check Alert Condition",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {\n          \"options\": {\n            \"caseSensitive\": true,\n            \"leftValue\": \"\",\n            \"typeValidation\": \"strict\"\n          },\n          \"conditions\": [\n            {\n              \"id\": \"8c72c233-b7a1-428e-88e6-0f6c2c807bc0\",\n              \"leftValue\": \"={{ $json.alertTriggered }}\",\n              \"rightValue\": true,\n              \"operator\": {\n                \"type\": \"boolean\",\n                \"operation\": \"equal\"\n              }\n            }\n          ],\n          \"combinator\": \"and\"\n        }
      },
      "position": [1000, 300]
    },
    {
      "name": "Run Full Valuation",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://MCP-SERVER:2901/mcp",
        "body": {
          "jsonrpc": "2.0",
          "id": "{{$json.symbol}}_valuation",
          "method": "tools/call",
          "params": {
            "name": "complete_valuation",
            "arguments": {
              "symbol": "={{$json.symbol}}",
              "requiredReturn": 0.10,
              "growthRate": 0.05,
              "discountRate": 0.10
            }
          }
        }
      },
      "position": [1200, 200]
    },
    {
      "name": "Create Alert Message",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Create formatted alert message\nconst alertData = $input.first().json;\nconst valuationData = $input.last()?.json ? \n  JSON.parse($input.last().json.result.content[0].text) : null;\n\nconst message = `\n🚨 PRICE ALERT: ${alertData.symbol}\n\n💰 Current Price: ฿${alertData.currentPrice}\n📍 Target Price: ฿${alertData.targetPrice}\n📈 Change: ${alertData.changePercent}%\n🔥 Direction: ${alertData.direction}\n\n${valuationData ? `\n📊 Valuation Summary:\n- PE Band: ${valuationData.peBand?.recommendation}\n- DDM: ${valuationData.ddm?.recommendation}\n- DCF: ${valuationData.dcf?.recommendation}\n- Overall: ${valuationData.recommendation}` : ''}\n\n⏰ Time: ${alertData.timestamp}\n`;\n\nreturn [{\n  json: {\n    ...alertData,\n    message: message,\n    valuation: valuationData\n  }\n}];"
      },
      "position": [1400, 300]
    },
    {
      "name": "Send Slack Notification",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "channel": "#stock-alerts",
        "text": "={{$json.message}}",
        "attachments": [
          {
            "color": "warning",
            "fields": [
              {
                "title": "Symbol",
                "value": "={{$json.symbol}}",
                "short": true
              },
              {
                "title": "Change",
                "value": "={{$json.changePercent}}%",
                "short": true
              }
            ]
          }
        ]
      },
      "position": [1600, 300]
    },
    {
      "name": "Send Email",
      "type": "n8n-nodes-base.emailSend",
      "parameters": {
        "toEmail": "trader@company.com",
        "subject": "Price Alert: {{$json.symbol}} - {{$json.changePercent}}%",
        "text": "={{$json.message}}"
      },
      "position": [1600, 200]
    }
  ]
}
```

## Advanced Use Cases

### 1. Portfolio Rebalancing

```javascript
// Portfolio Rebalancing Code Node
const portfolio = $json.portfolio;
const allocations = $json.allocations;
const currentValue = $input.all().map(item => {
  const data = JSON.parse(item.json.result.content[0].text);
  return data;
});

// Calculate current allocations
const totalValue = currentValue.reduce((sum, stock) => {
  const holding = portfolio.find(p => p.symbol === stock.symbol);
  return sum + (holding.quantity * stock.currentPrice);
}, 0);

const currentAllocations = currentValue.map(stock => {
  const holding = portfolio.find(p => p.symbol === stock.symbol);
  const value = holding.quantity * stock.currentPrice;
  return {
    symbol: stock.symbol,
    currentValue: value,
    currentAllocation: (value / totalValue) * 100,
    targetAllocation: allocations.find(a => a.symbol === stock.symbol).percentage,
    rebalanceAmount: ((allocations.find(a => a.symbol === stock.symbol).percentage / 100) * totalValue) - value
  };
});

return [{ json: { totalValue, currentAllocations } }];
```

### 2. Risk Assessment

```javascript
// Risk Assessment Code Node
const stocks = $input.all();
const riskMetrics = stocks.map(item => {
  const data = JSON.parse(item.json.result.content[0].text);

  // Calculate risk score
  const riskScore = calculateRiskScore(data);

  return {
    symbol: data.symbol,
    price: data.currentPrice,
    pe: data.pe,
    pbv: data.pbv,
    roe: data.roe,
    riskScore: riskScore,
    riskLevel: getRiskLevel(riskScore)
  };
});

function calculateRiskScore(data) {
  let score = 0;

  // PE ratio risk
  if (data.pe > 25) score += 2;
  else if (data.pe > 15) score += 1;

  // PBV ratio risk
  if (data.pbv > 3) score += 2;
  else if (data.pbv > 1.5) score += 1;

  // ROE strength
  if (data.roe < 5) score += 2;
  else if (data.roe < 10) score += 1;

  return Math.min(score, 6);
}

function getRiskLevel(score) {
  if (score <= 1) return 'LOW';
  if (score <= 3) return 'MEDIUM';
  if (score <= 5) return 'HIGH';
  return 'VERY HIGH';
}

return [{ json: { riskAnalysis: riskMetrics } }];
```

## Error Handling Examples

### 1. Retry Failed API Calls

```javascript
// Retry Logic in Function Node
const maxRetries = 3;
const retryDelay = 1000; // 1 second

async function callWithRetry(url, body, retries = 0) {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    return await response.json();
  } catch (error) {
    if (retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return callWithRetry(url, body, retries + 1);
    }
    throw error;
  }
}

// Usage
const result = await callWithRetry(
  'http://MCP-SERVER:2901/mcp',
  $json.requestBody
);

return [{ json: result }];
```

### 2. Graceful Degradation

```javascript
// Partial Data Handling
const symbol = $json.symbol;
const results = {};

try {
  // Try to fetch stock data
  const stockResponse = await fetch('http://MCP-SERVER:2901/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'fetch_stock_data', arguments: { symbol } }
    })
  });

  if (stockResponse.ok) {
    results.stockData = await stockResponse.json();
  } else {
    results.stockData = { error: 'Failed to fetch stock data' };
  }
} catch (error) {
  results.stockData = { error: error.message };
}

// Continue with other calculations even if one fails
try {
  const valuationResponse = await fetch('http://MCP-SERVER:2901/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'calculate_pe_band', arguments: { symbol, ...$json } }
    })
  });

  if (valuationResponse.ok) {
    results.valuation = await valuationResponse.json();
  }
} catch (error) {
  results.valuation = { error: error.message };
}

return [{ json: { symbol, results, partialSuccess: true } }];
```

## Batch Processing

### 1. Batch Stock Analysis

```javascript
// Batch Processing Code
const symbols = $json.symbols; // Array of symbols
const batchSize = 10;
const batches = [];

for (let i = 0; i < symbols.length; i += batchSize) {
  batches.push({
    batchId: Math.floor(i / batchSize),
    symbols: symbols.slice(i, i + batchSize),
    promises: symbols.slice(i, i + batchSize).map(symbol =>
      fetch('http://MCP-SERVER:2901/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: symbol,
          method: 'tools/call',
          params: {
            name: 'fetch_stock_data',
            arguments: { symbol }
          }
        })
      }).then(res => res.json())
    )
  });
}

// Process each batch
const allResults = [];
for (const batch of batches) {
  try {
    const batchResults = await Promise.allSettled(batch.promises);
    const processed = batchResults.map((result, index) => ({
      symbol: batch.symbols[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
    allResults.push(...processed);

    // Add delay between batches
    if (batches.indexOf(batch) < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error(`Batch ${batch.batchId} failed:`, error);
  }
}

return [{ json: { results: allResults, totalProcessed: allResults.length } }];
```

## Data Transformation

### 1. Convert to CSV Format

```javascript
// CSV Export Code
const data = $input.all();
const headers = ['Symbol', 'Price', 'PE', 'PBV', 'ROE', 'Recommendation', 'Timestamp'];
const csvRows = [headers.join(',')];

data.forEach(item => {
  const stockData = JSON.parse(item.json.result.content[0].text);
  const row = [
    stockData.symbol,
    stockData.currentPrice,
    stockData.pe,
    stockData.pbv,
    stockData.roe,
    item.json.recommendation || 'N/A',
    new Date().toISOString()
  ];
  csvRows.push(row.join(','));
});

const csv = csvRows.join('\n');

return [{ json: { csv, filename: `stock_analysis_${Date.now()}.csv` } }];
```

### 2. Generate HTML Report

```javascript
// HTML Report Generator
const analyses = $input.all();
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Stock Analysis Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .buy { color: green; }
    .sell { color: red; }
    .hold { color: orange; }
  </style>
</head>
<body>
  <h1>Stock Analysis Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  <table>
    <thead>
      <tr>
        <th>Symbol</th>
        <th>Price</th>
        <th>PE</th>
        <th>PBV</th>
        <th>ROE</th>
        <th>Recommendation</th>
      </tr>
    </thead>
    <tbody>
      ${analyses.map(item => {
        const data = JSON.parse(item.json.result.content[0].text);
        return `
          <tr>
            <td>${data.symbol}</td>
            <td>฿${data.currentPrice}</td>
            <td>${data.pe}</td>
            <td>${data.pbv}</td>
            <td>${data.roe}%</td>
            <td class="${item.json.recommendation?.toLowerCase()}">${item.json.recommendation || 'N/A'}</td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>
</body>
</html>
`;

return [{ json: { html, filename: `stock_report_${Date.now()}.html` } }];
```

## Integration with External Services

### 1. Send to Google Sheets

```javascript
// Google Sheets Preparation
const analyses = $input.all();
const rows = analyses.map(item => {
  const data = JSON.parse(item.json.result.content[0].text);
  return [
    data.symbol,
    data.currentPrice,
    data.pe,
    data.pbv,
    data.dividendYield,
    data.roe,
    item.json.recommendation,
    new Date().toISOString()
  ];
});

return [{ json: { range: 'Sheet1!A:H', values: rows } }];
```

### 2. Post to Discord Webhook

```javascript
// Discord Webhook Format
const analysis = $json;
const embed = {
  title: `Stock Analysis: ${analysis.symbol}`,
  color: analysis.recommendation === 'Buy' ? 3066993 :
          analysis.recommendation === 'Sell' ? 15158332 : 15105570,
  fields: [
    {
      name: 'Current Price',
      value: `฿${analysis.currentPrice}`,
      inline: true
    },
    {
      name: 'P/E Ratio',
      value: analysis.pe?.toFixed(2) || 'N/A',
      inline: true
    },
    {
      name: 'Recommendation',
      value: analysis.recommendation || 'N/A',
      inline: true
    }
  ],
  timestamp: new Date().toISOString()
};

return [{ json: { embeds: [embed] } }];
```

These examples provide comprehensive templates for integrating the Stock Valuation MCP Server with n8n workflows, covering everything from basic API calls to complex automated trading strategies.