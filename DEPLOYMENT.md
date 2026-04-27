# Sports & Nutrition Tracker - Deployment Guide

## 🚀 Deploy to Railway (Free - 5 minutes)

### Prerequisites
- GitHub account
- Railway account (sign up at railway.app with GitHub)

### Step 1: Push Code to GitHub (2 minutes)

1. Go to [GitHub](https://github.com/new) and create a new repository named `sport-nutrition-tracker`
2. In your terminal, run these commands:

```bash
cd "/Users/kimberlysegers/Sport app"

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Sport Nutrition Tracker"

# Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sport-nutrition-tracker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway (3 minutes)

1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `sport-nutrition-tracker` repository
5. Railway will detect it's a Node.js app automatically

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway will create and connect the database automatically

### Step 4: Set Environment Variables

Click on your app service, go to **"Variables"** tab, and add:

```
DATABASE_URL=(Railway will auto-fill this from PostgreSQL)
OPENAI_API_KEY=your_openai_key_here
NODE_ENV=production
```

### Step 5: Deploy Database Schema

After the first deployment, go to your PostgreSQL service and click **"Connect"**. 

Copy the connection command and run these in your terminal:

```bash
# Connect to Railway PostgreSQL
psql postgresql://[YOUR_CONNECTION_STRING]

# Then paste the contents of these files:
# - database/schema.sql
# - database/sample-schedule.sql  
# - database/measurements-schema.sql
# - database/workout-completions-schema.sql
```

**OR** use the Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run psql < database/schema.sql
railway run psql < database/sample-schedule.sql
railway run psql < database/measurements-schema.sql
railway run psql < database/workout-completions-schema.sql
```

### Step 6: Access Your App!

Railway will give you a URL like: `https://your-app.railway.app`

🎉 **Done!** Your app is now live 24/7!

---

## Alternative: Deploy to Render.com

### Prerequisites
- GitHub account (same as above)
- Render account (sign up at render.com)

### Steps:

1. **Push to GitHub** (same as Step 1 above)

2. **Go to [render.com](https://render.com)**
   - Click **"New +"** → **"Web Service"**
   - Connect your GitHub repository
   - Use these settings:
     - **Name:** sport-nutrition-tracker
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

3. **Add PostgreSQL Database**
   - Click **"New +"** → **"PostgreSQL"**
   - Name it `sport-tracker-db`
   - Choose **Free tier**
   - Copy the **Internal Database URL**

4. **Add Environment Variables** in your Web Service:
   - `DATABASE_URL` = [paste internal database URL]
   - `NODE_ENV` = `production`
   - `OPENAI_API_KEY` = your key

5. **Deploy Schema** using Render's PostgreSQL shell or local connection

---

## 📱 After Deployment

### Update Your Phone Bookmark
Replace `http://172.20.10.7:3000` with your new Railway/Render URL.

### Add to Home Screen Again
1. Visit your new cloud URL on your phone
2. Add to home screen (same process as before)
3. Now it works even when your laptop is off! ✅

---

## 🔐 Security Improvements (Optional)

After deployment, consider:
1. Adding user authentication
2. Removing the sample OpenAI key
3. Setting up proper user accounts
4. Adding password protection

---

## 💡 Tips

- **Free tier limits:** Railway gives $5/month credit (enough for this app)
- **Keep it alive:** Free tier may sleep after 30 min of inactivity
- **Monitor usage:** Check your Railway/Render dashboard occasionally
- **Backups:** Railway/Render handle database backups automatically

---

## Need Help?

If you run into issues:
1. Check Railway/Render logs for errors
2. Verify environment variables are set correctly
3. Make sure database migrations ran successfully
4. Test the `/api/health` endpoint

**Your app URL will be:** `https://[your-project-name].railway.app` or `https://[your-project-name].onrender.com`
