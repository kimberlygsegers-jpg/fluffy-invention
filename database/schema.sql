-- Sport and Nutrition Tracking Database Schema
-- PostgreSQL Database

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create training schedules table
CREATE TABLE IF NOT EXISTS training_schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) NOT NULL CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  workout_type VARCHAR(50) NOT NULL,
  exercises JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, day_of_week)
);

-- Create strength logs table
CREATE TABLE IF NOT EXISTS strength_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  exercise VARCHAR(255) NOT NULL,
  weight DECIMAL(6, 2) NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  notes TEXT,
  workout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create cardio logs table
CREATE TABLE IF NOT EXISTS cardio_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('cycling', 'swimming', 'running', 'other')),
  duration INTEGER NOT NULL, -- duration in minutes
  distance DECIMAL(6, 2), -- distance in km
  calories INTEGER,
  notes TEXT,
  workout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create nutrition logs table
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  food_item VARCHAR(255) NOT NULL,
  calories INTEGER,
  protein DECIMAL(6, 2), -- in grams
  carbs DECIMAL(6, 2), -- in grams
  fats DECIMAL(6, 2), -- in grams
  notes TEXT,
  meal_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_strength_logs_user_date ON strength_logs(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_strength_logs_user_exercise ON strength_logs(user_id, exercise);
CREATE INDEX IF NOT EXISTS idx_cardio_logs_user_date ON cardio_logs(user_id, workout_date DESC);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, meal_date DESC);
CREATE INDEX IF NOT EXISTS idx_training_schedules_user ON training_schedules(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_schedules_updated_at
  BEFORE UPDATE ON training_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample user (password: 'demo123' - hash this in production!)
INSERT INTO users (username, email, password_hash, full_name) 
VALUES ('demo', 'demo@example.com', '$2b$10$demo.hash.example', 'Demo User')
ON CONFLICT (username) DO NOTHING;
