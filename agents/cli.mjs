#!/usr/bin/env node
/**
 * MCP Agent CLI - Command-line interface for AI Dev and QA agents
 *
 * Usage:
 *   node agents/cli.mjs <command> [options]
 *
 * Commands:
 *   dev <task>              - Execute development task
 *   qa <task>               - Execute QA task
 *   workflow <task>         - Run complete Dev+QA workflow
 *   create-tool <name> <desc> - Create new tool
 *   convert-to-v2 <tool>    - Convert to SmartResponseV2
 *   validate <tool>         - Validate SmartResponse format
 *   test [pattern]          - Run tests
 *   status                  - Show project status
 *   help                    - Show help
 */

import { AgentManager } from './AgentManager.ts';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// =====================================================
// CLI UTILITIES
// =====================================================

function printHeader() {
  console.log('\n🤖 MCP Agent CLI');
  console.log('━'.repeat(50));
}

function printSuccess(message) {
  console.log(`✅ ${message}`);
}

function printError(message) {
  console.error(`❌ ${message}`);
}

function printInfo(message) {
  console.log(`ℹ️  ${message}`);
}

function printWarning(message) {
  console.log(`⚠️  ${message}`);
}

// =====================================================
// COMMAND HANDLERS
// =====================================================

/**
 * Handle 'dev' command
 */
async function handleDev(args) {
  const task = args.join(' ');
  if (!task) {
    printError('Please provide a task description');
    console.log('\nExample: node agents/cli.mjs dev "Fix PE Band bug"');
    return;
  }

  const manager = new AgentManager();
  try {
    const result = await manager.dev(task);
    console.log(result);
  } catch (error) {
    printError(error.message);
    process.exit(1);
  }
}

/**
 * Handle 'qa' command
 */
async function handleQa(args) {
  const task = args.join(' ');
  if (!task) {
    printError('Please provide a task description');
    console.log('\nExample: node agents/cli.mjs qa "Test PE Band with edge cases"');
    return;
  }

  const manager = new AgentManager();
  try {
    const result = await manager.qa(task);
    console.log(result);
  } catch (error) {
    printError(error.message);
    process.exit(1);
  }
}

/**
 * Handle 'workflow' command
 */
async function handleWorkflow(args) {
  const task = args.join(' ');
  if (!task) {
    printError('Please provide a task description');
    console.log('\nExample: node agents/cli.mjs workflow "Add beta calculation"');
    return;
  }

  const manager = new AgentManager();
  try {
    const result = await manager.workflow(task);

    if (result.success) {
      printSuccess('Workflow completed successfully!');
      console.log(`\nDuration: ${result.duration}ms`);
    } else {
      printWarning('Workflow completed with errors');
      if (result.errors.length > 0) {
        console.log('\nErrors:');
        result.errors.forEach(err => console.log(`  • ${err}`));
      }
      process.exit(1);
    }
  } catch (error) {
    printError(error.message);
    process.exit(1);
  }
}

/**
 * Handle 'create-tool' command
 */
async function handleCreateTool(args) {
  if (args.length < 2) {
    printError('Usage: create-tool <name> <description>');
    console.log('\nExample: node agents/cli.mjs create-tool calculate_wacc "Calculates WACC for Thai stocks"');
    return;
  }

  const name = args[0];
  const description = args.slice(1).join(' ');

  const manager = new AgentManager();
  try {
    const result = await manager.createTool(name, description);
    console.log(result);
  } catch (error) {
    printError(error.message);
    process.exit(1);
  }
}

/**
 * Handle 'convert-to-v2' command
 */
async function handleConvertToV2(args) {
  if (args.length < 1) {
    printError('Usage: convert-to-v2 <tool-name>');
    console.log('\nExample: node agents/cli.mjs convert-to-v2 fetch_stock_data');
    return;
  }

  const toolName = args[0];

  const manager = new AgentManager();
  try {
    const result = await manager.convertToV2(toolName);
    console.log(result);
  } catch (error) {
    printError(error.message);
    process.exit(1);
  }
}

/**
 * Handle 'validate' command
 */
async function handleValidate(args) {
  if (args.length < 1) {
    printError('Usage: validate <tool-name>');
    console.log('\nExample: node agents/cli.mjs validate calculate_pe_band');
    return;
  }

  const toolName = args[0];

  const manager = new AgentManager();
  try {
    const result = await manager.validateSmartResponse({ toolName });
    console.log(result);
  } catch (error) {
    printError(error.message);
    process.exit(1);
  }
}

/**
 * Handle 'test' command
 */
async function handleTest(args) {
  const pattern = args[0] || '';

  const manager = new AgentManager();
  try {
    const result = await manager.runTests({ pattern });
    console.log(result);
  } catch (error) {
    printError(error.message);
    process.exit(1);
  }
}

/**
 * Handle 'status' command
 */
async function handleStatus() {
  printHeader();

  const manager = new AgentManager();
  const status = manager.getStatus();

  console.log('\n📊 Project Status\n');

  // Tools status
  console.log('Tools:');
  console.log(`  Total: ${status.tools.total}`);
  console.log(`  ✅ V2 Compliant: ${status.tools.v2Compliant}`);
  console.log(`  ⏳ V1 Compliant: ${status.tools.v1Compliant}`);

  // Calculate percentage
  const v2Percent = status.tools.total > 0
    ? Math.round((status.tools.v2Compliant / status.tools.total) * 100)
    : 0;
  console.log(`  Progress: ${v2Percent}%`);

  // Files status
  console.log('\nFiles:');
  console.log(`  Source files: ${status.files.total}`);
  console.log(`  Test files: ${status.files.tests}`);

  const testCoverage = status.files.total > 0
    ? Math.round((status.files.tests / status.files.total) * 100)
    : 0;
  console.log(`  Coverage: ${testCoverage}%`);

  // List tools
  if (status.tools.total > 0) {
    console.log('\n📋 Tools:');
    const tools = manager.listTools();
    tools.forEach(tool => {
      const icon = tool.v2Compliant ? '✅' : '⏳';
      console.log(`  ${icon} ${tool.name}`);
    });
  }

  // Recommendations
  if (status.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    status.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  } else {
    console.log('\n✅ All good! No recommendations.');
  }

  console.log('\n' + '━'.repeat(50) + '\n');
}

/**
 * Handle 'help' command
 */
function handleHelp() {
  printHeader();

  console.log(`
Usage: node agents/cli.mjs <command> [options]

Commands:
  dev <task>                  Execute development task with DevBot
                              Example: dev "Fix PE Band bug"

  qa <task>                   Execute QA task with QABot
                              Example: qa "Test PE Band with edge cases"

  workflow <task>             Run complete Dev+QA workflow
                              Example: workflow "Add beta calculation"

  create-tool <name> <desc>   Create a new tool
                              Example: create-tool calculate_wacc "Calculates WACC"

  convert-to-v2 <tool>        Convert tool to SmartResponseV2 format
                              Example: convert-to-v2 fetch_stock_data

  validate <tool>             Validate SmartResponse format
                              Example: validate calculate_pe_band

  test [pattern]              Run tests
                              Example: test "pe_band"

  status                      Show project status

  help                        Show this help message

SmartResponse V2 Conversion:
  Convert tools to use semantic keyFindings, confidence scores,
  structured warnings, and enhanced recommendations.

Workflow:
  The 'workflow' command runs both DevBot and QABot, plus builds
  and type checks the project, ensuring everything works before
  completing.

Examples:
  # Create a new tool
  node agents/cli.mjs create-tool calculate_ev "Calculates Enterprise Value"

  # Convert to V2
  node agents/cli.mjs convert-to-v2 calculate_pe_band

  # Run complete workflow
  node agents/cli.mjs workflow "Add dividend yield to fetch_stock_data"

  # Check status
  node agents/cli.mjs status

For more information, see agents/README.md
`);
}

// =====================================================
// MAIN ENTRY POINT
// =====================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    handleHelp();
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  switch (command) {
    case 'dev':
      await handleDev(commandArgs);
      break;

    case 'qa':
      await handleQa(commandArgs);
      break;

    case 'workflow':
      await handleWorkflow(commandArgs);
      break;

    case 'create-tool':
      await handleCreateTool(commandArgs);
      break;

    case 'convert-to-v2':
      await handleConvertToV2(commandArgs);
      break;

    case 'validate':
      await handleValidate(commandArgs);
      break;

    case 'test':
      await handleTest(commandArgs);
      break;

    case 'status':
      await handleStatus();
      break;

    case 'help':
    case '--help':
    case '-h':
      handleHelp();
      break;

    default:
      printError(`Unknown command: ${command}`);
      console.log('\nRun "node agents/cli.mjs help" for usage information');
      process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  printError(`CLI Error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
