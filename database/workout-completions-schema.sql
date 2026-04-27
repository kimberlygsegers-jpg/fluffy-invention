-- Table to track workout completions
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

CREATE INDEX idx_workout_completions_user_date ON workout_completions(user_id, completion_date);
CREATE INDEX idx_workout_completions_schedule ON workout_completions(schedule_id);

-- Insert sample completion (mark Monday's workout as done)
INSERT INTO workout_completions (user_id, schedule_id, completion_date, notes, exercises_completed)
SELECT 1, id, CURRENT_DATE, 'Great workout! Felt strong today.', 
  '["Bench Press - 3x8 @ 80kg", "Incline Dumbbell Press - 3x10 @ 30kg", "Cable Flyes - 3x12"]'::jsonb
FROM training_schedules 
WHERE user_id = 1 AND day_of_week = 'monday'
ON CONFLICT (user_id, schedule_id, completion_date) DO NOTHING;
