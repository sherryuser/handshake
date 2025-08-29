# 🚀 Deployment Checklist for Vercel

## ✅ Pre-Deployment Setup

### 1. Steam Web API Key
- [ ] Go to https://steamcommunity.com/dev/apikey
- [ ] Login with Steam account
- [ ] Create API key with domain: `your-app-name.vercel.app`
- [ ] Copy the API key

### 2. Vercel Postgres Database
- [ ] Login to https://vercel.com/dashboard
- [ ] Create new project (don't deploy yet)
- [ ] Go to Storage → Create Database → Postgres
- [ ] Choose region close to your users
- [ ] Copy DATABASE_URL from database dashboard

### 3. Upstash Redis
- [ ] Go to https://upstash.com/
- [ ] Sign up with GitHub
- [ ] Create Redis Database
- [ ] Choose same region as your database
- [ ] Copy REST URL and REST TOKEN

### 4. Environment Variables for Vercel
Set these in Vercel dashboard → Project → Settings → Environment Variables:

```
STEAM_API_KEY=your_steam_api_key_here
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=your_random_secret_here
DATABASE_URL=your_postgres_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
CRON_SECRET=your_random_cron_secret
```

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

### Step 2: Deploy to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Next.js settings
4. Click "Deploy"

### Step 3: Set Environment Variables
1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add all variables listed above

### Step 4: Setup Database
```bash
# After first deployment, run this locally with production DATABASE_URL:
npx prisma migrate deploy
npx prisma db push
```

### Step 5: Verify Deployment
- [ ] Check homepage loads
- [ ] Test API endpoints
- [ ] Verify search functionality
- [ ] Test social sharing

## 🔧 Post-Deployment

### Custom Domain (Optional)
1. Vercel dashboard → Domains
2. Add your custom domain
3. Update NEXTAUTH_URL and Steam API key domain

### Monitor Performance
- Vercel Analytics (automatic)
- Check Redis usage in Upstash dashboard
- Monitor database usage in Vercel dashboard

## 🐛 Troubleshooting

### Common Issues:
1. **Environment Variables**: Double-check all are set correctly
2. **Database Connection**: Ensure DATABASE_URL is correct
3. **Steam API**: Verify domain matches deployment URL
4. **Redis Connection**: Check Upstash credentials

### Debug Commands:
```bash
# Check build locally
npm run build

# Check database connection
npx prisma db push

# View logs
vercel logs your-deployment-url
```

## 📱 Production Features
- ✅ Real Steam API integration
- ✅ PostgreSQL database with full features
- ✅ Redis caching for performance
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Serverless functions
- ✅ Automatic deployments from GitHub
