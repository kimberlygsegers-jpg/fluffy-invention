-- Body Measurements and Progress Tracking

-- Create body measurements table
CREATE TABLE IF NOT EXISTS body_measurements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  weight DECIMAL(5, 2), -- in kg
  body_fat_percentage DECIMAL(4, 2), -- percentage
  chest DECIMAL(5, 2), -- in cm
  waist DECIMAL(5, 2), -- in cm
  hips DECIMAL(5, 2), -- in cm
  biceps DECIMAL(5, 2), -- in cm
  thighs DECIMAL(5, 2), -- in cm
  calves DECIMAL(5, 2), -- in cm
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, measurement_date)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, measurement_date DESC);

-- Add sample measurements for demo
INSERT INTO body_measurements (user_id, measurement_date, weight, body_fat_percentage, chest, waist, hips, notes)
VALUES 
  (1, CURRENT_DATE - INTERVAL '30 days', 75.5, 18.5, 98, 82, 95, 'Starting measurements'),
  (1, CURRENT_DATE - INTERVAL '20 days', 74.8, 18.2, 98.5, 81, 95, 'Good progress'),
  (1, CURRENT_DATE - INTERVAL '10 days', 74.2, 17.8, 99, 80, 95.5, 'Feeling stronger')
ON CONFLICT (user_id, measurement_date) DO NOTHING;
