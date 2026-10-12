# CarPal — Firebase + Cloud Run Deployment Guide

## Architecture Overview

```
                    ┌─────────────────────┐
                    │  Firebase Hosting    │
                    │  (your-project.      │
                    │   web.app)           │
                    └────────┬────────────┘
                             │
              ┌──────────────┼──────────────┐
              │ /api/*       │              │ /*
              ▼              │              ▼
   ┌──────────────────┐     │   ┌──────────────────┐
   │  Cloud Run: API  │     │   │ Cloud Run: Web   │
   │  (NestJS)        │     │   │ (Next.js)        │
   │  Port 8080       │     │   │ Port 8080        │
   └────────┬─────────┘     │   └──────────────────┘
            │               │
            ▼               │
   ┌──────────────────┐     │
   │  Cloud SQL       │     │
   │  (PostgreSQL 15) │     │
   └──────────────────┘     │
                            │
   ┌──────────────────┐     │
   │  Google OAuth    │◄────┘
   │  (Sign-In)       │
   └──────────────────┘
```

## What You Need

### 1. Google Account + Billing
- A Google account (you already have one)
- A credit/debit card for Google Cloud billing (required for Cloud Run and Cloud SQL)
- **Free tier**: Google Cloud gives $300 free credit for 90 days for new accounts

### 2. Tools to Install (on your Windows PC)

#### Node.js (already installed ✓)

#### Firebase CLI
```powershell
npm install -g firebase-tools
```

#### Google Cloud SDK
Download from: https://cloud.google.com/sdk/docs/install
Or via PowerShell:
```powershell
# Download the installer
Invoke-WebRequest -Uri "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe" -OutFile "$env:TEMP\GoogleCloudSDKInstaller.exe"
# Run the installer
Start-Process "$env:TEMP\GoogleCloudSDKInstaller.exe"
```

#### Docker Desktop
Download from: https://www.docker.com/products/docker-desktop/
Install and restart your PC after installation.

### 3. Login to Services
```powershell
# Login to Google Cloud
gcloud auth login

# Login to Firebase
firebase login
```

---

## Step-by-Step Setup

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click **"Add Project"**
3. Name it something like `carpal-app` (this becomes your project ID)
4. Disable Google Analytics (optional — you can add it later)
5. Click **Create Project**

### Step 2: Update Project ID in Config Files

Open these files and replace `your-firebase-project-id` with your actual project ID:

- `.firebaserc` → line 3
- `firebase.json` → no changes needed (uses dynamic references)
- `apps/api/src/main.ts` → lines 17-18 (CORS URLs)
- `.env.production` → multiple places
- `deploy.sh` → line 16 (`PROJECT_ID`)

### Step 3: Set Up Google OAuth

1. Go to https://console.cloud.google.com/apis/credentials
2. Make sure your CarPal project is selected in the top dropdown
3. Click **"Create Credentials" → "OAuth Client ID"**
4. If prompted, configure the **OAuth consent screen** first:
   - Choose **External** user type
   - Fill in app name (CarPal), user support email, developer email
   - Add your email as a test user
5. Create the OAuth Client:
   - Application type: **Web application**
   - Name: CarPal Web
   - Authorized JavaScript origins:
     ```
     https://your-firebase-project-id.web.app
     https://your-firebase-project-id.firebaseapp.com
     http://localhost:3001
     ```
   - Authorized redirect URIs:
     ```
     https://your-firebase-project-id.web.app
     http://localhost:3001
     ```
6. Copy the **Client ID** — you'll need it for environment variables

### Step 4: Set Up Cloud SQL (PostgreSQL)

#### Option A: Automated (run the deploy script)
The `deploy.sh` script creates Cloud SQL for you.

#### Option B: Manual Setup
```powershell
# Set your project
gcloud config set project your-firebase-project-id

# Create the database instance (takes 2-3 minutes)
gcloud sql instances create carpal-db `
  --database-version=POSTGRES_15 `
  --tier=db-f1-micro `
  --region=us-central1 `
  --root-password="ChooseAStrongPassword123!"

# Create the database
gcloud sql databases create carpal --instance=carpal-db

# Create a database user
gcloud sql users create carpal --instance=carpal-db --password="ChooseAStrongPassword123!"

# Get the public IP of your Cloud SQL instance
gcloud sql instances describe carpal-db --format="value(ipAddresses.ipAddress)"
```

#### Run Prisma Migrations
```powershell
# Update DATABASE_URL in .env with your Cloud SQL connection string
# Format: postgresql://carpal:YOUR_PASSWORD@CLOUD_SQL_IP:5432/carpal?schema=public

# Run migrations
npx prisma migrate deploy

# Seed initial data (if you have seed data)
npx prisma db seed
```

### Step 5: Set Up Secret Manager (for env vars)

```powershell
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets
echo -n "postgresql://carpal:YOUR_PASSWORD@CLOUD_SQL_IP:5432/carpal?schema=public" | gcloud secrets create carpal-db-url --data-file=-
echo -n "your-jwt-secret-here" | gcloud secrets create carpal-jwt-secret --data-file=-
echo -n "your-google-client-id.apps.googleusercontent.com" | gcloud secrets create carpal-google-client-id --data-file=-

# Grant Cloud Run access to secrets
PROJECT_NUMBER=$(gcloud projects describe your-firebase-project-id --format="value(projectNumber)")
gcloud secrets add-iam-policy-binding carpal-db-url --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding carpal-jwt-secret --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
gcloud secrets add-iam-policy-binding carpal-google-client-id --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" --role="roles/secretmanager.secretAccessor"
```

### Step 6: Enable Required APIs

```powershell
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### Step 7: Deploy

#### Option A: Automated (recommended)
```bash
# Make the script executable
chmod +x deploy.sh

# Run it
./deploy.sh
```

#### Option B: Manual Step-by-Step

```powershell
# 1. Set project
gcloud config set project your-firebase-project-id

# 2. Create Artifact Registry
gcloud artifacts repositories create carpal-images `
  --repository-format=docker `
  --location=us-central1

# 3. Configure Docker
gcloud auth configure-docker us-central1-docker.pkg.dev

# 4. Build and push API image
cd apps/api
gcloud builds submit --tag us-central1-docker.pkg.dev/your-firebase-project-id/carpal-images/carpal-api:latest
cd ../..

# 5. Deploy API to Cloud Run
gcloud run deploy carpal-api `
  --image us-central1-docker.pkg.dev/your-firebase-project-id/carpal-images/carpal-api:latest `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --set-env-vars "NODE_ENV=production,PORT=8080,FRONTEND_URL=https://your-firebase-project-id.web.app" `
  --set-secrets "DATABASE_URL=carpal-db-url:latest,JWT_SECRET=carpal-jwt-secret:latest,GOOGLE_CLIENT_ID=carpal-google-client-id:latest"

# 6. Build and push Web image
cd apps/web
gcloud builds submit --tag us-central1-docker.pkg.dev/your-firebase-project-id/carpal-images/carpal-web:latest
cd ../..

# 7. Get API URL
$API_URL = gcloud run services describe carpal-api --region=us-central1 --format="value(status.url)"

# 8. Deploy Web to Cloud Run
gcloud run deploy carpal-web `
  --image us-central1-docker.pkg.dev/your-firebase-project-id/carpal-images/carpal-web:latest `
  --region us-central1 `
  --platform managed `
  --allow-unauthenticated `
  --port 8080 `
  --memory 512Mi `
  --set-env-vars "NODE_ENV=production,PORT=8080,NEXT_PUBLIC_API_URL=$API_URL/api,NEXT_PUBLIC_APP_URL=https://your-firebase-project-id.web.app,NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com"

# 9. Deploy Firebase Hosting
firebase deploy --only hosting
```

### Step 8: Verify Deployment

1. Open `https://your-firebase-project-id.web.app` in your browser
2. Check the API docs at the Cloud Run URL + `/api/docs`
3. Test registration, login, vehicle browsing

---

## Cost Estimate (Monthly)

| Service | Usage | Est. Cost |
|---------|-------|-----------|
| Firebase Hosting | 10 GB transfer | Free |
| Cloud Run (Web) | 1M requests, 512Mi | ~$0-5 |
| Cloud Run (API) | 500K requests, 512Mi | ~$0-3 |
| Cloud SQL (f1-micro) | Always on | ~$7-10 |
| Artifact Registry | 5 GB storage | Free tier |
| Secret Manager | 6 secrets | Free tier |
| **Total** | | **~$7-18/mo** |

*With Google's free tier and $300 new credit, you'll likely pay nothing for the first 90 days.*

---

## Updating / Redeploying

### Update API only
```powershell
cd apps/api
gcloud builds submit --tag us-central1-docker.pkg.dev/your-firebase-project-id/carpal-images/carpal-api:latest
cd ../..
gcloud run deploy carpal-api --image us-central1-docker.pkg.dev/your-firebase-project-id/carpal-images/carpal-api:latest --region us-central1
```

### Update Web only
```powershell
cd apps/web
gcloud builds submit --tag us-central1-docker.pkg.dev/your-firebase-project-id/carpal-images/carpal-web:latest
cd ../..
gcloud run deploy carpal-web --image us-central1-docker.pkg.dev/your-firebase-project-id/carpal-images/carpal-web:latest --region us-central1
```

### Run new database migrations
```powershell
# Connect to Cloud SQL proxy first
gcloud sql connect carpal-db --user=carpal

# Or run migrations locally with the Cloud SQL connection string
DATABASE_URL="postgresql://carpal:PASSWORD@IP:5432/carpal" npx prisma migrate deploy
```

---

## Custom Domain (Optional)

To use a custom domain like `www.carpal.com`:

1. In Firebase Console → Hosting → Add custom domain
2. Follow the DNS verification steps
3. Add the required TXT and A records to your domain's DNS

---

## Troubleshooting

**Cloud Run service won't start:**
```powershell
# Check logs
gcloud run services logs read carpal-api --region us-central1 --limit 50
```

**Database connection fails:**
- Make sure Cloud SQL has the correct network access
- Check that DATABASE_URL secret is correct
- Verify the Cloud SQL instance is running

**CORS errors:**
- Update the CORS origins in `apps/api/src/main.ts` with your Firebase Hosting URL
- Redeploy the API

**Firebase Hosting shows 404:**
- Make sure the rewrites in `firebase.json` point to the correct Cloud Run service names
- Verify the Cloud Run services are deployed and running
