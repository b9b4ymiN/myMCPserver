#!/usr/bin/env node

import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { stockValuationTools } from './tools/stockValuation.js';
import { fetchStockDataTool, completeValuationTool } from './tools/setWatchApi.js';
import {
  fetchIncomeStatementTool,
  fetchBalanceSheetTool,
  fetchCashFlowStatementTool,
  fetchAllFinancialStatementsTool
} from './tools/financialStatements.js';
import { fetchHistoricalRatiosTool, analyzeHistoricalRatiosTool } from './tools/historicalRatios.js';
import { SERVER_CONFIG } from './config/index.js';

const server = new Server(
  {
    name: 'stock-valuation-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      ...stockValuationTools,
      fetchStockDataTool,
      completeValuationTool,
      fetchIncomeStatementTool,
      fetchBalanceSheetTool,
      fetchCashFlowStatementTool,
      fetchAllFinancialStatementsTool,
      fetchHistoricalRatiosTool,
      analyzeHistoricalRatiosTool
    ].map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  const allTools = [
    ...stockValuationTools,
    fetchStockDataTool,
    completeValuationTool,
    fetchIncomeStatementTool,
    fetchBalanceSheetTool,
    fetchCashFlowStatementTool,
    fetchAllFinancialStatementsTool,
    fetchHistoricalRatiosTool,
    analyzeHistoricalRatiosTool
  ];
  const tool = allTools.find((t) => t.name === name);
  if (!tool) {
    throw new McpError(
      ErrorCode.MethodNotFound,
      `Unknown tool: ${name}`
    );
  }

  try {
    const result = await tool.handler(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
});

// Store all tools for HTTP endpoints
const allTools = [
  ...stockValuationTools,
  fetchStockDataTool,
  completeValuationTool,
  fetchIncomeStatementTool,
  fetchBalanceSheetTool,
  fetchCashFlowStatementTool,
  fetchAllFinancialStatementsTool,
  fetchHistoricalRatiosTool,
  analyzeHistoricalRatiosTool
];

// Create Express app for HTTP endpoints
const app = express();
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'stock-valuation-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// List all tools endpoint
app.get('/tools', (req, res) => {
  const toolsList = allTools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    category: getCategory(tool.name)
  }));

  res.json({
    server: 'stock-valuation-mcp',
    count: toolsList.length,
    tools: toolsList
  });
});

// Get specific tool info
app.get('/tools/:toolName', (req, res) => {
  const tool = allTools.find(t => t.name === req.params.toolName);
  if (!tool) {
    return res.status(404).json({ error: `Tool '${req.params.toolName}' not found` });
  }

  res.json({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    category: getCategory(tool.name),
    example: getToolExample(tool.name)
  });
});

// MCP JSON-RPC endpoint
app.post('/mcp', async (req, res) => {
  try {
    const { jsonrpc, method, params, id } = req.body;

    if (jsonrpc !== '2.0') {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32600, message: 'Invalid Request' },
        id
      });
    }

    switch (method) {
      case 'initialize':
        res.json({
          jsonrpc: '2.0',
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {}
            },
            serverInfo: {
              name: 'stock-valuation-mcp',
              version: '1.0.0'
            }
          },
          id
        });
        break;

      case 'tools/list':
        res.json({
          jsonrpc: '2.0',
          result: {
            tools: allTools.map(tool => ({
              name: tool.name,
              description: tool.description,
              inputSchema: tool.inputSchema
            }))
          },
          id
        });
        break;

      case 'tools/call':
        const { name, arguments: args } = params;
        const tool = allTools.find(t => t.name === name);

        if (!tool) {
          return res.json({
            jsonrpc: '2.0',
            error: { code: -32601, message: `Method not found: ${name}` },
            id
          });
        }

        try {
          const result = await tool.handler(args);
          res.json({
            jsonrpc: '2.0',
            result: {
              content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }]
            },
            id
          });
        } catch (error) {
          res.json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal error',
              data: error instanceof Error ? error.message : String(error)
            },
            id
          });
        }
        break;

      default:
        res.json({
          jsonrpc: '2.0',
          error: { code: -32601, message: `Method not found: ${method}` },
          id
        });
    }
  } catch (error) {
    res.status(500).json({
      jsonrpc: '2.0',
      error: { code: -32603, message: 'Internal error' }
    });
  }
});

// Helper functions
function getCategory(toolName: string): string {
  if (toolName.includes('pe_band') || toolName.includes('ddm') || toolName.includes('dcf')) {
    return 'Valuation';
  }
  if (toolName.includes('fetch_stock') || toolName.includes('complete_valuation')) {
    return 'Data Fetching';
  }
  if (toolName.includes('statement')) {
    return 'Financial Statements';
  }
  if (toolName.includes('historical') || toolName.includes('ratios')) {
    return 'Historical Analysis';
  }
  return 'General';
}

function getToolExample(toolName: string): any {
  switch (toolName) {
    case 'fetch_stock_data':
      return {
        arguments: { symbol: 'ADVANC' }
      };
    case 'calculate_pe_band':
      return {
        arguments: {
          symbol: 'SCB',
          currentPrice: 145.50,
          eps: 8.5,
          historicalPEs: [15.2, 16.8, 17.3, 18.1, 19.5, 18.7, 17.9]
        }
      };
    case 'complete_valuation':
      return {
        arguments: {
          symbol: 'PTT',
          requiredReturn: 0.10,
          growthRate: 0.05,
          discountRate: 0.10
        }
      };
    default:
      return { arguments: {} };
  }
}

async function main() {
  // Check if running with --stdio flag for MCP Client
  const args = process.argv.slice(2);

  if (args.includes('--stdio')) {
    // Run as MCP server for stdio (for Claude Desktop)
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Stock Valuation MCP Server running on stdio');
  } else {
    // Run as HTTP server (for n8n, web requests)
    const port = SERVER_CONFIG.PORT || 2901;
    app.listen(port, () => {
      console.log(`\n🚀 Stock Valuation MCP Server running on HTTP`);
      console.log(`📍 Server URL: http://localhost:${port}`);
      console.log(`📋 Tools List: http://localhost:${port}/tools`);
      console.log(`💚 Health Check: http://localhost:${port}/health`);
      console.log(`🔗 MCP Endpoint: http://localhost:${port}/mcp`);
      console.log(`\n🎯 For n8n MCP Client, use: http://localhost:${port}/mcp`);
      console.log(`\n📌 Available Endpoints:`);
      console.log(`   GET  /health  - Check server status`);
      console.log(`   GET  /tools   - List all available tools`);
      console.log(`   GET  /tools/:name - Get specific tool info`);
      console.log(`   POST /mcp     - MCP JSON-RPC endpoint`);
    });
  }
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});