// Custom n8n Node for Stock Valuation MCP Server
const { IExecuteFunctions } = require('n8n-core');

class StockValuationMCP {
  constructor() {
    this.description = {
      displayName: 'Stock Valuation MCP',
      name: 'stockValuationMCP',
      group: ['transform'],
      version: 1,
      description: 'Connect to Stock Valuation MCP Server',
      defaults: {
        name: 'Stock Valuation MCP',
      },
      inputs: ['main'],
      outputs: ['main'],
      credentials: [],
      properties: [
        {
          displayName: 'Server URL',
          name: 'serverUrl',
          type: 'string',
          default: 'http://localhost:2901/mcp',
          required: true,
          description: 'URL of the MCP server',
        },
        {
          displayName: 'Tool',
          name: 'tool',
          type: 'options',
          options: [
            { name: 'Fetch Stock Data', value: 'fetch_stock_data' },
            { name: 'Calculate PE Band', value: 'calculate_pe_band' },
            { name: 'Calculate DDM', value: 'calculate_ddm' },
            { name: 'Calculate DCF', value: 'calculate_dcf' },
            { name: 'Complete Valuation', value: 'complete_valuation' },
          ],
          default: 'fetch_stock_data',
          required: true,
        },
        {
          displayName: 'Symbol',
          name: 'symbol',
          type: 'string',
          default: '',
          required: true,
          displayOptions: {
            show: {
              tool: ['fetch_stock_data', 'complete_valuation'],
            },
          },
        },
        {
          displayName: 'Current Price',
          name: 'currentPrice',
          type: 'number',
          default: 0,
          required: true,
          displayOptions: {
            show: {
              tool: ['calculate_pe_band', 'calculate_ddm', 'calculate_dcf'],
            },
          },
        },
        {
          displayName: 'EPS',
          name: 'eps',
          type: 'number',
          default: 0,
          displayOptions: {
            show: {
              tool: ['calculate_pe_band'],
            },
          },
        },
        {
          displayName: 'Historical PEs',
          name: 'historicalPEs',
          type: 'string',
          default: '15, 16, 17, 18, 19',
          displayOptions: {
            show: {
              tool: ['calculate_pe_band'],
            },
          },
        },
      ],
    };
  }

  async execute() {
    const items = this.getInputData();
    const returnData = [];

    for (let i = 0; i < items.length; i++) {
      const serverUrl = this.getNodeParameter('serverUrl', i);
      const tool = this.getNodeParameter('tool', i);

      // Build arguments based on tool
      let arguments = {};

      switch (tool) {
        case 'fetch_stock_data':
        case 'complete_valuation':
          arguments.symbol = this.getNodeParameter('symbol', i);
          break;
        case 'calculate_pe_band':
          arguments = {
            symbol: this.getNodeParameter('symbol', i),
            currentPrice: this.getNodeParameter('currentPrice', i),
            eps: this.getNodeParameter('eps', i),
            historicalPEs: this.getNodeParameter('historicalPEs', i).split(',').map(pe => parseFloat(pe.trim())),
          };
          break;
        // Add other tools as needed
      }

      // Make request to MCP server
      const response = await this.helpers.request({
        method: 'POST',
        url: serverUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          jsonrpc: '2.0',
          id: i + 1,
          method: 'tools/call',
          params: {
            name: tool,
            arguments: arguments,
          },
        },
        json: true,
      });

      // Parse response
      if (response.result && response.result.content) {
        const content = response.result.content[0];
        if (content.type === 'text') {
          const data = JSON.parse(content.text);
          returnData.push({
            json: data,
          });
        }
      }
    }

    return returnData;
  }
}

module.exports = StockValuationMCP;