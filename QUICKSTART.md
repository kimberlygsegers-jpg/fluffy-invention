# Quick Start Guide

Get your Sports & Nutrition Tracker running in 5 minutes!

## 🚀 Prerequisites Check

Before you start, make sure you have:
- [ ] Node.js installed (v18+): Run `node --version`
- [ ] PostgreSQL installed: Run `psql --version`
- [ ] OpenAI API key: [Get one here](https://platform.openai.com/api-keys)

## ⚡ 5-Minute Setup

### 1. Install Dependencies (1 min)
```bash
npm install
```

### 2. Set Up Environment Variables (1 min)
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your favorite editor
# Required: Add your OpenAI API key
# Update PostgreSQL credentials if different from defaults
```

### 3. Create Database (2 min)

**Option A: Automatic (macOS/Linux)**
```bash
chmod +x setup-database.sh
./setup-database.sh
```

**Option B: Manual**
```bash
# Create database
psql -U postgres -c "CREATE DATABASE sports_tracker;"

# Run schema
psql -U postgres -d sports_tracker -f database/schema.sql
```

**Option C: Using pgAdmin or another GUI**
1. Open your PostgreSQL GUI tool
2. Create a new database named `sports_tracker`
3. Open and run `database/schema.sql`

### 4. Start the Server (1 min)
```bash
npm start
```

Visit: **http://localhost:3000** 🎉

## 🎯 First Steps

1. **Try the AI Chat**: Ask "What should I eat before a workout?"
2. **Log a Workout**: Go to Strength Training tab
3. **Track Nutrition**: Log your breakfast in the Nutrition tab
4. **Set Schedule**: Create your weekly workout plan

## 📱 Features Overview

| Tab | Purpose |
|-----|---------|
| 💬 AI Chat | Get nutrition and fitness advice |
| 💪 Strength Training | Log weight training with auto progress tracking |
| 🏃 Cardio | Track running, cycling, swimming |
| 🥗 Nutrition | Log meals and see daily macro totals |
| 📅 Schedule | Plan your weekly workouts |
| 📊 Progress | Visualize your progressive overload |

## 🔧 Common Issues & Fixes

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
pg_isready

# If not running, start it:
# macOS (Homebrew):
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Windows:
# Use Services app or pg_ctl start
```

### "Port 3000 is already in use"
```bash
# Change PORT in .env file to 3001 or another free port
PORT=3001
```

### "OpenAI API error"
- Verify your API key in .env
- Check you have credits: https://platform.openai.com/usage
- Ensure no extra spaces around the key

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 🚢 Deploy to Production

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Hosting Database
Use these PostgreSQL hosting services:
- **Neon** (neon.tech) - Free tier, serverless
- **Supabase** (supabase.com) - Free tier, 500MB
- **Railway** (railway.app) - Free tier available

## 📚 Learn More

- Full documentation: See [README.md](README.md)
- API reference: See [API_DOCS.md](API_DOCS.md)
- Database schema: See [database/schema.sql](database/schema.sql)

## 💡 Pro Tips

1. **Morning Routine**: Check "Today's Schedule" button each morning
2. **Track Consistently**: Log workouts immediately after completing them
3. **Ask the AI**: Use the chat for meal ideas and form checks
4. **Review Progress**: Check the Progress tab weekly to see your gains
5. **Backup Data**: Regularly export your PostgreSQL database

## 🎓 Usage Examples

### Log a Strength Workout
1. Go to "Strength Training" tab
2. Enter: Exercise: "Bench Press", Weight: 80kg, Reps: 8, Sets: 3
3. Click "Log Workout"
4. App will show if you achieved progressive overload! 🎉

### Ask AI for Nutrition Advice
1. Go to "AI Chat" tab
2. Ask: "I'm trying to build muscle, what should I eat after a workout?"
3. Get personalized advice from the AI coach

### Create Weekly Schedule
1. Go to "Schedule" tab
2. Select day (e.g., Monday)
3. Enter workout type (e.g., "Upper Body")
4. List exercises (one per line)
5. Save and see your weekly plan below

## 🆘 Need Help?

- Check [README.md](README.md) for detailed documentation
- Review [API_DOCS.md](API_DOCS.md) for API reference
- Open an issue on the repository

---

**Happy Training! 💪🏃‍♂️🥗**
