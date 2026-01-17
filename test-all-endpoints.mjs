#!/usr/bin/env node
/**
 * Comprehensive API Endpoint Verification
 * Tests all SET Watch API endpoints to ensure they're working correctly
 */

import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use default API host if not configured
const BASE_URL = process.env.SET_WATCH_API_HOST || 'https://set-watch-api.vercel.app';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

// Test symbols - different market caps and sectors
const TEST_SYMBOLS = ['ADVANC', 'KBANK', 'PTT', 'AOT', 'SCB'];
const PERIODS = ['TTM', 'Quarterly', 'Annual'];

const results = [];

// Test each endpoint
async function testEndpoint(endpoint, symbol = 'ADVANC', period = null) {
  const startTime = Date.now();
  try {
    const url = period
      ? `${BASE_URL}${endpoint}/${symbol}.BK/${period}`
      : `${BASE_URL}${endpoint}/${symbol}.BK`;

    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const responseTime = Date.now() - startTime;

    const hasData = response.data && (
      Array.isArray(response.data) ? response.data.length > 0 :
      Object.keys(response.data).length > 0
    );

    if (hasData) {
      return {
        endpoint,
        symbol,
        period,
        status: 'PASS',
        message: `Success (${responseTime}ms)`,
        responseTime,
        dataSample: Array.isArray(response.data)
          ? `${response.data.length} data points`
          : `${Object.keys(response.data).length} fields`
      };
    } else {
      return {
        endpoint,
        symbol,
        period,
        status: 'FAIL',
        message: 'Empty response',
        responseTime
      };
    }
  } catch (error) {
    return {
      endpoint,
      symbol,
      period,
      status: 'FAIL',
      message: `${error.response?.status || error.code}: ${error.message}`,
      responseTime: Date.now() - startTime
    };
  }
}

async function testAllEndpoints() {
  console.log(`\n${colors.bold}${colors.cyan}===================================================`);
  console.log(`  COMPREHENSIVE API ENDPOINT VERIFICATION`);
  console.log(`  API Host: ${BASE_URL}`);
  console.log(`  Testing Symbols: ${TEST_SYMBOLS.join(', ')}`);
  console.log(`===================================================${colors.reset}\n`);

  let testCount = 0;
  let passCount = 0;
  let failCount = 0;

  // Group 1: Main stock data
  console.log(`${colors.cyan}[Group 1] Main Stock Data Endpoint${colors.reset}`);
  const endpoint1 = '/mypick/snapStatistics';
  for (const symbol of TEST_SYMBOLS) {
    const result = await testEndpoint(endpoint1, symbol);
    results.push(result);
    testCount++;
    if (result.status === 'PASS') passCount++; else failCount++;
    printTestResult(result);
  }

  // Group 2: Financial Statements - Income
  console.log(`\n${colors.cyan}[Group 2] Financial Statements - Income Statement${colors.reset}`);
  const endpoint2 = '/mypick/snapFinancials';
  for (const symbol of TEST_SYMBOLS.slice(0, 2)) {
    for (const period of PERIODS) {
      const result = await testEndpoint(`${endpoint2}/Income`, symbol, period);
      results.push(result);
      testCount++;
      if (result.status === 'PASS') passCount++; else failCount++;
      printTestResult(result);
    }
  }

  // Group 3: Financial Statements - Balance Sheet
  console.log(`\n${colors.cyan}[Group 3] Financial Statements - Balance Sheet${colors.reset}`);
  for (const symbol of TEST_SYMBOLS.slice(0, 2)) {
    for (const period of PERIODS) {
      const result = await testEndpoint(`${endpoint2}/Balance Sheet`, symbol, period);
      results.push(result);
      testCount++;
      if (result.status === 'PASS') passCount++; else failCount++;
      printTestResult(result);
    }
  }

  // Group 4: Financial Statements - Cash Flow
  console.log(`\n${colors.cyan}[Group 4] Financial Statements - Cash Flow${colors.reset}`);
  for (const symbol of TEST_SYMBOLS.slice(0, 2)) {
    for (const period of PERIODS) {
      const result = await testEndpoint(`${endpoint2}/Cash Flow`, symbol, period);
      results.push(result);
      testCount++;
      if (result.status === 'PASS') passCount++; else failCount++;
      printTestResult(result);
    }
  }

  // Group 5: Historical Ratios
  console.log(`\n${colors.cyan}[Group 5] Historical Ratios${colors.reset}`);
  const endpoint5 = '/mypick/Ratio4Chart';
  for (const symbol of TEST_SYMBOLS.slice(0, 2)) {
    for (const period of ['TTM', 'Quarterly']) {
      const result = await testEndpoint(`${endpoint5}`, symbol, period);
      results.push(result);
      testCount++;
      if (result.status === 'PASS') passCount++; else failCount++;
      printTestResult(result);
    }
  }

  // Group 6: Edge cases
  console.log(`\n${colors.cyan}[Group 6] Edge Case Tests${colors.reset}`);
  console.log(`Testing invalid symbol...`);
  const edgeResult = await testEndpoint('/mypick/snapStatistics', 'INVALID999');
  results.push(edgeResult);
  testCount++;
  if (edgeResult.status === 'FAIL' && edgeResult.message.includes('404')) passCount++; else failCount++;
  printTestResult(edgeResult);

  // Print summary
  printSummary(testCount, passCount, failCount);
}

function printTestResult(result) {
  const icon = result.status === 'PASS' ? '✓' : '✗';
  const color = result.status === 'PASS' ? colors.green : colors.red;
  const periodStr = result.period ? ` (${result.period})` : '';

  console.log(`${color}${icon} ${result.endpoint}/${result.symbol}.BK${periodStr}${colors.reset}`);
  console.log(`  ${result.message} (${result.responseTime}ms)`);
  if (result.dataSample) {
    console.log(`  Data: ${result.dataSample}`);
  }
}

function printSummary(total, passed, failed) {
  console.log(`\n${colors.bold}${colors.cyan}===================================================`);
  console.log(`  FINAL SUMMARY`);
  console.log(`===================================================${colors.reset}\n`);

  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed} (${(passed/total*100).toFixed(1)}%)${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed} (${(failed/total*100).toFixed(1)}%)${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}✓ ALL ENDPOINTS WORKING!${colors.reset}`);
    console.log(`All ${total} API endpoints from set-watch-api.vercel.app are functional.\n`);
  } else {
    console.log(`\n${colors.yellow}⚠ ${failed} endpoint(s) failed${colors.reset}`);
    console.log(`Check the failed tests above for specific error details.\n`);
  }

  // Breakdown by endpoint type
  const endpointTypes = {
    'Stock Data': results.filter(r => r.endpoint.includes('snapStatistics')),
    'Income Statement': results.filter(r => r.endpoint.includes('/Income')),
    'Balance Sheet': results.filter(r => r => r.endpoint.includes('/Balance Sheet')),
    'Cash Flow': results.filter(r => r.endpoint.includes('/Cash Flow')),
    'Historical Ratios': results.filter(r => r.endpoint.includes('Ratio4Chart'))
  };

  console.log(`\n${colors.cyan}Breakdown by Endpoint Type:${colors.reset}`);
  for (const [type, typeResults] of Object.entries(endpointTypes)) {
    const typePass = typeResults.filter(r => r.status === 'PASS').length;
    const typeTotal = typeResults.length;
    console.log(`  ${type}: ${typePass}/${typeTotal} (${(typePass/typeTotal*100).toFixed(0)}%)`);
  }

  console.log(`\n${colors.cyan}===================================================${colors.reset}\n`);
}

// Run tests
testAllEndpoints().catch(error => {
  console.error(`${colors.red}Test suite failed:${colors.reset}`, error.message);
  process.exit(1);
});
