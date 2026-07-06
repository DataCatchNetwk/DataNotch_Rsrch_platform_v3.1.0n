# Production Deployment Setup Guide

**Repository Structure** (Already Optimized):
```
├── apps/
│   ├── web/          ← Frontend (Next.js) → Deploy to VERCEL
│   └── api/          ← Backend (Express) → Deploy to RENDER
├── packages/         ← Shared dependencies (used by both)
├── vercel.json       ← Vercel configuration ✓
├── .vercelignore     ← Excludes backend from Vercel ✓
└── pnpm-workspace.yaml ← Monorepo config
```

---

## ⚡ QUICK START: 3 Steps to Production

### Step 1: Deploy Frontend to Vercel (5 minutes)

**In Vercel Dashboard:**

1. Click "Add New" → "Project"
2. Import your GitHub repository
3. **CRITICAL SETTINGS:**
   ```
   Framework Preset:     Next.js
   Root Directory:       apps/web              ← MUST BE THIS
   Build Command:        next build
   Install Command:      pnpm install
   Output Directory:     .next
   Node.js Version:      20.x
   ```
4. **Add Environment Variables:**
   ```
   NEXT_PUBLIC_API_BASE_URL  = https://api.example.com
                            (You'll get this URL from Step 2)
   NEXT_PUBLIC_WS_BASE_URL   = https://api.example.com
   ```
5. Click "Deploy"
6. **Wait for deployment to complete** ✓

---

### Step 2: Deploy Backend to Render (10 minutes)

**In Render Dashboard:**

1. Click "New +" → "Web Service"
2. **Connect Repository:**
   - Select your GitHub repo
   - Choose branch: `maurice` (or your branch)

3. **Configure Service:**
   ```
   Name:                api
   Runtime:             Node
   Region:              Choose closest to users
   Build Command:       npm --prefix apps/api run build
   Start Command:       npm --prefix apps/api start
   ```

4. **Add Environment Variables:**
   ```
   NODE_ENV             = production
   PORT                 = 3001
   CLIENT_URL           = https://your-vercel-app.vercel.app
   SERVER_PUBLIC_URL    = https://api-xxxxx.onrender.com
   
   ALLOWED_ORIGINS      = https://your-vercel-app.vercel.app
   
   DATABASE_URL         = [See Step 3]
   
   JWT_SECRET           = [Generate a random string]
   
   STORAGE_PROVIDER     = supabase
   SUPABASE_URL         = https://project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = [See Step 3]
   SUPABASE_STORAGE_BUCKET = research-platform-storage
   
   QUEUE_BACKEND        = postgres
   POSTGRES_WORKER_POLL_MS = 1500
   
   AUTH_NETWORK_BLOCK_ENABLED = true
   RATE_LIMIT_ENABLED   = true
   ```

5. **Click "Create Web Service"**
6. **Wait for deployment** (first build takes 5-10 minutes)
7. **Copy the URL**: `https://api-xxxxx.onrender.com` → Use in Step 1

---

### Step 3: Setup Database & Storage (Supabase)

**Go to Supabase Dashboard:**

1. **Create Project** (or use existing):
   - Region: Same as Render or Vercel (for lower latency)
   - Password: Keep secure

2. **Get Connection String:**
   - Settings → Database → Connection String
   - Copy: `postgresql://<USER>:<PASSWORD>@<HOST>:5432/<DATABASE>?sslmode=require`
   - Use in Render's DATABASE_URL

3. **Get Service Role Key:**
   - Settings → API → Service Role (Secret key)
   - Use in Render's SUPABASE_SERVICE_ROLE_KEY

4. **Get Project URL:**
   - Settings → API → Project URL
   - Use in Render's SUPABASE_URL

5. **Create Storage Bucket:**
   - Storage → Create bucket
   - Name: `research-platform-storage`
   - Make it Private
   - Use in Render's SUPABASE_STORAGE_BUCKET

6. **Run Migrations:**
   - Back in Render, SSH into your service or use Render Shell:
     ```bash
     cd /app && npx prisma migrate deploy
     ```
   - Verify: `npx prisma db push`

---

## 📋 Deployment Checklist

### Before Deploying Frontend (Vercel)

- [ ] GitHub repo has latest code pushed to `maurice` branch
- [ ] `.env.example` has all required `NEXT_PUBLIC_*` variables documented
- [ ] `vercel.json` exists at repo root ✓
- [ ] `.vercelignore` exists and excludes `apps/api/` ✓
- [ ] No hardcoded API URLs in code (use env variables)

### Before Deploying Backend (Render)

- [ ] GitHub repo has latest code pushed
- [ ] `apps/api/package.json` has build and start scripts ✓
- [ ] `.env.example` has all required variables documented
- [ ] Supabase project created and credentials available
- [ ] Prisma schema is up-to-date
- [ ] All environment variables added to Render dashboard (don't use .env files in production)

### After Deployment

- [ ] Frontend loads at `https://your-vercel-app.vercel.app`
- [ ] Backend health check: `curl https://api.yourrender.app/health`
- [ ] Frontend can fetch from backend (check browser Network tab)
- [ ] Database migrations completed successfully
- [ ] Storage bucket is accessible

---

## 🔄 Deploying Updates

**For Frontend Changes:**
```bash
git add .
git commit -m "frontend: description"
git push origin maurice
# Vercel auto-redeploys (watch dashboard)
```

**For Backend Changes:**
```bash
git add .
git commit -m "api: description"
git push origin maurice
# Render auto-redeploys (watch dashboard)
```

**For Database Schema Changes:**
```bash
# Locally first
npx prisma migrate dev --name description

# In production (via Render Shell or SSH)
npx prisma migrate deploy
```

---

## 🆘 Troubleshooting

### Frontend shows "Cannot reach API"
1. Check frontend environment variables in Vercel dashboard
2. Verify `NEXT_PUBLIC_API_BASE_URL` matches your Render backend URL
3. Check Render backend is running: `curl https://api.yourrender.app/health`
4. Check CORS: Render should have `ALLOWED_ORIGINS=https://your-vercel-app.vercel.app`

### Backend crashes on startup
1. Check Render logs for errors
2. Common cause: Missing DATABASE_URL or SUPABASE credentials
3. Verify Supabase project is running
4. Run: `npx prisma db push` to ensure schema is synced

### Database connection fails
1. Check DATABASE_URL format in Render
2. Verify Supabase project exists and is active
3. Check firewall: Supabase should allow connections from Render IP (usually automatic)
4. Run migrations: `npx prisma migrate deploy`

### Workers not processing jobs
1. Verify QUEUE_BACKEND is set to `postgres`
2. Check workers are started: `npm --prefix apps/api run worker`
3. Note: Render free tier doesn't support long-running background jobs well
4. Consider: Redis queue + separate worker service for production

---

## 🚀 Production Best Practices

### Secrets Management
- **Never** commit `.env` files
- Use Render's Environment Variables (not .env files)
- Rotate JWT_SECRET regularly
- Regenerate SUPABASE_SERVICE_ROLE_KEY if compromised

### Monitoring
- Enable Render error tracking
- Set up Vercel error notifications
- Monitor database connections (Supabase dashboard)
- Set up uptime monitoring for `/health` endpoint

### Scaling
- Render: Upgrade from free tier for production
- Vercel: Automatically scales, no configuration needed
- Database: Monitor connections, upgrade Supabase if needed
- Storage: Supabase auto-scales

### Backups
- Enable Supabase automated backups (Settings → Backups)
- Regular database exports: `pg_dump` command
- Test restores monthly

---

## 📚 Configuration Reference

### Frontend Environment Variables (NEXT_PUBLIC_*)
```
NEXT_PUBLIC_API_BASE_URL     - Backend API URL (required at runtime)
NEXT_PUBLIC_API_URL          - Alternative name for above (optional)
NEXT_PUBLIC_WS_BASE_URL      - WebSocket URL for real-time features
NEXT_PUBLIC_GOOGLE_SSO_ENABLED - Enable Google OAuth (optional)
NEXT_PUBLIC_MICROSOFT_SSO_ENABLED - Enable Microsoft OAuth (optional)
```

### Backend Environment Variables
```
NODE_ENV                     - production
PORT                         - 3001
CLIENT_URL                   - Frontend URL (for CORS)
SERVER_PUBLIC_URL            - Backend public URL
ALLOWED_ORIGINS              - Comma-separated CORS whitelist

DATABASE_URL                 - Supabase PostgreSQL connection
JWT_SECRET                   - Secret for JWT tokens
BCRYPT_ROUNDS                - 12 (default)

STORAGE_PROVIDER             - supabase (or local for dev)
SUPABASE_URL                 - Supabase project URL
SUPABASE_SERVICE_ROLE_KEY    - Service role key from Supabase
SUPABASE_STORAGE_BUCKET      - research-platform-storage

QUEUE_BACKEND                - postgres (or redis)
POSTGRES_WORKER_POLL_MS      - 1500

AUTH_NETWORK_BLOCK_ENABLED   - true/false
RATE_LIMIT_ENABLED           - true/false
```

---

## ✅ Success Indicators

Your deployment is working when:

1. ✅ Frontend loads without "Cannot reach API" errors
2. ✅ Login page loads and can authenticate
3. ✅ Backend `/health` endpoint returns 200 OK
4. ✅ Dashboard loads and shows data
5. ✅ Database queries execute without timeout
6. ✅ File uploads work and store in Supabase
7. ✅ Real-time notifications update in real-time
8. ✅ No 500 errors in browser console
9. ✅ No "undefined" errors from missing env variables

---

**Questions? Check logs:**
- Vercel logs: Dashboard → Deployments → Click deployment → Logs
- Render logs: Dashboard → Select service → Logs tab
- Supabase logs: Dashboard → Logs
