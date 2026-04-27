# 🚀 Deploy Your App - Super Quick Guide

**Goal:** Get your app online in 5-10 minutes so it works 24/7, even when your laptop is off!

---

## Option A: Railway CLI (Recommended - Fastest)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Deploy!
```bash
cd "/Users/kimberlysegers/Sport app"

railway login          # Opens browser, sign up with GitHub
railway init          # Create project
railway add           # Choose PostgreSQL
railway up            # Deploy!
```

### Step 3: Setup Database
```bash
railway variables set NODE_ENV=production
railway run psql < database/deploy-schema.sql
```

### Step 4: Get Your URL!
```bash
railway open
```

**✅ Done!** Your app is now live at `https://your-app.up.railway.app`

---

## Option B: Railway Website (No CLI needed)

### Step 1: Push to GitHub
```bash
cd "/Users/kimberlysegers/Sport app"

git init
git add .
git commit -m "Deploy sport tracker"
git branch -M main
```

Go to **github.com/new** and create repository `sport-nutrition-tracker`, then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/sport-nutrition-tracker.git
git push -u origin main
```

### Step 2: Deploy on Railway
1. Go to **railway.app** → Sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `sport-nutrition-tracker`
4. Click **"+ New"** → **"Database"** → **"PostgreSQL"**

### Step 3: Setup Database
Click PostgreSQL service → **"Connect"** → Copy psql command

In your terminal:
```bash
psql [paste connection string here] < database/deploy-schema.sql
```

### Step 4: Set Environment Variables
In Railway, click your app → **"Variables"** tab → Add:
- `NODE_ENV` = `production`
- `DATABASE_URL` = (auto-filled by Railway)

**✅ Done!** Click **"Deployments"** to see your live URL!

---

## 📱 Use on Your Phone

1. Get your Railway URL (ends with `.railway.app`)
2. Open it in Safari/Chrome on your phone
3. **iPhone:** Tap Share (⬆️) → "Add to Home Screen"
4. **Android:** Menu (⋮) → "Add to Home screen"

**Now it works everywhere, anytime!** 🎉

---

## 🆘 Troubleshooting

**App won't start?**
```bash
railway logs  # Check for errors
```

**Database not connected?**
```bash
railway variables  # Should show DATABASE_URL
```

**Need to redeploy?**
```bash
railway up --detach
```

---

## 💰 Cost

**FREE!** Railway gives $5/month credit - more than enough for this app.

Your app URL: `https://[project-name].up.railway.app`

Share it with friends, your trainer, or keep it private - it's yours! 🏋️
