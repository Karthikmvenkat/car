# Free Deployment Guide — Vercel + Render + Neon

Get CarPal live on the internet for free in ~20 minutes. No credit card needed.

## Architecture

```
  Client →  Vercel (Next.js)  →  Render (NestJS API)  →  Neon (PostgreSQL)
             free                    free (sleeps)           free (500MB)
```

---

## Step 1: Push Code to GitHub

You need a GitHub repo first. Create one at https://github.com/new (name it `carpal`, private is fine).

Then push your code:

```powershell
cd D:\car

# Create .gitignore if not exists
git init
git add .
git commit -m "Initial CarPal setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/carpal.git
git push -u origin main
```

**Important**: Add a root `.gitignore` first:

```
node_modules
.next
dist
out
.env
.env.local
.env.production
*.log
.firebase
```

---

## Step 2: Create Free Neon Database (2 minutes)

1. Go to https://neon.tech and sign up (use GitHub login)
2. Click **"New Project"**
3. Name it `carpal`, region: **Oregon** (or closest to you)
4. Click **Create Project**
5. Copy the **connection string** — it looks like:
   ```
   postgresql://neondb:xxxx@ep-xxx-xxx.us-east-2.aws.neon.tech/carpal?sslmode=require
   ```
6. **Save this string** — you'll need it for Render

---

## Step 3: Deploy API to Render (5 minutes)

1. Go to https://render.com and sign up (use GitHub login)
2. Click **"New +"** → **"Web Service"**
3. Connect your `carpal` GitHub repo
4. Configure:
   - **Name**: `carpal-api`
   - **Region**: Oregon
   - **Branch**: main
   - **Root Directory**: `apps/api`
   - **Runtime**: Node
   - **Build Command**: `cd ../.. && npm ci && npx prisma generate --schema=prisma/schema.prisma && npm run build --workspace=apps/api`
   - **Start Command**: `node dist/main.js`
   - **Instance Type**: **Free**
5. Add **Environment Variables** (click "Advanced" → "Add Environment Variable"):

   | Key | Value |
   |-----|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `4000` |
   | `DATABASE_URL` | *(paste your Neon connection string from Step 2)* |
   | `JWT_SECRET` | *(generate one — see below)* |
   | `FRONTEND_URL` | `https://carpal.vercel.app` *(temporary — update later)* |
   | `GOOGLE_CLIENT_ID` | *(leave blank for demo, or add your Google OAuth ID)* |

   **Generate JWT_SECRET**: Open https://www.random.org/strings/ or run in Node:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. Click **"Create Web Service"**
7. Wait 3-5 minutes for it to build and deploy
8. Once deployed, copy your API URL — it will be something like:
   ```
   https://carpal-api-xxxx.onrender.com
   ```
9. **Test the API**: Open `https://carpal-api-xxxx.onrender.com/api/health` in your browser
   - You should see a JSON response like `{"status":"ok"}`

### Run Database Migrations

After the API is deployed, you need to push your Prisma schema to Neon. The easiest way:

**Option A: From your local machine** (easiest)
```powershell
# Set the Neon connection string temporarily
$env:DATABASE_URL="postgresql://neondb:xxxx@ep-xxx-xxx.us-east-2.aws.neon.tech/carpal?sslmode=require"

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

**Option B: Add a Render "Pre-deploy" script**
In Render dashboard → your API service → Settings → Build Command, change to:
```
cd ../.. && npm ci && npx prisma generate --schema=prisma/schema.prisma && npx prisma db push --schema=prisma/schema.prisma && npm run build --workspace=apps/api
```

---

## Step 4: Deploy Frontend to Vercel (3 minutes)

1. Go to https://vercel.com and sign up (use GitHub login)
2. Click **"Add New..."** → **"Project"**
3. Import your `carpal` repo
4. Vercel will auto-detect it as Next.js. Configure:
   - **Root Directory**: `apps/web` *(important — change from default)*
   - **Framework Preset**: Next.js
   - **Build Command**: *(leave default — Vercel auto-detects)*
   - **Output Directory**: `.next`
5. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://carpal-api-xxxx.onrender.com/api` *(your Render URL + /api)* |
   | `NEXT_PUBLIC_APP_URL` | `https://carpal.vercel.app` *(your Vercel URL)* |
   | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | *(leave blank for demo)* |

6. Click **"Deploy"**
7. Wait 2-3 minutes
8. Your site is live at `https://carpal-xxxx.vercel.app`

---

## Step 5: Update CORS with Final URLs

Now that you have both URLs:

1. Go to Render dashboard → `carpal-api` → **Environment**
2. Update `FRONTEND_URL` to your actual Vercel URL: `https://carpal-xxxx.vercel.app`
3. Click **"Save Changes"** — Render will redeploy automatically

---

## Step 6: Verify Everything Works

1. Open your Vercel URL in a browser
2. Check:
   - Homepage loads with vehicles
   - Vehicle detail page shows car images
   - Color Studio color switching works
   - Sign up / login works (email/password)
   - Enquiry form loads
   - Test drive booking loads

---

## Troubleshooting

**API returns 502 or "Application failed to respond":**
- Render free tier "sleeps" after 15 minutes of no traffic
- First request after sleep takes ~30-50 seconds to wake up
- Just wait and refresh

**Database connection error:**
- Make sure `DATABASE_URL` in Render includes `?sslmode=require` at the end
- Verify the Neon database is active (not paused — free tier pauses after 5 min of inactivity but auto-resumes on connection)

**Vercel build fails:**
- Make sure **Root Directory** is set to `apps/web` (not the repo root)
- Check that the build command includes workspace: `cd ../.. && npm run build --workspace=apps/web`

**CORS errors in browser console:**
- The API CORS is configured to allow any `.vercel.app` and `.onrender.com` origin
- If using a custom domain, add it to the `FRONTEND_URL` env var in Render

**Google Sign-In doesn't work:**
- For a client demo, email/password auth works fine without Google OAuth
- To enable Google: create OAuth credentials at https://console.cloud.google.com/apis/credentials
  - Add your Vercel URL to "Authorized JavaScript origins"
  - Set `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in Vercel and `GOOGLE_CLIENT_ID` in Render

---

## Sharing with Your Client

Just send them the Vercel URL! e.g., `https://carpal-xxxx.vercel.app`

Tips for the demo:
- The first page load might be slow if the API is sleeping (~30 seconds)
- After that, everything is fast
- Email/password registration works immediately
- All 26 vehicles with color switching will work
- Forms (enquiry, test drive) will submit but won't send real emails

---

## What's Free (Summary)

| Service | Free Limits | What Happens When Exceeded |
|---------|-------------|---------------------------|
| Vercel | 100GB bandwidth, unlimited deploys | Nothing — very generous |
| Render | 750 hrs/month, sleeps after 15min idle | 30-second wake-up delay |
| Neon | 500MB storage, 1 project | Can't create more data |

**Total cost: $0/month**
