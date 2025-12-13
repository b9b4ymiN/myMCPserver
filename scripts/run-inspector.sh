#!/bin/bash

echo "Starting MCP Server and Inspector..."

# Start the MCP server in Docker
echo "Starting MCP server on port 2901..."
docker run -d \
  --name stock-valuation-mcp \
  -p 2901:2901 \
  -e NODE_ENV=production \
  -e SET_WATCH_API_HOST=https://set-watch-api.vercel.app \
  -e LOG_LEVEL=debug \
  stock-valuation-mcp

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

# Check if server is running
if curl -s http://localhost:2901 > /dev/null; then
    echo "✅ MCP Server is running on port 2901"

    # Start inspector
    echo "Starting MCP Inspector..."
    npx @modelcontextprotocol/inspector node dist/index.js
else
    echo "❌ Failed to start MCP Server"
    echo "Check logs: docker logs stock-valuation-mcp"
fi