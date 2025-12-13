# 🔧 Troubleshooting Guide

## Table of Contents
1. [Common Issues](#common-issues)
2. [Oracle Cloud Issues](#oracle-cloud-issues)
3. [MCP Server Issues](#mcp-server-issues)
4. [n8n Integration Issues](#n8n-integration-issues)
5. [Performance Issues](#performance-issues)
6. [Debugging Tools](#debugging-tools)
7. [Emergency Recovery](#emergency-recovery)

## Common Issues

### 1. Server Won't Start

#### Symptoms
- Container exits immediately
- Port 2901 not accessible
- Timeouts when connecting

#### Diagnosis
```bash
# Check container status
docker ps -a

# Check container logs
docker logs stock-valuation-mcp

# Check port usage
netstat -tulpn | grep 2901
```

#### Solutions

**A. Port Already in Use**
```bash
# Find process using port 2901
sudo lsof -i :2901

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "2902:2901"
```

**B. Missing Environment Variables**
```bash
# Check .env file exists
ls -la .env

# Create .env from example
cp .env.example .env

# Edit with correct values
nano .env
```

**C. Insufficient Permissions**
```bash
# Check Docker permissions
sudo usermod -aG docker $USER

# Restart Docker service
sudo systemctl restart docker
```

### 2. API Connection Errors

#### Symptoms
- HTTP 502/503 errors
- Connection refused
- Timeouts from API calls

#### Diagnosis
```bash
# Test API connectivity
curl -I https://your-api-host.com

# Check DNS resolution
nslookup your-api-host.com

# Test from container
docker exec -it stock-valuation-mcp curl -I https://your-api-host.com
```

#### Solutions

**A. Firewall Blocking**
```bash
# Check firewall rules
sudo firewall-cmd --list-all

# Allow outbound HTTPS
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

**B. SSL Certificate Issues**
```bash
# Update CA certificates
sudo yum update -y ca-certificates

# Or disable SSL verification for testing (NOT recommended for production)
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

**C. Proxy Configuration**
```bash
# Set proxy if required
export HTTP_PROXY=http://proxy.company.com:8080
export HTTPS_PROXY=http://proxy.company.com:8080
```

## Oracle Cloud Issues

### 1. Instance Not Accessible

#### Symptoms
- SSH connection refused
- Instance not responding to ping
- Web interface not loading

#### Diagnosis
```bash
# Check instance state
oci compute instance get --instance-id <instance-id>

# Check public IP
oci compute instance list --query 'data[0]."public-ip"'

# Check VCN and subnet
oci network vcn get --vcn-id <vcn-id>
oci network subnet get --subnet-id <subnet-id>
```

#### Solutions

**A. Security List Configuration**
```bash
# Check security list
oci network security-list get --security-list-id <security-list-id>

# Update security list rules
oci network security-list update \
  --security-list-id <security-list-id> \
  --ingress-security-rules '[{"protocol": "6", "tcpOptions": {"destinationPortRange": {"max": 2901, "min": 2901}}, "source": "0.0.0.0/0", "isStateless": false}]'
```

**B. Instance in Wrong State**
```bash
# Start instance if stopped
oci compute instance action --instance-id <instance-id> --action START

# Reboot if unresponsive
oci compute instance action --instance-id <instance-id> --action SOFTRESET
```

### 2. Out of Memory

#### Symptoms
- Container OOMKilled
- Instance becomes unresponsive
- Services keep restarting

#### Diagnosis
```bash
# Check memory usage
free -h

# Check Docker memory
docker stats

# Check system logs
dmesg | grep -i oom
```

#### Solutions

**A. Increase Instance Shape**
```bash
oci compute instance update \
  --instance-id <instance-id> \
  --shape-config '{"memoryInGBs": "12", "ocpus": "4"}'
```

**B. Optimize Container**
```yaml
# In docker-compose.yml
services:
  stock-valuation-mcp:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### 3. Disk Space Full

#### Symptoms
- Write operations fail
- Docker errors
- Container won't start

#### Diagnosis
```bash
# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Find large files
sudo find / -type f -size +1G 2>/dev/null
```

#### Solutions

**A. Clean Docker**
```bash
# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Clean volumes
docker volume prune
```

**B. Increase Disk Size**
```bash
# Attach new block volume
oci bv volume create \
  --compartment-id <compartment-id> \
  --availability-domain <ad> \
  --size-in-gbs 100 \
  --display-name additional-storage

# Attach to instance
oci compute volume-attachment create \
  --instance-id <instance-id> \
  --volume-id <volume-id> \
  --type iscsi
```

## MCP Server Issues

### 1. Invalid JSON-RPC Requests

#### Symptoms
- HTTP 400 errors
- "Invalid request" responses
- Tools not executing

#### Diagnosis
```bash
# Test with curl
curl -X POST http://localhost:2901/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

#### Common JSON-RPC Errors

**Missing Required Fields**
```json
// Incorrect
{
  "method": "tools/call",
  "params": { "symbol": "AAPL" }
}

// Correct
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": { "symbol": "AAPL" }
}
```

### 2. Tool Execution Failures

#### Symptoms
- Tool returns error instead of data
- Partial responses
- Hanging requests

#### Debugging Tool Calls
```bash
# Enable debug logging
export LOG_LEVEL=debug

# Test specific tool
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

#### Common Tool Errors

**A. Invalid Arguments**
```json
// Error: Missing required argument
{
  "error": {
    "code": -32602,
    "message": "Invalid params: missing required field 'symbol'"
  }
}
```

**B. API Errors**
```json
// Error: API call failed
{
  "error": {
    "code": -32000,
    "message": "SET Watch API error: 404 Not Found"
  }
}
```

## n8n Integration Issues

### 1. Webhook Not Triggering

#### Symptoms
- Webhook URL not receiving requests
- n8n workflow not starting
- Timeout errors

#### Diagnosis
```bash
# Check n8n webhook configuration
curl -X POST https://your-n8n-domain.com/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check n8n logs
docker logs n8n
```

#### Solutions

**A. Webhook URL Incorrect**
- Ensure URL includes workflow ID
- Use https in production
- Check trailing slashes

**B. CORS Issues**
```javascript
// In MCP server, add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

### 2. Large Payload Handling

#### Symptoms
- Requests timing out
- Partial data received
- Memory errors in n8n

#### Solutions

**A. Increase Timeout**
```json
// In n8n HTTP Request node
{
  "timeout": 60000,
  "retry": {
    "enabled": true,
    "maxTries": 3
  }
}
```

**B. Stream Processing**
```javascript
// Process large responses in chunks
const response = await fetch(url);
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  // Process chunk
}
```

## Performance Issues

### 1. Slow Response Times

#### Diagnosis
```bash
# Check response times
curl -w "@curl-format.txt" -X POST http://localhost:2901/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"fetch_stock_data","arguments":{"symbol":"AAPL"}}}'

# curl-format.txt
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

#### Solutions

**A. Implement Caching**
```typescript
// Add Redis cache
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// Cache API responses
const cacheKey = `stock:${symbol}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 minutes
```

**B. Optimize Database Queries**
```sql
-- Add indexes
CREATE INDEX idx_symbol ON stock_analyses(symbol);
CREATE INDEX idx_timestamp ON stock_analyses(timestamp);

-- Use pagination
SELECT * FROM stock_analyses
WHERE symbol = 'AAPL'
ORDER BY timestamp DESC
LIMIT 100;
```

### 2. High CPU Usage

#### Diagnosis
```bash
# Check CPU usage
top -p $(pgrep node)

# Check Docker stats
docker stats --no-stream

# Profile Node.js
node --prof dist/index.js
```

#### Solutions

**A. Optimize Code**
```typescript
// Use worker threads for CPU-intensive tasks
import { Worker, isMainThread, parentPort } from 'worker_threads';

if (isMainThread) {
  const worker = new Worker('./valuation-worker.js');
  worker.postMessage({ symbol, data });
} else {
  // Heavy calculations here
}
```

**B. Scale Horizontally**
```yaml
# docker-compose.yml with multiple replicas
services:
  stock-valuation-mcp:
    replicas: 3
    deploy:
      replicas: 3
```

## Debugging Tools

### 1. Enable Debug Logging
```bash
# Set environment variable
export LOG_LEVEL=debug

# Or in .env
echo "LOG_LEVEL=debug" >> .env
```

### 2. Health Check Endpoint
```typescript
// Add to index.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version
  });
});
```

### 3. Prometheus Metrics
```typescript
import client from 'prom-client';

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code']
});

// Use in routes
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.path, code: res.statusCode });
  });
  next();
});
```

## Emergency Recovery

### 1. Backup Data
```bash
# Backup database
pg_dump n8n > n8n-backup-$(date +%Y%m%d).sql

# Backup Docker volumes
docker run --rm -v n8n_n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-data-$(date +%Y%m%d).tar.gz -C /data .

# Backup configurations
tar czf configs-backup-$(date +%Y%m%d).tar.gz .env docker-compose.yml nginx/
```

### 2. Quick Recovery Script
```bash
#!/bin/bash
# emergency-recovery.sh

echo "Starting emergency recovery..."

# Stop all services
docker-compose down

# Restore from backup
docker-compose -f docker-compose-backup.yml up -d

# Wait for services
sleep 30

# Check health
curl -f http://localhost:2901/health || echo "Health check failed"

echo "Recovery complete"
```

### 3. Disaster Recovery Checklist

- [ ] Oracle Cloud instance status
- [ ] DNS resolution
- [ ] SSL certificates validity
- [ ] Database connectivity
- [ ] External API availability
- [ ] Monitoring alerts
- [ ] Backup integrity
- [ ] Documentation updates

## Contact Support

If issues persist:

1. Check [GitHub Issues](https://github.com/yourusername/myMCPserver/issues)
2. Create new issue with:
   - Error messages
   - Logs from MCP server
   - n8n workflow export
   - Environment details

3. Emergency contact:
   - Email: support@yourcompany.com
   - Slack: #emergency-support