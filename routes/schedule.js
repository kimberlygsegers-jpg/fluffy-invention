const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Create or update training schedule
router.post('/', async (req, res) => {
  try {
    const { user_id, day_of_week, workout_type, exercises, notes } = req.body;

    if (!user_id || !day_of_week || !workout_type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if schedule exists for this user and day
    const existingQuery = `
      SELECT * FROM training_schedules
      WHERE user_id = $1 AND day_of_week = $2
    `;
    const existing = await pool.query(existingQuery, [user_id, day_of_week]);

    let result;
    if (existing.rows.length > 0) {
      // Update existing schedule
      const updateQuery = `
        UPDATE training_schedules
        SET workout_type = $1, exercises = $2, notes = $3, updated_at = NOW()
        WHERE user_id = $4 AND day_of_week = $5
        RETURNING *
      `;
      result = await pool.query(updateQuery, [workout_type, JSON.stringify(exercises), notes, user_id, day_of_week]);
    } else {
      // Create new schedule
      const insertQuery = `
        INSERT INTO training_schedules (user_id, day_of_week, workout_type, exercises, notes)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      result = await pool.query(insertQuery, [user_id, day_of_week, workout_type, JSON.stringify(exercises), notes]);
    }

    res.json({
      success: true,
      schedule: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating/updating schedule:', error);
    res.status(500).json({ error: 'Failed to save schedule' });
  }
});

// Get weekly training schedule
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT * FROM training_schedules
      WHERE user_id = $1
      ORDER BY 
        CASE day_of_week
          WHEN 'monday' THEN 1
          WHEN 'tuesday' THEN 2
          WHEN 'wednesday' THEN 3
          WHEN 'thursday' THEN 4
          WHEN 'friday' THEN 5
          WHEN 'saturday' THEN 6
          WHEN 'sunday' THEN 7
        END
    `;

    const result = await pool.query(query, [userId]);

    res.json({ schedule: result.rows });

  } catch (error) {
    console.error('❌ Error fetching schedule:', error.message);
    console.error('Full error:', error);
    res.status(500).json({ error: 'Failed to fetch schedule', details: error.message });
  }
});

// Get today's training schedule
router.get('/:userId/today', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = daysOfWeek[new Date().getDay()];

    const query = `
      SELECT * FROM training_schedules
      WHERE user_id = $1 AND day_of_week = $2
    `;

    const result = await pool.query(query, [userId, today]);

    if (result.rows.length === 0) {
      return res.json({ 
        message: 'No training scheduled for today',
        day: today
      });
    }

    res.json({
      day: today,
      schedule: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching today\'s schedule:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s schedule' });
  }
});

// Delete training schedule
router.delete('/:userId/:dayOfWeek', async (req, res) => {
  try {
    const { userId, dayOfWeek } = req.params;

    const query = `
      DELETE FROM training_schedules
      WHERE user_id = $1 AND day_of_week = $2
      RETURNING *
    `;

    const result = await pool.query(query, [userId, dayOfWeek]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
});

module.exports = router;
