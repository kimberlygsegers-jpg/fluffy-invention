const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Log strength training workout
router.post('/strength', async (req, res) => {
  try {
    const { user_id, exercise_name, weight, reps, sets, notes, workout_date } = req.body;

    if (!user_id || !exercise_name || !weight || !reps || !sets) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO strength_logs (user_id, exercise, weight, reps, sets, notes, workout_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      user_id,
      exercise_name,
      weight,
      reps,
      sets,
      notes || null,
      workout_date || new Date()
    ];

    const result = await pool.query(query, values);

    // Check for progressive overload
    const previousQuery = `
      SELECT * FROM strength_logs
      WHERE user_id = $1 AND exercise = $2 AND id != $3
      ORDER BY workout_date DESC
      LIMIT 1
    `;
    const previousResult = await pool.query(previousQuery, [user_id, exercise_name, result.rows[0].id]);
    
    let progressiveOverload = null;
    if (previousResult.rows.length > 0) {
      const prev = previousResult.rows[0];
      const prevVolume = prev.weight * prev.reps * prev.sets;
      const currentVolume = weight * reps * sets;
      
      if (currentVolume > prevVolume) {
        progressiveOverload = {
          achieved: true,
          volumeIncrease: ((currentVolume - prevVolume) / prevVolume * 100).toFixed(2),
          message: 'Progressive overload achieved!'
        };
      }
    }

    res.json({
      success: true,
      workout: result.rows[0],
      progressiveOverload
    });

  } catch (error) {
    console.error('Error logging strength workout:', error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

// Log cardio workout
router.post('/cardio', async (req, res) => {
  try {
    const { user_id, activity_type, duration_minutes, distance_km, calories_burned, notes, activity_date } = req.body;

    if (!user_id || !activity_type || !duration_minutes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO cardio_logs (user_id, activity_type, duration, distance, calories, notes, workout_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      user_id,
      activity_type,
      duration_minutes,
      distance_km || null,
      calories_burned || null,
      notes || null,
      activity_date || new Date()
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      workout: result.rows[0]
    });

  } catch (error) {
    console.error('Error logging cardio workout:', error);
    res.status(500).json({ error: 'Failed to log workout' });
  }
});

// Get workout history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, limit = 50 } = req.query;

    let query;
    if (type === 'strength') {
      query = `
        SELECT * FROM strength_logs
        WHERE user_id = $1
        ORDER BY workout_date DESC
        LIMIT $2
      `;
    } else if (type === 'cardio') {
      query = `
        SELECT * FROM cardio_logs
        WHERE user_id = $1
        ORDER BY workout_date DESC
        LIMIT $2
      `;
    } else {
      // Get both types
      const strengthQuery = await pool.query(`
        SELECT *, 'strength' as workout_type FROM strength_logs
        WHERE user_id = $1
        ORDER BY workout_date DESC
        LIMIT $2
      `, [userId, limit]);

      const cardioQuery = await pool.query(`
        SELECT *, 'cardio' as workout_type FROM cardio_logs
        WHERE user_id = $1
        ORDER BY workout_date DESC
        LIMIT $2
      `, [userId, limit]);

      const combined = [...strengthQuery.rows, ...cardioQuery.rows]
        .sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date))
        .slice(0, limit);

      return res.json({ workouts: combined });
    }

    const result = await pool.query(query, [userId, limit]);
    res.json({ workouts: result.rows });

  } catch (error) {
    console.error('Error fetching workout history:', error);
    res.status(500).json({ error: 'Failed to fetch workout history' });
  }
});

// Get progressive overload stats for an exercise
router.get('/progress/:userId/:exercise', async (req, res) => {
  try {
    const { userId, exercise } = req.params;

    const query = `
      SELECT workout_date, weight, reps, sets, (weight * reps * sets) as volume
      FROM strength_logs
      WHERE user_id = $1 AND exercise = $2
      ORDER BY workout_date ASC
    `;

    const result = await pool.query(query, [userId, exercise]);

    res.json({
      exercise,
      history: result.rows
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

module.exports = router;
