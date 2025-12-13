#!/usr/bin/env node

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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Stock Valuation MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});