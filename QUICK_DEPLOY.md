# ⚡ 15-Minute Deployment Checklist

Copy this and complete each step. Takes ~15 minutes total.

---

## STEP 1: Supabase Setup (5 min)

**Goal**: Get DATABASE_URL and storage credentials

- [ ] Go to https://supabase.com
- [ ] Create new project OR use existing
- [ ] Copy these 3 values:
  
  ```
  DATABASE_URL = "postgresql://<USER>:<PASSWORD>@<HOST>:5432/<DATABASE>?sslmode=require"
  SUPABASE_URL = "https://<PROJECT_REF>.supabase.co"
  SUPABASE_SERVICE_ROLE_KEY = "<SUPABASE_SERVICE_ROLE_KEY>"
  ```

- [ ] Create storage bucket:
  - Storage → Create bucket
  - Name: `research-platform-storage`
  - Private bucket
  - Click Create

- [ ] Save these 3 values for Step 2 & 3

---

## STEP 2: Deploy Backend to Render (5 min)

**Goal**: Get your API running and get its URL

- [ ] Go to https://render.com
- [ ] Click "New +" → "Web Service"
- [ ] Select your GitHub repo
- [ ] Fill in:
  ```
  Name: api
  Root Directory: (leave blank)
  Runtime: Node
  Build Command: npm --prefix apps/api run build
  Start Command: npm --prefix apps/api start
  ```
- [ ] Click "Create Web Service"
- [ ] **WHILE IT BUILDS (2-5 min)**: Go to Environment section
- [ ] Add these variables (copy from Step 1):
  ```
  NODE_ENV = production
  DATABASE_URL = [paste from Step 1]
  SUPABASE_URL = [paste from Step 1]
  SUPABASE_SERVICE_ROLE_KEY = [paste from Step 1]
  JWT_SECRET = [generate: openssl rand -base64 32]
  ```
- [ ] Wait for build to complete ✓
- [ ] **Copy your API URL**: `https://api-xxxxx.onrender.com` (shown at top)
- [ ] Test: `curl https://api-xxxxx.onrender.com/health` (should return 200)

---

## STEP 3: Deploy Frontend to Vercel (3 min)

**Goal**: Get your frontend running with API connected

- [ ] Go to https://vercel.com
- [ ] Click "Add New" → "Project"
- [ ] Import your GitHub repo
- [ ] **CRITICAL: Settings**:
  - Root Directory: `apps/web` ← **MUST SET THIS**
  - Build Command: `next build`
  - Install Command: `pnpm install`
- [ ] **Environment Variables** (2 required):
  ```
  NEXT_PUBLIC_API_BASE_URL = [your Render API URL from Step 2]
                            e.g., https://api-xxxxx.onrender.com
  NEXT_PUBLIC_WS_BASE_URL = [same as above]
                            e.g., https://api-xxxxx.onrender.com
  ```
- [ ] Click "Deploy"
- [ ] **Wait for deployment** (usually 2-3 min)
- [ ] Visit your Vercel URL when ready ✓

---

## STEP 4: Run Database Migrations (2 min)

**Goal**: Set up database tables

Option A - If Render Shell is available:
- [ ] In Render dashboard → Select API service
- [ ] Click "Shell" tab
- [ ] Run: `cd /app && npx prisma migrate deploy`

Option B - Via local terminal:
- [ ] Locally run:
  ```bash
  export DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:5432/<DATABASE>?sslmode=require"
  npx prisma migrate deploy
  ```

---

## VERIFICATION CHECKLIST

- [ ] Frontend loads at `https://yourapp.vercel.app`
- [ ] Backend health check: `curl https://api-xxxxx.onrender.com/health` → 200 OK
- [ ] Frontend loads without "Cannot reach API" error
- [ ] Login page displays
- [ ] Can see API calls in browser Network tab going to Render URL

---

## ❌ If Something Fails

**Frontend shows "Cannot reach API":**
1. Check Vercel environment variables (must have NEXT_PUBLIC_API_BASE_URL)
2. Check Render API is running (curl /health)
3. Verify both URLs don't have trailing slashes

**Backend won't start:**
1. Check Render logs for DATABASE_URL error
2. Verify DATABASE_URL is correct in Render dashboard
3. Verify Supabase project exists

**Database migration fails:**
1. Verify DATABASE_URL format
2. Check Supabase project is running
3. Try: `npx prisma db push` instead

---

## 📱 After Deployment

Your platform is now running on:
- **Frontend**: https://yourapp.vercel.app (Vercel)
- **Backend API**: https://api-xxxxx.onrender.com (Render)
- **Database**: PostgreSQL on Supabase

**To deploy updates:**
1. Push code: `git push origin maurice`
2. Vercel auto-redeploys frontend (~2 min)
3. Render auto-redeploys backend (~2 min)
4. Changes live ✓

---

**Total Time: ~15 minutes**
**Cost: FREE tier available on all platforms (Vercel, Render, Supabase)**
