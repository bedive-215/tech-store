#!/bin/bash
# Tech-Store GCloud Deployment Script
# Deploy to Compute Engine VM with Docker Compose

set -e

# Configuration
PROJECT_ID="hailamdev"
ZONE="asia-southeast1-b"
INSTANCE_NAME="tech-store-vm"
MACHINE_TYPE="e2-medium"
DOMAIN="store.hailamdev.space"

echo "🚀 Tech-Store GCloud Deployment"
echo "================================"

# Check if gcloud is authenticated
gcloud auth print-identity-token > /dev/null 2>&1 || {
    echo "❌ Please authenticate with: gcloud auth login"
    exit 1
}

# Set project
gcloud config set project $PROJECT_ID

# Create VM if not exists
echo "📦 Checking/Creating VM instance..."
if ! gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE > /dev/null 2>&1; then
    gcloud compute instances create $INSTANCE_NAME \
        --zone=$ZONE \
        --machine-type=$MACHINE_TYPE \
        --image-family=ubuntu-2204-lts \
        --image-project=ubuntu-os-cloud \
        --boot-disk-size=50GB \
        --boot-disk-type=pd-ssd \
        --tags=http-server,https-server \
        --metadata=startup-script='#!/bin/bash
apt-get update
apt-get install -y docker.io docker-compose git certbot
systemctl enable docker
systemctl start docker
usermod -aG docker $USER'
    
    echo "⏳ Waiting for VM to be ready..."
    sleep 60
fi

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "🌐 VM External IP: $EXTERNAL_IP"

# Create firewall rules
echo "🔥 Configuring firewall rules..."
gcloud compute firewall-rules create allow-http \
    --allow=tcp:80 \
    --target-tags=http-server \
    --description="Allow HTTP" 2>/dev/null || true

gcloud compute firewall-rules create allow-https \
    --allow=tcp:443 \
    --target-tags=https-server \
    --description="Allow HTTPS" 2>/dev/null || true

# Reserve static IP
echo "📍 Reserving static IP..."
gcloud compute addresses create tech-store-ip \
    --region=asia-southeast1 2>/dev/null || true

STATIC_IP=$(gcloud compute addresses describe tech-store-ip \
    --region=asia-southeast1 \
    --format='get(address)' 2>/dev/null) || STATIC_IP=$EXTERNAL_IP

echo "📋 Static IP: $STATIC_IP"

# DNS Configuration reminder
echo ""
echo "🔧 DNS CONFIGURATION REQUIRED:"
echo "=============================="
echo "Add these DNS records to your domain registrar:"
echo ""
echo "  A    store.hailamdev.space      →  $STATIC_IP"
echo "  A    api.store.hailamdev.space  →  $STATIC_IP"
echo ""

# Copy files to VM
echo "📤 Copying project files to VM..."
gcloud compute scp --recurse \
    --zone=$ZONE \
    ../../../tech-store $INSTANCE_NAME:~/

# SSH and setup
echo "🔨 Setting up Docker on VM..."
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    cd ~/tech-store/deployment/docker
    
    # Wait for Docker
    while ! docker info > /dev/null 2>&1; do
        echo 'Waiting for Docker...'
        sleep 5
    done
    
    # Build and start services
    docker-compose build
    docker-compose up -d
    
    echo '✅ Services started!'
    docker-compose ps
"

echo ""
echo "✅ Deployment completed!"
echo "========================"
echo "VM IP: $STATIC_IP"
echo ""
echo "Next steps:"
echo "1. Configure DNS records (see above)"
echo "2. SSH to VM and run certbot for SSL:"
echo "   gcloud compute ssh $INSTANCE_NAME --zone=$ZONE"
echo "   sudo certbot certonly --standalone -d $DOMAIN -d api.$DOMAIN"
echo "3. Restart nginx after SSL certificate is obtained"
