-- Combined database schema for deployment
-- Run this file once after deploying to cloud

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert demo user
INSERT INTO users (username, email) 
VALUES ('demo_user', 'demo@example.com')
ON CONFLICT (username) DO NOTHING;

-- Training schedules table
CREATE TABLE IF NOT EXISTS training_schedules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week VARCHAR(10) NOT NULL,
  workout_type VARCHAR(100) NOT NULL,
  exercises JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, day_of_week)
);

-- Strength logs table
CREATE TABLE IF NOT EXISTS strength_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise VARCHAR(100) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  reps INTEGER NOT NULL,
  sets INTEGER NOT NULL,
  notes TEXT,
  workout_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cardio logs table
CREATE TABLE IF NOT EXISTS cardio_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  duration INTEGER NOT NULL,
  distance DECIMAL(6,2),
  calories INTEGER,
  notes TEXT,
  workout_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nutrition logs table
CREATE TABLE IF NOT EXISTS nutrition_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  meal_type VARCHAR(20) NOT NULL,
  food_item VARCHAR(200) NOT NULL,
  calories INTEGER,
  protein DECIMAL(5,2),
  carbs DECIMAL(5,2),
  fats DECIMAL(5,2),
  notes TEXT,
  meal_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Body measurements table
CREATE TABLE IF NOT EXISTS body_measurements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  weight DECIMAL(5,2),
  body_fat_percentage DECIMAL(4,2),
  chest DECIMAL(5,2),
  waist DECIMAL(5,2),
  hips DECIMAL(5,2),
  biceps DECIMAL(5,2),
  thighs DECIMAL(5,2),
  calves DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, measurement_date)
);

-- Workout completions table
CREATE TABLE IF NOT EXISTS workout_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  schedule_id INTEGER NOT NULL REFERENCES training_schedules(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  exercises_completed JSONB,
  UNIQUE(user_id, schedule_id, completion_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_strength_logs_user_date ON strength_logs(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_strength_logs_exercise ON strength_logs(exercise);
CREATE INDEX IF NOT EXISTS idx_cardio_logs_user_date ON cardio_logs(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date ON nutrition_logs(user_id, meal_date);
CREATE INDEX IF NOT EXISTS idx_training_schedules_user ON training_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, measurement_date);
CREATE INDEX IF NOT EXISTS idx_workout_completions_user_date ON workout_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_workout_completions_schedule ON workout_completions(schedule_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_training_schedules_updated_at ON training_schedules;
CREATE TRIGGER update_training_schedules_updated_at
  BEFORE UPDATE ON training_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample training schedule (7 days)
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
VALUES 
  (1, 'monday', 'Upper Body Strength', 
   '["Bench Press - 4x8-10", "Incline Dumbbell Press - 3x10-12", "Cable Flyes - 3x12-15", "Overhead Press - 4x8-10", "Lateral Raises - 3x12-15", "Tricep Pushdowns - 3x12-15", "Face Pulls - 3x15-20"]'::jsonb,
   'Focus on progressive overload'),
  
  (1, 'tuesday', 'Lower Body & Core', 
   '["Squats - 4x8-10", "Romanian Deadlifts - 3x10-12", "Leg Press - 3x12-15", "Walking Lunges - 3x12 each", "Leg Curls - 3x12-15", "Calf Raises - 4x15-20", "Plank - 3x60sec"]'::jsonb,
   'Keep core tight'),
  
  (1, 'wednesday', 'Cardio & Recovery', 
   '["30 min Cycling", "Foam Rolling", "Light Stretching"]'::jsonb,
   'Active recovery day'),
  
  (1, 'thursday', 'Push Day', 
   '["Bench Press - 4x6-8", "Incline Barbell Press - 3x8-10", "Dips - 3x10-12", "Dumbbell Shoulder Press - 3x10-12", "Lateral Raises - 4x12-15", "Overhead Tricep Extension - 3x12-15", "Cable Crossovers - 3x15"]'::jsonb,
   'Heavy pushing movements'),
  
  (1, 'friday', 'Pull Day', 
   '["Deadlifts - 4x6-8", "Pull-ups - 3x8-10", "Barbell Rows - 3x8-10", "Lat Pulldowns - 3x10-12", "Face Pulls - 3x15-20", "Barbell Curls - 3x10-12", "Hammer Curls - 3x12-15"]'::jsonb,
   'Focus on back thickness'),
  
  (1, 'saturday', 'Leg Day + HIIT', 
   '["Squats - 5x5", "Leg Press - 4x12", "Leg Extensions - 3x15", "Hamstring Curls - 3x15", "Bulgarian Split Squats - 3x10 each", "HIIT Sprints - 10x30sec"]'::jsonb,
   'High intensity leg session'),
  
  (1, 'sunday', 'Rest Day', 
   '["Light walk", "Meal prep", "Recovery"]'::jsonb,
   'Full rest and recovery')
ON CONFLICT (user_id, day_of_week) DO NOTHING;

-- Insert sample body measurements (last 3 months progress)
INSERT INTO body_measurements (user_id, measurement_date, weight, body_fat_percentage, chest, waist, hips)
VALUES 
  (1, CURRENT_DATE - INTERVAL '60 days', 75.5, 18.5, 98, 82, 95),
  (1, CURRENT_DATE - INTERVAL '30 days', 74.8, 18.2, 98.5, 81, 95),
  (1, CURRENT_DATE - INTERVAL '10 days', 74.2, 17.8, 99, 80, 95.5)
ON CONFLICT (user_id, measurement_date) DO NOTHING;

-- Mark Monday's workout as completed (sample)
INSERT INTO workout_completions (user_id, schedule_id, completion_date, notes, exercises_completed)
SELECT 1, id, CURRENT_DATE, 'Great workout! Felt strong today.', 
  '["Bench Press - 3x8 @ 80kg", "Incline Dumbbell Press - 3x10 @ 30kg", "Cable Flyes - 3x12"]'::jsonb
FROM training_schedules 
WHERE user_id = 1 AND day_of_week = 'monday'
ON CONFLICT (user_id, schedule_id, completion_date) DO NOTHING;

-- Success message
SELECT 'Database setup complete!' as status;
