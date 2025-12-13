# 📊 Stock Valuation MCP Server

<div align="center">
  <strong>A comprehensive Model Context Protocol (MCP) server for professional stock valuation and financial analysis</strong>
</div>

[![MCP](https://img.shields.io/badge/MCP-v1.24.3-blue.svg)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com)
[![Oracle Cloud](https://img.shields.io/badge/Oracle%20Cloud-Free%20Tier-orange.svg)](https://www.oracle.com/cloud/free/)

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Supported Tools](#-supported-tools)
- [Quick Start](#-quick-start)
- [Oracle Cloud Deployment](#oracle-cloud-deployment)
- [n8n Integration](#n8n-integration)
- [Documentation](#-documentation)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Usage Examples](#-usage-examples)
- [Deployment](#-deployment)
- [Architecture](#-architecture)
- [Contributing](#-contributing)
- [License](#-license)

---

## 📝 About

The Stock Valuation MCP Server provides professional-grade financial analysis tools for stock valuation and investment decision-making. It integrates seamlessly with Claude Desktop and provides real-time data from Thai stock markets through the SET Watch API.

### Key Capabilities

- **Valuation Models**: PE Band Analysis, Dividend Discount Model (DDM), Discounted Cash Flow (DCF)
- **Real-time Data**: Live stock data from SET Watch API
- **Financial Statements**: Complete income statement, balance sheet, and cash flow analysis
- **Historical Analysis**: Track and analyze financial ratios over time
- **Investment Recommendations**: Data-driven buy/sell/hold suggestions
- **Secure Configuration**: Environment-based configuration for API keys and secrets

---

## ✨ Features

### 📈 Valuation Tools

- **PE Band Analysis** - Historical PE ratio analysis with fair value ranges
- **Dividend Discount Model (DDM)** - Gordon Growth Model for dividend-paying stocks
- **Discounted Cash Flow (DCF)** - Intrinsic value calculation using free cash flow projections

### 🔍 Real-Time Data Integration

- **SET Watch API Integration** - Fetch real-time Thai stock data
- **Financial Statements** - Complete financial statement analysis
- **Historical Ratios** - Track PE, PBV, ROE, ROA, ROIC trends over time
- **Automatic Calculations** - Compute key financial ratios automatically

### 📊 Analysis Features

- **Trend Analysis** - Identify valuation and profitability trends
- **Comparative Analysis** - Compare against historical averages
- **Investment Scoring** - Generate buy/sell/hold recommendations
- **Risk Metrics** - Altman Z-Score, Piotroski F-Score calculations

### 🛡️ Security & Configuration

- **Environment Variables** - Secure API key and configuration management
- **Oracle Cloud Ready** - Optimized for Oracle Cloud Free Tier deployment
- **Docker Support** - Containerized deployment with environment injection
- **Type Safety** - Full TypeScript implementation with comprehensive type definitions

---

## 🛠️ Supported Tools

| Tool Category | Tool Name | Description |
|---------------|-----------|-------------|
| **Valuation** | `calculate_pe_band` | Calculate PE band valuation with historical data |
| **Valuation** | `calculate_ddm` | Dividend Discount Model analysis |
| **Valuation** | `calculate_dcf` | Discounted Cash Flow valuation |
| **Data Fetching** | `fetch_stock_data` | Fetch real-time stock data from SET Watch |
| **Data Fetching** | `complete_valuation` | Run all valuation models with fetched data |
| **Financial Statements** | `fetch_income_statement` | Fetch income statement data |
| **Financial Statements** | `fetch_balance_sheet` | Fetch balance sheet data |
| **Financial Statements** | `fetch_cash_flow_statement` | Fetch cash flow statement data |
| **Financial Statements** | `fetch_all_financial_statements` | Fetch all statements with ratio analysis |
| **Historical Analysis** | `fetch_historical_ratios` | Fetch historical PE, PBV, ROE, ROA, ROIC data |
| **Historical Analysis** | `analyze_historical_ratios` | Analyze trends with investment recommendations |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Claude Desktop (for MCP integration)
- Docker (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd myMCPserver

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Build the project
npm run build
```

### Claude Desktop Integration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "stock-valuation": {
      "command": "node",
      "args": ["C:/Programing/ByAI/myMCPserver/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop to start using the tools!

### Quick Test with MCP Inspector

```bash
npm install -g @modelcontextprotocol/inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

---

## ☁️ Oracle Cloud Deployment

### One-Click Deployment

```bash
# Deploy to Oracle Cloud Free Tier
chmod +x scripts/deploy-oracle.sh
./scripts/deploy-oracle.sh
```

### Manual Deployment Steps

1. **Setup Oracle Cloud Account**
   - Create free tier account
   - Setup compartment and VCN
   - Generate SSH keys

2. **Deploy Instance**
   ```bash
   # Using OCI CLI
   oci compute instance launch \
     --availability-domain <your-AD> \
     --compartment-id <compartment-id> \
     --shape VM.Standard.A1.Flex \
     --shape-config '{"memoryInGBs": "6", "ocpus": "2"}' \
     --display-name stock-valuation-mcp \
     --assign-public-ip true
   ```

3. **Configure Environment**
   ```bash
   # SSH into instance
   ssh -i ~/.ssh/oracle_key opc@<instance-ip>

   # Setup Docker
   sudo yum install -y docker
   sudo systemctl start docker
   sudo usermod -aG docker opc

   # Deploy MCP Server
   docker run -d \
     --name stock-valuation-mcp \
     --restart unless-stopped \
     -p 2901:2901 \
     -e NODE_ENV=production \
     -e SET_WATCH_API_HOST=https://your-api.com \
     stock-valuation-mcp:latest
   ```

For detailed deployment instructions, see [Oracle Cloud Deployment Guide](docs/ORACLE-CLOUD-DEPLOYMENT.md).

---

## 🔗 n8n Integration

### Setting up n8n

1. **Deploy n8n**
   ```bash
   docker-compose up -d
   ```

2. **Create HTTP Request Node**
   ```json
   {
     "method": "POST",
     "url": "http://YOUR-MCP-SERVER:2901/mcp",
     "body": {
       "jsonrpc": "2.0",
       "id": 1,
       "method": "tools/call",
       "params": {
         "name": "fetch_stock_data",
         "arguments": {
           "symbol": "ADVANC"
         }
       }
     }
   }
   ```

### Example Workflows

- **Daily Analysis Report**: Automatically analyze portfolio stocks every morning
- **Price Alerts**: Get notified when stocks hit target prices
- **Batch Valuation**: Value multiple stocks in parallel

For complete n8n integration guide, see [n8n Integration Documentation](docs/N8N-INTEGRATION.md).

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Oracle Cloud Deployment](docs/ORACLE-CLOUD-DEPLOYMENT.md) | Complete guide for deploying to Oracle Cloud Free Tier |
| [n8n Integration](docs/N8N-INTEGRATION.md) | Integrate with n8n for automated workflows |
| [n8n API Examples](docs/N8N-API-EXAMPLES.md) | Ready-to-use n8n workflow examples |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |

---

## ⚙️ Installation

### Development Mode

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Build TypeScript
npm run build

# Run in development
npm run dev
```

### Production Mode

```bash
# Build for production
npm run clean
npm run build

# Run production server
npm start
```

### Docker Deployment

```bash
# Build image
docker build -t stock-valuation-mcp .

# Run with Docker
docker run -d \
  -p 2901:2901 \
  -e NODE_ENV=production \
  stock-valuation-mcp

# Or use Docker Compose
docker-compose up -d
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# API Configuration
SET_WATCH_API_HOST=https://xxxxxxxxxxxx.app  # Your API host
SET_WATCH_API_TIMEOUT=30000

# Server Configuration
NODE_ENV=production
LOG_LEVEL=info

# Optional: Custom API Authentication
# API_AUTH_HEADER=X-API-Key
# API_AUTH_VALUE=your-api-key
```

### Available Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SET_WATCH_API_HOST` | SET Watch API base URL | `https://xxxx-api.vercel.app` |
| `SET_WATCH_API_TIMEOUT` | API request timeout (ms) | `30000` |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |
| `API_AUTH_HEADER` | Custom auth header | (none) |
| `API_AUTH_VALUE` | Auth header value | (none) |

---

## 📚 API Documentation

### Tool Examples

#### 1. Complete Stock Analysis

```json
{
  "tool": "complete_valuation",
  "arguments": {
    "symbol": "ADVANC",
    "requiredReturn": 0.10,
    "growthRate": 0.05,
    "discountRate": 0.10
  }
}
```

#### 2. Financial Statement Analysis

```json
{
  "tool": "fetch_all_financial_statements",
  "arguments": {
    "symbol": "SCB",
    "period": "Quarterly"
  }
}
```

#### 3. Historical Trend Analysis

```json
{
  "tool": "analyze_historical_ratios",
  "arguments": {
    "symbol": "PTT",
    "period": "Quarterly"
  }
}
```

### Response Format

All tools return structured JSON responses including:

```json
{
  "symbol": "ADVANC.BK",
  "timestamp": "2024-01-20T10:30:00Z",
  "data": { ... },
  "analysis": { ... },
  "recommendation": "Buy"
}
```

---

## 💡 Usage Examples

### Example 1: Thai Stock Valuation

```json
{
  "tool": "fetch_stock_data",
  "arguments": {
    "symbol": "AOT"
  }
}
```

**Response**: Current stock data with PE, PBV, EPS, dividend yield, ROE, etc.

### Example 2: PE Band Analysis with Custom Data

```json
{
  "tool": "calculate_pe_band",
  "arguments": {
    "symbol": "AAPL",
    "currentPrice": 150.00,
    "eps": 5.00,
    "historicalPEs": [15, 18, 20, 22, 25, 23]
  }
}
```

**Response**: PE band analysis with fair value range and recommendation.

### Example 3: DCF Valuation

```json
{
  "tool": "calculate_dcf",
  "arguments": {
    "symbol": "GOOGL",
    "currentPrice": 150,
    "freeCashFlow": 60000000000,
    "sharesOutstanding": 15000000000,
    "growthRate": 0.08,
    "discountRate": 0.10,
    "years": 5
  }
}
```

**Response**: DCF analysis with 5-year projections and intrinsic value calculation.

### Example 4: Historical Ratio Analysis

```json
{
  "tool": "analyze_historical_ratios",
  "arguments": {
    "symbol": "KBANK",
    "period": "Quarterly"
  }
}
```

**Response**: Complete historical analysis with trends and investment recommendation.

---

## 🚀 Deployment

### Oracle Cloud Free Tier

1. **Update Deployment Script**:
   ```bash
   # Edit scripts/deploy-oracle.sh
   # Update your Oracle Cloud credentials
   ```

2. **Deploy**:
   ```bash
   chmod +x scripts/deploy-oracle.sh
   ./scripts/deploy-oracle.sh
   ```

3. **Configure Environment**:
   ```bash
   # On the instance
   docker pull <your-image>
   docker run -d \
     -p 2901:2901 \
     -e NODE_ENV=production \
     -e SET_WATCH_API_HOST=https://your-api.com \
     <your-image>
   ```

### Docker Compose

```yaml
services:
  stock-valuation:
    build: .
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - SET_WATCH_API_HOST=https://your-api.com
    ports:
      - "2901:2901"
    volumes:
      - ./logs:/app/logs
```

### Environment-Specific Configuration

**Development (.env.development)**:
```bash
NODE_ENV=development
LOG_LEVEL=debug
SET_WATCH_API_TIMEOUT=60000
```

**Production (.env.production)**:
```bash
NODE_ENV=production
LOG_LEVEL=warn
SET_WATCH_API_TIMEOUT=10000
```

---

## 🏗️ Architecture

### Project Structure

```
myMCPserver/
├── src/
│   ├── index.ts                    # Main MCP server entry point
│   ├── config/                     # Configuration management
│   │   └── index.ts               # Environment variable configuration
│   ├── types/                      # TypeScript type definitions
│   │   └── index.ts               # All type definitions
│   └── tools/                      # MCP tool implementations
│       ├── stockValuation.ts      # Core valuation models
│       ├── setWatchApi.ts         # SET Watch API integration
│       ├── financialStatements.ts # Financial statement tools
│       └── historicalRatios.ts     # Historical analysis tools
├── scripts/                         # Deployment scripts
├── dist/                           # Compiled TypeScript output
├── docs/                          # Additional documentation
├── tests/                         # Test files (when added)
├── docker-compose.yml              # Docker configuration
├── Dockerfile                      # Docker image definition
├── .env.example                    # Environment variable template
└── README.md                      # This file
```

### MCP Server Architecture

```
┌─────────────────────────────────────┐
│           Claude Desktop              │
│                │                    │
│         MCP Protocol                 │
│                │                    │
├─────────────────────────────────────┤
│         Stock Valuation Server       │
│  ┌─────────────────────────────┐   │
│  │       Tool Registry          │   │
│  │  ┌─────────────────────────┐ │   │
│  │  │   Valuation Tools       │ │   │
│  │  │  Data Fetching Tools   │ │   │
│  │  │  Analysis Tools        │ │   │
│  │  └─────────────────────────┘ │   │
│  │          ┌─────────────────┐ │   │
│  │          │ Configuration   │ │   │
│  │          └─────────────────┘ │   │
│  └─────────────────────────────┘   │
│                │                    │
│          ┌─────────────────┐      │
│          │  SET Watch API     │◄────┘
│          └─────────────────┘      │
└─────────────────────────────────────┘
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests if applicable**
5. **Ensure all tests pass** (`npm test`)
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to the branch** (`git push origin feature/amazing-feature`)
8. **Create a Pull Request**

### Code Standards

- Use TypeScript for all new code
- Follow ESLint rules (`npm run lint`)
- Add JSDoc comments for functions
- Write tests for new features
- Update documentation

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏‍♂️ Acknowledgments

- **[Model Context Protocol](https://modelcontextprotocol.io)** - For the MCP SDK
- **[SET Watch](https://set-watch.com)** - For providing the Thai stock market data API
- **Oracle Cloud** - For the generous free tier hosting option
- **[n8n](https://n8n.io)** - For workflow automation capabilities

---

## 📞 Support

- 📧 Create an issue for bug reports or feature requests
- 📖 Check [Issues](https://github.com/b9b4ymiN/myMCPserver/issues) for known problems
- 📚 See [Documentation](./docs/) for detailed guides

---

<div align="center">
  <strong>Built with ❤️ for the investment community</strong>
</div>