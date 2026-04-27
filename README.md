# 🏋️ Sports & Nutrition Tracker

A comprehensive web application for tracking workouts, nutrition, and fitness goals with AI-powered chat assistance. Built with Node.js, Express, PostgreSQL, and OpenAI integration.

## ✨ Features

- **🤖 AI Chat Assistant**: Get personalized nutrition advice and fitness recommendations using OpenAI GPT-4
- **💪 Strength Training Logger**: Track weight, reps, sets with automatic progressive overload detection
- **🏃 Cardio Activity Tracking**: Log cycling, swimming, running, and other cardio activities
- **🥗 Nutrition Logging**: Track meals with macros (calories, protein, carbs, fats)
- **📅 Training Schedule**: Plan your weekly workout routine with morning notifications
- **📊 Progress Tracking**: Visualize your progressive overload and workout improvements
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone or download the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   PORT=3000
   DB_USER=postgres
   DB_HOST=localhost
   DB_NAME=sports_tracker
   DB_PASSWORD=your_password
   DB_PORT=5432
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Create PostgreSQL database**
   ```bash
   # Log into PostgreSQL
   psql -U postgres
   
   # Create the database
   CREATE DATABASE sports_tracker;
   
   # Exit psql
   \q
   ```

5. **Set up database schema**
   ```bash
   # Run the schema file
   psql -U postgres -d sports_tracker -f database/schema.sql
   ```
   
   Or manually:
   ```bash
   psql -U postgres -d sports_tracker
   ```
   Then copy and paste the contents of `database/schema.sql`

6. **Start the server**
   
   Development mode (with auto-reload):
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

7. **Open the application**
   
   Navigate to: `http://localhost:3000`

## 📁 Project Structure

```
sport-app/
├── server.js                 # Main Express server
├── package.json             # Dependencies and scripts
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── routes/
│   ├── chat.js            # AI chat endpoints
│   ├── workouts.js        # Strength & cardio logging
│   ├── nutrition.js       # Nutrition logging
│   └── schedule.js        # Training schedule management
├── database/
│   └── schema.sql         # PostgreSQL database schema
├── public/
│   ├── index.html         # Main application UI
│   ├── styles.css         # Application styles
│   └── app.js             # Frontend JavaScript
└── README.md              # This file
```

## 🎯 API Endpoints

### Chat
- `POST /api/chat` - Send message to AI coach

### Workouts
- `POST /api/workouts/strength` - Log strength training workout
- `POST /api/workouts/cardio` - Log cardio activity
- `GET /api/workouts/history/:userId` - Get workout history
- `GET /api/workouts/progress/:userId/:exercise` - Get progress for specific exercise

### Nutrition
- `POST /api/nutrition` - Log meal/nutrition entry
- `GET /api/nutrition/daily/:userId` - Get daily nutrition summary
- `GET /api/nutrition/history/:userId` - Get nutrition history

### Schedule
- `POST /api/schedule` - Create/update training schedule
- `GET /api/schedule/:userId` - Get weekly training schedule
- `GET /api/schedule/:userId/today` - Get today's training schedule
- `DELETE /api/schedule/:userId/:dayOfWeek` - Delete schedule for specific day

## 💾 Database Schema

The application uses PostgreSQL with the following tables:

- **users** - User profiles and authentication
- **training_schedules** - Weekly workout plans
- **strength_logs** - Strength training workout records
- **cardio_logs** - Cardio activity records
- **nutrition_logs** - Meal and nutrition entries

See `database/schema.sql` for complete schema details.

## 🚢 Deployment

### Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Configure `vercel.json` (already included in project)

3. Deploy:
   ```bash
   vercel
   ```

4. Set environment variables in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`

### Database Hosting

For production, use a hosted PostgreSQL service:
- [Neon](https://neon.tech/) - Serverless Postgres (recommended for Vercel)
- [Supabase](https://supabase.com/) - PostgreSQL with additional features
- [Railway](https://railway.app/) - Full-stack hosting
- [ElephantSQL](https://www.elephantsql.com/) - PostgreSQL as a service

### Environment Variables in Production

Make sure to set all environment variables from `.env.example` in your hosting platform:
- Database connection strings
- OpenAI API key
- Any other configuration values

## 🔧 Configuration

### OpenAI Settings

The AI chat uses GPT-4 by default. To change the model or settings, edit `routes/chat.js`:

```javascript
const completion = await openai.chat.completions.create({
  model: 'gpt-4', // Change to 'gpt-3.5-turbo' for faster/cheaper responses
  messages: messages,
  max_tokens: 500,
  temperature: 0.7,
});
```

### User Authentication

The current version uses a demo user ID (`USER_ID = 1`). For production, implement proper authentication:

1. Add authentication middleware (JWT, sessions, etc.)
2. Update `public/app.js` to use authenticated user ID
3. Add login/signup pages

## 📝 Usage Tips

### Strength Training
- Always log weight in kilograms
- The app automatically calculates progressive overload based on volume (weight × reps × sets)
- Track the same exercises consistently for accurate progress tracking

### Nutrition
- Log meals as you eat them for accurate daily totals
- Use the AI chat to get nutritional information about foods
- Daily summary updates automatically when you switch to the Nutrition tab

### Training Schedule
- Set up your weekly schedule to get morning notifications
- Use the "Today's Schedule" button in the header for quick access
- Update schedules as your training program evolves

### AI Chat
- Ask about meal recommendations
- Get advice on progressive overload strategies
- Request workout modifications based on goals
- Inquire about recovery and nutrition timing

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready

# Verify database exists
psql -U postgres -l | grep sports_tracker

# Test connection
psql -U postgres -d sports_tracker -c "SELECT NOW();"
```

### OpenAI API Issues
- Verify your API key is valid
- Check your OpenAI account has available credits
- Ensure you have access to the GPT-4 model (or change to GPT-3.5)

### Port Already in Use
```bash
# Change PORT in .env file or kill the process:
# On macOS/Linux:
lsof -ti:3000 | xargs kill -9

# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## 🔐 Security Notes

For production deployment:
- Implement proper user authentication
- Hash passwords using bcrypt
- Use HTTPS for all connections
- Validate and sanitize all user inputs
- Use parameterized queries (already implemented)
- Store sensitive data securely (use environment variables)
- Implement rate limiting for API endpoints
- Add CORS restrictions for specific domains

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 📧 Support

For questions or issues, please open an issue on the repository.

---

**Note**: This application uses a demo user by default. For production use, implement proper authentication and user management.
