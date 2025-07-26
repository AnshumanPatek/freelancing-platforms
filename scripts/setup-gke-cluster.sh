#!/bin/bash

# GKE Cluster Setup Script for Job Portal API
# This script automates the GKE cluster creation process

set -e  # Exit on any error

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

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install it first."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Get user input
get_user_input() {
    print_status "Getting configuration from user..."
    
    read -p "Enter your GCP Project ID (or press Enter for 'job-portal-production'): " PROJECT_ID
    PROJECT_ID=${PROJECT_ID:-job-portal-production}
    
    read -p "Enter cluster name (or press Enter for 'job-portal-cluster'): " CLUSTER_NAME
    CLUSTER_NAME=${CLUSTER_NAME:-job-portal-cluster}
    
    read -p "Enter zone (or press Enter for 'us-central1-a'): " ZONE
    ZONE=${ZONE:-us-central1-a}
    
    read -p "Enter number of nodes (or press Enter for '3'): " NUM_NODES
    NUM_NODES=${NUM_NODES:-3}
    
    read -p "Enter machine type (or press Enter for 'e2-medium'): " MACHINE_TYPE
    MACHINE_TYPE=${MACHINE_TYPE:-e2-medium}
    
    echo ""
    print_status "Configuration:"
    echo "  Project ID: $PROJECT_ID"
    echo "  Cluster Name: $CLUSTER_NAME"
    echo "  Zone: $ZONE"
    echo "  Number of Nodes: $NUM_NODES"
    echo "  Machine Type: $MACHINE_TYPE"
    echo ""
    
    read -p "Continue with this configuration? (y/N): " CONFIRM
    if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled by user"
        exit 1
    fi
}

# Set up GCP project
setup_project() {
    print_status "Setting up GCP project..."
    
    # Check if project exists
    if gcloud projects describe $PROJECT_ID &> /dev/null; then
        print_success "Project $PROJECT_ID already exists"
    else
        print_status "Creating project $PROJECT_ID..."
        gcloud projects create $PROJECT_ID --name="Job Portal Production"
    fi
    
    # Set as default project
    gcloud config set project $PROJECT_ID
    print_success "Set $PROJECT_ID as default project"
    
    # Enable APIs
    print_status "Enabling required APIs..."
    gcloud services enable container.googleapis.com
    gcloud services enable compute.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    print_success "APIs enabled"
}

# Create GKE cluster
create_cluster() {
    print_status "Creating GKE cluster..."
    
    # Check if cluster already exists
    if gcloud container clusters describe $CLUSTER_NAME --zone $ZONE &> /dev/null; then
        print_warning "Cluster $CLUSTER_NAME already exists in zone $ZONE"
        read -p "Do you want to continue with existing cluster? (y/N): " USE_EXISTING
        if [[ ! $USE_EXISTING =~ ^[Yy]$ ]]; then
            print_error "Setup cancelled"
            exit 1
        fi
    else
        print_status "Creating cluster $CLUSTER_NAME..."
        gcloud container clusters create $CLUSTER_NAME \
          --zone $ZONE \
          --num-nodes $NUM_NODES \
          --machine-type $MACHINE_TYPE \
          --disk-size 20GB \
          --disk-type pd-standard \
          --enable-autoscaling \
          --min-nodes 1 \
          --max-nodes 5 \
          --enable-autorepair \
          --enable-autoupgrade \
          --enable-network-policy \
          --enable-ip-alias \
          --network "default" \
          --subnetwork "default"
        
        print_success "Cluster created successfully"
    fi
    
    # Get credentials
    print_status "Getting cluster credentials..."
    gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE
    print_success "Cluster credentials configured"
}

# Create service account
create_service_account() {
    print_status "Creating service account for GitHub Actions..."
    
    SA_NAME="github-actions-sa"
    SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
    
    # Check if service account exists
    if gcloud iam service-accounts describe $SA_EMAIL &> /dev/null; then
        print_warning "Service account already exists"
    else
        gcloud iam service-accounts create $SA_NAME \
          --display-name="GitHub Actions Service Account" \
          --description="Service account for GitHub Actions CI/CD"
        print_success "Service account created"
    fi
    
    # Grant permissions
    print_status "Granting permissions to service account..."
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:$SA_EMAIL" \
      --role="roles/container.developer" &> /dev/null
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:$SA_EMAIL" \
      --role="roles/storage.admin" &> /dev/null
    
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:$SA_EMAIL" \
      --role="roles/container.clusterAdmin" &> /dev/null
    
    print_success "Permissions granted"
    
    # Create key
    KEY_FILE="$HOME/gcp-key-$PROJECT_ID.json"
    print_status "Creating service account key..."
    gcloud iam service-accounts keys create $KEY_FILE \
      --iam-account=$SA_EMAIL
    
    print_success "Service account key created: $KEY_FILE"
    print_warning "IMPORTANT: Add this key content to GitHub Secrets as 'GCP_SA_KEY'"
}

# Reserve static IP
reserve_static_ip() {
    print_status "Reserving static IP address..."
    
    IP_NAME="job-portal-ip"
    
    # Check if IP already exists
    if gcloud compute addresses describe $IP_NAME --global &> /dev/null; then
        print_warning "Static IP already exists"
    else
        gcloud compute addresses create $IP_NAME --global
        print_success "Static IP reserved"
    fi
    
    # Get IP address
    STATIC_IP=$(gcloud compute addresses describe $IP_NAME --global --format="value(address)")
    print_success "Static IP address: $STATIC_IP"
    print_warning "Point your domain to this IP address"
}

# Verify cluster
verify_cluster() {
    print_status "Verifying cluster setup..."
    
    echo ""
    print_status "Cluster info:"
    kubectl cluster-info
    
    echo ""
    print_status "Nodes:"
    kubectl get nodes
    
    print_success "Cluster verification completed"
}

# Print next steps
print_next_steps() {
    echo ""
    print_success "🎉 GKE Cluster Setup Completed!"
    echo "=================================="
    echo ""
    print_status "Next Steps:"
    echo "1. Add these GitHub Secrets to your repository:"
    echo "   - GCP_SA_KEY: [Content of $HOME/gcp-key-$PROJECT_ID.json]"
    echo "   - GCP_PROJECT_ID: $PROJECT_ID"
    echo "   - GKE_CLUSTER_NAME: $CLUSTER_NAME"
    echo "   - GKE_CLUSTER_ZONE: $ZONE"
    echo "   - DOCKERHUB_USERNAME: [Your Docker Hub username]"
    echo "   - DOCKERHUB_TOKEN: [Your Docker Hub token]"
    echo "   - MONGODB_URI: [Your MongoDB connection string]"
    echo "   - JWT_SECRET: [Your JWT secret]"
    echo ""
    echo "2. Update k8s/secret.yaml with base64 encoded values"
    echo "3. Update k8s/ingress.yaml with your domain name"
    echo "4. Point your domain to static IP: $STATIC_IP"
    echo "5. Push to main branch to trigger deployment"
    echo ""
    print_status "Useful commands:"
    echo "   kubectl get pods -n job-portal"
    echo "   kubectl logs -f deployment/job-portal-deployment -n job-portal"
    echo "   kubectl get ingress -n job-portal"
    echo ""
    print_success "Your GKE cluster is ready for production deployment! 🚀"
}

# Main execution
main() {
    echo "🚀 Job Portal GKE Cluster Setup"
    echo "==============================="
    echo ""
    
    check_prerequisites
    get_user_input
    setup_project
    create_cluster
    create_service_account
    reserve_static_ip
    verify_cluster
    print_next_steps
}

# Run main function
main "$@"