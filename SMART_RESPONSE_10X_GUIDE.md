# Smart Response Format: The Path to 10/10 for AI Consumption

> **Goal**: Transform MCP tool responses into the most AI-friendly format possible, enabling LLMs to understand, reason, and act with maximum effectiveness.

---

## 📊 Current State: 7/10

### What's Working Well (✅)
- **Pre-extracted insights** in `keyFindings` array
- **Structured recommendations** with typed decision fields
- **Data quality metadata** (quality + completeness indicators)
- **Tool chaining support** via `context` section
- **Clear hierarchical structure** (5 components)

### What's Missing (❌)
- Redundant fields (`action` vs `investment`)
- Unstructured warnings (plain string array)
- `keyFindings` as plain text instead of semantic objects
- No explicit data freshness assessment
- Raw data mixed with processed output
- Missing confidence scores
- No field-level validation status
- Limited tool chaining context (no suggested parameters)

---

## 🎯 The 10/10 Vision

A **10/10 smart response** enables an AI to:

1. **Instantly understand** what happened (summary with semantic keyFindings)
2. **Assess data reliability** at a glance (structured quality metrics)
3. **Extract actions** without parsing (typed recommendations with confidence)
4. **Chain tools intelligently** (related tools with suggested parameters)
5. **Handle edge cases** gracefully (structured warnings with severity)
6. **Trust the data** (freshness, completeness, validation status)
7. **Present to users** effectively (ready-to-consume summaries)
8. **Explain reasoning** (transparent decision logic)
9. **Adapt to context** (conditional recommendations)
10. **Learn from feedback** (response improvement hints)

---

## 🏗️ Smart Response Architecture (10/10)

```typescript
export interface SmartResponseV2<T = any> {
  // ============================================================
  // SECTION 1: SUMMARY - What AI needs first (instant comprehension)
  // ============================================================
  summary: {
    title: string;                      // Human-readable identifier
    what: string;                       // What operation was performed
    input: {                            // What was requested (for context)
      symbol?: string;
      params?: Record<string, any>;
    };
    keyFindings: Array<{                // Semantic insights (not plain strings!)
      metric: string;                   // Metric name
      value: string | number;           // Actual value
      formatted: string;                // Human-readable format
      assessment: 'excellent' | 'good' | 'neutral' | 'concerning' | 'critical';
      icon?: '✓' | '✗' | '⚠' | '○';   // Quick visual indicator
      threshold?: {                     // Why this assessment
        value: number;
        operator: '>' | '<' | '=' | '>=' | '<=';
      };
      weight?: number;                  // Importance (0-1) for ranking
    }>;
    conclusion: string;                 // One-sentence takeaway
    confidence: {
      level: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
      score: number;                    // 0-1 numerical confidence
      factors: string[];                // What confidence is based on
    };
  };

  // ============================================================
  // SECTION 2: DATA - Clean, structured, typed output
  // ============================================================
  data: {
    processed: T;                       // Main processed result (typed)
    rawData?: any;                      // Optional: Original API response
    validation: {                       // Field-level validation status
      validFields: string[];
      missingFields: string[];
      nullFields: string[];
      defaultFields: Array<{            // Fields that used defaults
        field: string;
        defaultValue: any;
        reason: string;
      }>;
    };
    dataQuality: {
      completeness: {
        percentage: number;             // 0-100
        status: 'complete' | 'partial' | 'minimal';
        missingCritical: string[];
      };
      accuracy: {
        score: number;                  // 0-1
        factors: Array<{
          aspect: string;
          status: 'verified' | 'estimated' | 'assumed' | 'unknown';
        }>;
      };
      freshness: {
        timestamp: string;              // ISO timestamp
        age: {
          value: number;
          unit: 'seconds' | 'minutes' | 'hours' | 'days';
        };
        status: 'real-time' | 'fresh' | 'acceptable' | 'stale' | 'outdated';
        nextUpdate?: string;            // When data should be refreshed
      };
    };
  };

  // ============================================================
  // SECTION 3: METADATA - Tool info and execution context
  // ============================================================
  metadata: {
    tool: {
      name: string;
      version: string;
      category: 'Data Fetching' | 'Valuation' | 'Analysis' | 'Screening' | 'Utility';
    };
    execution: {
      duration: number;                 // Processing time in ms
      timestamp: string;                // When executed
      cached: boolean;
      cacheHit?: boolean;
    };
    source: {
      name: string;                     // e.g., "SET Watch API"
      url?: string;
      version?: string;
      reliability: 'high' | 'medium' | 'low';
    };
    assumptions: Array<{                // Explicit assumptions made
      what: string;
      why: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    warnings: Array<{                   // Structured warnings
      id: string;                       // Unique warning code
      severity: 'critical' | 'warning' | 'info' | 'debug';
      category: 'data' | 'calculation' | 'assumption' | 'limitation';
      message: string;
      field?: string;                   // Affected field
      impact: string;                   // How this affects results
      suggestion?: string;              // How to address
    }>;
  };

  // ============================================================
  // SECTION 4: RECOMMENDATIONS - Actionable intelligence
  // ============================================================
  recommendations: {
    primary: {
      action: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'Avoid' | 'N/A';
      confidence: number;               // 0-1
      priority: 'Critical' | 'High' | 'Medium' | 'Low';
      reasoning: string;                // Human-readable explanation
      drivers: Array<{                  // What led to this decision
        factor: string;
        value: number | string;
        weight: number;                 // How much this influenced decision
        direction: 'positive' | 'negative' | 'neutral';
      }>;
    };
    scenarios?: Array<{                 // Conditional recommendations
      condition: string;                // e.g., "If price drops below 100"
      action: string;
      reasoning: string;
    }>;
    nextSteps: Array<{
      action: string;
      tool?: string;                    // Tool to use
      params?: Record<string, any>;     // Suggested parameters
      priority: 'now' | 'soon' | 'later';
      reason: string;
    }>;
    risks: Array<{                      // Potential risks to consider
      what: string;
      likelihood: 'high' | 'medium' | 'low';
      impact: 'high' | 'medium' | 'low';
      mitigation?: string;
    }>;
  };

  // ============================================================
  // SECTION 5: CONTEXT - Tool chaining and follow-up
  // ============================================================
  context: {
    relatedTools: Array<{               // Tools to call next
      name: string;
      reason: string;                   // Why call this tool
      suggestedParams?: Record<string, any>;
      expectedValue: string;            // What information this provides
      priority: 'high' | 'medium' | 'low';
    }>;
    alternativeTools: Array<{           // Other approaches
      name: string;
      whenToUse: string;                // When this alternative is better
      tradeoffs: string[];
    }>;
    suggestedFollowUp: Array<{          // Questions to ask user
      question: string;
      why: string;                      // Why this matters
      options?: string[];               // Suggested answers
    }>;
    dependencies: {                     // Data relationships
      requires: string[];               // What data is needed
      provides: string[];               // What data this provides
      conflictsWith?: string[];         // What tools might conflict
    };
    learnMore: Array<{                  // Educational context
      topic: string;
      relevance: string;
      resource?: string;
    }>;
  };

  // ============================================================
  // SECTION 6: PRESENTATION - Ready for user display
  // ============================================================
  presentation?: {
    headline: string;                   // One-line summary for users
    subheadline?: string;               // Additional context
    highlights: string[];               // 3-5 bullet points
    tables?: Array<{                    // Suggested table format
      title: string;
      headers: string[];
      rows: (string | number)[][];
    }>;
    charts?: Array<{                    // Suggested visualizations
      type: 'line' | 'bar' | 'pie' | 'scatter';
      title: string;
      data: any;
    }>;
    formatting: {
      currency: string;                 // e.g., "฿"
      locale: string;                   // e.g., "th-TH"
      decimals: {
        price: number;
        percentage: number;
        ratio: number;
      };
    };
  };

  // ============================================================
  // SECTION 7: FEEDBACK - For continuous improvement
  // ============================================================
  feedback?: {
    responseQuality: {
      rating?: number;                  // User feedback 1-5
      issues?: string[];                // Reported problems
    };
    improvementHints: Array<{           // How to make this better
      aspect: string;
      suggestion: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    modelVersion: string;               // What model generated this
    promptTokens?: number;
    completionTokens?: number;
  };
}
```

---

## 🗺️ Implementation Roadmap

### Phase 1: Foundation (Quick Wins) - 1 week
**Target: Improve from 7/10 → 8/10**

| Task | Description | Priority | Effort |
|------|-------------|----------|--------|
| 1.1 | Remove `summary.action` field (use `recommendations.primary.action`) | High | Low |
| 1.2 | Add `summary.conclusion` one-sentence takeaway | High | Low |
| 1.3 | Add numerical confidence scores (0-1) | High | Low |
| 1.4 | Add `summary.input` to track request params | Medium | Low |
| 1.5 | Structure `metadata.warnings` with severity | High | Medium |
| 1.6 | Add `data.validation` for field-level status | Medium | Medium |
| 1.7 | Add `presentation.headline` and `highlights` | Medium | Low |

**Deliverable**: All tools use improved format with structured warnings and validation

---

### Phase 2: Semantic Intelligence - 2 weeks
**Target: Improve from 8/10 → 9/10**

| Task | Description | Priority | Effort |
|------|-------------|----------|--------|
| 2.1 | Convert `keyFindings` to semantic objects | High | High |
| 2.2 | Add `dataQuality.freshness` with age calculation | High | Medium |
| 2.3 | Add `dataQuality.accuracy` with verification status | High | Medium |
| 2.4 | Add `recommendations.primary.drivers` array | High | Medium |
| 2.5 | Add `recommendations.scenarios` for conditional recommendations | Medium | High |
| 2.6 | Add `recommendations.risks` array | Medium | Medium |
| 2.7 | Add `metadata.assumptions` tracking | High | High |

**Deliverable**: Semantic keyFindings with assessments, data freshness tracking

---

### Phase 3: Tool Chaining Intelligence - 2 weeks
**Target: Improve from 9/10 → 9.5/10**

| Task | Description | Priority | Effort |
|------|-------------|----------|--------|
| 3.1 | Add `context.relatedTools` with suggestedParams | High | High |
| 3.2 | Add `context.alternativeTools` with tradeoffs | Medium | Medium |
| 3.3 | Add `context.suggestedFollowUp` as objects | Medium | Medium |
| 3.4 | Add `context.dependencies` mapping | High | Medium |
| 3.5 | Add `recommendations.nextSteps` with tool/params | High | High |
| 3.6 | Create tool dependency graph | Medium | High |

**Deliverable**: Intelligent tool chaining with parameter suggestions

---

### Phase 4: Presentation & Polish - 1 week
**Target: Improve from 9.5/10 → 10/10**

| Task | Description | Priority | Effort |
|------|-------------|----------|--------|
| 4.1 | Add `presentation` section with tables/charts | Medium | High |
| 4.2 | Add `presentation.formatting` for consistent display | Low | Low |
| 4.3 | Add `feedback.improvementHints` | Low | Medium |
| 4.4 | Add `context.learnMore` educational context | Low | Medium |
| 4.5 | Optimize response size (remove redundancy) | Medium | Medium |
| 4.6 | Add response compression hints | Low | Low |
| 4.7 | Create comprehensive examples | High | Medium |

**Deliverable**: Complete 10/10 smart response format with full documentation

---

## ✅ Implementation Checklist

### Phase 1: Foundation Tasks

#### Task 1.1: Remove Redundant action Field
- [ ] Create new type `SmartResponseV2` without `summary.action`
- [ ] Update all tool handlers to remove action assignment
- [ ] Verify `recommendations.primary.action` is always set
- [ ] Run tests to ensure no regression
- [ ] Update documentation

**Files to modify**:
- `src/types/responses.ts` - Add SmartResponseV2 interface
- `src/tools/*.ts` - Update all formatters

**Validation**:
```typescript
// Before
summary: { action: 'Buy', ... }

// After
summary: { ... }  // No action
recommendations: { primary: { action: 'Buy' } }
```

---

#### Task 1.2: Add summary.conclusion
- [ ] Add `conclusion: string` to Summary interface
- [ ] Create conclusion generation logic per tool type
- [ ] Update 13+ tool formatters with conclusions
- [ ] Test conclusion quality across tools

**Conclusion templates by tool type**:
```typescript
// Valuation tools
`${symbol} is ${recommendation} based on ${methodCount} valuation methods`

// Data fetching
`Retrieved ${dataPoints} data points for ${symbol} with ${quality}% quality`

// Screening
`Symbol ${symbol} scores ${score}/${maxScore} (${grade} grade) - ${action}`
```

---

#### Task 1.3: Add Numerical Confidence Scores
- [ ] Add `confidence.score: number` (0-1) to Summary
- [ ] Add `confidence.factors: string[]` explaining score
- [ ] Create confidence calculation logic:
  ```typescript
  function calculateConfidence(
    dataQuality: number,      // 0-1
    completeness: number,     // 0-1
    modelAgreement: number,   // 0-1 (for valuations)
    dataFreshness: number     // 0-1
  ): number {
    return (dataQuality * 0.3 + completeness * 0.3 +
            modelAgreement * 0.25 + dataFreshness * 0.15);
  }
  ```
- [ ] Update all tools to calculate and include confidence
- [ ] Document confidence calculation methodology

---

#### Task 1.4: Add summary.input Tracking
- [ ] Add `input` object to Summary interface
- [ ] Track symbol and key parameters in input
- [ ] Update tool handlers to populate input
- [ ] Use input for context in keyFindings

**Example**:
```typescript
summary: {
  input: {
    symbol: 'ADVANC.BK',
    method: 'pe_band',
    period: '5y'
  },
  ...
}
```

---

#### Task 1.5: Structure Warnings with Severity
- [ ] Create `StructuredWarning` interface:
  ```typescript
  interface StructuredWarning {
    id: string;           // e.g., "WARN_NO_DIVIDEND_DATA"
    severity: 'critical' | 'warning' | 'info' | 'debug';
    category: 'data' | 'calculation' | 'assumption' | 'limitation';
    message: string;
    field?: string;
    impact: string;
    suggestion?: string;
  }
  ```
- [ ] Create warning ID constants
- [ ] Update all formatters to use structured warnings
- [ ] Add warning templates for common cases

**Warning examples**:
```typescript
// No dividend data
{
  id: 'WARN_NO_DIVIDEND_DATA',
  severity: 'warning',
  category: 'data',
  message: 'Dividend data not available',
  field: 'dividend',
  impact: 'DDM valuation cannot be calculated',
  suggestion: 'Use DCF or PE Band valuation instead'
}

// Low ROE
{
  id: 'WARN_LOW_ROE',
  severity: 'warning',
  category: 'calculation',
  message: 'ROE is below 10%',
  field: 'roe',
  impact: 'Company may have poor profitability',
  suggestion: 'Review profit margins and asset turnover'
}
```

---

#### Task 1.6: Add data.validation Tracking
- [ ] Create `DataValidation` interface:
  ```typescript
  interface DataValidation {
    validFields: string[];      // Fields with real data
    missingFields: string[];    // Fields expected but missing
    nullFields: string[];       // Fields that are null
    defaultFields: Array<{
      field: string;
      defaultValue: any;
      reason: string;
    }>;
  }
  ```
- [ ] Create validation tracker function
- [ ] Update all tools to track validation
- [ ] Include validation in metadata

---

#### Task 1.7: Add presentation.headline
- [ ] Add `presentation` section to SmartResponseV2
- [ ] Create headline generation logic
- [ ] Add highlights array (3-5 bullets)
- [ ] Update tools to populate presentation

**Example**:
```typescript
presentation: {
  headline: 'ADVANC.BK is undervalued by 15% based on PE Band analysis',
  highlights: [
    'Current PE (12.5) below historical average (15.0)',
    'Fair value range: ฿96 - ฿264',
    'Strong financial health (Altman Z-Score: 3.45)'
  ]
}
```

---

### Phase 2: Semantic Intelligence Tasks

#### Task 2.1: Convert keyFindings to Semantic Objects
- [ ] Create `KeyFinding` interface:
  ```typescript
  interface KeyFinding {
    metric: string;                    // e.g., "PE Ratio"
    value: string | number;            // e.g., 12.5
    formatted: string;                 // e.g., "12.50x"
    assessment: 'excellent' | 'good' | 'neutral' | 'concerning' | 'critical';
    icon?: '✓' | '✗' | '⚠' | '○';
    threshold?: {
      value: number;
      operator: '>' | '<' | '=' | '>=' | '<=';
    };
    weight?: number;                   // 0-1, default 0.5
  }
  ```
- [ ] Create assessment logic helper:
  ```typescript
  function assessMetric(
    value: number,
    thresholds: { excellent: number; good: number; neutral: number; concerning: number; critical: number },
    higherIsBetter: boolean
  ): 'excellent' | 'good' | 'neutral' | 'concerning' | 'critical'
  ```
- [ ] Update all formatters with semantic keyFindings
- [ ] Add weight values for ranking

**Example semantic keyFindings**:
```typescript
keyFindings: [
  {
    metric: 'PE Ratio',
    value: 12.5,
    formatted: '12.50x',
    assessment: 'good',
    icon: '✓',
    threshold: { value: 15, operator: '<' },
    weight: 0.7
  },
  {
    metric: 'ROE',
    value: 18.5,
    formatted: '18.5%',
    assessment: 'excellent',
    icon: '✓',
    threshold: { value: 15, operator: '>=' },
    weight: 0.8
  },
  {
    metric: 'Altman Z-Score',
    value: 3.45,
    formatted: '3.45',
    assessment: 'excellent',
    icon: '✓',
    threshold: { value: 3, operator: '>=' },
    weight: 0.9
  }
]
```

---

#### Task 2.2: Add Data Freshness Tracking
- [ ] Add `freshness` object to `dataQuality`
- [ ] Create age calculator:
  ```typescript
  function calculateDataAge(timestamp: string | Date): {
    value: number;
    unit: 'seconds' | 'minutes' | 'hours' | 'days';
  } {
    const now = new Date();
    const then = new Date(timestamp);
    const diff = now.getTime() - then.getTime();

    if (diff < 60000) return { value: Math.floor(diff / 1000), unit: 'seconds' };
    if (diff < 3600000) return { value: Math.floor(diff / 60000), unit: 'minutes' };
    if (diff < 86400000) return { value: Math.floor(diff / 3600000), unit: 'hours' };
    return { value: Math.floor(diff / 86400000), unit: 'days' };
  }
  ```
- [ ] Create freshness status mapper:
  ```typescript
  function getFreshnessStatus(age: { value: number; unit: string }): 'real-time' | 'fresh' | 'acceptable' | 'stale' | 'outdated' {
    if (age.unit === 'seconds' && age.value < 30) return 'real-time';
    if (age.unit === 'minutes' && age.value < 15) return 'fresh';
    if (age.unit === 'hours' && age.value < 6) return 'acceptable';
    if (age.unit === 'hours' && age.value < 24) return 'stale';
    return 'outdated';
  }
  ```
- [ ] Add nextUpdate calculation for cache hints

---

#### Task 2.3: Add Data Accuracy Tracking
- [ ] Add `accuracy` object to `dataQuality`
- [ ] Create accuracy assessment logic per data type
- [ ] Track verification status for each metric
- [ ] Document accuracy methodology

**Example**:
```typescript
accuracy: {
  score: 0.85,
  factors: [
    { aspect: 'Price data', status: 'verified' },
    { aspect: 'Financial ratios', status: 'verified' },
    { aspect: 'EPS (calculated)', status: 'estimated' },
    { aspect: 'Historical PE', status: 'assumed' }
  ]
}
```

---

#### Task 2.4: Add Recommendation Drivers
- [ ] Create `RecommendationDriver` interface:
  ```typescript
  interface RecommendationDriver {
    factor: string;           // e.g., "PE Ratio"
    value: number | string;
    weight: number;           // 0-1, how much this influenced decision
    direction: 'positive' | 'negative' | 'neutral';
  }
  ```
- [ ] Create driver calculation logic:
  ```typescript
  function calculateDrivers(
    metrics: Record<string, number>,
    decision: 'Buy' | 'Sell' | 'Hold'
  ): RecommendationDriver[]
  ```
- [ ] Update recommendation formatters with drivers

**Example**:
```typescript
recommendations: {
  primary: {
    action: 'Buy',
    confidence: 0.75,
    reasoning: 'Stock is undervalued with strong fundamentals',
    drivers: [
      { factor: 'PE Ratio', value: 12.5, weight: 0.3, direction: 'positive' },
      { factor: 'ROE', value: 18.5, weight: 0.25, direction: 'positive' },
      { factor: 'Margin of Safety', value: 25.3, weight: 0.35, direction: 'positive' },
      { factor: 'Beta', value: 0.85, weight: 0.1, direction: 'neutral' }
    ]
  }
}
```

---

#### Task 2.5: Add Conditional Scenarios
- [ ] Add `scenarios` array to recommendations
- [ ] Create scenario generation logic:
  ```typescript
  function generateScenarios(
    currentPrice: number,
    fairValues: { lower: number; upper: number }
  ): Array<{
    condition: string;
    action: string;
    reasoning: string;
  }>
  ```
- [ ] Add scenarios to valuation tools

**Example scenarios**:
```typescript
scenarios: [
  {
    condition: 'If price drops below ฿140',
    action: 'Strong Buy',
    reasoning: 'Price would be 20% below fair value with significant margin of safety'
  },
  {
    condition: 'If price rises above ฿180',
    action: 'Hold',
    reasoning: 'Price approaching upper fair value range, consider taking profits'
  },
  {
    condition: 'If EPS estimate changes by ±10%',
    action: 'Re-evaluate',
    reasoning: 'Fair value sensitive to earnings changes'
  }
]
```

---

#### Task 2.6: Add Risk Assessment
- [ ] Create `Risk` interface:
  ```typescript
  interface Risk {
    what: string;
    likelihood: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation?: string;
  }
  ```
- [ ] Create risk calculator per tool type
- [ ] Add risks to recommendations
- [ ] Create risk matrix visualization

**Example risks**:
```typescript
risks: [
  {
    what: 'Valuation assumes historical PE range remains valid',
    likelihood: 'medium',
    impact: 'high',
    mitigation: 'Compare with DCF/DDM for confirmation'
  },
  {
    what: 'Market conditions may affect PE multiples',
    likelihood: 'high',
    impact: 'medium',
    mitigation: 'Monitor market trends and sector performance'
  }
]
```

---

#### Task 2.7: Track Assumptions Explicitly
- [ ] Create `Assumption` interface:
  ```typescript
  interface Assumption {
    what: string;
    why: string;
    impact: 'high' | 'medium' | 'low';
  }
  ```
- [ ] Document all assumptions per tool
- [ ] Add assumptions to metadata
- [ ] Create assumption templates

**Example assumptions**:
```typescript
assumptions: [
  {
    what: 'Historical PE range (8-22) represents reasonable valuation',
    why: 'Based on 5-year historical data from SET Watch API',
    impact: 'high'
  },
  {
    what: 'Growth rate of 5% for DCF projections',
    why: 'Conservative estimate based on historical growth',
    impact: 'high'
  },
  {
    what: 'Terminal growth rate of 2.5%',
    why: 'Standard assumption for mature companies',
    impact: 'medium'
  }
]
```

---

### Phase 3: Tool Chaining Intelligence

#### Task 3.1: Add Related Tools with Parameters
- [ ] Create `RelatedTool` interface:
  ```typescript
  interface RelatedTool {
    name: string;
    reason: string;
    suggestedParams?: Record<string, any>;
    expectedValue: string;
    priority: 'high' | 'medium' | 'low';
  }
  ```
- [ ] Create tool dependency mapping
- [ ] Generate suggested params from current context
- [ ] Update context.relatedTools across all tools

**Example**:
```typescript
context: {
  relatedTools: [
    {
      name: 'calculate_dcf',
      reason: 'Verify PE Band valuation with cash flow analysis',
      suggestedParams: {
        symbol: 'ADVANC.BK',
        discountRate: 0.10,
        growthRate: 0.05,
        years: 5
      },
      expectedValue: 'Intrinsic value based on future cash flows',
      priority: 'high'
    },
    {
      name: 'fetch_income_statement',
      reason: 'Analyze earnings quality and trends',
      suggestedParams: {
        symbol: 'ADVANC.BK',
        period: 'TTM'
      },
      expectedValue: 'Revenue, net income, margins over time',
      priority: 'medium'
    }
  ]
}
```

---

#### Task 3.2: Add Alternative Tools
- [ ] Create `AlternativeTool` interface:
  ```typescript
  interface AlternativeTool {
    name: string;
    whenToUse: string;
    tradeoffs: string[];
  }
  ```
- [ ] Document alternative tools per category
- [ ] Add alternatives to context
- [ ] Create alternative tool decision tree

**Example**:
```typescript
alternativeTools: [
  {
    name: 'calculate_canslim_score',
    whenToUse: 'For growth stock screening and momentum analysis',
    tradeoffs: [
      'Focuses on growth metrics rather than value',
      'Requires 7 criteria (some may be missing)',
      'Better for high-growth stocks vs. mature companies'
    ]
  },
  {
    name: 'calculate_ddm',
    whenToUse: 'For dividend-paying stocks with stable payouts',
    tradeoffs: [
      'Only works for dividend-paying stocks',
      'Sensitive to growth rate assumptions',
      'Not suitable for non-dividend or growth stocks'
    ]
  }
]
```

---

#### Task 3.3: Structure Suggested Follow-up
- [ ] Convert `suggestedFollowUp` from strings to objects
- [ ] Create `FollowUpQuestion` interface:
  ```typescript
  interface FollowUpQuestion {
    question: string;
    why: string;
    options?: string[];
  }
  ```
- [ ] Generate contextual follow-up questions
- [ ] Add question options for quick responses

**Example**:
```typescript
suggestedFollowUp: [
  {
    question: 'What is your investment horizon for this stock?',
    why: 'Different valuation methods work better for different timeframes',
    options: ['Short-term (< 1 year)', 'Medium-term (1-3 years)', 'Long-term (3+ years)']
  },
  {
    question: 'Are you looking for income or growth?',
    why: 'This affects which metrics matter most',
    options: ['Income (dividends)', 'Growth (capital appreciation)', 'Both']
  },
  {
    question: 'What is your risk tolerance?',
    why: 'Helps determine appropriate margin of safety requirements',
    options: ['Conservative', 'Moderate', 'Aggressive']
  }
]
```

---

#### Task 3.4: Create Tool Dependencies Map
- [ ] Create tool dependency graph
- [ ] Document data flow between tools
- [ ] Add dependency metadata to each tool
- [ ] Create dependency visualization

**Dependency map**:
```typescript
// fetch_stock_data
//   ↓ provides: price, PE, PB, EPS, dividend, FCF, shares
//   ↓
// ├─→ calculate_pe_band (uses: price, EPS)
// ├─→ calculate_ddm (uses: price, dividend)
// ├─→ calculate_dcf (uses: price, FCF, shares)
// └─→ complete_valuation (uses: all above)
//
// fetch_income_statement
//   ↓ provides: revenue, net income, margins
//   ↓
// └─→ calculate_canslim_score (uses: revenue, net income growth)
```

---

#### Task 3.5: Enhance Next Steps with Tool/Params
- [ ] Convert `nextSteps` to structured objects:
  ```typescript
  interface NextStep {
    action: string;
    tool?: string;
    params?: Record<string, any>;
    priority: 'now' | 'soon' | 'later';
    reason: string;
  }
  ```
- [ ] Generate contextual next steps
- [ ] Include tool parameters for easy execution

**Example**:
```typescript
nextSteps: [
  {
    action: 'Verify valuation with DCF analysis',
    tool: 'calculate_dcf',
    params: {
      symbol: 'ADVANC.BK',
      discountRate: 0.10,
      growthRate: 0.05,
      years: 5
    },
    priority: 'now',
    reason: 'Cross-check PE Band valuation with cash flow method'
  },
  {
    action: 'Review financial health metrics',
    tool: 'fetch_balance_sheet',
    params: {
      symbol: 'ADVANC.BK',
      period: 'TTM'
    },
    priority: 'soon',
    reason: 'Confirm company has strong financial position'
  },
  {
    action: 'Monitor price movement',
    priority: 'later',
    reason: 'Wait for better entry point if stock rises'
  }
]
```

---

### Phase 4: Presentation & Polish

#### Task 4.1: Add Presentation Section
- [ ] Create `Presentation` interface with tables/charts
- [ ] Generate table suggestions for tabular data
- [ ] Create chart type recommendations
- [ ] Add formatting guidelines

**Example**:
```typescript
presentation: {
  headline: 'ADVANC.BK appears undervalued by 15% based on PE Band analysis',
  subheadline: 'Strong financials with low downside risk',
  highlights: [
    'Trading at 12.5x PE, below 5-year average of 15x',
    'Fair value range: ฿96 - ฿264 (current: ฿156)',
    'Strong financial health (Altman Z-Score: 3.45)',
    '25% margin of safety at current price'
  ],
  tables: [
    {
      type: 'valuation_comparison',
      title: 'Valuation Summary',
      headers: ['Method', 'Intrinsic Value', 'Status'],
      rows: [
        ['PE Band', '฿156 - ฿264', 'Undervalued'],
        ['DDM', '฿180', 'Undervalued'],
        ['DCF', '฿142', 'Fairly Valued']
      ]
    },
    {
      type: 'key_metrics',
      title: 'Key Metrics',
      headers: ['Metric', 'Value', 'Assessment'],
      rows: [
        ['PE Ratio', '12.5x', 'Good'],
        ['ROE', '18.5%', 'Excellent'],
        ['Debt/Equity', '0.45', 'Good'],
        ['Altman Z-Score', '3.45', 'Excellent']
      ]
    }
  ],
  charts: [
    {
      type: 'line',
      title: 'Historical PE Range',
      description: 'Current PE vs historical range',
      data: {
        labels: ['2019', '2020', '2021', '2022', '2023', 'Current'],
        datasets: [{
          label: 'PE Ratio',
          data: [15, 12, 18, 14, 13, 12.5],
          highlight: [null, null, null, null, null, 12.5]
        }]
      }
    }
  ],
  formatting: {
    currency: '฿',
    locale: 'th-TH',
    decimals: {
      price: 2,
      percentage: 1,
      ratio: 2
    }
  }
}
```

---

#### Task 4.2: Add Formatting Guidelines
- [ ] Define formatting standards per data type
- [ ] Create formatter utility functions
- [ ] Add locale support for Thai market
- [ ] Document number formatting rules

---

#### Task 4.3: Add Feedback Mechanisms
- [ ] Add `feedback` section to response
- [ ] Create improvement hint generator
- [ ] Track response metadata (tokens, model)
- [ ] Design feedback collection interface

---

#### Task 4.4: Add Educational Context
- [ ] Create `learnMore` array in context
- [ ] Add explanations for key concepts
- [ ] Link to relevant resources
- [ ] Create concept glossary

**Example**:
```typescript
learnMore: [
  {
    topic: 'PE Band Analysis',
    relevance: 'Method used to determine if stock is undervalued based on historical PE ratios',
    resource: 'https://investopedia.com/terms/p/price-earnings-ratio.asp'
  },
  {
    topic: 'Altman Z-Score',
    relevance: 'Measures bankruptcy risk - scores above 3 indicate safe financial health',
    resource: 'https://investopedia.com/terms/a/altman.asp'
  },
  {
    topic: 'Margin of Safety',
    relevance: 'Buffer between current price and intrinsic value - larger means lower risk',
  }
]
```

---

#### Task 4.5: Optimize Response Size
- [ ] Remove redundant data
- [ ] Compress repeated structures
- [ ] Use references instead of duplication
- [ ] Create size budget per section

**Optimization strategies**:
```typescript
// BEFORE (redundant)
data: {
  symbol: 'ADVANC.BK',
  symbol: 'ADVANC.BK',  // duplicate
  ...
}

// AFTER (optimized)
data: {
  _ref: { symbol: 'ADVANC.BK' },  // defined once
  ...
}
```

---

#### Task 4.6: Create Comprehensive Examples
- [ ] Create example responses for each tool
- [ ] Document edge cases
- [ ] Create comparison examples (good vs bad)
- [ ] Build example gallery

---

## 📈 Success Metrics

### Phase 1 Success Criteria (8/10)
- ✅ All tools use structured warnings with severity
- ✅ Redundant `action` field removed
- ✅ Numerical confidence scores included
- ✅ Validation tracking implemented
- ✅ Presentation headline added

### Phase 2 Success Criteria (9/10)
- ✅ Semantic keyFindings with assessments
- ✅ Data freshness tracking with age calculation
- ✅ Recommendation drivers included
- ✅ Assumptions explicitly tracked
- ✅ Risk assessment included

### Phase 3 Success Criteria (9.5/10)
- ✅ Related tools with suggested parameters
- ✅ Next steps with tool/params
- ✅ Tool dependency graph created
- ✅ Alternative tools documented

### Phase 4 Success Criteria (10/10)
- ✅ Presentation section with tables/charts
- ✅ Educational context included
- ✅ Response size optimized
- ✅ Comprehensive examples documented
- ✅ All 13+ tools converted to V2 format

---

## 🎯 Quick Reference: 10/10 Response Example

```typescript
{
  summary: {
    title: "PE Band Valuation - ADVANC.BK",
    what: "Price-to-earnings ratio analysis using historical PE range",
    input: { symbol: "ADVANC.BK", period: "5y" },
    keyFindings: [
      {
        metric: "PE Ratio",
        value: 12.5,
        formatted: "12.50x",
        assessment: "good",
        icon: "✓",
        threshold: { value: 15, operator: "<" },
        weight: 0.7
      },
      {
        metric: "Margin of Safety",
        value: 25.3,
        formatted: "25.3%",
        assessment: "excellent",
        icon: "✓",
        threshold: { value: 20, operator: ">=" },
        weight: 0.9
      }
    ],
    conclusion: "ADVANC.BK is undervalued by 15% based on PE Band analysis with strong financial health",
    confidence: {
      level: "High",
      score: 0.82,
      factors: [
        "High data quality (95% completeness)",
        "Verified data source (SET Watch API)",
        "Fresh data (2 minutes old)",
        "Strong financial health indicators"
      ]
    }
  },
  data: {
    processed: { /* ... */ },
    validation: {
      validFields: ["peRatio", "currentPrice", "eps"],
      missingFields: [],
      nullFields: [],
      defaultFields: []
    },
    dataQuality: {
      completeness: { percentage: 95, status: "complete" },
      accuracy: { score: 0.9, factors: [/* ... */] },
      freshness: {
        timestamp: "2025-01-17T10:30:00Z",
        age: { value: 2, unit: "minutes" },
        status: "fresh",
        nextUpdate: "2025-01-17T10:35:00Z"
      }
    }
  },
  metadata: {
    tool: { name: "calculate_pe_band", version: "2.0", category: "Valuation" },
    execution: { duration: 150, timestamp: "2025-01-17T10:30:01Z", cached: false },
    source: { name: "SET Watch API", url: "https://set-watch-api.vercel.app", reliability: "high" },
    assumptions: [
      { what: "Historical PE range valid", why: "5-year data", impact: "high" }
    ],
    warnings: []
  },
  recommendations: {
    primary: {
      action: "Buy",
      confidence: 0.82,
      priority: "High",
      reasoning: "Stock trading below fair value with strong fundamentals",
      drivers: [
        { factor: "PE Ratio", value: 12.5, weight: 0.35, direction: "positive" },
        { factor: "ROE", value: 18.5, weight: 0.3, direction: "positive" },
        { factor: "Margin of Safety", value: 25.3, weight: 0.35, direction: "positive" }
      ]
    },
    scenarios: [
      { condition: "Price drops below ฿140", action: "Strong Buy", reasoning: "25% below fair value" }
    ],
    nextSteps: [
      { action: "Verify with DCF", tool: "calculate_dcf", params: { /* ... */ }, priority: "now", reason: "Cross-check valuation" }
    ],
    risks: [
      { what: "PE multiples may contract", likelihood: "medium", impact: "medium", mitigation: "Monitor market trends" }
    ]
  },
  context: {
    relatedTools: [
      { name: "calculate_dcf", reason: "Verify valuation", suggestedParams: { /* ... */ }, expectedValue: "FCF-based intrinsic value", priority: "high" }
    ],
    alternativeTools: [
      { name: "calculate_ddm", whenToUse: "For dividend stocks", tradeoffs: ["Only works with dividends"] }
    ],
    suggestedFollowUp: [
      { question: "What is your investment horizon?", why: "Affects valuation method", options: ["Short", "Medium", "Long"] }
    ],
    dependencies: { requires: ["fetch_stock_data"], provides: ["fair_value", "recommendation"] },
    learnMore: [
      { topic: "PE Band Analysis", relevance: "Historical PE valuation method" }
    ]
  },
  presentation: {
    headline: "ADVANC.BK appears undervalued by 15% based on PE Band analysis",
    highlights: ["PE 12.5x vs average 15x", "25% margin of safety", "Strong financial health"],
    tables: [/* ... */],
    formatting: { currency: "฿", locale: "th-TH", decimals: { price: 2, percentage: 1, ratio: 2 } }
  }
}
```

---

## 📚 Related Documentation

- [Current Implementation](src/types/responses.ts) - SmartResponse interface
- [Tool Formatters](src/tools/) - Current response formatters
- [Response Examples](test-smart-response.mjs) - Example outputs
- [Improvement Topics](IMPROVEMENT_TOPICS.md) - Original improvement ideas

---

## 🚀 Next Steps

1. **Review this document** with team/stakeholders
2. **Prioritize phases** based on project goals
3. **Assign tasks** to developers
4. **Set timeline** for each phase
5. **Create tracking** for implementation progress
6. **Test thoroughly** after each phase
7. **Gather feedback** from AI performance
8. **Iterate** based on real-world usage

---

**Document Version**: 1.0
**Last Updated**: 2025-01-17
**Status**: Ready for Implementation
**Estimated Timeline**: 6 weeks (Phases 1-4)
**Target Quality Score**: 10/10 for AI consumption
