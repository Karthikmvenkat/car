#!/bin/bash
# ============================================================
# CAR — Firebase + Cloud Run Deployment Script
# ============================================================
# Prerequisites:
#   1. Install Firebase CLI:  npm install -g firebase-tools
#   2. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
#   3. Run: gcloud auth login
#   4. Run: firebase login
#   5. Create a Firebase project at https://console.firebase.google.com
#   6. Enable billing on your Google Cloud project
# ============================================================

set -e

# ─── Configuration ─────────────────────────────────────────
PROJECT_ID="your-firebase-project-id"   # ← Replace with your Firebase project ID
REGION="us-central1"                     # ← Change to your preferred region
API_SERVICE="car-api"
WEB_SERVICE="car-web"
DB_INSTANCE="car-db"
DB_NAME="car"
DB_USER="car"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  CAR — Firebase + Cloud Run Deployment            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Verify tools ─────────────────────────────────
echo "▶ Checking prerequisites..."
command -v gcloud >/dev/null 2>&1 || { echo "✗ gcloud not found. Install: https://cloud.google.com/sdk/docs/install"; exit 1; }
command -v firebase >/dev/null 2>&1 || { echo "✗ firebase not found. Install: npm install -g firebase-tools"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "✗ docker not found. Install: https://docs.docker.com/get-docker"; exit 1; }
echo "✓ All prerequisites found"
echo ""

# ─── Step 2: Set Google Cloud project ─────────────────────
echo "▶ Setting Google Cloud project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID
echo ""

# ─── Step 3: Enable required APIs ─────────────────────────
echo "▶ Enabling Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com
echo "✓ APIs enabled"
echo ""

# ─── Step 4: Create Artifact Registry for Docker images ───
echo "▶ Setting up Artifact Registry..."
gcloud artifacts repositories create car-images \
  --repository-format=docker \
  --location=$REGION \
  --description="CAR Docker images" 2>/dev/null || echo "  (Repository already exists)"
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
echo "✓ Artifact Registry ready"
echo ""

# ─── Step 5: Create Cloud SQL (PostgreSQL) ────────────────
echo "▶ Setting up Cloud SQL (PostgreSQL)..."
echo "  This may take a few minutes..."
gcloud sql instances create $DB_INSTANCE \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password="CHANGE_THIS_PASSWORD" \
  --database-flags=cloudsql.iam_authentication=on 2>/dev/null || echo "  (Instance already exists)"

gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE 2>/dev/null || echo "  (Database already exists)"
echo "✓ Cloud SQL ready"
echo ""

# ─── Step 6: Build and push API Docker image ──────────────
echo "▶ Building API Docker image..."
cd apps/api
gcloud builds submit \
  --tag ${REGION}-docker.pkg.dev/$PROJECT_ID/car-images/$API_SERVICE:latest \
  --timeout=600
cd ../..
echo "✓ API image pushed"
echo ""

# ─── Step 7: Deploy API to Cloud Run ──────────────────────
echo "▶ Deploying API to Cloud Run..."
gcloud run deploy $API_SERVICE \
  --image ${REGION}-docker.pkg.dev/$PROJECT_ID/car-images/$API_SERVICE:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --set-env-vars "NODE_ENV=production,PORT=8080" \
  --set-secrets "DATABASE_URL=car-db-url:latest,JWT_SECRET=car-jwt-secret:latest,GOOGLE_CLIENT_ID=car-google-client-id:latest" \
  --update-env-vars "FRONTEND_URL=https://$PROJECT_ID.web.app"
echo "✓ API deployed"
echo ""

# ─── Step 8: Build and push Web Docker image ──────────────
echo "▶ Building Web Docker image..."
cd apps/web
gcloud builds submit \
  --tag ${REGION}-docker.pkg.dev/$PROJECT_ID/car-images/$WEB_SERVICE:latest \
  --timeout=600
cd ../..
echo "✓ Web image pushed"
echo ""

# ─── Step 9: Deploy Web to Cloud Run ──────────────────────
echo "▶ Deploying Web to Cloud Run..."
API_URL=$(gcloud run services describe $API_SERVICE --region=$REGION --format='value(status.url)')
gcloud run deploy $WEB_SERVICE \
  --image ${REGION}-docker.pkg.dev/$PROJECT_ID/car-images/$WEB_SERVICE:latest \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,PORT=8080,NEXT_PUBLIC_API_URL=${API_URL}/api,NEXT_PUBLIC_APP_URL=https://$PROJECT_ID.web.app"
echo "✓ Web deployed"
echo ""

# ─── Step 10: Deploy Firebase Hosting ─────────────────────
echo "▶ Deploying Firebase Hosting..."
firebase deploy --only hosting
echo "✓ Firebase Hosting deployed"
echo ""

# ─── Done! ─────────────────────────────────────────────────
WEB_URL=$(gcloud run services describe $WEB_SERVICE --region=$REGION --format='value(status.url)')
API_URL=$(gcloud run services describe $API_SERVICE --region=$REGION --format='value(status.url)')

echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✓ CAR deployed successfully!                     ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "║                                                      ║"
echo "║  Firebase Hosting: https://$PROJECT_ID.web.app      ║"
echo "║  Web (Cloud Run):  $WEB_URL                         ║"
echo "║  API (Cloud Run):  $API_URL                         ║"
echo "║  API Docs:         $API_URL/api/docs                ║"
echo "║                                                      ║"
echo "╚══════════════════════════════════════════════════════╝"
