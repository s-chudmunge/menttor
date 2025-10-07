#!/bin/bash

# Deploy Auto Generator Service to Cloud Run

set -e

PROJECT_ID="gen-lang-client-0319118634"
SERVICE_NAME="auto-batch-generator"
REGION="asia-south1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying Auto Batch Generator Service to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "======================================================"

# Build and push Docker image
echo "📦 Building Docker image..."
docker build -f Dockerfile.autogen -t $IMAGE_NAME .

echo "📤 Pushing image to Container Registry..."
docker push $IMAGE_NAME

# Deploy to Cloud Run
echo "🚢 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --timeout 3600 \
    --concurrency 1 \
    --max-instances 1 \
    --min-instances 0 \
    --port 8080 \
    --set-env-vars="BATCH_SIZE=20,MAX_BATCHES=1000,SLEEP_BETWEEN_BATCHES=10" \
    --project $PROJECT_ID

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format "value(status.url)" --project $PROJECT_ID)

echo ""
echo "✅ Deployment successful!"
echo "🔗 Service URL: $SERVICE_URL"
echo ""
echo "📋 Available endpoints:"
echo "  GET  $SERVICE_URL/status          - Check generator status"
echo "  POST $SERVICE_URL/start           - Start continuous generation"
echo "  POST $SERVICE_URL/pause           - Pause generation"
echo "  POST $SERVICE_URL/resume          - Resume generation"
echo "  POST $SERVICE_URL/stop            - Stop generation"
echo "  GET  $SERVICE_URL/health          - Health check"
echo ""
echo "🚀 To start generation:"
echo "curl -X POST '$SERVICE_URL/start'"