# MCP Server Improvement Topics

## Executive Summary

This document outlines improvement topics for the **Stock Valuation MCP Server** to enhance performance and optimize output for LLM consumption.

**Project:** Stock Valuation MCP Server
**Version:** 1.0.0
**Date:** 2026-01-11
**Status:** Planning Phase

---

## Table of Contents

1. [Performance Improvements - Caching Layer](#topic-1-performance-improvements---caching-layer)
2. [Response Format for Better LLM Consumption](#topic-2-response-format-for-better-llm-consumption)
3. [Async Performance Optimization](#topic-3-async-performance-optimization)
4. [Enhanced Tool Descriptions for LLM](#topic-4-enhanced-tool-descriptions-for-llm)
5. [Streaming Response Support](#topic-5-streaming-response-support)
6. [Input Validation & Sanitization](#topic-6-input-validation--sanitization)
7. [Rich Output Types (Beyond JSON)]#topic-7-rich-output-types-beyond-json)
8. [Error Response Standardization](#topic-8-error-response-standardization)
9. [Metadata Addition for Context](#topic-9-metadata-addition-for-context)
10. [Tool Chaining & Composition](#topic-10-tool-chaining--composition)

---

## Topic 1: Performance Improvements - Caching Layer

### Current State
- No response caching implemented
- Every API call hits external services (SET Watch API, web scraping)
- Repeated requests for same stock data waste resources

### Priority Matrix

| Priority | Improvement | Impact | Effort |
|----------|-------------|--------|--------|
| **HIGH** | Implement in-memory LRU cache for stock data | 70-90% reduction in API calls | Medium |
| **HIGH** | Cache web search results with TTL | 50% faster repeated queries | Low |
| **MEDIUM** | Persistent Redis cache for production | Cross-instance data sharing | High |

### Implementation Approach

```typescript
// Cache Entry Structure
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in ms
}

// Cache Strategy:
// - Stock data: 5 minutes TTL
//   - Price data changes frequently
//   - Financial statements: 1 hour TTL
// - Web search: 15 minutes TTL
// - Valuation results: 30 minutes TTL
//   - Calculations don't change if inputs are same
```

### Recommended Libraries

```json
{
  "dependencies": {
    "lru-cache": "^10.0.0",
    "ioredis": "^5.3.2"  // Optional for production
  }
}
```

### File Changes

- **New:** `src/cache/index.ts` - Cache implementation
- **Modify:** `src/tools/setWatchApi.ts` - Add cache wrapper
- **Modify:** `src/tools/webTools.ts` - Add cache wrapper
- **Modify:** `src/config/index.ts` - Add cache configuration

---

## Topic 2: Response Format for Better LLM Consumption

### Current Issues
1. JSON.stringify with `null, 2` creates verbose output
2. Raw data fields (`rawData: data`) bloat responses
3. No structured summaries for quick LLM understanding
4. Missing key insights extraction

### Recommended Response Structure

```typescript
// BEFORE (current)
{
  "symbol": "SCB.BK",
  "currentPrice": 145.50,
  "eps": 8.5,
  "rawData": { ...70+ fields... }
}

// AFTER (LLM-optimized)
{
  "summary": {
    "symbol": "SCB.BK",
    "action": "HOLD",
    "confidence": "Medium",
    "keyReason": "Trading within fair value range"
  },
  "metrics": {
    "price": 145.50,
    "pe": 17.12,
    "pb": 1.2,
    "dividendYield": 4.5
  },
  "analysis": {
    "valuation": "Fairly Valued",
    "strengths": ["High dividend yield", "Low PB ratio"],
    "risks": ["Declining ROE trend"]
  },
  "detailed": { ...full data... }
}
```

### Output Format Options

Add `outputFormat` parameter to all tools:

| Format | Use Case | Description |
|--------|----------|-------------|
| `summary` | Quick LLM decisions | Top 5 key metrics + recommendation |
| `standard` | Default use | Balanced detail |
| `detailed` | Deep analysis | Full data with all fields |
| `markdown` | Human-readable | Formatted markdown tables |

### Implementation

```typescript
// Add to all tool input schemas
outputFormat: {
  type: 'string',
  enum: ['summary', 'standard', 'detailed', 'markdown'],
  default: 'standard'
}
```

---

## Topic 3: Async Performance Optimization

### Current Bottlenecks

| Location | Issue | Impact |
|----------|-------|--------|
| `setWatchApi.ts:122` | Sequential valuation calculations | 3x slower than needed |
| `index.ts:92` | No request batching | N+1 query problem |
| `webTools.ts:79` | Synchronous Cheerio parsing | Blocks event loop |

### Recommended Changes

```typescript
// Parallel execution for independent calculations
const [peBand, ddm, dcf] = await Promise.all([
  calculatePEBand(data),
  calculateDDM(data),
  calculateDCF(data)
]);
```

### Worker Thread Strategy

```typescript
// CPU-intensive calculations in worker threads
import { Worker } from 'worker_threads';

function calculateInWorker<T>(fn: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./calculation-worker.js');
    worker.postMessage(fn);
    worker.on('message', resolve);
    worker.on('error', reject);
  });
}
```

---

## Topic 4: Enhanced Tool Descriptions for LLM

### Current vs Recommended

**Current Description:**
> "Calculate PE band valuation for a stock"

**Recommended Description:**
> "Calculate PE band valuation for a stock using historical PE ratios. Returns fair value range, current percentile, and buy/hold/sell signal. Best for: Thai stocks, value investing decisions. Input: symbol, currentPrice, eps, historicalPEs (optional)"

### Key Improvements
1. Add **best use case** to each description
2. Specify **expected input ranges**
3. Include **output examples**
4. Add **related tools** for chaining

### Template

```typescript
interface EnhancedToolDescription {
  name: string;
  description: string;           // What it does
  useCase: string;               // When to use this tool
  inputs: Record<string, {       // Input expectations
    description: string;
    type: string;
    range?: string;
    example?: any;
  }>;
  outputs: {                     // Output structure
    structure: Record<string, string>;
    example: any;
  };
  relatedTools: string[];        // Tools to chain with
  category: string;              // Tool category
}
```

### Implementation Files

- **Modify:** All tool files in `src/tools/`
- **New:** `src/types/tool-descriptions.ts` - Description interfaces
- **New:** `src/utils/tool-descriptor.ts` - Description builder

---

## Topic 5: Streaming Response Support

### Why This Matters
- Large responses (like complete_valuation) can exceed token limits
- LLMs can start processing before full response arrives
- Better perceived performance

### Implementation

```typescript
// Add streaming mode to tools
interface StreamingToolResponse {
  stream: AsyncGenerator<ToolChunk>;
}

type ToolChunk = {
  type: 'summary' | 'data' | 'complete';
  content: any;
};

// Example streaming flow
async function* streamValuation(data: StockData) {
  yield { type: 'summary', content: generateSummary(data) };
  yield { type: 'data', content: calculatePEBand(data) };
  yield { type: 'data', content: calculateDDM(data) };
  yield { type: 'complete', content: { status: 'done' } };
}
```

### Server-Side Changes

```typescript
// Support streaming in MCP protocol
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await tool.handler(args);

  if (isStreamingResponse(result)) {
    return {
      content: result.stream,
      streaming: true
    };
  }
  // ...
});
```

---

## Topic 6: Input Validation & Sanitization

### Current Gaps

| Issue | Location | Risk |
|-------|----------|------|
| No symbol format validation | setWatchApi.ts | Invalid API calls |
| Missing range checks | stockValuation.ts | Calculation errors |
| No rate limiting | index.ts:HTTP | API abuse |

### Recommendations

```typescript
// Pre-validation middleware
function validateStockSymbol(symbol: string): boolean {
  // Thai stocks: 2-6 letters, no .BK suffix (added internally)
  return /^[A-Z]{2,6}$/.test(symbol);
}

function validatePositiveNumber(value: number, fieldName: string): void {
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be positive, got ${value}`);
  }
}

function validatePercentage(value: number, fieldName: string): void {
  if (value < 0 || value > 1) {
    throw new ValidationError(`${fieldName} must be between 0 and 1, got ${value}`);
  }
}
```

### Implementation Files

- **New:** `src/utils/validators.ts` - Validation functions
- **Modify:** All tool handlers to use validators
- **New:** `src/middleware/validation.ts` - Request validation middleware

---

## Topic 7: Rich Output Types (Beyond JSON)

### New Content Types

```typescript
interface ToolResponse {
  content: Array<{
    type: 'text' | 'table' | 'chart' | 'summary';
    data: any;
  }>;
}

// Example: PE Band with table
{
  content: [
    { type: 'summary', text: 'SCB is undervalued by 15%' },
    { type: 'table', data: { headers: [...], rows: [...] } }
  ]
}
```

### Content Type Specifications

```typescript
interface TableContent {
  type: 'table';
  data: {
    headers: string[];
    rows: (string | number)[][];
    caption?: string;
  };
}

interface ChartContent {
  type: 'chart';
  data: {
    chartType: 'line' | 'bar' | 'pie';
    title: string;
    xAxis: string[];
    yAxis: number[];
    labels?: string[];
  };
}

interface SummaryContent {
  type: 'summary';
  data: {
    title: string;
    highlights: string[];
    recommendation: string;
    confidence: number;
  };
}
```

---

## Topic 8: Error Response Standardization

### Current Issues
- Inconsistent error messages
- No error codes for LLMs to understand failure reasons
- Missing recovery suggestions

### Recommended Error Format

```typescript
interface MCPError {
  code: string;           // e.g., "INVALID_SYMBOL", "API_TIMEOUT"
  message: string;        // Human-readable
  recoverable: boolean;   // Can LLM retry?
  suggestion?: string;    // What to try instead
  details?: any;          // Additional context
}

// Error Codes Registry
enum ErrorCodes {
  INVALID_SYMBOL = 'INVALID_SYMBOL',
  SYMBOL_NOT_FOUND = 'SYMBOL_NOT_FOUND',
  API_TIMEOUT = 'API_TIMEOUT',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  INVALID_INPUT = 'INVALID_INPUT',
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

### Implementation

```typescript
class MCPError extends Error {
  constructor(
    public code: string,
    message: string,
    public recoverable: boolean = true,
    public suggestion?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      recoverable: this.recoverable,
      suggestion: this.suggestion,
      details: this.details
    };
  }
}
```

---

## Topic 9: Metadata Addition for Context

### Add Context to Responses

```typescript
interface ResponseMetadata {
  toolVersion: string;        // Version of the tool
  dataSource: string;         // Where data came from
  lastUpdated: string;        // When data was last updated
  confidence: number;         // 0-1 score
  dataQuality: 'high' | 'medium' | 'low';
  warnings?: string[];        // Any data quality warnings
  processingTime?: number;    // Time taken to process
}

// Example usage
{
  "result": { ... },
  "metadata": {
    "toolVersion": "1.0.0",
    "dataSource": "SET Watch API",
    "lastUpdated": "2026-01-11T10:30:00Z",
    "confidence": 0.85,
    "dataQuality": "high",
    "warnings": [],
    "processingTime": 234
  }
}
```

---

## Topic 10: Tool Chaining & Composition

### Enable Multi-Tool Workflows

```typescript
// New: Composite tools that chain multiple operations
const quickAnalysisTool: Tool = {
  name: 'quick_stock_analysis',
  description: 'Fetch data + run all valuations + return summary',
  handler: async (args) => {
    const data = await fetchStockData(args.symbol);
    const valuations = await runAllValuations(data);
    return {
      summary: extractSummary(valuations),
      details: valuations
    };
  }
};
```

### Composite Tool Templates

```typescript
// Pre-built workflows
const workflows = {
  // Full investment analysis
  fullAnalysis: [
    'fetch_stock_data',
    'calculate_pe_band',
    'calculate_ddm',
    'calculate_dcf',
    'calculate_margin_of_safety',
    'calculate_financial_health_score'
  ],

  // Quick valuation
  quickValuation: [
    'fetch_stock_data',
    'calculate_pe_band',
    'calculate_margin_of_safety'
  ],

  // Income stock analysis
  dividendAnalysis: [
    'fetch_stock_data',
    'calculate_ddm',
    'dividend_safety_analysis',
    'dividend_aristocrat_score'
  ]
};
```

---

## Implementation Priority Matrix

```
                    Impact
                High     |   Low
           -------------------------
Quick Win  |  1, 4    |   6
           -------------------------
Medium     |  2, 3    |   7, 9
           -------------------------
Complex    |  5, 10   |   8
           -------------------------
         Quick  Medium  Complex
              Effort
```

---

## Quick Start Recommendations

To improve your MCP server immediately, implement these 3 changes:

1. **Add response summaries** to all tools (Topic 2)
2. **Implement basic caching** (Topic 1)
3. **Enhance tool descriptions** (Topic 4)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-11 | 1.0.0 | Initial documentation of 10 improvement topics |

---

## Next Steps

1. Review and prioritize topics based on your use cases
2. Implement Topic 4 (Enhanced Tool Descriptions) first - highest ROI
3. Add caching layer (Topic 1) for performance gains
4. Implement response format improvements (Topic 2)

