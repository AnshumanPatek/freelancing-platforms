# GKE Cluster Setup Guide for Job Portal API

This guide will walk you through setting up a Google Kubernetes Engine (GKE) cluster for your Job Portal API production deployment.

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI installed
- `kubectl` installed
- Docker installed
- GitHub repository with the Job Portal code

## Step 1: Install Required Tools

### Install Google Cloud CLI
```bash
# On Ubuntu/Debian
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# On macOS
brew install --cask google-cloud-sdk

# On Windows
# Download from: https://cloud.google.com/sdk/docs/install
```

### Install kubectl
```bash
# Install kubectl via gcloud
gcloud components install kubectl

# Or install directly
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

## Step 2: Set Up Google Cloud Project

### 1. Create a new project (or use existing)
```bash
# Set your project ID
export PROJECT_ID="job-portal-production"

# Create project
gcloud projects create $PROJECT_ID --name="Job Portal Production"

# Set as default project
gcloud config set project $PROJECT_ID
```

### 2. Enable required APIs
```bash
# Enable necessary APIs
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Set up billing (required for GKE)
```bash
# List billing accounts
gcloud billing accounts list

# Link billing account to project
gcloud billing projects link $PROJECT_ID --billing-account=YOUR_BILLING_ACCOUNT_ID
```

## Step 3: Create GKE Cluster

### 1. Set cluster configuration
```bash
# Set variables
export CLUSTER_NAME="job-portal-cluster"
export ZONE="us-central1-a"
export REGION="us-central1"
```

### 2. Create the cluster
```bash
# Create GKE cluster with recommended settings
gcloud container clusters create $CLUSTER_NAME \
  --zone $ZONE \
  --num-nodes 3 \
  --node-locations $ZONE \
  --machine-type e2-medium \
  --disk-size 20GB \
  --disk-type pd-standard \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 5 \
  --enable-autorepair \
  --enable-autoupgrade \
  --maintenance-window-start "2023-01-01T09:00:00Z" \
  --maintenance-window-end "2023-01-01T17:00:00Z" \
  --maintenance-window-recurrence "FREQ=WEEKLY;BYDAY=SA" \
  --enable-network-policy \
  --enable-ip-alias \
  --network "default" \
  --subnetwork "default" \
  --cluster-version "latest"
```

### 3. Get cluster credentials
```bash
# Configure kubectl to use the cluster
gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE
```

### 4. Verify cluster is running
```bash
# Check cluster status
kubectl cluster-info

# Check nodes
kubectl get nodes

# Check system pods
kubectl get pods --all-namespaces
```

## Step 4: Set Up Service Account for GitHub Actions

### 1. Create service account
```bash
# Create service account
gcloud iam service-accounts create github-actions-sa \
  --display-name="GitHub Actions Service Account" \
  --description="Service account for GitHub Actions CI/CD"
```

### 2. Grant necessary permissions
```bash
# Get service account email
export SA_EMAIL="github-actions-sa@$PROJECT_ID.iam.gserviceaccount.com"

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/container.clusterAdmin"
```

### 3. Create and download service account key
```bash
# Create key file
gcloud iam service-accounts keys create ~/gcp-key.json \
  --iam-account=$SA_EMAIL

# Display the key (copy this for GitHub secrets)
cat ~/gcp-key.json
```

## Step 5: Set Up Static IP and SSL Certificate

### 1. Reserve static IP
```bash
# Reserve global static IP
gcloud compute addresses create job-portal-ip --global

# Get the IP address
gcloud compute addresses describe job-portal-ip --global --format="value(address)"
```

### 2. Create managed SSL certificate
```bash
# Create managed certificate (replace with your domain)
kubectl apply -f - <<EOF
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: job-portal-ssl-cert
  namespace: job-portal
spec:
  domains:
    - api.yourjobportal.com
EOF
```

## Step 6: Configure GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

```bash
# Google Cloud secrets
GCP_SA_KEY: [Contents of ~/gcp-key.json file]
GCP_PROJECT_ID: job-portal-production
GKE_CLUSTER_NAME: job-portal-cluster
GKE_CLUSTER_ZONE: us-central1-a

# Docker Hub secrets
DOCKERHUB_USERNAME: [Your Docker Hub username]
DOCKERHUB_TOKEN: [Your Docker Hub access token]

# Application secrets
MONGODB_URI: [Your production MongoDB connection string]
JWT_SECRET: [Your production JWT secret]
```

## Step 7: Prepare Kubernetes Secrets

### 1. Encode your secrets
```bash
# Encode MongoDB URI
echo -n "your-mongodb-connection-string" | base64

# Encode JWT Secret
echo -n "your-jwt-secret-key" | base64
```

### 2. Update k8s/secret.yaml
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: job-portal-secrets
  namespace: job-portal
type: Opaque
data:
  MONGODB_URI: [base64-encoded-mongodb-uri]
  JWT_SECRET: [base64-encoded-jwt-secret]
```

## Step 8: Update Domain Configuration

### 1. Update k8s/ingress.yaml
```yaml
spec:
  rules:
  - host: api.yourjobportal.com  # Replace with your actual domain
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: job-portal-service
            port:
              number: 80
```

### 2. Point your domain to the static IP
- Go to your domain registrar
- Create an A record pointing `api.yourjobportal.com` to your static IP

## Step 9: Deploy Your Application

### 1. Push to main branch
```bash
git add .
git commit -m "Add GKE deployment configuration"
git push origin main
```

### 2. Monitor deployment
```bash
# Watch GitHub Actions
# Go to your repository → Actions tab

# Or monitor directly in cluster
kubectl get pods -n job-portal -w
```

## Step 10: Verify Deployment

### 1. Check all resources
```bash
# Check namespace
kubectl get namespace job-portal

# Check all resources in namespace
kubectl get all -n job-portal

# Check ingress
kubectl get ingress -n job-portal

# Check secrets and configmaps
kubectl get secrets,configmaps -n job-portal
```

### 2. Test your API
```bash
# Get external IP
kubectl get ingress job-portal-ingress -n job-portal

# Test API (replace with your domain/IP)
curl http://your-external-ip/
curl http://your-external-ip/api-docs
```

## Monitoring and Maintenance

### 1. View logs
```bash
# View application logs
kubectl logs -f deployment/job-portal-deployment -n job-portal

# View logs from specific pod
kubectl logs -f pod/[pod-name] -n job-portal
```

### 2. Scale deployment
```bash
# Scale to 5 replicas
kubectl scale deployment job-portal-deployment --replicas=5 -n job-portal

# Check scaling
kubectl get deployment job-portal-deployment -n job-portal
```

### 3. Update application
```bash
# Trigger new deployment by pushing to main branch
# Or manually update image
kubectl set image deployment/job-portal-deployment \
  job-portal=your-dockerhub-username/job-portal:new-tag -n job-portal
```

## Cost Optimization Tips

### 1. Use preemptible nodes for development
```bash
# Create cluster with preemptible nodes (cheaper)
gcloud container clusters create job-portal-dev \
  --zone $ZONE \
  --num-nodes 2 \
  --preemptible \
  --machine-type e2-small
```

### 2. Set up cluster autoscaling
```bash
# Enable cluster autoscaling
gcloud container clusters update $CLUSTER_NAME \
  --zone $ZONE \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 3
```

### 3. Monitor costs
```bash
# Check current costs
gcloud billing budgets list

# Set up budget alerts in Google Cloud Console
```

## Troubleshooting

### Common Issues:

1. **Pods not starting**: Check logs and resource limits
2. **External IP not assigned**: Wait 5-10 minutes, check ingress configuration
3. **SSL certificate not working**: Ensure domain points to correct IP
4. **Database connection issues**: Verify MongoDB URI and network access

### Useful Commands:
```bash
# Describe resources for debugging
kubectl describe pod [pod-name] -n job-portal
kubectl describe ingress job-portal-ingress -n job-portal

# Get events
kubectl get events -n job-portal --sort-by='.lastTimestamp'

# Port forward for local testing
kubectl port-forward service/job-portal-service 8080:80 -n job-portal
```

## Security Best Practices

1. **Regularly update cluster**: Enable auto-upgrade
2. **Use network policies**: Restrict pod-to-pod communication
3. **Scan images**: Use container image scanning
4. **Rotate secrets**: Regularly update JWT secrets and API keys
5. **Monitor access**: Enable audit logging

Your GKE cluster is now ready for production deployment! 🚀