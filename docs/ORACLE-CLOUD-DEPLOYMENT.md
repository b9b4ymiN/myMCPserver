# 🚀 Oracle Cloud Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Oracle Cloud Setup](#oracle-cloud-setup)
3. [Deployment Methods](#deployment-methods)
4. [Post-Deployment Configuration](#post-deployment-configuration)
5. [Monitoring and Maintenance](#monitoring-and-maintenance)
6. [Scaling and Optimization](#scaling-and-optimization)

## Prerequisites

### Required Accounts
- **Oracle Cloud Infrastructure (OCI)** account with Free Tier
- **GitHub** account (for cloning the repository)
- **Docker Hub** or **Oracle Container Registry** account

### Local Tools
- Docker Desktop installed and running
- Git installed
- OCI CLI (optional, for automated deployment)

### Verify Oracle Free Tier Eligibility
```bash
# Check your free tier limits
oci compute shape list --compartment-id <your-compartment-id>
```

## Oracle Cloud Setup

### 1. Create Compartment
1. Login to Oracle Cloud Console
2. Navigate to **Identity & Security** → **Compartments**
3. Click **Create Compartment**
4. Name: `MCP-Servers`
5. Description: `Compartment for MCP server deployments`

### 2. Generate SSH Key Pair
```bash
# Generate SSH key on your local machine
ssh-keygen -t rsa -b 2048 -f ~/.ssh/oracle_key

# Display public key (copy this for Oracle Cloud)
cat ~/.ssh/oracle_key.pub
```

### 3. Create Virtual Cloud Network (VCN)
1. Navigate to **Networking** → **Virtual Cloud Networks**
2. Click **Create VCN**
3. Name: `MCP-VCN`
4. CIDR Block: `10.0.0.0/16`
5. Click **Create**

### 4. Create Security List
1. In your VCN, go to **Security Lists**
2. Click **Create Security List**
3. Name: `MCP-Security-List`
4. Add Ingress Rules:
   - **Port 22** (SSH): `0.0.0.0/0`
   - **Port 2901** (MCP Server): `0.0.0.0/0`

## Deployment Methods

### Method 1: Using OCI CLI (Recommended)

#### 1. Install and Configure OCI CLI
```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Configure
oci setup config
```

#### 2. Create Deployment Script
Create `deploy-oracle.sh`:
```bash
#!/bin/bash
set -e

# Configuration
IMAGE_NAME="stock-valuation-mcp"
VERSION="latest"
COMPARTMENT_ID="<your-compartment-ocid>"
REGION="phx"
VCN_ID="<your-vcn-id>"
SUBNET_ID="<your-subnet-id>"

# Build and push to Oracle Container Registry
docker build -t ${IMAGE_NAME}:${VERSION} .

# Tag for OCIR
OCIR_REGISTRY="${REGION}.ocir.io"
OCIR_USERNAME="<your-tenancy-name>/<your-username>"
OCIR_IMAGE="${OCIR_REGISTRY}/${OCIR_USERNAME}/${IMAGE_NAME}:${VERSION}"

docker tag ${IMAGE_NAME}:${VERSION} ${OCIR_IMAGE}
docker login ${OCIR_REGISTRY} -u ${OCIR_USERNAME} -p $(oci iam auth token create --description 'Docker' | jq -r '.data.token')
docker push ${OCIR_IMAGE}

# Create compute instance
oci compute instance launch \
    --availability-domain "$(oci iam availability-domain list --compartment-id ${COMPARTMENT_ID} --query 'data[0].name' --raw-output)" \
    --compartment-id ${COMPARTMENT_ID} \
    --shape VM.Standard.A1.Flex \
    --shape-config '{"memoryInGBs": "6", "ocpus": "2"}' \
    --subnet-id ${SUBNET_ID} \
    --image-id "$(oci compute image list --compartment-id ${COMPARTMENT_ID} --operating-system "Oracle Linux" --operating-system-version "8" --query 'data[0].id' --raw-output)" \
    --display-name stock-valuation-mcp \
    --assign-public-ip true \
    --ssh-authorized-keys-file ~/.ssh/oracle_key.pub \
    --metadata '{"docker_image": "'"${OCIR_IMAGE}"'"}' \
    --user-data-file ./cloud-init.yml \
    --wait-for-state RUNNING

# Get instance IP
INSTANCE_IP=$(oci compute instance list --compartment-id ${COMPARTMENT_ID} --display-name stock-valuation-mcp --query 'data[0]."public-ip"' --raw-output)
echo "Instance deployed at: ${INSTANCE_IP}"
```

#### 3. Create Cloud Init File
Create `cloud-init.yml`:
```yaml
#cloud-config
package_update: true
package_upgrade: true
packages:
  - docker
  - docker-compose

runcmd:
  - systemctl start docker
  - systemctl enable docker
  - usermod -aG docker opc
  - docker run -d --name stock-valuation-mcp --restart unless-stopped -p 2901:2901 -e NODE_ENV=production -e LOG_LEVEL=info -e SET_WATCH_API_HOST=https://your-api.com ${metadata.docker_image}

final_message: "Stock Valuation MCP Server deployment complete!"
```

### Method 2: Manual Deployment via Console

#### 1. Create Compute Instance
1. Navigate to **Compute** → **Instances**
2. Click **Create Instance**
3. Configure:
   - Name: `stock-valuation-mcp`
   - Compartment: `MCP-Servers`
   - Shape: `VM.Standard.A1.Flex`
   - Memory: `6 GB`
   - OCPUs: `2`
   - Image: `Oracle Linux 8`
   - SSH Key: Paste your public key
   - VCN: `MCP-VCN`

#### 2. Configure Instance
SSH into your instance:
```bash
ssh -i ~/.ssh/oracle_key opc@<instance-public-ip>
```

Run setup commands:
```bash
# Update system
sudo yum update -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker opc

# Create app directory
mkdir -p ~/app
cd ~/app

# Clone repository
git clone https://github.com/yourusername/myMCPserver.git .

# Create .env file
cat > .env << EOF
NODE_ENV=production
LOG_LEVEL=warn
SET_WATCH_API_HOST=https://your-api-host.com
SET_WATCH_API_TIMEOUT=30000
EOF

# Run with Docker
docker-compose up -d
```

## Post-Deployment Configuration

### 1. Verify Server Status
```bash
# Check container status
docker ps

# Check logs
docker logs stock-valuation-mcp

# Test MCP connection
curl -X POST http://localhost:2901/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}'
```

### 2. Set Up Reverse Proxy (Optional)
Create Nginx configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:2901;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Configure SSL (Optional)
```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Generate SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Monitoring and Maintenance

### 1. Set Up Logging
Create log rotation:
```bash
sudo nano /etc/logrotate.d/docker-containers
```

Content:
```
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    copytruncate
}
```

### 2. Health Check Script
Create `health-check.sh`:
```bash
#!/bin/bash
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:2901/health)
if [ $response -ne 200 ]; then
    echo "Server is down, restarting..."
    docker restart stock-valuation-mcp
else
    echo "Server is running"
fi
```

### 3. Auto-restart Configuration
In Docker Compose:
```yaml
services:
  stock-valuation-mcp:
    restart: unless-stopped
    deploy:
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

## Scaling and Optimization

### 1. Load Balancing
```bash
# Create load balancer
oci lb load-balancer create \
    --compartment-id ${COMPARTMENT_ID} \
    --display-name mcp-lb \
    --shape flexible \
    --subnet-ids ${SUBNET_ID} \
    --is-private false
```

### 2. Instance Scaling
```bash
# Update instance shape
oci compute instance update \
    --instance-id ${INSTANCE_ID} \
    --shape-config '{"memoryInGBs": "12", "ocpus": "4"}'
```

### 3. Performance Monitoring
Install monitoring agents:
```bash
# Oracle Cloud Agent
sudo yum install -y oci-utils

# Prometheus exporter
docker run -d \
  --name node-exporter \
  -p 9100:9100 \
  prom/node-exporter
```

## Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker logs stock-valuation-mcp

# Check container status
docker inspect stock-valuation-mcp
```

#### 2. Connection Refused
```bash
# Check firewall
sudo firewall-cmd --list-all

# Open port if needed
sudo firewall-cmd --permanent --add-port=2901/tcp
sudo firewall-cmd --reload
```

#### 3. Out of Memory
```bash
# Check memory usage
free -h

# Check Docker memory
docker stats
```

### Emergency Recovery
```bash
# Backup data
docker export stock-valuation-mcp > backup.tar

# Restore from backup
docker import backup.tar stock-valuation-mcp:backup

# Run from backup
docker run -d --name stock-valuation-recovery -p 2901:2901 stock-valuation-mcp:backup
```

## Security Best Practices

1. **Use SSH Keys Only**: Disable password authentication
   ```bash
   sudo nano /etc/ssh/sshd_config
   # PasswordAuthentication no
   ```

2. **Regular Updates**
   ```bash
   sudo yum update -y
   ```

3. **Monitor Access Logs**
   ```bash
   sudo tail -f /var/log/secure
   ```

4. **Use Oracle Cloud Guard**: Enable in your compartment

## Next Steps

After deployment:
1. [Integrate with n8n](./N8N-INTEGRATION.md)
2. [Set up monitoring](./MONITORING.md)
3. [Configure backup strategies](./BACKUP.md)