#!/bin/bash

# Oracle Cloud Deployment Script for Stock Valuation MCP Server

set -e

# Configuration
IMAGE_NAME="stock-valuation-mcp"
VERSION="latest"

# Oracle Cloud Configuration (update these values)
REGION_KEY="phx"  # e.g., phx, iad, etc.
TENANCY="<your-tenancy-ocid>"
COMPARTMENT_ID="<your-compartment-ocid>"
REPO="<your-repo-name>"

# Environment variables for production
# You can modify these or set them as environment variables before running
export NODE_ENV=${NODE_ENV:-production}
export LOG_LEVEL=${LOG_LEVEL:-warn}
export SET_WATCH_API_HOST=${SET_WATCH_API_HOST:-https://xxxxxx-api.vercel.app}
export SET_WATCH_API_TIMEOUT=${SET_WATCH_API_TIMEOUT:-30000}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Oracle Cloud deployment for ${IMAGE_NAME}${NC}"

# Step 1: Build Docker image
echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t ${IMAGE_NAME}:${VERSION} .

# Step 2: Tag for Oracle Container Registry
echo -e "${YELLOW}Tagging image for Oracle Container Registry...${NC}"
OCIR_REGISTRY="${REGION_KEY}.ocir.io"
OCIR_IMAGE="${OCIR_REGISTRY}/${TENANCY}/${REPO}/${IMAGE_NAME}:${VERSION}"
docker tag ${IMAGE_NAME}:${VERSION} ${OCIR_IMAGE}

# Step 3: Push to Oracle Container Registry
echo -e "${YELLOW}Pushing to Oracle Container Registry...${NC}"
docker push ${OCIR_IMAGE}

# Step 4: Create Docker deployment script for Oracle instance
cat > deploy-on-instance.sh << 'EOF'
#!/bin/bash

# Deployment script to run on Oracle Cloud instance

set -e

IMAGE_NAME="$1"
PORT="3000"

echo "Pulling and running ${IMAGE_NAME}"

# Pull latest image
docker pull ${IMAGE_NAME}

# Stop existing container if running
docker stop stock-valuation-server 2>/dev/null || true
docker rm stock-valuation-server 2>/dev/null || true

# Run new container
docker run -d \
  --name stock-valuation-server \
  --restart unless-stopped \
  -p ${PORT}:3000 \
  -e NODE_ENV=production \
  ${IMAGE_NAME}

echo "Deployment complete!"
echo "Server is running on port ${PORT}"
docker logs stock-valuation-server
EOF

chmod +x deploy-on-instance.sh

echo -e "${GREEN}Deployment preparation complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. SSH into your Oracle Cloud instance"
echo "2. Run: ./deploy-on-instance.sh ${OCIR_IMAGE}"
echo "3. Verify the service is running: docker logs stock-valuation-server"

# Step 5: Optional - Auto-deploy to Oracle Cloud (requires OCI CLI)
read -p "Do you want to deploy directly to Oracle Cloud now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deploying to Oracle Cloud...${NC}"

    # Create compute instance
    oci compute instance launch \
        --availability-domain "$(oci iam availability-domain list --compartment-id ${COMPARTMENT_ID} --query 'data[0].name' --raw-output)" \
        --compartment-id ${COMPARTMENT_ID} \
        --shape VM.Standard.A1.Flex \
        --shape-config '{"memoryInGBs": "6", "ocpus": "2"}' \
        --subnet-id "$(oci network subnet list --compartment-id ${COMPARTMENT_ID} --query 'data[0].id' --raw-output)" \
        --image-id "$(oci compute image list --compartment-id ${COMPARTMENT_ID} --operating-system "Oracle Linux" --operating-system-version "8" --query 'data[0].id' --raw-output)" \
        --display-name stock-valuation-server \
        --assign-public-ip true \
        --ssh-authorized-keys-file ~/.ssh/id_rsa.pub \
        --instance-options '{"instanceOptions": {"bootVolumeSizeInGBs": 50}}' \
        --defined-tags '{"Environment": "production"}' \
        --freeform-tags '{"Project": "stock-valuation-mcp", "NodeEnv": "'${NODE_ENV}'"}' \
        --wait-for-state RUNNING

    echo -e "${GREEN}Instance created successfully!${NC}"

    # Get instance public IP
    INSTANCE_IP=$(oci compute instance list --compartment-id ${COMPARTMENT_ID} --display-name stock-valuation-server --query 'data[0]."public-ip"' --raw-output)

    echo -e "${YELLOW}Instance IP: ${INSTANCE_IP}${NC}"
    echo "Run the following on the instance:"
    echo "ssh -i ~/.ssh/id_rsa opc@${INSTANCE_IP}"
    echo "sudo yum install -y docker"
    echo "sudo systemctl start docker && sudo systemctl enable docker"
    echo "sudo usermod -a -G docker opc"
    echo "# Logout and login again"
    echo "docker pull ${OCIR_IMAGE}"
    echo "docker run -d -p 2901:2901 --restart unless-stopped \\"
    echo "  -e NODE_ENV=${NODE_ENV} \\"
    echo "  -e LOG_LEVEL=${LOG_LEVEL} \\"
    echo "  -e SET_WATCH_API_HOST=${SET_WATCH_API_HOST} \\"
    echo "  ${OCIR_IMAGE}"
fi

echo -e "${GREEN}Deployment script complete!${NC}"