#!/usr/bin/env node

// Test script to verify MCP server connection
import { spawn } from 'child_process';
import { createInterface } from 'readline';

console.log('🔍 Testing MCP Server Connection...\n');

// Test basic connection
async function testConnection() {
  try {
    const response = await fetch('http://localhost:2901/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list"
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Server is responding!');
      console.log('Available tools:', data.result?.tools?.map(t => t.name).join(', '));
    } else {
      console.log(`❌ Server responded with ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    console.log('\nMake sure the server is running:');
    console.log('docker run -d -p 2901:2901 stock-valuation-mcp');
  }
}

// Run test
testConnection().then(() => {
  console.log('\n🚀 Starting MCP Inspector...');

  // Start inspector
  const inspector = spawn('npx', ['@modelcontextprotocol/inspector', 'node', 'dist/index.js'], {
    stdio: 'inherit'
  });

  inspector.on('error', (err) => {
    console.error('Failed to start inspector:', err.message);
    console.log('\nTry installing it first: npm install -g @modelcontextprotocol/inspector');
  });
});