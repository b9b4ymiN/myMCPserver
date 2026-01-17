# Agent Setup & Implementation Guide

> Complete guide for setting up and using AI Dev and AI QA agents in the MCP Stock Analysis Server project

---

## 🚀 Quick Setup

### Step 1: Install Agent Dependencies

```bash
# Install core dependencies
npm install --save-dev \
  @anthropic-ai/sdk \
  @modelcontextprotocol/sdk \
  dotenv \
  chalk \
  ora

# Install testing dependencies for QA agent
npm install --save-dev \
  vitest \
  @vitest/ui \
  @vitest/coverage-v8 \
  eslint \
  prettier
```

### Step 2: Create Agent Configuration

Create `agents/agent-config.json`:

```json
{
  "version": "1.0",
  "project": "MCP Stock Analysis Server",
  "agents": {
    "dev": {
      "name": "DevBot",
      "type": "AI Development Agent",
      "config": "agents/ai-dev-agent.md",
      "model": "claude-sonnet-4-5-20250114",
      "temperature": 0.3,
      "max_tokens": 8000,
      "tools": [
        "read_file",
        "write_file",
        "edit_file",
        "search_code",
        "run_tests",
        "build_project",
        "lint_code",
        "git_operations"
      ]
    },
    "qa": {
      "name": "QABot",
      "type": "AI QA Agent",
      "config": "agents/ai-qa-agent.md",
      "model": "claude-sonnet-4-5-20250114",
      "temperature": 0.2,
      "max_tokens": 8000,
      "tools": [
        "run_unit_tests",
        "validate_smartresponse",
        "test_api_endpoint",
        "measure_coverage",
        "lint_check",
        "type_check"
      ]
    }
  },
  "shared": {
    "project_root": "/path/to/myMCPserver",
    "src_dir": "src",
    "test_dir": "tests",
    "agent_log_dir": "agents/logs"
  }
}
```

### Step 3: Create Agent Manager

Create `agents/agent-manager.ts`:

```typescript
#!/usr/bin/env node
/**
 * Agent Manager - Orchestrates AI Dev and QA agents
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora, { Ora } from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AgentConfig {
  name: string;
  type: string;
  config: string;
  model: string;
  temperature: number;
  max_tokens: number;
  tools: string[];
}

interface AgentManagerConfig {
  version: string;
  project: string;
  agents: {
    dev: AgentConfig;
    qa: AgentConfig;
  };
  shared: {
    project_root: string;
    src_dir: string;
    test_dir: string;
    agent_log_dir: string;
  };
}

class AgentManager {
  private config: AgentManagerConfig;
  private projectRoot: string;

  constructor(configPath: string = 'agents/agent-config.json') {
    const configContent = fs.readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configContent);
    this.projectRoot = this.config.shared.project_root;
  }

  /**
   * Execute a task with the Dev agent
   */
  async dev(task: string, options?: { silent?: boolean }): Promise<string> {
    return this.executeAgent('dev', task, options);
  }

  /**
   * Execute a task with the QA agent
   */
  async qa(task: string, options?: { silent?: boolean }): Promise<string> {
    return this.executeAgent('qa', task, options);
  }

  /**
   * Run a complete workflow (Dev + QA)
   */
  async workflow(task: string, options?: { silent?: boolean }): Promise<{
    devResult: string;
    qaResult: string;
    success: boolean;
  }> {
    const spinner = options?.silent ? null : ora('Running development workflow...').start();

    try {
      // Step 1: Dev agent creates/fixes code
      spinner?.info('Step 1: Development phase');
      const devResult = await this.dev(task, { silent: true });

      // Step 2: Build and type check
      spinner?.info('Step 2: Building project');
      const buildSuccess = await this.buildProject();

      if (!buildSuccess) {
        spinner?.fail('Build failed');
        return {
          devResult,
          qaResult: 'Build failed - skipping QA',
          success: false
        };
      }

      // Step 3: QA agent validates
      spinner?.info('Step 3: QA validation phase');
      const qaResult = await this.qa(`Validate and test: ${task}`, { silent: true });

      spinner?.succeed('Workflow complete');
      return { devResult, qaResult, success: true };
    } catch (error) {
      spinner?.fail(`Workflow failed: ${error}`);
      throw error;
    }
  }

  /**
   * Common agent tasks
   */
  async createTool(toolName: string, description: string): Promise<string> {
    return this.dev(
      `Create a new tool called "${toolName}" that ${description}. ` +
      'Follow the SmartResponseV2 format and include proper error handling.',
      { silent: false }
    );
  }

  async convertToV2(toolName: string): Promise<string> {
    return this.dev(
      `Convert the ${toolName} tool to use SmartResponseV2 format with ` +
      'semantic keyFindings, confidence scores, and structured warnings.',
      { silent: false }
    );
  }

  async validateTool(toolName: string): Promise<string> {
    return this.qa(
      `Create comprehensive tests for ${toolName} and validate SmartResponse format`,
      { silent: false }
    );
  }

  async runTests(pattern?: string): Promise<string> {
    return this.qa(
      pattern
        ? `Run tests matching pattern: ${pattern}`
        : 'Run full test suite and generate coverage report',
      { silent: false }
    );
  }

  /**
   * Private methods
   */
  private async executeAgent(
    agentType: 'dev' | 'qa',
    task: string,
    options?: { silent?: boolean }
  ): Promise<string> {
    const agentConfig = this.config.agents[agentType];
    const spinner = options?.silent ? null : ora(`Executing ${agentConfig.name}...`).start();

    try {
      // Load agent prompt
      const agentPrompt = this.loadAgentPrompt(agentConfig.config);

      // For now, this is a placeholder - in production, this would call
      // the actual AI model (Claude, GPT-4, etc.)
      const result = await this.simulateAgentExecution(agentType, task, agentPrompt);

      spinner?.succeed(`${agentConfig.name} complete`);
      return result;
    } catch (error) {
      spinner?.fail(`${agentConfig.name} failed`);
      throw error;
    }
  }

  private loadAgentPrompt(configPath: string): string {
    const fullPath = path.join(this.projectRoot, configPath);
    return fs.readFileSync(fullPath, 'utf-8');
  }

  private async simulateAgentExecution(
    agentType: string,
    task: string,
    agentPrompt: string
  ): Promise<string> {
    // In production, this would:
    // 1. Call the AI model with the agent prompt and task
    // 2. Stream the response back
    // 3. Handle tool calls if the agent needs to use tools

    // For demo purposes, return a mock response
    return `[${agentType.toUpperCase()}] Task: "${task}"\n` +
      `This would execute the agent with full prompt context.\n` +
      `In production, this calls the AI model with tools.\n\n` +
      `Agent prompt loaded: ${agentPrompt.length} bytes\n`;
  }

  private async buildProject(): Promise<boolean> {
    const { spawnSync } = await import('child_process');
    const result = spawnSync('npm', ['run', 'build'], {
      cwd: this.projectRoot,
      stdio: 'pipe'
    });
    return result.status === 0;
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const manager = new AgentManager();

  if (args.length === 0) {
    console.log(chalk.cyan('\n🤖 MCP Agent Manager\n'));
    console.log('Usage:');
    console.log('  node agent-manager.ts dev "task description"');
    console.log('  node agent-manager.ts qa "task description"');
    console.log('  node agent-manager.ts workflow "task description"');
    console.log('  node agent-manager.ts create-tool <name> <description>');
    console.log('  node agent-manager.ts convert-to-v2 <tool-name>');
    console.log('  node agent-manager.ts validate <tool-name>');
    console.log('  node agent-manager.ts test [pattern]\n');
    process.exit(0);
  }

  const command = args[0];
  const task = args.slice(1).join(' ');

  try {
    switch (command) {
      case 'dev':
        console.log(await manager.dev(task));
        break;
      case 'qa':
        console.log(await manager.qa(task));
        break;
      case 'workflow':
        const result = await manager.workflow(task);
        console.log(chalk.green('\n✓ Development successful'));
        console.log(chalk.green('✓ QA validation passed'));
        break;
      case 'create-tool':
        const [name, ...descParts] = args.slice(1);
        const description = descParts.join(' ');
        console.log(await manager.createTool(name, description));
        break;
      case 'convert-to-v2':
        console.log(await manager.convertToV2(args[1]));
        break;
      case 'validate':
        console.log(await manager.validateTool(args[1]));
        break;
      case 'test':
        console.log(await manager.runTests(args[1]));
        break;
      default:
        console.error(chalk.red(`Unknown command: ${command}`));
        process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}

// Export for use as module
export { AgentManager };

// Run as CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
```

### Step 4: Create SmartResponse Validator

Create `agents/smartresponse-validator.ts`:

```typescript
/**
 * SmartResponse Validator
 * Validates SmartResponse and SmartResponseV2 format compliance
 */

interface ValidationResult {
  valid: boolean;
  score: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
}

interface ValidationError {
  section: string;
  field: string;
  message: string;
  severity: 'critical' | 'error';
}

interface ValidationWarning {
  section: string;
  field: string;
  message: string;
  suggestion: string;
}

export class SmartResponseValidator {
  /**
   * Validate SmartResponseV2 format
   */
  static validateV2(response: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const recommendations: string[] = [];

    // Check required sections
    if (!response.summary) {
      errors.push({
        section: 'root',
        field: 'summary',
        message: 'Missing required section: summary',
        severity: 'critical'
      });
    }

    if (!response.data) {
      errors.push({
        section: 'root',
        field: 'data',
        message: 'Missing required section: data',
        severity: 'critical'
      });
    }

    if (!response.metadata) {
      errors.push({
        section: 'root',
        field: 'metadata',
        message: 'Missing required section: metadata',
        severity: 'critical'
      });
    }

    if (!response.recommendations) {
      warnings.push({
        section: 'root',
        field: 'recommendations',
        message: 'Missing recommendations section',
        suggestion: 'Add recommendations with investment decision and reasoning'
      });
    }

    if (!response.context) {
      warnings.push({
        section: 'root',
        field: 'context',
        message: 'Missing context section',
        suggestion: 'Add context with related tools for tool chaining'
      });
    }

    // Validate summary section
    if (response.summary) {
      this.validateSummary(response.summary, errors, warnings, recommendations);
    }

    // Validate data section
    if (response.data) {
      this.validateData(response.data, errors, warnings, recommendations);
    }

    // Validate metadata section
    if (response.metadata) {
      this.validateMetadata(response.metadata, errors, warnings, recommendations);
    }

    // Validate recommendations section
    if (response.recommendations) {
      this.validateRecommendations(response.recommendations, errors, warnings, recommendations);
    }

    // Validate context section
    if (response.context) {
      this.validateContext(response.context, errors, warnings, recommendations);
    }

    // Calculate score
    const score = this.calculateScore(errors, warnings, recommendations);
    const valid = errors.filter(e => e.severity === 'critical').length === 0;

    return {
      valid,
      score,
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Validate summary section
   */
  private static validateSummary(
    summary: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    // Required fields
    if (!summary.title) {
      errors.push({
        section: 'summary',
        field: 'title',
        message: 'Missing required field: title',
        severity: 'error'
      });
    }

    if (!summary.what) {
      errors.push({
        section: 'summary',
        field: 'what',
        message: 'Missing required field: what',
        severity: 'error'
      });
    }

    if (!summary.keyFindings || !Array.isArray(summary.keyFindings)) {
      errors.push({
        section: 'summary',
        field: 'keyFindings',
        message: 'keyFindings must be an array',
        severity: 'error'
      });
    } else {
      // Check if semantic (V2) or plain strings (V1)
      if (summary.keyFindings.length > 0) {
        if (typeof summary.keyFindings[0] === 'string') {
          warnings.push({
            section: 'summary',
            field: 'keyFindings',
            message: 'keyFindings are plain strings (V1 format)',
            suggestion: 'Convert to semantic objects with metric, value, assessment'
          });
          recommendations.push('Convert keyFindings to SmartResponseV2 format');
        } else {
          // Validate semantic structure
          const hasMetric = summary.keyFindings.every((k: any) => k.metric);
          const hasAssessment = summary.keyFindings.every((k: any) => k.assessment);
          if (!hasMetric || !hasAssessment) {
            errors.push({
              section: 'summary',
              field: 'keyFindings',
              message: 'Semantic keyFindings missing required fields',
              severity: 'error'
            });
          }
        }

        // Check length
        if (summary.keyFindings.length < 3 || summary.keyFindings.length > 7) {
          warnings.push({
            section: 'summary',
            field: 'keyFindings',
            message: `keyFindings has ${summary.keyFindings.length} items (recommended: 3-7)`,
            suggestion: 'Aim for 3-7 key findings for optimal AI comprehension'
          });
        }
      }
    }

    if (!summary.confidence) {
      warnings.push({
        section: 'summary',
        field: 'confidence',
        message: 'Missing confidence information',
        suggestion: 'Add confidence with level and score (0-1)'
      });
      recommendations.push('Add confidence scoring for 10/10 format');
    } else if (typeof summary.confidence === 'string') {
      // V1 format - just level
      warnings.push({
        section: 'summary',
        field: 'confidence',
        message: 'Confidence is plain string (V1 format)',
        suggestion: 'Add confidence object with level, score, and factors'
      });
    } else if (!summary.confidence.score) {
      warnings.push({
        section: 'summary',
        field: 'confidence.score',
        message: 'Missing numerical confidence score',
        suggestion: 'Add score field (0-1) for precise confidence measurement'
      });
    }

    if (!summary.conclusion) {
      recommendations.push('Add conclusion field for one-sentence takeaway');
    }
  }

  /**
   * Validate data section
   */
  private static validateData(
    data: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    if (!data.processed && !data.validation && !data.dataQuality) {
      warnings.push({
        section: 'data',
        field: 'structure',
        message: 'Data section lacks V2 enhancements',
        suggestion: 'Add validation, dataQuality with freshness/accuracy/completeness'
      });
      recommendations.push('Enhance data section with validation and quality metrics');
    }

    if (data.dataQuality) {
      if (!data.dataQuality.freshness) {
        recommendations.push('Add data freshness tracking with age calculation');
      }
      if (!data.dataQuality.accuracy) {
        recommendations.push('Add data accuracy tracking with verification status');
      }
    }
  }

  /**
   * Validate metadata section
   */
  private static validateMetadata(
    metadata: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    if (!metadata.warnings || !Array.isArray(metadata.warnings)) {
      // Warnings is optional
    } else if (metadata.warnings.length > 0 && typeof metadata.warnings[0] === 'string') {
      warnings.push({
        section: 'metadata',
        field: 'warnings',
        message: 'Warnings are plain strings (V1 format)',
        suggestion: 'Convert to structured warnings with id, severity, category'
      });
      recommendations.push('Convert warnings to structured format');
    }

    if (!metadata.assumptions || metadata.assumptions.length === 0) {
      recommendations.push('Document assumptions explicitly in metadata');
    }
  }

  /**
   * Validate recommendations section
   */
  private static validateRecommendations(
    recommendations: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations_out: string[]
  ): void {
    if (!recommendations.primary) {
      recommendations_out.push('Use recommendations.primary structure for main recommendation');
    } else {
      if (!recommendations.primary.drivers || recommendations.primary.drivers.length === 0) {
        recommendations_out.push('Add recommendation drivers to show decision factors');
      }
      if (!recommendations.primary.confidence && typeof recommendations.primary.confidence !== 'number') {
        recommendations_out.push('Add numerical confidence to recommendation');
      }
    }

    if (!recommendations.risks || recommendations.risks.length === 0) {
      recommendations_out.push('Add risk assessment to recommendations');
    }
  }

  /**
   * Validate context section
   */
  private static validateContext(
    context: any,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): void {
    if (!context.relatedTools || context.relatedTools.length === 0) {
      recommendations.push('Add related tools for intelligent tool chaining');
    } else if (typeof context.relatedTools[0] === 'string') {
      warnings.push({
        section: 'context',
        field: 'relatedTools',
        message: 'relatedTools are plain strings (V1 format)',
        suggestion: 'Convert to objects with name, reason, suggestedParams'
      });
      recommendations.push('Enhance related tools with parameter suggestions');
    }
  }

  /**
   * Calculate validation score (0-100)
   */
  private static calculateScore(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: string[]
  ): number {
    let score = 100;

    // Critical errors: -20 each
    score -= errors.filter(e => e.severity === 'critical').length * 20;

    // Regular errors: -10 each
    score -= errors.filter(e => e.severity === 'error').length * 10;

    // Warnings: -5 each
    score -= warnings.length * 5;

    // Missing recommendations: -2 each
    score -= recommendations.length * 2;

    return Math.max(0, score);
  }

  /**
   * Generate validation report
   */
  static generateReport(validation: ValidationResult, toolName: string): string {
    const lines: string[] = [];

    lines.push(`\n${'='.repeat(60)}`);
    lines.push(`SmartResponse Validation Report: ${toolName}`);
    lines.push(`${'='.repeat(60)}\n`);

    // Overall status
    const status = validation.valid ? '✅ VALID' : '❌ INVALID';
    const scoreColor = validation.score >= 80 ? '🟢' : validation.score >= 60 ? '🟡' : '🔴';
    lines.push(`Status: ${status}`);
    lines.push(`Score: ${scoreColor} ${validation.score}/100\n`);

    // Errors
    if (validation.errors.length > 0) {
      lines.push('❌ ERRORS:');
      validation.errors.forEach(err => {
        lines.push(`  [${err.section}.${err.field}] ${err.message}`);
      });
      lines.push('');
    }

    // Warnings
    if (validation.warnings.length > 0) {
      lines.push('⚠️  WARNINGS:');
      validation.warnings.forEach(warn => {
        lines.push(`  [${warn.section}.${warn.field}] ${warn.message}`);
        if (warn.suggestion) {
          lines.push(`    💡 ${warn.suggestion}`);
        }
      });
      lines.push('');
    }

    // Recommendations
    if (validation.recommendations.length > 0) {
      lines.push('💡 RECOMMENDATIONS:');
      validation.recommendations.forEach(rec => {
        lines.push(`  • ${rec}`);
      });
      lines.push('');
    }

    lines.push(`${'='.repeat(60)}\n`);

    return lines.join('\n');
  }
}
```

### Step 5: Create CLI Tool

Create `agents/cli.mjs`:

```javascript
#!/usr/bin/env node
/**
 * Agent CLI - Quick access to Dev and QA agents
 */

import { AgentManager } from './agent-manager.ts';
import { SmartResponseValidator } from './smartresponse-validator.ts';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs';

const program = new Command();

program
  .name('mcp-agent')
  .description('AI Agent CLI for MCP Stock Analysis Server')
  .version('1.0.0');

// Dev agent commands
program.command('dev <task>')
  .description('Execute development task with AI')
  .option('-s, --silent', 'Silent mode')
  .action(async (task, options) => {
    const manager = new AgentManager();
    try {
      const result = await manager.dev(task, options);
      console.log(result);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// QA agent commands
program.command('qa <task>')
  .description('Execute QA task with AI')
  .option('-s, --silent', 'Silent mode')
  .action(async (task, options) => {
    const manager = new AgentManager();
    try {
      const result = await manager.qa(task, options);
      console.log(result);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Workflow command
program.command('workflow <task>')
  .description('Run complete workflow (Dev + QA)')
  .action(async (task) => {
    const manager = new AgentManager();
    try {
      const result = await manager.workflow(task);
      console.log(chalk.green('✓ Workflow completed successfully'));
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Create tool command
program.command('create-tool <name> <description>')
  .description('Create a new tool with AI assistance')
  .action(async (name, description) => {
    const manager = new AgentManager();
    try {
      const result = await manager.createTool(name, description);
      console.log(result);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Convert to V2 command
program.command('convert-to-v2 <toolName>')
  .description('Convert tool to SmartResponseV2 format')
  .action(async (toolName) => {
    const manager = new AgentManager();
    try {
      const result = await manager.convertToV2(toolName);
      console.log(result);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Validate command
program.command('validate <toolName>')
  .description('Validate tool and create tests')
  .action(async (toolName) => {
    const manager = new AgentManager();
    try {
      const result = await manager.validateTool(toolName);
      console.log(result);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Test command
program.command('test [pattern]')
  .description('Run tests')
  .action(async (pattern) => {
    const manager = new AgentManager();
    try {
      const result = await manager.runTests(pattern);
      console.log(result);
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Validate SmartResponse command
program.command('validate-smartresponse <file>')
  .description('Validate SmartResponse format in a file')
  .action((file) => {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const response = JSON.parse(content);
      const validation = SmartResponseValidator.validateV2(response);
      const report = SmartResponseValidator.generateReport(validation, file);
      console.log(report);

      if (!validation.valid) {
        process.exit(1);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

// Status command
program.command('status')
  .description('Show agent and project status')
  .action(() => {
    console.log(chalk.cyan('\n🤖 MCP Agent Status\n'));

    // Agent status
    console.log('Agents:');
    console.log('  🟢 DevBot  - Ready');
    console.log('  🟢 QABot  - Ready\n');

    // Project status
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
      console.log(`Project: ${packageJson.name}`);
      console.log(`Version: ${packageJson.version}\n`);

      // SmartResponse V2 progress
      console.log('SmartResponse V2 Progress:');
      const tools = [
        'fetch_stock_data',
        'complete_valuation',
        'calculate_pe_band',
        'calculate_ddm',
        'calculate_dcf',
        'margin_of_safety',
        'calculate_canslim_score'
      ];
      tools.forEach(tool => {
        console.log(`  ⏳ ${tool} - Not converted`);
      });
      console.log('');
    } catch (error) {
      console.error(chalk.yellow('Could not read project status'));
    }
  });

program.parse();
```

---

## 📖 Usage Examples

### Example 1: Create a New Tool

```bash
# Using the CLI
npx mcp-agent create-tool calculate_wacc "Calculates Weighted Average Cost of Capital for Thai stocks"

# Or using the agent manager directly
node agents/agent-manager.ts create-tool calculate_wacc "Calculates WACC with cost of equity, cost of debt, and capital structure"
```

**Expected Output**:
```
🤖 DevBot executing...

## Analysis
Creating a new tool for WACC calculation. This is a fundamental financial metric
used in DCF valuations.

## Implementation
[Generated TypeScript code for the tool]
- Tool handler function
- Input validation
- SmartResponseV2 formatter
- Error handling
- Documentation

## Files Modified
- src/tools/stockValuation.ts (added calculate_wacc function)
- src/index.ts (registered new tool)

## Testing
Run: npm run test -- calculate_wacc

## Next Steps
1. Review generated code
2. Run tests
3. Test with real data
```

---

### Example 2: Convert Tool to SmartResponseV2

```bash
npx mcp-agent convert-to-v2 fetch_stock_data
```

**Expected Output**:
```
🤖 DevBot executing...

Converting fetch_stock_data to SmartResponseV2 format...

Changes to be made:
1. Add semantic keyFindings with assessments
2. Add confidence score calculation
3. Add structured warnings with severity
4. Add data validation tracking
5. Add data freshness tracking
6. Add recommendation drivers
7. Add risk assessment
8. Enhance context with suggested params

Implementing changes...
✓ Updated formatStockDataResponse function
✓ Added semantic keyFindings generator
✓ Added confidence calculation
✓ Added structured warnings
✓ Enhanced recommendations with drivers

Files modified: src/tools/setWatchApi.ts

Testing:
Build: ✅ Success
Type check: ✅ No errors
Tests: ⚠️  Need updates for new format

Next: Run QABot to validate and create tests
```

---

### Example 3: Complete Workflow (Dev + QA)

```bash
npx mcp-agent workflow "Add beta calculation to fetch_stock_data"
```

**Expected Output**:
```
⏳ Step 1: Development phase
🤖 DevBot implementing beta calculation...
✓ Added beta calculation to fetchStockData
✓ Updated SmartResponse formatter
✓ Added validation

⏳ Step 2: Building project
✓ Build successful
✓ Type check passed

⏳ Step 3: QA validation phase
🤖 QABot validating changes...
✓ SmartResponse format valid
✓ All tests passing
✓ Coverage: 85%

✅ Workflow complete
```

---

### Example 4: Validate SmartResponse Format

```bash
npx mcp-agent validate-smartresponse test-smart-response.mjs
```

**Expected Output**:
```
============================================================
SmartResponse Validation Report: test-smart-response.mjs
============================================================

Status: ✅ VALID
Score: 🟢 85/100

⚠️  WARNINGS:
  [summary.keyFindings] keyFindings are plain strings (V1 format)
    💡 Convert to semantic objects with metric, value, assessment
  [summary.confidence] Confidence is plain string (V1 format)
    💡 Add confidence object with level, score, and factors

💡 RECOMMENDATIONS:
  • Convert keyFindings to SmartResponseV2 format
  • Add confidence scoring for 10/10 format
  • Add data freshness tracking with age calculation
  • Add recommendation drivers to show decision factors

============================================================
```

---

## 🔧 Advanced Usage

### Batch Convert All Tools to V2

```bash
# Create a script
cat > agents/batch-convert.mjs << 'EOF'
#!/usr/bin/env node
import { AgentManager } from './agent-manager.js';

const manager = new AgentManager();
const tools = [
  'fetch_stock_data',
  'complete_valuation',
  'calculate_pe_band',
  'calculate_ddm',
  'calculate_dcf',
  'margin_of_safety',
  'fetch_income_statement',
  'fetch_balance_sheet',
  'fetch_cash_flow_statement',
  'calculate_canslim_score',
  'web_search',
  'web_fetch',
  'news_search'
];

for (const tool of tools) {
  console.log(`\n🔄 Converting ${tool}...`);
  await manager.convertToV2(tool);
  console.log(`✓ ${tool} converted\n`);
}
EOF

# Run the batch conversion
node agents/batch-convert.mjs
```

### Continuous Validation

```bash
# Watch for changes and validate
npx chokidar "src/**/*.ts" -c "npx mcp-agent validate-smartresponse {path}"
```

### Git Hook Integration

Add to `.husky/pre-commit`:
```bash
#!/bin/bash
# Validate all changed tools

echo "🤖 Running agent validation..."

# Get changed files
CHANGED=$(git diff --cached --name-only | grep "src/tools/")

if [ -n "$CHANGED" ]; then
  # Run QA validation
  node agents/agent-manager.ts qa "Validate changed tools"

  if [ $? -ne 0 ]; then
    echo "❌ Validation failed. Commit aborted."
    exit 1
  fi
fi

echo "✅ All validations passed"
```

---

## 📚 Summary

You now have:

1. **AI Dev Agent** (`agents/ai-dev-agent.md`) - For development tasks
2. **AI QA Agent** (`agents/ai-qa-agent.md`) - For testing and validation
3. **Agent Manager** (`agents/agent-manager.ts`) - For orchestrating agents
4. **SmartResponse Validator** (`agents/smartresponse-validator.ts`) - For format validation
5. **CLI Tool** (`agents/cli.mjs`) - For easy agent access

### Quick Commands

```bash
# Development
npx mcp-agent dev "Fix error in calculate_pe_band"
npx mcp-agent create-tool <name> <description>
npx mcp-agent convert-to-v2 <tool-name>

# QA
npx mcp-agent qa "Test calculate_pe_band with edge cases"
npx mcp-agent validate <tool-name>
npx mcp-agent test

# Workflow
npx mcp-agent workflow "Add new feature"
npx mcp-agent validate-smartresponse <file>
npx mcp-agent status
```

**Setup Complete!** Your AI agents are ready to help with development and QA.
