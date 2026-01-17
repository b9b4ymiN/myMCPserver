#!/usr/bin/env node
/**
 * Test Smart Response Format
 * Shows example responses from tools with smart format
 */

// Example 1: PE Band Valuation (without API call)
const peBandExample = {
  summary: {
    title: "PE Band Valuation - ADVANC.BK",
    what: "Price-to-earnings ratio analysis using historical PE range",
    keyFindings: [
      "PE ratio of 12.50 (historical average: 15.00)",
      "PE range: 8.00 - 22.00",
      "Fair value: ฿96.00 - ฿264.00"
    ],
    action: "Hold",
    confidence: "Low"
  },
  data: {
    symbol: "ADVANC.BK",
    currentPE: 12.5,
    averagePE: 15,
    minPE: 8,
    maxPE: 22,
    pePercentile: 25,
    fairValueRange: { lower: 96, upper: 264 },
    recommendation: "Fairly Valued",
    analysis: "Stock is trading within its historical PE range. Current PE (12.50) is at the 25th percentile of historical values."
  },
  metadata: {
    tool: "calculate_pe_band",
    category: "Valuation",
    dataSource: "Calculated from inputs",
    lastUpdated: new Date().toISOString(),
    processingTime: 0,
    dataQuality: "high",
    completeness: "complete",
    warnings: []
  },
  recommendations: {
    investment: "Hold",
    priority: "Low",
    reasoning: "Fairly Valued based on PE analysis",
    nextSteps: [
      "Wait for better entry point",
      "Monitor for changes"
    ]
  },
  context: {
    relatedTools: ["calculate_margin_of_safety", "calculate_dcf", "fetch_stock_data"],
    alternativeTools: [],
    suggestedFollowUp: [
      "Check financial health metrics",
      "Review technical indicators"
    ]
  }
};

// Example 2: Stock Data (without API call)
const stockDataExample = {
  summary: {
    title: "Stock Data - ADVANC.BK",
    what: "Comprehensive stock data and metrics from SET Watch API",
    keyFindings: [
      "Current Price: ฿156.25",
      "PE Ratio: 12.50 | PB Ratio: 1.60",
      "ROE: 18.5% | Dividend Yield: 3.20%",
      "Debt-to-Equity: 0.45 | Beta: 0.85",
      "✓ Strong financial health (Altman Z-Score: 3.45)",
      "✓ Excellent profitability (ROE: 18.5%)"
    ],
    action: "Buy",
    confidence: "Medium"
  },
  data: {
    summary: {
      symbol: "ADVANC.BK",
      currentPrice: "฿156.25",
      currency: "THB",
      exchange: "SET"
    },
    valuation: {
      peRatio: 12.5,
      pbRatio: 1.6,
      dividendYield: 0.032,
      roe: 0.185
    },
    health: {
      altmanZScore: 3.45,
      piotroskiFScore: 7,
      currentRatio: 1.8,
      debtToEquity: 0.45
    },
    technical: {
      beta: 0.85,
      priceChange52W: 15.5,
      rsi: 55
    }
  },
  metadata: {
    tool: "fetch_stock_data",
    category: "Data Fetching",
    dataSource: "SET Watch API",
    lastUpdated: new Date().toISOString(),
    processingTime: 0,
    dataQuality: "high",
    completeness: "complete",
    warnings: []
  },
  recommendations: {
    investment: "Buy",
    priority: "Medium",
    reasoning: "Based on PE ratio of 12.50 and ROE of 18.5%",
    nextSteps: [
      "Run valuation models",
      "Check financial statements",
      "Verify earnings quality"
    ]
  },
  context: {
    relatedTools: ["complete_valuation", "calculate_pe_band", "calculate_dcf", "calculate_ddm"],
    alternativeTools: ["calculate_canslim_score"],
    suggestedFollowUp: [
      "Run complete valuation for investment decision",
      "Check financial statements for details",
      "Review technical indicators"
    ]
  }
};

// Example 3: Complete Valuation
const completeValuationExample = {
  summary: {
    title: "Complete Valuation - ADVANC.BK",
    what: "Comprehensive valuation using PE Band, DDM, DCF, and Margin of Safety",
    keyFindings: [
      "PE Band: Undervalued (PE: 12.5)",
      "DDM: Buy (Intrinsic: ฿180.50)",
      "DCF: Hold (Intrinsic: ฿142.30)",
      "Margin of Safety: 25.3% (Low risk)"
    ],
    action: "Buy",
    confidence: "High"
  },
  data: {
    symbol: "ADVANC.BK",
    currentPrice: 156.25,
    lastUpdated: new Date().toISOString(),
    valuations: {
      peBand: {
        currentPE: 12.5,
        averagePE: 15,
        minPE: 8,
        maxPE: 22,
        fairValueRange: { lower: 96, upper: 264 },
        recommendation: "Undervalued"
      },
      ddm: {
        dividend: 5,
        requiredReturn: 0.1,
        growthRate: 0.05,
        intrinsicValue: 180.50,
        marginOfSafety: -13.45,
        recommendation: "Buy"
      },
      dcf: {
        freeCashFlow: 45000000000,
        growthRate: 0.05,
        discountRate: 0.1,
        terminalGrowthRate: 0.025,
        intrinsicValue: 142.30,
        marginOfSafety: 9.04,
        recommendation: "Hold",
        projections: []
      },
      marginOfSafety: {
        averageIntrinsicValue: 139.60,
        marginOfSafety: 25.3,
        recommendation: "Buy",
        riskLevel: "Low"
      }
    },
    summary: {
      peBand: "Undervalued",
      ddm: "Buy",
      dcf: "Hold",
      marginOfSafety: "Buy",
      overall: "Buy"
    }
  },
  metadata: {
    tool: "complete_valuation",
    category: "Valuation",
    dataSource: "SET Watch API + Calculated Valuations",
    lastUpdated: new Date().toISOString(),
    processingTime: 0,
    dataQuality: "high",
    completeness: "complete",
    warnings: []
  },
  recommendations: {
    investment: "Buy",
    priority: "High",
    reasoning: "Buy based on 3 valuation methods (PE Band, DDM, Margin of Safety)",
    nextSteps: [
      "Verify intrinsic value assumptions",
      "Check financial health",
      "Consider position sizing"
    ]
  },
  context: {
    relatedTools: ["fetch_stock_data", "calculate_margin_of_safety", "calculate_pe_band", "calculate_dcf", "calculate_ddm"],
    alternativeTools: ["calculate_canslim_score"],
    suggestedFollowUp: [
      "Review financial statements for details",
      "Check management commentary",
      "Monitor technical indicators"
    ]
  }
};

console.log('\n=== SMART RESPONSE FORMAT EXAMPLES ===\n');

console.log('1. PE Band Valuation Response:');
console.log(JSON.stringify(peBandExample, null, 2));

console.log('\n2. Stock Data Response:');
console.log(JSON.stringify(stockDataExample, null, 2));

console.log('\n3. Complete Valuation Response:');
console.log(JSON.stringify(completeValuationExample, null, 2));

console.log('\n=== KEY COMPONENTS ===');
console.log('- summary: Quick overview (title, what, keyFindings, action, confidence)');
console.log('- data: Complete original data with structured sub-sections');
console.log('- metadata: Tool info, data quality, source, timing');
console.log('- recommendations: Investment decision, priority, reasoning, next steps');
console.log('- context: Related tools, alternatives, suggested follow-up');
