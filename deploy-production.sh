#!/bin/bash

# Production Deployment Script for Village Security System

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if domain is provided
if [ -z "$1" ]; then
    print_error "Please provide your domain name"
    echo "Usage: ./deploy-production.sh your-domain.com"
    exit 1
fi

DOMAIN=$1
print_status "Deploying for domain: $DOMAIN"

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
    print_warning "Running as root is not recommended for security reasons"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available. Please install Docker Compose plugin."
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p logs/caddy
mkdir -p backend/.env.production

# Update Caddyfile.production with actual domain
print_status "Updating Caddyfile with domain: $DOMAIN"
sed "s/your-domain.com/$DOMAIN/g" Caddyfile.production > Caddyfile.production.tmp
mv Caddyfile.production.tmp Caddyfile.production

# Check if .env file exists for backend
if [ ! -f "backend/.env" ]; then
    print_warning "Backend .env file not found. Creating template..."
    cat > backend/.env << EOF
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
DATABASE_URL=postgresql://admin:1234@db:5432/SOFEWARE_EN
PORT=3001
EOF
    print_warning "Please review and update backend/.env with your actual values"
fi

# Stop any existing containers
print_status "Stopping existing containers..."
docker compose -f docker-compose-server.yml down || true

# Pull latest images
print_status "Pulling latest base images..."
docker compose -f docker-compose-server.yml pull

# Build application images
print_status "Building application images..."
docker compose -f docker-compose-server.yml build

# Start services
print_status "Starting production services..."
docker compose -f docker-compose-server.yml up -d

# Wait for services to start
print_status "Waiting for services to initialize..."
sleep 30

# Check service status
print_status "Checking service status..."
if docker compose -f docker-compose-server.yml ps | grep -q "unhealthy\|exited"; then
    print_error "Some services failed to start properly"
    docker compose -f docker-compose-server.yml ps
    docker compose -f docker-compose-server.yml logs
    exit 1
fi

print_success "All services started successfully!"

# Display service status
print_status "Service Status:"
docker compose -f docker-compose-server.yml ps

# Test HTTP connection
print_status "Testing HTTP connection..."
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "200\|301\|302"; then
    print_success "HTTP connection successful"
else
    print_warning "HTTP connection test failed - this might be normal if DNS hasn't propagated yet"
fi

# Wait for SSL certificate
print_status "Waiting for SSL certificate generation (this may take a few minutes)..."
sleep 60

# Test HTTPS connection
print_status "Testing HTTPS connection..."
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
    print_success "HTTPS connection successful"
    
    # Test WebSocket
    print_status "WebSocket endpoint available at: wss://$DOMAIN/ws"
else
    print_warning "HTTPS connection test failed - SSL certificate might still be generating"
    print_status "Check Caddy logs: docker compose -f docker-compose-server.yml logs caddy"
fi

# Display final information
echo ""
echo "========================================"
print_success "Production Deployment Complete!"
echo "========================================"
echo ""
echo "🌐 Application URLs:"
echo "   Main Site: https://$DOMAIN"
echo "   API: https://$DOMAIN/api"
echo "   WebSocket: wss://$DOMAIN/ws"
echo ""
echo "📋 Management Commands:"
echo "   View logs: docker compose -f docker-compose-server.yml logs [service]"
echo "   Restart: docker compose -f docker-compose-server.yml restart [service]"
echo "   Stop: docker compose -f docker-compose-server.yml down"
echo "   Update: ./deploy-production.sh $DOMAIN"
echo ""
echo "🔍 Troubleshooting:"
echo "   If SSL fails, check: docker compose -f docker-compose-server.yml logs caddy"
echo "   If WebSocket fails, check browser developer tools console"
echo ""

# Create a status check script
cat > check-status.sh << 'EOF'
#!/bin/bash
echo "=== Service Status ==="
docker compose -f docker-compose-server.yml ps

echo ""
echo "=== Resource Usage ==="
docker stats --no-stream

echo ""
echo "=== Recent Logs ==="
docker compose -f docker-compose-server.yml logs --tail=10
EOF

chmod +x check-status.sh
print_success "Status check script created: ./check-status.sh"

print_success "Deployment completed successfully! 🎉"
