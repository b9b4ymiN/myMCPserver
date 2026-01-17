/**
 * AgentManager - Orchestrates AI Dev and QA agents for MCP Stock Analysis Server
 *
 * This is the main orchestrator that coordinates between DevBot and QABot
 * to provide intelligent development and testing assistance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// TYPES
// =====================================================

export interface AgentConfig {
  name: string;
  type: string;
  configPath: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface ManagerConfig {
  version: string;
  project: string;
  agents: {
    dev: AgentConfig;
    qa: AgentConfig;
  };
  shared: {
    projectRoot: string;
    srcDir: string;
    testDir: string;
    agentLogDir: string;
  };
}

export interface WorkflowResult {
  devResult: string;
  qaResult: string;
  success: boolean;
  duration: number;
  errors: string[];
}

export interface AgentTask {
  type: 'dev' | 'qa';
  action: string;
  input: any;
  expectedOutput?: any;
}

export interface ToolInfo {
  name: string;
  file: string;
  v2Compliant: boolean;
  lastModified: Date;
}

// =====================================================
// AGENT MANAGER CLASS
// =====================================================

export class AgentManager {
  private config: ManagerConfig;
  private projectRoot: string;
  private srcDir: string;
  private logs: string[] = [];

  constructor(configPath?: string) {
    const defaultConfigPath = path.join(__dirname, 'agent-config.json');
    const configFile = configPath || defaultConfigPath;

    if (!fs.existsSync(configFile)) {
      this.createDefaultConfig(configFile);
    }

    const configContent = fs.readFileSync(configFile, 'utf-8');
    this.config = JSON.parse(configContent);
    this.projectRoot = this.config.shared.projectRoot || process.cwd();
    this.srcDir = path.join(this.projectRoot, this.config.shared.srcDir);
  }

  // =====================================================
  // DEV AGENT METHODS
  // =====================================================

  /**
   * Execute a task with the Dev agent
   */
  async dev(task: string, options?: { silent?: boolean; file?: string }): Promise<string> {
    const startTime = Date.now();
    this.log(`🤖 DevBot: "${task}"`);

    try {
      // Parse the task to determine action
      const action = this.parseDevTask(task);

      let result: string;

      switch (action.type) {
        case 'create-tool':
          result = await this.createNewTool(action.params);
          break;
        case 'fix-bug':
          result = await this.fixBug(action.params);
          break;
        case 'convert-v2':
          result = await this.convertToV2(action.params);
          break;
        case 'add-feature':
          result = await this.addFeature(action.params);
          break;
        case 'refactor':
          result = await this.refactorCode(action.params);
          break;
        default:
          result = await this.generalDevTask(task);
      }

      const duration = Date.now() - startTime;
      this.log(`✓ DevBot completed in ${duration}ms`);
      return result;

    } catch (error) {
      const errorMsg = `DevBot failed: ${error instanceof Error ? error.message : String(error)}`;
      this.log(`✗ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  // =====================================================
  // QA AGENT METHODS
  // =====================================================

  /**
   * Execute a task with the QA agent
   */
  async qa(task: string, options?: { silent?: boolean }): Promise<string> {
    const startTime = Date.now();
    this.log(`🧪 QABot: "${task}"`);

    try {
      const action = this.parseQATask(task);

      let result: string;

      switch (action.type) {
        case 'test':
          result = await this.runTests(action.params);
          break;
        case 'validate':
          result = await this.validateSmartResponse(action.params);
          break;
        case 'coverage':
          result = await this.checkCoverage(action.params);
          break;
        case 'api-test':
          result = await this.testAPI(action.params);
          break;
        case 'lint':
          result = await this.runLint(action.params);
          break;
        default:
          result = await this.generalQATask(task);
      }

      const duration = Date.now() - startTime;
      this.log(`✓ QABot completed in ${duration}ms`);
      return result;

    } catch (error) {
      const errorMsg = `QABot failed: ${error instanceof Error ? error.message : String(error)}`;
      this.log(`✗ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }

  // =====================================================
  // WORKFLOW METHODS
  // =====================================================

  /**
   * Run a complete workflow (Dev + QA)
   */
  async workflow(task: string, options?: { silent?: boolean }): Promise<WorkflowResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    this.log('\n🚀 Starting workflow...');
    this.log(`   Task: "${task}"`);

    try {
      // Step 1: Development phase
      this.log('\n📝 Phase 1: Development');
      let devResult: string;
      try {
        devResult = await this.dev(task, { silent: true });
        this.log('   ✓ Development phase complete');
      } catch (error) {
        errors.push(`Dev error: ${error}`);
        devResult = `Failed: ${error}`;
      }

      // Step 2: Build the project
      this.log('\n🔨 Phase 2: Building project');
      const buildSuccess = await this.buildProject(options);

      if (!buildSuccess) {
        errors.push('Build failed - compilation errors detected');
        this.log('   ✗ Build failed');
        return {
          devResult,
          qaResult: 'Skipped due to build failure',
          success: false,
          duration: Date.now() - startTime,
          errors
        };
      }
      this.log('   ✓ Build successful');

      // Step 3: Type checking
      this.log('\n🔍 Phase 3: Type checking');
      const typeCheckSuccess = await this.typeCheck();

      if (!typeCheckSuccess) {
        errors.push('Type check failed - type errors detected');
        this.log('   ✗ Type check failed');
        return {
          devResult,
          qaResult: 'Skipped due to type errors',
          success: false,
          duration: Date.now() - startTime,
          errors
        };
      }
      this.log('   ✓ Type check passed');

      // Step 4: QA validation phase
      this.log('\n🧪 Phase 4: QA validation');
      let qaResult: string;
      try {
        qaResult = await this.qa(`Validate and test: ${task}`, { silent: true });
        this.log('   ✓ QA validation complete');
      } catch (error) {
        errors.push(`QA error: ${error}`);
        qaResult = `Failed: ${error}`;
      }

      const success = errors.length === 0;
      const duration = Date.now() - startTime;

      if (success) {
        this.log('\n✅ Workflow completed successfully!\n');
      } else {
        this.log('\n⚠️  Workflow completed with errors\n');
      }

      return {
        devResult,
        qaResult,
        success,
        duration,
        errors
      };

    } catch (error) {
      this.log(`\n❌ Workflow failed: ${error}\n`);
      throw error;
    }
  }

  // =====================================================
  // HIGH-LEVEL TASK METHODS
  // =====================================================

  /**
   * Create a new tool
   */
  async createTool(toolName: string, description: string): Promise<string> {
    this.log(`Creating new tool: ${toolName}`);

    const result: string[] = [];
    result.push(`\n${'='.repeat(60)}`);
    result.push(`Creating Tool: ${toolName}`);
    result.push(`${'='.repeat(60)}\n`);

    // Analyze requirements
    result.push('📋 Analysis:');
    result.push(`  Tool name: ${toolName}`);
    result.push(`  Description: ${description}`);

    // Determine tool file
    const toolFile = this.determineToolFile(description);
    result.push(`  Target file: ${toolFile}`);

    // Generate code
    result.push('\n🔨 Implementation:');

    // This would integrate with AI model to generate actual code
    // For now, provide a template
    const codeTemplate = this.generateToolTemplate(toolName, description);
    result.push(codeTemplate);

    result.push('\n📝 Next Steps:');
    result.push('  1. Review the generated code');
    result.push('  2. Implement the business logic');
    result.push('  3. Add SmartResponseV2 formatter');
    result.push('  4. Register tool in src/index.ts');
    result.push('  5. Run: npm run test');

    result.push(`\n${'='.repeat(60)}\n`);

    return result.join('\n');
  }

  /**
   * Convert tool to SmartResponseV2
   */
  async convertToV2(toolName: string): Promise<string> {
    this.log(`Converting ${toolName} to SmartResponseV2`);

    const result: string[] = [];
    result.push(`\n${'='.repeat(60)}`);
    result.push(`Converting to SmartResponseV2: ${toolName}`);
    result.push(`${'='.repeat(60)}\n`);

    // Find the tool
    const toolInfo = this.findTool(toolName);

    if (!toolInfo) {
      result.push(`❌ Tool "${toolName}" not found`);
      result.push('\nAvailable tools:');
      const tools = this.listTools();
      tools.forEach(t => result.push(`  - ${t.name}`));
      return result.join('\n');
    }

    result.push(`📍 Found tool in: ${toolInfo.file}`);
    result.push(`   Current format: ${toolInfo.v2Compliant ? 'V2' : 'V1'}`);

    if (toolInfo.v2Compliant) {
      result.push('\n✅ Tool is already V2 compliant!');
      return result.join('\n');
    }

    result.push('\n🔄 Converting to V2 format...');

    // List changes needed
    result.push('\n📋 Changes to implement:');
    result.push('  1. ✅ Add semantic keyFindings with assessments');
    result.push('  2. ✅ Add confidence score (0-1) with factors');
    result.push('  3. ✅ Convert warnings to structured format');
    result.push('  4. ✅ Add data validation tracking');
    result.push('  5. ✅ Add data freshness tracking');
    result.push('  6. ✅ Add recommendation drivers');
    result.push('  7. ✅ Add risk assessment');
    result.push('  8. ✅ Enhance context with suggested params');

    result.push('\n💡 Implementation would:');
    result.push('  • Read current formatter function');
    result.push('  • Generate semantic keyFindings');
    result.push('  • Add confidence calculation logic');
    result.push('  • Restructure warnings with severity');
    result.push('  • Add data quality metrics');
    result.push('  • Enhance recommendations with drivers');
    result.push('  • Add risk scenarios');

    result.push('\n📝 Example V2 structure:');
    result.push(this.getV2Example());

    result.push(`\n${'='.repeat(60)}\n`);

    return result.join('\n');
  }

  /**
   * Validate SmartResponse format
   */
  async validateSmartResponse(params: any): Promise<string> {
    const { toolName, file } = params;

    const result: string[] = [];
    result.push(`\n${'='.repeat(60)}`);
    result.push(`SmartResponse Validation`);
    result.push(`${'='.repeat(60)}\n`);

    if (toolName) {
      result.push(`🔍 Validating tool: ${toolName}`);

      const toolInfo = this.findTool(toolName);
      if (!toolInfo) {
        result.push(`❌ Tool not found`);
        return result.join('\n');
      }

      // Read and validate the file
      const validation = this.validateToolFile(toolInfo.file);
      result.push(validation);
    } else if (file) {
      result.push(`🔍 Validating file: ${file}`);
      const validation = this.validateToolFile(file);
      result.push(validation);
    } else {
      result.push('❌ Please specify toolName or file');
    }

    result.push(`\n${'='.repeat(60)}\n`);

    return result.join('\n');
  }

  /**
   * Run tests
   */
  async runTests(params?: any): Promise<string> {
    const pattern = params?.pattern || '';

    return new Promise((resolve, reject) => {
      const args = ['run', 'test'];
      if (pattern) {
        args.push('--', pattern);
      }

      const test = spawn('npm', args, {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      test.stdout.on('data', (data) => {
        output += data.toString();
      });

      test.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      test.on('close', (code) => {
        const result: string[] = [];
        result.push(`\n${'='.repeat(60)}`);
        result.push(`Test Results`);
        result.push(`${'='.repeat(60)}\n`);

        if (code === 0) {
          result.push('✅ All tests passed!\n');
        } else {
          result.push('❌ Some tests failed\n');
        }

        if (output) {
          result.push('📊 Output:');
          result.push(output);
        }

        if (errorOutput) {
          result.push('\n⚠️  Errors:');
          result.push(errorOutput);
        }

        result.push(`\n${'='.repeat(60)}\n`);

        resolve(result.join('\n'));
      });

      test.on('error', (error) => {
        reject(new Error(`Failed to run tests: ${error.message}`));
      });
    });
  }

  // =====================================================
  // PROJECT METHODS
  // =====================================================

  /**
   * List all tools in the project
   */
  listTools(): ToolInfo[] {
    const tools: ToolInfo[] = [];

    // Scan src/tools directory
    const toolsDir = path.join(this.srcDir, 'tools');

    if (fs.existsSync(toolsDir)) {
      const files = fs.readdirSync(toolsDir).filter(f => f.endsWith('.ts'));

      files.forEach(file => {
        const filePath = path.join(toolsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const stats = fs.statSync(filePath);

        // Extract tool names
        const toolRegex = /export\s+const\s+(\w+)\s*:\s*Tool\s*=/g;
        let match;

        while ((match = toolRegex.exec(content)) !== null) {
          const toolName = match[1];
          const v2Compliant = this.checkV2Compliance(content);

          tools.push({
            name: toolName,
            file: filePath,
            v2Compliant,
            lastModified: stats.mtime
          });
        }
      });
    }

    return tools;
  }

  /**
   * Get project status
   */
  getStatus(): {
    tools: { total: number; v2Compliant: number; v1Compliant: number };
    files: { total: number; tests: number };
    recommendations: string[];
  } {
    const tools = this.listTools();
    const v2Compliant = tools.filter(t => t.v2Compliant).length;

    // Count test files
    const testFiles = this.countTestFiles();

    // Generate recommendations
    const recommendations: string[] = [];

    if (v2Compliant < tools.length) {
      recommendations.push(`Convert ${tools.length - v2Compliant} tools to SmartResponseV2`);
    }

    if (testFiles === 0) {
      recommendations.push('Create test files for all tools');
    }

    const testCoverage = tools.length > 0 ? testFiles / tools.length : 0;
    if (testCoverage < 0.8) {
      recommendations.push('Increase test coverage to at least 80%');
    }

    return {
      tools: {
        total: tools.length,
        v2Compliant,
        v1Compliant: tools.length - v2Compliant
      },
      files: {
        total: this.countSourceFiles(),
        tests: testFiles
      },
      recommendations
    };
  }

  // =====================================================
  // PRIVATE HELPER METHODS
  // =====================================================

  private createDefaultConfig(configPath: string): void {
    const defaultConfig: ManagerConfig = {
      version: '1.0',
      project: 'MCP Stock Analysis Server',
      agents: {
        dev: {
          name: 'DevBot',
          type: 'AI Development Agent',
          configPath: 'agents/ai-dev-agent.md',
          model: 'claude-sonnet-4-5-20250114',
          temperature: 0.3,
          maxTokens: 8000
        },
        qa: {
          name: 'QABot',
          type: 'AI QA Agent',
          configPath: 'agents/ai-qa-agent.md',
          model: 'claude-sonnet-4-5-20250114',
          temperature: 0.2,
          maxTokens: 8000
        }
      },
      shared: {
        projectRoot: process.cwd(),
        srcDir: 'src',
        testDir: 'tests',
        agentLogDir: 'agents/logs'
      }
    };

    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    this.log(`Created default config at ${configPath}`);
  }

  private parseDevTask(task: string): { type: string; params: any } {
    const lowerTask = task.toLowerCase();

    if (lowerTask.includes('create') && lowerTask.includes('tool')) {
      const match = task.match(/create\s+(?:a\s+)?(?:new\s+)?tool\s+(?:called\s+)?["']?(\w+)["']?\s+(?:to\s+)?(.+)/i);
      if (match) {
        return { type: 'create-tool', params: { name: match[1], description: match[2] } };
      }
    }

    if (lowerTask.includes('convert') && (lowerTask.includes('v2') || lowerTask.includes('smartresponse'))) {
      const match = task.match(/convert\s+(\w+)\s+(?:to\s+)?v2/i);
      if (match) {
        return { type: 'convert-v2', params: { toolName: match[1] } };
      }
    }

    if (lowerTask.includes('fix') || lowerTask.includes('bug') || lowerTask.includes('error')) {
      return { type: 'fix-bug', params: { task } };
    }

    if (lowerTask.includes('add') || lowerTask.includes('implement')) {
      return { type: 'add-feature', params: { task } };
    }

    if (lowerTask.includes('refactor')) {
      return { type: 'refactor', params: { task } };
    }

    return { type: 'general', params: { task } };
  }

  private parseQATask(task: string): { type: string; params: any } {
    const lowerTask = task.toLowerCase();

    if (lowerTask.includes('test') || lowerTask.includes('spec')) {
      return { type: 'test', params: { task } };
    }

    if (lowerTask.includes('validate') || lowerTask.includes('check')) {
      const match = task.match(/validate\s+(\w+)/i);
      if (match) {
        return { type: 'validate', params: { toolName: match[1] } };
      }
      return { type: 'validate', params: {} };
    }

    if (lowerTask.includes('coverage')) {
      return { type: 'coverage', params: {} };
    }

    if (lowerTask.includes('api')) {
      return { type: 'api-test', params: { task } };
    }

    if (lowerTask.includes('lint')) {
      return { type: 'lint', params: {} };
    }

    return { type: 'general', params: { task } };
  }

  private determineToolFile(description: string): string {
    const desc = description.toLowerCase();

    if (desc.includes('valuation') || desc.includes('intrinsic value') || desc.includes('ddm') || desc.includes('dcf')) {
      return 'src/tools/stockValuation.ts';
    }

    if (desc.includes('financial') || desc.includes('income') || desc.includes('balance') || desc.includes('cash flow')) {
      return 'src/tools/financialStatements.ts';
    }

    if (desc.includes('canslim') || desc.includes('growth') || desc.includes('screening')) {
      return 'src/tools/canslim.ts';
    }

    if (desc.includes('web') || desc.includes('search') || desc.includes('news') || desc.includes('fetch')) {
      return 'src/tools/webTools.ts';
    }

    return 'src/tools/setWatchApi.ts';
  }

  private generateToolTemplate(toolName: string, description: string): string {
    return `
// Example template for ${toolName}
export const ${toolName}Tool: Tool = {
  name: '${toolName}',
  description: \`${description}\`,
  inputSchema: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Stock symbol'
      }
    },
    required: ['symbol']
  },
  handler: async (args) => {
    const { symbol } = args;

    try {
      // 1. Validate input
      const validatedSymbol = validateSymbol(symbol);

      // 2. Fetch data
      const data = await fetchData(validatedSymbol);

      // 3. Process and format
      return format${this.capitalize(toolName)}Response(data);

    } catch (error) {
      throw new Error(\`Failed to ${toolName}: \${error instanceof Error ? error.message : String(error)}\`);
    }
  }
};

/**
 * Format response as SmartResponseV2
 */
function format${this.capitalize(toolName)}Response(data: any): SmartResponse {
  // TODO: Implement SmartResponseV2 formatter

  return {
    summary: {
      title: \`${toolName} - \${data.symbol}\`,
      what: \`${description}\`,
      keyFindings: [],
      confidence: { level: 'Medium', score: 0.5, factors: [] }
    },
    data: { processed: data },
    metadata: {
      tool: '${toolName}',
      category: 'Valuation',
      dataSource: 'Calculated',
      lastUpdated: new Date().toISOString(),
      processingTime: 0,
      dataQuality: 'medium',
      completeness: 'partial',
      warnings: []
    },
    recommendations: {
      investment: 'Hold',
      priority: 'Medium',
      reasoning: 'Analysis complete'
    },
    context: {
      relatedTools: [],
      alternativeTools: []
    }
  };
}
`;
  }

  private findTool(toolName: string): ToolInfo | undefined {
    const tools = this.listTools();
    return tools.find(t =>
      t.name.toLowerCase() === toolName.toLowerCase() ||
      t.name.toLowerCase().replace('tool', '') === toolName.toLowerCase()
    );
  }

  private checkV2Compliance(content: string): boolean {
    // Check for V2 indicators
    const v2Indicators = [
      /semantic\s+keyFindings/i,
      /confidence.*score.*0.*1/i,
      /StructuredWarning/i,
      /dataQuality.*freshness/i,
      /recommendation.*drivers/i
    ];

    // Check for V1 indicators
    const v1Indicators = [
      /keyFindings.*:\s*\[/i,  // Plain array
      /action.*:.*['"]Buy['"]/i,  // String action
    ];

    const hasV2 = v2Indicators.some(pattern => pattern.test(content));
    const hasV1 = v1Indicators.some(pattern => pattern.test(content));

    return hasV2 || !hasV1; // Assume V2 if has V2 indicators or no V1 indicators
  }

  private validateToolFile(filePath: string): string {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result: string[] = [];

    // Check for required sections
    const hasSummary = /summary\s*:/i.test(content);
    const hasData = /data\s*:/i.test(content);
    const hasMetadata = /metadata\s*:/i.test(content);
    const hasRecommendations = /recommendations\s*:/i.test(content);
    const hasContext = /context\s*:/i.test(content);

    result.push('📋 Format Check:');

    if (!hasSummary) result.push('  ❌ Missing summary section');
    else result.push('  ✅ Has summary section');

    if (!hasData) result.push('  ❌ Missing data section');
    else result.push('  ✅ Has data section');

    if (!hasMetadata) result.push('  ❌ Missing metadata section');
    else result.push('  ✅ Has metadata section');

    if (!hasRecommendations) result.push('  ⚠️  Missing recommendations section (optional)');
    else result.push('  ✅ Has recommendations section');

    if (!hasContext) result.push('  ⚠️  Missing context section (optional)');
    else result.push('  ✅ Has context section');

    // Check V2 compliance
    const v2Compliant = this.checkV2Compliance(content);

    result.push('\n🎯 Version:');
    result.push(v2Compliant ? '  ✅ SmartResponseV2 format detected' : '  ⚠️  SmartResponseV1 format (consider upgrading)');

    // Calculate score
    const score = this.calculateV2Score(content);
    result.push(`\n📊 V2 Score: ${score}/100`);

    if (score >= 80) {
      result.push('  Status: 🟢 Excellent - Production ready');
    } else if (score >= 60) {
      result.push('  Status: 🟡 Good - Minor improvements needed');
    } else if (score >= 40) {
      result.push('  Status: 🟠 Fair - Significant improvements needed');
    } else {
      result.push('  Status: 🔴 Poor - Complete V2 conversion recommended');
    }

    return result.join('\n');
  }

  private calculateV2Score(content: string): number {
    let score = 0;

    // Check for V2 features
    if (/confidence.*score/i.test(content)) score += 15;
    if (/structured.*warnings/i.test(content) || /StructuredWarning/i.test(content)) score += 15;
    if (/dataQuality.*freshness/i.test(content)) score += 10;
    if (/recommendation.*drivers/i.test(content)) score += 15;
    if (/metric.*value.*assessment/i.test(content)) score += 15;
    if (/risk/i.test(content)) score += 10;
    if (/suggestedParams/i.test(content)) score += 10;
    if (/presentation/i.test(content)) score += 10;

    return score;
  }

  private getV2Example(): string {
    return `
// Example V2 structure:
summary: {
  title: "Tool Name - SYMBOL",
  what: "What was done",
  keyFindings: [
    {
      metric: "PE Ratio",
      value: 12.5,
      formatted: "12.50x",
      assessment: "good",
      threshold: { value: 15, operator: "<" },
      weight: 0.7
    }
  ],
  confidence: {
    level: "High",
    score: 0.82,
    factors: ["High data quality", "Complete data"]
  }
}
`;
  }

  private countTestFiles(): number {
    const testDir = path.join(this.projectRoot, this.config.shared.testDir);
    if (!fs.existsSync(testDir)) return 0;

    const files = fs.readdirSync(testDir);
    return files.filter(f => f.endsWith('.test.ts') || f.endsWith('.spec.ts')).length;
  }

  private countSourceFiles(): number {
    let count = 0;

    const countInDir = (dir: string) => {
      if (!fs.existsSync(dir)) return;

      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.')) {
          countInDir(filePath);
        } else if (file.endsWith('.ts')) {
          count++;
        }
      });
    };

    countInDir(this.srcDir);
    return count;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private async buildProject(options?: { silent?: boolean }): Promise<boolean> {
    return new Promise((resolve) => {
      const build = spawn('npm', ['run', 'build'], {
        cwd: this.projectRoot,
        stdio: options?.silent ? 'pipe' : 'inherit'
      });

      build.on('close', (code) => {
        resolve(code === 0);
      });

      build.on('error', () => {
        resolve(false);
      });
    });
  }

  private async typeCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      const tsc = spawn('npx', ['tsc', '--noEmit'], {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      tsc.on('close', (code) => {
        resolve(code === 0);
      });

      tsc.on('error', () => {
        resolve(false);
      });
    });
  }

  private async createNewTool(params: any): Promise<string> {
    return this.createTool(params.name, params.description);
  }

  private async fixBug(params: any): Promise<string> {
    return `
🔧 Bug Fix Analysis

Task: ${params.task}

To fix this bug, the agent would:
1. Read the error message and stack trace
2. Locate the problematic code
3. Analyze the root cause
4. Implement a fix with proper error handling
5. Add null safety checks where needed
6. Update tests to cover the edge case

Example fix patterns:
- Add null checks: data?.field ?? defaultValue
- Add validation: validateInput(input)
- Add error handling: try { ... } catch (error) { ... }

Recommendation: Provide the exact error message for precise fix.
`;
  }

  private async refactorCode(params: any): Promise<string> {
    return `
🔨 Refactoring

Task: ${params.task}

Refactoring recommendations:
1. Extract reusable functions
2. Improve type safety
3. Add proper error handling
4. Improve naming conventions
5. Add documentation
6. Remove code duplication

Run: npm run lint to identify issues
`;
  }

  private async addFeature(params: any): Promise<string> {
    return `
✨ Adding Feature

Task: ${params.task}

Implementation plan:
1. Analyze requirements
2. Design the feature
3. Implement with SmartResponseV2
4. Add tests
5. Update documentation

Recommendation: Be specific about what to add for better results.
`;
  }

  private async generalDevTask(task: string): Promise<string> {
    return `
🤖 DevBot

Task: ${task}

For best results, be more specific:
- "Create a tool called X that does Y"
- "Fix error: [exact error message]"
- "Convert toolName to V2 format"
- "Add feature X to tool Y"

Available commands:
- create-tool <name> <description>
- convert-to-v2 <toolName>
- fix-bug <error description>
- add-feature <feature description>
`;
  }

  private async generalQATask(task: string): Promise<string> {
    return `
🧪 QABot

Task: ${task}

For best results, be more specific:
- "Test toolName with edge cases"
- "Validate toolName SmartResponse format"
- "Check coverage for toolName"
- "API test for endpoint"

Available commands:
- test [pattern]
- validate <toolName>
- coverage
- api-test <endpoint>
- lint
`;
  }

  private async checkCoverage(params: any): Promise<string> {
    return `
📊 Coverage Report

Run: npm run test -- --coverage

Coverage targets:
- Lines: ≥ 80%
- Functions: ≥ 80%
- Branches: ≥ 75%
- Statements: ≥ 80%
`;
  }

  private async testAPI(params: any): Promise<string> {
    return `
🌐 API Testing

To test API endpoints:

1. Check endpoint availability
2. Test with valid inputs
3. Test with invalid inputs
4. Test error scenarios
5. Validate response format
6. Check response times

Use: npm run test -- api-test
`;
  }

  private async runLint(params: any): Promise<string> {
    return new Promise((resolve) => {
      const lint = spawn('npm', ['run', 'lint'], {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      let output = '';

      lint.stdout.on('data', (data) => {
        output += data.toString();
      });

      lint.stderr.on('data', (data) => {
        output += data.toString();
      });

      lint.on('close', (code) => {
        const result = `
🔍 Lint Results

${output || 'No lint errors found!'}

Status: ${code === 0 ? '✅ Passed' : '❌ Failed'}
`;
        resolve(result);
      });

      lint.on('error', () => {
        resolve('❌ Failed to run lint\n');
      });
    });
  }

  private log(message: string): void {
    this.logs.push(message);
    console.log(message);
  }

  /**
   * Get logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Save logs to file
   */
  saveLogs(filePath?: string): void {
    const logPath = filePath || path.join(
      this.projectRoot,
      this.config.shared.agentLogDir,
      `agent-${Date.now()}.log`
    );

    const logDir = path.dirname(logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    fs.writeFileSync(logPath, this.logs.join('\n'));
    this.log(`\n📝 Logs saved to: ${logPath}`);
  }
}

// =====================================================
// EXPORTS
// =====================================================

export default AgentManager;
