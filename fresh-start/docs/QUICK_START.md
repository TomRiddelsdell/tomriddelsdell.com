# 🚀 Quick Start Guide

**Get tomriddelsdell.com running in 5 minutes**

## Prerequisites

- Node.js 18+ 
- Git
- PostgreSQL database (local or cloud)

## 1-Minute Setup

```bash
# 1. Fork & Clone
git clone https://github.com/YOUR_USERNAME/tomriddelsdell.com
cd tomriddelsdell.com

# 2. Install & Configure
npm install
cp .env.template .env

# 3. Set Database (choose one):
# Option A: Local PostgreSQL
echo "DATABASE_URL=postgresql://user:pass@localhost:5432/tomriddelsdell_dev" >> .env

# Option B: Free Cloud DB (Neon/Supabase/Railway)
echo "DATABASE_URL=postgresql://user:pass@hostname:5432/database" >> .env

# 4. Add Session Secret
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env

# 5. Start Development
npm run dev
```

**🎉 Open http://localhost:3000 - You're running!**

## Production Deployment

### Option 1: GitHub Actions (Recommended)
1. **Fork repository** → GitHub creates CI/CD automatically
2. **Add secrets** in GitHub repo settings:
   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   PRODUCTION_DATABASE_URL
   SESSION_SECRET
   ```
3. **Push to main** → Auto-deploys to AWS

### Option 2: Manual Deploy
```bash
npm run build
# Deploy dist/ folder to your platform of choice
```

## Essential Configuration

**Minimum `.env` for development:**
```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host:port/database
SESSION_SECRET=your-32-character-secret-here
```

**Optional integrations** (leave empty to disable):
```bash
# AWS Features
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# GitHub Integration  
GITHUB_TOKEN=

# Email Service
EMAIL_PROVIDER=none
SENDGRID_API_KEY=
```

## Common Issues

❌ **"Missing required configuration"**
→ Check your `.env` has `DATABASE_URL` and `SESSION_SECRET`

❌ **"Database connection failed"**  
→ Verify your database is running and URL format is correct

❌ **"Tests failing"**
→ Run `npm test` to see specific errors

## Next Steps

- 📖 [Full Documentation](./README.md)
- 🏗️ [Architecture Guide](./ARCHITECTURE.md) 
- 🔒 [Security Guide](./SECURITY.md)
- ☁️ [AWS Deployment](./DEPLOYMENT.md)

**💡 Pro Tip**: Use the dev container in VS Code for a fully configured environment!
