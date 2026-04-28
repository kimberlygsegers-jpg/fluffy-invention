-- Clear existing schedule for user 1
DELETE FROM training_schedules WHERE user_id = 1;
DELETE FROM workout_completions WHERE user_id = 1;

-- Insert 12-week training schedule starting April 29, 2026
-- Week pattern: Wed-Run, Thu-Rest/Walk, Fri-Strength B, Sat-Swimming, Sun-Biking, Mon-Rest, Tue-Strength A

-- MONDAY - Rest
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes) VALUES
(1, 'monday', 'Rest Day', '["Rest or light walk"]', 'Recovery day - stay hydrated, focus on nutrition');

-- TUESDAY - Strength A
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes) VALUES
(1, 'tuesday', 'Strength Training A', 
'[
  "Warm-up: Squats × 15",
  "Warm-up: Glute bridges × 15",
  "Squats - 3×10 (Week 1-2), 4×10 (Week 3+)",
  "Romanian Deadlifts - 3×10 (Week 1-4), 4×10 (Week 5+)",
  "Shoulder Press - 3×10",
  "Bent-over Rows - 3×10",
  "Walking lunges - 2×10/leg (Week 1-6), 3×10/leg (Week 7+)",
  "Core: Dead bug - 3×10",
  "Core: Plank - 3×30-45 sec"
]', 
'Progressive overload: Increase weight slightly each week. Week 8: Maintain. Week 9+: Rest 60 sec between sets. 45 min total.');

-- WEDNESDAY - Running (Intervals)
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes) VALUES
(1, 'wednesday', 'Running - Intervals', 
'[
  "Warm-up: 10 min easy jog",
  "Week 1-2: 4 × 3 min fast (~5:30/km), 2 min slow jog between",
  "Week 3-4: 5 × 3 min fast, 2 min jog between",
  "Week 5-8: 6 × 3 min fast, 2 min jog between",
  "Week 9: 4 × 4 min fast, 2 min jog between",
  "Week 10: 5 × 4 min fast, 2 min jog between",
  "Week 11: 6 × 3 min (faster pace)",
  "Week 12: 4 × 3 min (deload)",
  "Cool-down: 5-10 min easy jog"
]', 
'Total 35-40 min. Focus on controlled pacing, slightly faster each week. Week 11 = high intensity.');

-- THURSDAY - Rest / Optional Walk
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes) VALUES
(1, 'thursday', 'Rest / Optional Activity', 
'[
  "Week 1-3, 6, 8-10, 12: Rest or 20-30 min easy walk",
  "Week 4-5, 7, 11: Optional 20-30 min easy run"
]', 
'Light recovery day. If optional run, keep it very easy and short.');

-- FRIDAY - Strength B
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes) VALUES
(1, 'friday', 'Strength Training B', 
'[
  "Warm-up: Squats × 15",
  "Warm-up: Glute bridges × 15",
  "Hip Thrusts - 3×12 (Week 1-2), 4×12 (Week 3+)",
  "Step-ups - 3×10/leg (Week 1-6), 4×10/leg (Week 7+)",
  "Chest Press - 3×10",
  "Lat pulldown - 3×8",
  "Kettlebell swings - 3×15 (slower tempo Week 5+)",
  "Core: Side plank - 3×30 sec/side",
  "Core: Bird dog - 3×10",
  "Week 10+: Optional finisher - 30 sec fast / 30 sec rest × 6"
]', 
'Progressive overload: Increase weight slightly each week. Week 5: Slow tempo on swings. Week 8: Maintain weights. Week 9+: Rest 60 sec. 45 min total.');

-- SATURDAY - Swimming
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes) VALUES
(1, 'saturday', 'Swimming', 
'[
  "1h30 swimming session",
  "Focus on technique and endurance",
  "Mix of freestyle and other strokes",
  "Include warm-up and cool-down"
]', 
'1 hour 30 minutes total. Maintain consistent pace, work on form.');

-- SUNDAY - Biking
INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes) VALUES
(1, 'sunday', 'Road Biking', 
'[
  "3 hours road biking",
  "Steady endurance pace",
  "Stay in aerobic zone",
  "Fuel properly during ride"
]', 
'3 hours total. Long endurance ride. Bring water and nutrition. Stay comfortable in saddle.');
