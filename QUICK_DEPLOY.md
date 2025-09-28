# Quick Start: Deploy to Cloud (Free Tier)

## 🚀 Fast Track Deployment

Follow these steps to get your app online in under 30 minutes:

### 1. Set up Supabase Database (5 minutes)

1. Go to [supabase.com](https://supabase.com) → Sign up → New Project
2. Wait for project creation (2-3 minutes)
3. Go to **Settings** → **Database** → **Connection string**
4. Copy the connection string (save this!)

### 2. Deploy Backend to Render (10 minutes)

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **"New"** → **"Web Service"**
3. Connect your `job-search-tracker-api` repository
4. Configure:
   - **Name**: `job-search-tracker-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && alembic upgrade head`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT --proxy-headers --forwarded-allow-ips "*"`
   - **Health Check Path**: `/health`

5. Add Environment Variables:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres
   SECRET_KEY=[RUN: python scripts/generate_secret_key.py]
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.onrender.com"]
   ENVIRONMENT=production
   DEBUG=false
   LOG_LEVEL=INFO
   ```

6. Click **"Create Web Service"** → Wait for deployment
7. **Save the URL** (e.g., `https://job-search-tracker-api.onrender.com`)

### 3. Deploy Frontend to Render (10 minutes)

1. In Render dashboard → **"New"** → **"Static Site"**
2. Connect your `job-search-tracker-frontend` repository
3. Configure:
   - **Name**: `job-search-tracker-frontend`
   - **Build Command**: `npm ci && npm run build:production`
   - **Publish Directory**: `build`

4. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-domain.onrender.com
   REACT_APP_ENVIRONMENT=production
   ```

5. Click **"Create Static Site"** → Wait for deployment
6. **Save the URL** (e.g., `https://job-search-tracker-frontend.onrender.com`)

### 4. Update CORS (2 minutes)

1. Go back to your backend service in Render
2. Update `BACKEND_CORS_ORIGINS`:
   ```
   BACKEND_CORS_ORIGINS=["https://your-frontend-domain.onrender.com"]
   ```
3. Redeploy backend

### 5. Test Your App (3 minutes)

1. Visit your frontend URL
2. Test login/registration
3. Check API docs: `https://your-backend-domain.onrender.com/docs`

## 🎉 You're Live!

Your app is now deployed with:
- ✅ HTTPS (automatic)
- ✅ Free tier database
- ✅ Auto-deployment from Git
- ✅ Production-ready configuration

## 📝 Important Notes

- **Free tier limits**: Services may sleep after 15min inactivity
- **Database**: 500MB storage limit on Supabase free tier
- **Bandwidth**: 100GB/month on Render free tier
- **Security**: Never commit secrets to Git

## 🔧 Troubleshooting

**Database connection fails?**
- Check DATABASE_URL format
- Verify Supabase project is active

**CORS errors?**
- Update BACKEND_CORS_ORIGINS with exact frontend URL
- No trailing slashes in URLs

**Build fails?**
- Check build logs in Render dashboard
- Verify all dependencies are in requirements.txt/package.json

## 🚀 Next Steps

1. Set up custom domain (optional)
2. Configure monitoring
3. Set up backups
4. Scale up when needed

---

**Need help?** Check the full [CLOUD_DEPLOYMENT.md](./CLOUD_DEPLOYMENT.md) guide for detailed instructions.
