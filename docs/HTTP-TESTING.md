# 🌐 HTTP Testing Guide for MCP Server

## Testing MCP Server with curl

### 1. Check if Server is Running

First, verify that your MCP server is running:

```bash
# If running locally
docker ps | grep stock-valuation

# Check logs
docker logs stock-valuation-mcp

# Or if running directly
ps aux | grep node
```

### 2. Correct curl Command Format

The MCP server expects specific JSON-RPC format. Here's the correct way to test:

```bash
curl -X POST http://localhost:2901/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "fetch_stock_data",
      "arguments": {
        "symbol": "ADVANC"
      }
    }
  }'
```

### 3. Common Issues and Solutions

#### Issue 1: Server Not Running

**Error**: `Connection refused` or `502 Bad Gateway`

**Solution**: Start the server
```bash
# Using Docker
docker run -d \
  --name stock-valuation-mcp \
  -p 2901:2901 \
  -e NODE_ENV=production \
  -e SET_WATCH_API_HOST=https://set-watch-api.vercel.app \
  stock-valuation-mcp

# Or using npm
npm start
```

#### Issue 2: Wrong Port or Host

**Symptoms**: Connection timeout or 502 error

**Check your configuration**:
```bash
# Check if port 2901 is open
netstat -tulpn | grep 2901

# Test with telnet
telnet localhost 2901
```

#### Issue 3: API Host Configuration

If using a custom API host, ensure it's correct:

```bash
# Check your .env file
cat .env | grep SET_WATCH_API_HOST

# Test the API host directly
curl -I https://your-api-host.com
```

### 4. Testing Different Tools

#### Test PE Band Calculation

```bash
curl -X POST http://localhost:2901/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "calculate_pe_band",
      "arguments": {
        "symbol": "SCB",
        "currentPrice": 145.50,
        "eps": 8.5,
        "historicalPEs": [15.2, 16.8, 17.3, 18.1, 19.5, 18.7, 17.9]
      }
    }
  }'
```

#### Test Complete Valuation

```bash
curl -X POST http://localhost:2901/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "complete_valuation",
      "arguments": {
        "symbol": "PTT",
        "requiredReturn": 0.10,
        "growthRate": 0.05,
        "discountRate": 0.10
      }
    }
  }'
```

### 5. Expected Response Format

Successful response should look like:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"symbol\":\"ADVANC.BK\",\"currentPrice\":185.5,\"pe\":18.23,\"pbv\":2.45,\"eps\":10.18,\"dividendYield\":3.12,\"roe\":15.6,\"roa\":8.2,\"timestamp\":\"2024-01-20T10:30:00Z\"}"
      }
    ]
  }
}
```

### 6. Debug Mode

Enable debug logging:
```bash
# Set environment variable
export LOG_LEVEL=debug

# Or update .env
echo "LOG_LEVEL=debug" >> .env

# Restart server
docker restart stock-valuation-mcp
```

### 7. Testing on Oracle Cloud

If deployed on Oracle Cloud:

```bash
# Replace with your instance IP
MCP_SERVER="http://YOUR-ORACLE-IP:2901"

# Test connection
curl -I $MCP_SERVER

# Test MCP endpoint
curl -X POST $MCP_SERVER/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "fetch_stock_data",
      "arguments": {
        "symbol": "ADVANC"
      }
    }
  }'
```

### 8. Firewall Issues

If running on Oracle Cloud, check security list:

```bash
# Using OCI CLI
oci network security-list get \
  --security-list-id <your-security-list-id>

# Ensure port 2901 is open
oci network security-list update \
  --security-list-id <security-list-id> \
  --ingress-security-rules '[{"protocol": "6", "tcpOptions": {"destinationPortRange": {"max": 2901, "min": 2901}}, "source": "0.0.0.0/0", "isStateless": false}]'
```

### 9. Alternative Testing with Python

```python
import requests
import json

url = "http://localhost:2901/mcp"
payload = {
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

try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Error: {e}")
```

### 10. Test Health Endpoint

If you added a health endpoint to the server:

```bash
curl http://localhost:2901/health
```

## Troubleshooting Checklist

- [ ] Server is running (`docker ps`)
- [ ] Port 2901 is exposed
- [ ] API host is reachable
- [ ] Environment variables are set
- [ ] Firewall allows port 2901
- [ ] Using correct JSON-RPC format
- [ ] Content-Type header is set to application/json