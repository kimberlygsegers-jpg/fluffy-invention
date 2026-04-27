-- Sample Training Schedule for Demo User
-- This creates a complete weekly workout plan

-- Monday: Upper Body Strength
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
VALUES (1, 'monday', 'Upper Body Strength', 
'["Bench Press - 4x8-10", "Barbell Rows - 4x8-10", "Overhead Press - 3x10-12", "Pull-ups - 3x8-10", "Dumbbell Flyes - 3x12-15", "Bicep Curls - 3x12-15", "Tricep Dips - 3x12-15"]',
'Focus on compound movements first, maintain proper form')
ON CONFLICT (user_id, day_of_week) DO UPDATE
SET workout_type = EXCLUDED.workout_type,
    exercises = EXCLUDED.exercises,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;

-- Tuesday: Lower Body + Core
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
VALUES (1, 'tuesday', 'Lower Body & Core',
'["Squats - 4x8-10", "Romanian Deadlifts - 4x8-10", "Leg Press - 3x12-15", "Leg Curls - 3x12-15", "Calf Raises - 4x15-20", "Plank - 3x60 seconds", "Russian Twists - 3x20"]',
'Progressive overload on squats, focus on depth')
ON CONFLICT (user_id, day_of_week) DO UPDATE
SET workout_type = EXCLUDED.workout_type,
    exercises = EXCLUDED.exercises,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;

-- Wednesday: Cardio & Active Recovery
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
VALUES (1, 'wednesday', 'Cardio & Recovery',
'["30-45 min moderate cycling or swimming", "Foam rolling - 10 minutes", "Dynamic stretching - 15 minutes", "Light yoga or mobility work"]',
'Keep heart rate at 60-70% max, focus on recovery')
ON CONFLICT (user_id, day_of_week) DO UPDATE
SET workout_type = EXCLUDED.workout_type,
    exercises = EXCLUDED.exercises,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;

-- Thursday: Push Day
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
VALUES (1, 'thursday', 'Push Day (Chest, Shoulders, Triceps)',
'["Incline Bench Press - 4x8-10", "Dumbbell Shoulder Press - 4x10-12", "Chest Dips - 3x10-12", "Lateral Raises - 3x12-15", "Cable Flyes - 3x12-15", "Overhead Tricep Extension - 3x12-15", "Face Pulls - 3x15-20"]',
'Emphasize mind-muscle connection, control the negative')
ON CONFLICT (user_id, day_of_week) DO UPDATE
SET workout_type = EXCLUDED.workout_type,
    exercises = EXCLUDED.exercises,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;

-- Friday: Pull Day
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
VALUES (1, 'friday', 'Pull Day (Back & Biceps)',
'["Deadlifts - 4x6-8", "Pull-ups or Lat Pulldowns - 4x8-10", "Bent Over Rows - 4x8-10", "Single Arm Dumbbell Rows - 3x10-12", "Face Pulls - 3x15-20", "Hammer Curls - 3x12-15", "Cable Curls - 3x12-15"]',
'Deadlifts first when fresh, engage lats on all pulling movements')
ON CONFLICT (user_id, day_of_week) DO UPDATE
SET workout_type = EXCLUDED.workout_type,
    exercises = EXCLUDED.exercises,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;

-- Saturday: Legs + HIIT
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
VALUES (1, 'saturday', 'Leg Day + HIIT',
'["Front Squats - 4x8-10", "Bulgarian Split Squats - 3x10-12 each leg", "Leg Extensions - 3x12-15", "Lying Leg Curls - 3x12-15", "Walking Lunges - 3x20 steps", "20 min HIIT: 30 sec sprint, 90 sec walk"]',
'High intensity today, fuel properly before and after')
ON CONFLICT (user_id, day_of_week) DO UPDATE
SET workout_type = EXCLUDED.workout_type,
    exercises = EXCLUDED.exercises,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;

-- Sunday: Rest or Light Activity
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
VALUES (1, 'sunday', 'Rest Day',
'["Optional: Light walk 20-30 minutes", "Stretching or yoga - 20 minutes", "Meal prep for the week", "Recovery and relaxation"]',
'Listen to your body, rest is when muscles grow')
ON CONFLICT (user_id, day_of_week) DO UPDATE
SET workout_type = EXCLUDED.workout_type,
    exercises = EXCLUDED.exercises,
    notes = EXCLUDED.notes,
    updated_at = CURRENT_TIMESTAMP;
