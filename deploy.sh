#!/bin/bash

# Steam Handshakes Deployment Script

echo "🚀 Steam Handshakes Deployment Script"
echo "======================================"

# Check if GitHub URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: GitHub repository URL required"
    echo "Usage: ./deploy.sh https://github.com/yourusername/steam-handshakes.git"
    exit 1
fi

GITHUB_URL=$1

echo "📦 Adding GitHub remote..."
git remote add origin $GITHUB_URL

echo "📤 Pushing to GitHub..."
git branch -M main
git push -u origin main

echo ""
echo "✅ Code pushed to GitHub successfully!"
echo ""
echo "🎯 Next steps:"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository: $GITHUB_URL"
echo "3. Vercel will auto-detect Next.js settings"
echo "4. Click 'Deploy'"
echo ""
echo "🔧 After deployment, set these environment variables in Vercel:"
echo "   STEAM_API_KEY=your_steam_api_key"
echo "   NEXTAUTH_URL=https://your-app-name.vercel.app"
echo "   NEXTAUTH_SECRET=your_random_secret"
echo "   DATABASE_URL=your_postgres_url"
echo "   UPSTASH_REDIS_REST_URL=your_redis_url"
echo "   UPSTASH_REDIS_REST_TOKEN=your_redis_token"
echo "   CRON_SECRET=your_random_cron_secret"
echo ""
echo "🗄️ After setting env vars, run database migration:"
echo "   npx prisma migrate deploy"
echo ""
echo "🎉 Your app will be live at: https://your-app-name.vercel.app"
