#!/usr/bin/env node
/**
 * Stock Tools Verification Script
 * Tests all MCP tools that fetch stock information to verify they work correctly
 */

import axios from 'axios';
import { API_CONFIG } from './dist/config/index.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

const SYMBOL = 'ADVANC'; // Test with ADVANC (a large cap Thai stock)
const BASE_URL = API_CONFIG.SET_WATCH.HOST;

interface TestResult {
  tool: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  error?: string;
  responseTime?: number;
}

const results: TestResult[] = [];

// Helper to make test API calls
async function testEndpoint(name: string, endpoint: string): Promise<TestResult> {
  const startTime = Date.now();
  try {
    const response = await axios.get(endpoint, {
      timeout: 10000,
      headers: API_CONFIG.SET_WATCH.HEADERS
    });
    const responseTime = Date.now() - startTime;

    if (response.data && Object.keys(response.data).length > 0) {
      return {
        tool: name,
        status: 'PASS',
        message: `Successfully fetched data (${responseTime}ms)`,
        responseTime
      };
    } else {
      return {
        tool: name,
        status: 'FAIL',
        message: 'Empty response data',
        responseTime
      };
    }
  } catch (error: any) {
    return {
      tool: name,
      status: 'FAIL',
      message: `Request failed: ${error.message}`,
      error: error.code,
      responseTime: Date.now() - startTime
    };
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}===================================================`);
  console.log(`  Stock Information Tools Verification`);
  console.log(`  Testing Symbol: ${SYMBOL}.BK`);
  console.log(`  API Host: ${BASE_URL}`);
  console.log(`===================================================${colors.reset}\n`);

  // Test 1: Main stock data endpoint
  console.log(`${colors.cyan}[1/7] Testing fetch_stock_data...${colors.reset}`);
  results.push(await testEndpoint(
    'fetch_stock_data',
    `${BASE_URL}/mypick/snapStatistics/${SYMBOL}.BK`
  ));
  printResult(results[results.length - 1]);

  // Test 2: Quarterly income statement
  console.log(`\n${colors.cyan}[2/7] Testing fetch_income_statement (Quarterly)...${colors.reset}`);
  results.push(await testEndpoint(
    'fetch_income_statement (Quarterly)',
    `${BASE_URL}/mypick/snapFinancials/${SYMBOL}.BK/Income/Quarterly`
  ));
  printResult(results[results.length - 1]);

  // Test 3: Annual income statement
  console.log(`\n${colors.cyan}[3/7] Testing fetch_income_statement (Annual)...${colors.reset}`);
  results.push(await testEndpoint(
    'fetch_income_statement (Annual)',
    `${BASE_URL}/mypick/snapFinancials/${SYMBOL}.BK/Income/Annual`
  ));
  printResult(results[results.length - 1]);

  // Test 4: Balance sheet
  console.log(`\n${colors.cyan}[4/7] Testing fetch_balance_sheet...${colors.reset}`);
  results.push(await testEndpoint(
    'fetch_balance_sheet',
    `${BASE_URL}/mypick/snapFinancials/${SYMBOL}.BK/Balance Sheet/TTM`
  ));
  printResult(results[results.length - 1]);

  // Test 5: Cash flow statement
  console.log(`\n${colors.cyan}[5/7] Testing fetch_cash_flow_statement...${colors.reset}`);
  results.push(await testEndpoint(
    'fetch_cash_flow_statement',
    `${BASE_URL}/mypick/snapFinancials/${SYMBOL}.BK/Cash Flow/TTM`
  ));
  printResult(results[results.length - 1]);

  // Test 6: Historical ratios
  console.log(`\n${colors.cyan}[6/7] Testing fetch_historical_ratios...${colors.reset}`);
  results.push(await testEndpoint(
    'fetch_historical_ratios',
    `${BASE_URL}/mypick/Ratio4Chart/${SYMBOL}.BK/TTM`
  ));
  printResult(results[results.length - 1]);

  // Test 7: Historical ratios (Quarterly)
  console.log(`\n${colors.cyan}[7/7] Testing fetch_historical_ratios (Quarterly)...${colors.reset}`);
  results.push(await testEndpoint(
    'fetch_historical_ratios (Quarterly)',
    `${BASE_URL}/mypick/Ratio4Chart/${SYMBOL}.BK/Quarterly`
  ));
  printResult(results[results.length - 1]);

  // Summary
  printSummary();
}

function printResult(result: TestResult) {
  const icon = result.status === 'PASS' ? '✓' : result.status === 'FAIL' ? '✗' : '○';
  const color = result.status === 'PASS' ? colors.green : result.status === 'FAIL' ? colors.red : colors.yellow;

  console.log(`${color}${icon} ${result.tool}${colors.reset}`);
  console.log(`  Status: ${result.status}`);
  console.log(`  ${result.message}`);
  if (result.error) {
    console.log(`  Error Code: ${result.error}`);
  }
  if (result.responseTime) {
    console.log(`  Response Time: ${result.responseTime}ms`);
  }
}

function printSummary() {
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`\n${colors.cyan}===================================================`);
  console.log(`  SUMMARY`);
  console.log(`===================================================${colors.reset}\n`);

  console.log(`Total Tests: ${total}`);
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`);

  if (failed === 0) {
    console.log(`\n${colors.green}✓ All stock information tools are working!${colors.reset}`);
  } else {
    console.log(`\n${colors.yellow}! Some tools failed. Check the errors above.${colors.reset}`);
    console.log(`\n${colors.gray}Common issues:${colors.reset}`);
    console.log(`  - 404: Symbol not found (try a different stock)`);
    console.log(`  - Network: Check internet connection`);
    console.log(`  - Timeout: API may be slow, try again`);
    console.log(`  - Server Error: API may be down`);
  }

  console.log(`\n${colors.cyan}===================================================${colors.reset}\n`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite failed:${colors.reset}`, error.message);
  process.exit(1);
});
