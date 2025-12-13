# 🛡️ Margin of Safety Tool Documentation

## Overview

The Margin of Safety tool calculates the difference between a stock's current market price and its intrinsic value, helping value investors make informed decisions based on Benjamin Graham's principle of buying with a safety cushion.

## What is Margin of Safety?

Margin of Safety = (Intrinsic Value - Current Price) / Intrinsic Value × 100%

A positive margin of safety means the stock is trading below its intrinsic value (undervalued), while a negative margin indicates overvaluation.

## Tool Details

### Tool Name
`calculate_margin_of_safety`

### Description
Calculate Margin of Safety for value investing decisions with risk adjustment and detailed analysis.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `symbol` | string | Yes | - | Stock symbol (e.g., AAPL, SCB) |
| `currentPrice` | number | Yes | - | Current stock price |
| `intrinsicValue` | number | Yes | - | Calculated intrinsic value of the stock |
| `valuationMethod` | string | No | Multiple Methods Average | Method used to calculate intrinsic value |
| `riskAdjustment` | number | No | 1.0 | Risk adjustment factor (0.8 for high risk, 1.0 for normal, 1.2 for low risk) |

### Valuation Method Options
- `DCF` - Discounted Cash Flow
- `DDM` - Dividend Discount Model
- `PE Band` - PE Band Analysis
- `Asset-Based` - Asset-Based Valuation
- `Multiple Methods Average` - Average of multiple methods

### Risk Adjustment Factor
- `0.5` - Very high risk (conservative)
- `0.8` - High risk
- `1.0` - Normal risk (neutral)
- `1.2` - Low risk (optimistic)
- `1.5` - Very low risk (aggressive)

## Response Format

```json
{
  "symbol": "SCB",
  "currentPrice": 145.5,
  "intrinsicValue": 180,
  "marginOfSafety": 34.5,
  "marginOfSafetyPercentage": 19.17,
  "valuationMethod": "Multiple Methods Average",
  "recommendation": "Hold",
  "analysis": "Moderate margin of safety of 19.2%. Stock is reasonably valued but may not provide sufficient margin for error...",
  "riskLevel": "Medium",
  "principlesCheck": {
    "belowIntrinsicValue": true,
    "adequateMargin": false,
    "reasonableRisk": true
  },
  "unadjustedMarginOfSafety": 19.17,
  "riskAdjustmentFactor": 1
}
```

## Recommendation Scale

| Margin of Safety | Recommendation | Risk Level | Interpretation |
|------------------|----------------|------------|----------------|
| ≥ 50% | Strong Buy | Very Low | Excellent margin with substantial downside protection |
| 30% - 49% | Buy | Low | Good margin with reasonable downside protection |
| 10% - 29% | Hold | Medium | Moderate margin, may not provide sufficient cushion |
| -10% - 9% | Sell | High | Negative margin, limited upside potential |
| < -10% | Strong Sell | Very High | Significantly overvalued with high risk of loss |

## Usage Examples

### Example 1: Conservative Value Investing

```json
{
  "tool": "calculate_margin_of_safety",
  "arguments": {
    "symbol": "SCB",
    "currentPrice": 145.50,
    "intrinsicValue": 200.00,
    "valuationMethod": "DCF",
    "riskAdjustment": 0.8
  }
}
```

**Result**: Strong Buy recommendation with 33.3% margin even after conservative risk adjustment.

### Example 2: Growth Stock Analysis

```json
{
  "tool": "calculate_margin_of_safety",
  "arguments": {
    "symbol": "PTT",
    "currentPrice": 35.00,
    "intrinsicValue": 32.00,
    "valuationMethod": "Multiple Methods Average",
    "riskAdjustment": 1.2
  }
}
```

**Result**: Sell recommendation with negative margin even after optimistic adjustment.

## Integration in Workflows

### Complete Valuation Workflow

The Margin of Safety tool is automatically included in the `complete_valuation` tool, which:

1. Fetches stock data
2. Runs PE Band, DDM, and DCF valuations
3. Calculates average intrinsic value
4. Applies margin of safety analysis
5. Provides consolidated recommendation

### Custom Valuation Workflow

```
1. Run individual valuation tools (DCF, DDM, PE Band)
2. Average the intrinsic values
3. Use calculate_margin_of_safety with the average
4. Apply risk adjustment based on company profile
5. Make investment decision
```

## Value Investing Principles Check

The tool includes a `principlesCheck` object that validates:

- **belowIntrinsicValue**: Is the price below intrinsic value?
- **adequateMargin**: Is the margin ≥ 20% (Ben Graham's rule)?
- **reasonableRisk**: Is the risk level acceptable?

## Best Practices

1. **Always use risk adjustment** for:
   - High-growth stocks (use 0.8)
   - Cyclical companies (use 0.8)
   - Stable blue-chips (use 1.2)

2. **Combine multiple valuation methods** for more accurate intrinsic value

3. **Consider qualitative factors** not captured in the calculations

4. **Update intrinsic value regularly** as new information becomes available

## Testing with curl

```bash
curl -X POST http://localhost:2901/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "calculate_margin_of_safety",
      "arguments": {
        "symbol": "ADVANC",
        "currentPrice": 185.50,
        "intrinsicValue": 220.00,
        "valuationMethod": "Multiple Methods Average",
        "riskAdjustment": 1.0
      }
    }
  }'
```

## n8n Integration

In n8n, use the MCP Client node:

1. **Tool**: `calculate_margin_of_safety`
2. **Parameters**: Fill in the required fields
3. **Dynamic Values**: Use n8n expressions for dynamic input:
   - `{{ $json.currentPrice }}`
   - `{{ $json.intrinsicValue }}`

## Common Use Cases

1. **Portfolio Screening**: Filter stocks with >30% margin of safety
2. **Buy/Sell Decisions**: Identify entry/exit points
3. **Risk Management**: Assess potential downside
4. **Performance Tracking**: Monitor margin changes over time

## Limitations

1. Relies on accurate intrinsic value calculation
2. Doesn't account for market sentiment
3. May not work well for:
   - Startups with no earnings
   - Highly speculative stocks
   - Companies in distress

## Related Tools

- `calculate_dcf` - For intrinsic value calculation
- `calculate_ddm` - For dividend-paying stocks
- `calculate_pe_band` - For relative valuation
- `complete_valuation` - For automated analysis