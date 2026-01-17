#!/usr/bin/env node
/**
 * Test AgentManager
 *
 * Quick test to verify AgentManager functionality
 */

import { AgentManager } from './AgentManager.ts';
import { SmartResponseValidator } from './SmartResponseValidator.ts';

console.log('\n🧪 Testing AgentManager\n');

const manager = new AgentManager();

// Test 1: List tools
console.log('Test 1: List Tools');
console.log('─'.repeat(40));
const tools = manager.listTools();
console.log(`Found ${tools.length} tools:`);
tools.forEach(tool => {
  console.log(`  ${tool.v2Compliant ? '✅' : '⏳'} ${tool.name}`);
});
console.log();

// Test 2: Get status
console.log('Test 2: Project Status');
console.log('─'.repeat(40));
const status = manager.getStatus();
console.log(`Tools: ${status.tools.total} total, ${status.tools.v2Compliant} V2 compliant`);
console.log(`Files: ${status.files.total} source files, ${status.files.tests} test files`);
console.log();

// Test 3: Create tool template
console.log('Test 3: Create Tool Template');
console.log('─'.repeat(40));
const createResult = await manager.createTool('test_tool', 'A test tool for demonstration');
console.log(createResult.substring(0, 500) + '...');
console.log();

// Test 4: Convert to V2 analysis
console.log('Test 4: Convert to V2 Analysis');
console.log('─'.repeat(40));
if (tools.length > 0) {
  const convertResult = await manager.convertToV2(tools[0].name);
  console.log(convertResult.substring(0, 500) + '...');
} else {
  console.log('No tools found to convert');
}
console.log();

// Test 5: Validate SmartResponse
console.log('Test 5: Validate SmartResponse');
console.log('─'.repeat(40));

// Test V1 format
const v1Response = {
  summary: {
    title: "Test",
    what: "Test response",
    keyFindings: ["Finding 1", "Finding 2"],
    action: "Buy",
    confidence: "High"
  },
  data: {},
  metadata: {
    tool: "test",
    category: "Test",
    dataSource: "Test",
    lastUpdated: new Date().toISOString(),
    dataQuality: "high",
    completeness: "complete"
  }
};

const v1Validation = SmartResponseValidator.validateV2(v1Response);
console.log('V1 Format Validation:');
console.log(`  Valid: ${v1Validation.valid}`);
console.log(`  Score: ${v1Validation.score}/100`);
console.log(`  Level: ${v1Validation.level}`);
console.log(`  Warnings: ${v1Validation.warnings.length}`);
console.log();

// Test V2 format
const v2Response = {
  summary: {
    title: "Test",
    what: "Test response",
    keyFindings: [
      { metric: "PE Ratio", value: 12.5, assessment: "good" },
      { metric: "ROE", value: 18.5, assessment: "excellent" }
    ],
    confidence: {
      level: "High",
      score: 0.82,
      factors: ["Good data quality"]
    }
  },
  data: {
    processed: {},
    dataQuality: {
      completeness: { percentage: 100, status: "complete" },
      freshness: {
        timestamp: new Date().toISOString(),
        age: { value: 2, unit: "minutes" },
        status: "fresh"
      }
    }
  },
  metadata: {
    tool: "test",
    category: "Test",
    dataSource: "Test",
    lastUpdated: new Date().toISOString(),
    dataQuality: {
      completeness: { percentage: 100, status: "complete" }
    },
    warnings: []
  },
  recommendations: {
    primary: {
      action: "Buy",
      confidence: 0.82,
      priority: "High",
      reasoning: "Test",
      drivers: [
        { factor: "PE Ratio", value: 12.5, weight: 0.5, direction: "positive" }
      ]
    },
    risks: []
  },
  context: {
    relatedTools: [
      { name: "other_tool", reason: "Additional analysis" }
    ]
  }
};

const v2Validation = SmartResponseValidator.validateV2(v2Response);
console.log('V2 Format Validation:');
console.log(`  Valid: ${v2Validation.valid}`);
console.log(`  Score: ${v2Validation.score}/100`);
console.log(`  Level: ${v2Validation.level}`);
console.log(`  Warnings: ${v2Validation.warnings.length}`);
console.log();

// Test 6: Generate reports
console.log('Test 6: Validation Reports');
console.log('─'.repeat(40));
console.log(SmartResponseValidator.generateReport(v1Validation, "V1 Example"));
console.log(SmartResponseValidator.generateReport(v2Validation, "V2 Example"));

console.log('✅ All tests completed!');
console.log('\nTo use the agents:');
console.log('  node agents/cli.mjs status');
console.log('  node agents/cli.mjs convert-to-v2 <tool>');
console.log('  node agents/cli.mjs validate <tool>');
console.log();
