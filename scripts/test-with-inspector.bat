@echo off
REM Test script for MCP Inspector (Windows)

echo 🔧 Starting MCP Inspector for Stock Valuation Server...
echo.
echo 📍 Make sure your server is built (run 'npm run build' if needed)
echo.

REM Check if dist/index.js exists
if not exist "dist\index.js" (
    echo ❌ dist\index.js not found. Building the project...
    npm run build
)

echo 🚀 Launching MCP Inspector...
echo.
echo Once loaded, you can test the following tools:
echo.
echo 1. PE Band Analysis:
echo {"tool": "calculate_pe_band", "arguments": {"symbol": "AAPL", "currentPrice": 170.5, "eps": 6.05}}
echo.
echo 2. DDM Valuation:
echo {"tool": "calculate_ddm", "arguments": {"symbol": "MSFT", "currentPrice": 378.85, "dividend": 2.72, "requiredReturn": 0.1, "growthRate": 0.05}}
echo.
echo 3. DCF Valuation:
echo {"tool": "calculate_dcf", "arguments": {"symbol": "GOOGL", "currentPrice": 141.8, "freeCashFlow": 60000000000, "sharesOutstanding": 15000000000, "growthRate": 0.08, "discountRate": 0.1}}
echo.
echo 🌐 Opening MCP Inspector...
echo.

REM Start MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js

pause