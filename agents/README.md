# AI Agents - Quick Start Guide

> Get started with AI-powered development and QA for your MCP Stock Analysis Server

---

## 🚀 Setup (5 minutes)

### 1. Install Dependencies

```bash
npm install --save-dev chalk ora commander
```

### 2. Make Scripts Executable

```bash
chmod +x agents/*.mjs
chmod +x agents/*.ts
```

### 3. Test the Agents

```bash
# Check agent status
node agents/cli.mjs status

# Expected output:
# 🤖 MCP Agent Status
# Agents: 🟢 DevBot - Ready, 🟢 QABot - Ready
```

---

## 📖 Quick Reference

| Command | Description | Example |
|---------|-------------|---------|
| `dev <task>` | Development task | `dev "Fix PE Band bug"` |
| `qa <task>` | QA task | `qa "Test PE Band edge cases"` |
| `workflow <task>` | Full Dev+QA workflow | `workflow "Add beta calculation"` |
| `create-tool <name> <desc>` | Create new tool | `create-tool wacc "Calculate WACC"` |
| `convert-to-v2 <tool>` | Convert to V2 format | `convert-to-v2 fetch_stock_data` |
| `validate <tool>` | Validate and test | `validate calculate_pe_band` |
| `test [pattern]` | Run tests | `test "pe_band"` |
| `validate-smartresponse <file>` | Validate format | `validate-smartresponse test.mjs` |
| `status` | Show status | `status` |

---

## 💡 Common Tasks

### Task 1: Create a New Valuation Tool

```bash
node agents/cli.mjs create-tool calculate_ev_ebitda "Calculates EV/EBITDA ratio for Thai stocks"
```

**What happens**:
1. DevBot analyzes requirements
2. Generates TypeScript code
3. Creates SmartResponseV2 formatter
4. Registers the tool
5. Shows files modified

**Output**:
```typescript
// Generated tool structure:
{
  name: 'calculate_ev_ebitda',
  handler: async (args) => {
    // Implementation
    return formatEV_EBITDAResponse(data);
  }
}
```

---

### Task 2: Fix a Bug

```bash
node agents/cli.mjs dev "fetch_stock_data throws error when symbol is TRUE"
```

**What happens**:
1. DevBot reads the error
2. Analyzes the code
3. Identifies root cause
4. Implements fix
5. Shows what changed

---

### Task 3: Convert to SmartResponseV2

```bash
node agents/cli.mjs convert-to-v2 calculate_pe_band
```

**Improvements**:
- ✅ Semantic keyFindings with assessments
- ✅ Confidence score (0-1)
- ✅ Structured warnings
- ✅ Data validation tracking
- ✅ Recommendation drivers
- ✅ Risk assessment

---

### Task 4: Run Complete Workflow

```bash
node agents/cli.mjs workflow "Add dividend yield calculation to complete_valuation"
```

**Workflow**:
```
Step 1: 🤖 Development (DevBot)
  → Analyze requirements
  → Implement feature
  → Add SmartResponseV2 format
  → Include error handling

Step 2: 🔨 Build
  → Compile TypeScript
  → Type checking
  → Linting

Step 3: 🧪 QA (QABot)
  → Create tests
  → Run test suite
  → Validate SmartResponse
  → Check coverage

Result: ✅ Ready to deploy
```

---

## 📊 SmartResponse Validation

### Validate a Response File

```bash
node agents/cli.mjs validate-smartresponse test-smart-response.mjs
```

**Sample Output**:
```
============================================================
SmartResponse Validation Report: test-smart-response.mjs
============================================================

Status: ✅ VALID
Score: 🟢 85/100

⚠️  WARNINGS:
  [summary.keyFindings] Using plain strings (V1 format)
    💡 Convert to semantic objects with metric, value, assessment

💡 RECOMMENDATIONS:
  • Convert keyFindings to SmartResponseV2 format
  • Add confidence scoring (0-1)
  • Add data freshness tracking
  • Add recommendation drivers

============================================================
```

### Validation Scores

| Score | Quality | Action |
|-------|---------|--------|
| 90-100 | 🟢 Excellent | Production ready |
| 80-89 | 🟢 Good | Minor improvements |
| 70-79 | 🟡 Fair | Needs enhancement |
| 60-69 | 🟠 Poor | Significant work needed |
| 0-59 | 🔴 Critical | Complete rewrite needed |

---

## 🎯 Development Workflows

### Workflow 1: New Feature

```bash
# 1. Create the feature
node agents/cli.mjs dev "Add PEG ratio calculation to fetch_stock_data"

# 2. Build and type check
npm run build
npm run type-check

# 3. Run tests
npm run test

# 4. Validate format
node agents/cli.mjs validate-smartresponse src/tools/setWatchApi.ts

# 5. Create PR
git add .
git commit -m "feat: add PEG ratio calculation"
git push
```

### Workflow 2: Bug Fix

```bash
# 1. Diagnose and fix
node agents/cli.mjs workflow "Fix calculate_dcf crash when FCF is zero"

# This runs both DevBot and QABot automatically

# 2. Verify fix
npm run test -- calculate_dcf

# 3. Check coverage
npm run test -- --coverage

# 4. Deploy if all pass
```

### Workflow 3: SmartResponse V2 Migration

```bash
# Check current status
node agents/cli.mjs status

# Convert one tool
node agents/cli.mjs convert-to-v2 fetch_stock_data

# Validate the conversion
node agents/cli.mjs qa "Validate fetch_stock_data SmartResponseV2 format"

# Run tests
npm run test -- fetch_stock_data

# Repeat for next tool...
node agents/cli.mjs convert-to-v2 complete_valuation
```

---

## 🧪 Testing with QABot

### Generate Tests for a Tool

```bash
node agents/cli.mjs qa "Create comprehensive tests for calculate_pe_band including:
- Happy path scenarios
- Edge cases (zero, negative, null values)
- Error handling
- SmartResponse validation
- Performance tests"
```

**Generated Tests Include**:
- ✅ Unit tests for all functions
- ✅ Edge case coverage
- ✅ Error scenarios
- ✅ SmartResponse format validation
- ✅ Mock API responses
- ✅ Performance benchmarks

### Run Specific Test Suite

```bash
# Test a specific tool
node agents/cli.mjs test "pe_band"

# Run all tests
node agents/cli.mjs test

# Run with coverage
npm run test -- --coverage
```

---

## 📈 SmartResponse V2 Progress Tracker

### Track Your Progress

```bash
# Check which tools need conversion
node agents/cli.mjs status

# Expected output:
# SmartResponse V2 Progress:
#   ✅ fetch_stock_data - Converted (85/100)
#   ⏳ complete_valuation - Not converted
#   ⏳ calculate_pe_band - Not converted
#   ⏳ calculate_ddm - Not converted
#   ...
```

### Conversion Checklist

For each tool, verify:

- [ ] Semantic keyFindings (not plain strings)
- [ ] Confidence score (0-1)
- [ ] Structured warnings with severity
- [ ] Data validation tracking
- [ ] Data freshness tracking
- [ ] Recommendation drivers
- [ ] Risk assessment
- [ ] Related tools with suggested params
- [ ] Enhanced next steps
- [ ] Presentation section

---

## 🔍 Debugging with Agents

### Debug a Failing Test

```bash
node agents/cli.mjs dev "Debug: calculate_pe_band test fails when PE is negative. Error: Cannot read property 'toFixed' of undefined"
```

**DevBot will**:
1. Read the test error
2. Find the problematic code
3. Identify the root cause
4. Implement a fix
5. Add null safety
6. Update tests

### Debug SmartResponse Format

```bash
node agents/cli.mjs validate-smartresponse src/tools/setWatchApi.ts
```

**Look for**:
- Missing required sections
- Invalid data types
- V1 vs V2 format issues
- Empty required fields

---

## 📝 Agent Prompts

### Effective DevBot Prompts

| Task | Example Prompt |
|------|----------------|
| Create tool | `"Create a tool called 'calculate_roe' that calculates Return on Equity with inputs: netIncome, shareholderEquity"` |
| Fix bug | `"Fix the error in fetch_stock_data where it crashes when API returns null for peRatio"` |
| Refactor | `"Refactor formatStockDataResponse to extract keyFindings generation into a separate function"` |
| Add feature | `"Add dividend growth rate calculation to fetch_stock_data tool"` |
| Convert V2 | `"Convert calculate_dcf to SmartResponseV2 with semantic keyFindings and confidence scoring"` |

### Effective QABot Prompts

| Task | Example Prompt |
|------|----------------|
| Create tests | `"Create comprehensive tests for calculate_wacc including edge cases for zero and negative values"` |
| Validate format | `"Validate SmartResponse format for complete_valuation and check for V2 compliance"` |
| Coverage | `"Analyze test coverage for stockValuation.ts and identify missing test cases"` |
| API test | `"Test SET Watch API integration for fetch_stock_data with timeout and error scenarios"` |
| Performance | `"Run performance tests for complete_valuation and check if it completes under 5 seconds"` |

---

## 🎓 Tips and Best Practices

### DevBot Tips

1. **Be Specific**: Include exact error messages
   ```bash
   # Good
   dev "TypeError: Cannot read property 'peRatio' of undefined at line 45"

   # Bad
   dev "Fix peRatio error"
   ```

2. **Include Context**: Mention what you're trying to achieve
   ```bash
   # Good
   dev "Add PEG ratio to fetch_stock_data. PEG = PE / (Growth Rate * 100)"

   # Bad
   dev "Add PEG ratio"
   ```

3. **Request Tests**: Ask QABot after DevBot
   ```bash
   workflow "Add new feature"  # Runs both DevBot and QABot
   ```

### QABot Tips

1. **Specify Coverage**: Mention what to test
   ```bash
   # Good
   qa "Test calculate_pe_band with edge cases: zero PE, negative PE, null values, and validate SmartResponse format"

   # Bad
   qa "Test PE Band"
   ```

2. **Request Scenarios**: Ask for specific test scenarios
   ```bash
   qa "Create test scenarios for: happy path, API timeout, null data, and SmartResponse validation"
   ```

3. **Check Coverage**: Always verify
   ```bash
   qa "Run tests with coverage and identify which lines are not covered"
   ```

---

## 🚨 Troubleshooting

### Agent Not Responding

**Problem**: Agent seems stuck

**Solution**:
```bash
# Check if node process is running
ps aux | grep node

# Kill if needed
killall node

# Try again with verbose mode
DEBUG=* node agents/cli.mjs dev "task"
```

### Build Errors After Agent Changes

**Problem**: `npm run build` fails after agent makes changes

**Solution**:
```bash
# 1. Check type errors
npx tsc --noEmit

# 2. Ask DevBot to fix
node agents/cli.mjs dev "Fix TypeScript errors: [paste errors]"

# 3. Rebuild
npm run build
```

### Test Failures

**Problem**: Tests fail after agent changes

**Solution**:
```bash
# 1. Run failing test with verbose output
npm run test -- --reporter=verbose <test-name>

# 2. Ask QABot to fix
node agents/cli.mjs qa "Fix failing test: [paste test output]"

# 3. Verify fix
npm run test
```

---

## 📚 Additional Resources

- **[DevBot Documentation](ai-dev-agent.md)** - Full agent capabilities
- **[QABot Documentation](ai-qa-agent.md)** - Testing strategies
- **[Agent Setup Guide](agent-setup.md)** - Technical setup details
- **[SmartResponse 10/10 Guide](../SMART_RESPONSE_10X_GUIDE.md)** - Format specification
- **[Implementation Checklist](../SMART_RESPONSE_CHECKLIST.md)** - Migration tasks

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Development
dev "task description"                      # Development task
create-tool <name> <description>            # Create new tool
convert-to-v2 <tool>                        # Convert to V2 format
workflow "task description"                 # Full Dev+QA workflow

# QA
qa "task description"                       # QA task
validate <tool>                             # Validate tool
test [pattern]                              # Run tests
validate-smartresponse <file>               # Validate format

# Info
status                                      # Show status
help                                        # Show help
```

---

**Ready to use your AI agents!** 🚀

Start with: `node agents/cli.mjs status` to verify everything is working.
