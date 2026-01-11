// =====================================================
// TOOL DESCRIPTOR UTILITY
// =====================================================
// Helper functions for creating enhanced tool descriptions

import { EnhancedToolDescription, ToolInputDescription, ToolOutputDescription, ToolCategory } from '../types/tool-descriptions.js';

/**
 * Create an enhanced tool description with all required fields
 */
export function createToolDescription(config: {
  name: string;
  description: string;
  useCase: string;
  category: ToolCategory;
  bestFor: string[];
  inputs: Record<string, Omit<ToolInputDescription, 'required'> & { required?: boolean }>;
  outputs: Omit<ToolOutputDescription, 'format'>;
  relatedTools?: string[];
  alternatives?: string[];
  requires?: string[];
  dataSource?: string;
  executionTime?: string;
  caching?: string;
  examples: Array<{
    input: Record<string, any>;
    output: any;
    scenario: string;
  }>;
  limitations?: string[];
  notes?: string;
}): EnhancedToolDescription {
  // Add required field to inputs
  const enhancedInputs: Record<string, ToolInputDescription> = {};
  for (const [key, value] of Object.entries(config.inputs)) {
    enhancedInputs[key] = {
      ...value,
      required: value.required ?? false
    };
  }

  // Infer format from outputs
  const outputFormat = inferOutputFormat(config.outputs);

  return {
    name: config.name,
    description: config.description,
    useCase: config.useCase,
    category: config.category,
    bestFor: config.bestFor,
    inputs: enhancedInputs,
    outputs: {
      ...config.outputs,
      format: outputFormat
    },
    relatedTools: config.relatedTools ?? [],
    alternatives: config.alternatives,
    requires: config.requires,
    dataSource: config.dataSource,
    executionTime: config.executionTime ?? '< 1 second',
    caching: config.caching ?? 'none',
    examples: config.examples,
    limitations: config.limitations,
    notes: config.notes
  };
}

/**
 * Infer output format from structure
 */
function inferOutputFormat(outputs: Omit<ToolOutputDescription, 'format'>): string {
  const structure = outputs.structure;
  const keys = Object.keys(structure);

  if (keys.includes('summary') || keys.includes('recommendation')) {
    return 'structured';
  }
  if (keys.includes('data') || keys.includes('results')) {
    return 'array';
  }
  return 'object';
}

/**
 * Generate a formatted tool description string for LLM
 */
export function formatToolForLLM(tool: EnhancedToolDescription): string {
  let desc = `## Tool: ${tool.name}\n\n`;
  desc += `**Category:** ${tool.category}\n`;
  desc += `**Use Case:** ${tool.useCase}\n`;
  desc += `**Best For:** ${tool.bestFor.join(', ')}\n\n`;

  desc += `### Description\n${tool.description}\n\n`;

  desc += `### Inputs\n`;
  for (const [name, input] of Object.entries(tool.inputs)) {
    const required = input.required ? '(required)' : '(optional)';
    desc += `- **${name}** ${required}: ${input.description}`;
    if (input.range) desc += ` (valid range: ${input.range})`;
    if (input.example !== undefined) desc += ` | Example: ${JSON.stringify(input.example)}`;
    desc += '\n';
  }
  desc += '\n';

  desc += `### Outputs\n`;
  desc += `- Format: ${tool.outputs.format}\n`;
  desc += `- Structure:\n`;
  for (const [key, value] of Object.entries(tool.outputs.structure)) {
    desc += `  - ${key}: ${value}\n`;
  }
  desc += '\n';

  if (tool.relatedTools.length > 0) {
    desc += `### Related Tools\n`;
    desc += tool.relatedTools.map(t => `- ${t}`).join('\n');
    desc += '\n\n';
  }

  if (tool.requires && tool.requires.length > 0) {
    desc += `### Prerequisites\n`;
    desc += `Call these tools first: ${tool.requires.join(', ')}\n\n`;
  }

  if (tool.dataSource) {
    desc += `### Data Source\n${tool.dataSource}\n\n`;
  }

  desc += `### Execution\n`;
  desc += `- Expected time: ${tool.executionTime}\n`;
  desc += `- Caching: ${tool.caching}\n\n`;

  if (tool.examples.length > 0) {
    desc += `### Examples\n`;
    tool.examples.forEach((ex, i) => {
      desc += `**Example ${i + 1}: ${ex.scenario}**\n`;
      desc += `Input: \`${JSON.stringify(ex.input)}\`\n`;
      desc += `Output: \`${JSON.stringify(ex.output)}\`\n\n`;
    });
  }

  if (tool.limitations && tool.limitations.length > 0) {
    desc += `### Limitations\n`;
    tool.limitations.forEach(l => desc += `- ${l}\n`);
    desc += '\n';
  }

  if (tool.notes) {
    desc += `### Notes\n${tool.notes}\n`;
  }

  return desc;
}

/**
 * Create input description helper
 */
export function input(
  description: string,
  type: string,
  options: Partial<ToolInputDescription> = {}
): Omit<ToolInputDescription, 'required'> & { required?: boolean } {
  return {
    description,
    type,
    ...options
  };
}

/**
 * Create output description helper
 */
export function output(
  structure: Record<string, string>,
  example: any
): Omit<ToolOutputDescription, 'format'> {
  return { structure, example };
}

/**
 * Create example helper
 */
export function example(
  input: Record<string, any>,
  output: any,
  scenario: string
): { input: Record<string, any>; output: any; scenario: string } {
  return { input, output, scenario };
}

/**
 * Common tool descriptions snippets
 */
export const CommonDescriptions = {
  // Stock valuation
  PE_BAND: 'Calculate PE band valuation using historical PE ratios to determine if a stock is undervalued, fairly valued, or overvalued.',
  DDM: 'Calculate intrinsic value using Dividend Discount Model (Gordon Growth Model). Best for dividend-paying stocks.',
  DCF: 'Calculate intrinsic value using Discounted Cash Flow analysis. Projects future cash flows and discounts them to present value.',
  MARGIN_OF_SAFETY: 'Calculate margin of safety to assess downside protection. Essential for value investing decisions.',

  // Data fetching
  FETCH_STOCK: 'Fetch comprehensive stock data including financial metrics, ratios, and market data.',
  COMPLETE_VALUATION: 'Run all valuation models at once for comprehensive stock analysis.',

  // Financial analysis
  FINANCIAL_HEALTH: 'Assess financial health using Altman Z-Score and Piotroski F-Score.',
  DUPONT: 'Decompose ROE into profit margin, asset turnover, and financial leverage.',

  // Web tools
  WEB_SEARCH: 'Search the web for current information, news, and research.',
  WEB_FETCH: 'Extract clean content from web pages by removing ads and clutter.',
  NEWS_SEARCH: 'Search recent news articles for stock news and company updates.',

  // Utilities
  TIME: 'Get current time in any timezone with multiple format options.',
  FILE_READ: 'Read file contents with encoding support.',
  STATS: 'Calculate comprehensive statistics including mean, median, standard deviation, and outliers.'
};

/**
 * Common use cases
 */
export const CommonUseCases = {
  VALUE_INVESTING: 'Value investing analysis and stock picking',
  DIVIDEND_INVESTING: 'Dividend stock analysis and income investing',
  QUICK_CHECK: 'Quick stock valuation check',
  DEEP_ANALYSIS: 'Comprehensive fundamental analysis',
  RESEARCH: 'Research and news gathering for investment decisions',
  PORTFOLIO: 'Portfolio management and risk assessment'
};

/**
 * Common data sources
 */
export const CommonDataSources = {
  SET_WATCH: 'SET Watch API (Thai stock market data)',
  CALCULATED: 'Calculated from input parameters',
  WEB_SCRAPING: 'Web scraping (real-time data)',
  HISTORICAL: 'Historical data analysis'
};
