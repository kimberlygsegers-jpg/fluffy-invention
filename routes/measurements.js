const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Log body measurements
router.post('/', async (req, res) => {
  try {
    const { 
      user_id, 
      measurement_date, 
      weight, 
      body_fat_percentage, 
      chest, 
      waist, 
      hips, 
      biceps, 
      thighs, 
      calves, 
      notes 
    } = req.body;

    if (!user_id || !measurement_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO body_measurements 
      (user_id, measurement_date, weight, body_fat_percentage, chest, waist, hips, biceps, thighs, calves, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id, measurement_date) 
      DO UPDATE SET
        weight = EXCLUDED.weight,
        body_fat_percentage = EXCLUDED.body_fat_percentage,
        chest = EXCLUDED.chest,
        waist = EXCLUDED.waist,
        hips = EXCLUDED.hips,
        biceps = EXCLUDED.biceps,
        thighs = EXCLUDED.thighs,
        calves = EXCLUDED.calves,
        notes = EXCLUDED.notes
      RETURNING *
    `;

    const values = [
      user_id,
      measurement_date,
      weight || null,
      body_fat_percentage || null,
      chest || null,
      waist || null,
      hips || null,
      biceps || null,
      thighs || null,
      calves || null,
      notes || null
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      measurement: result.rows[0]
    });

  } catch (error) {
    console.error('Error logging measurements:', error);
    res.status(500).json({ error: 'Failed to log measurements' });
  }
});

// Get measurement history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const query = `
      SELECT * FROM body_measurements
      WHERE user_id = $1
      ORDER BY measurement_date DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);

    res.json({ measurements: result.rows });

  } catch (error) {
    console.error('Error fetching measurements:', error);
    res.status(500).json({ error: 'Failed to fetch measurements' });
  }
});

// Get progress data for charts
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 90 } = req.query;

    const query = `
      SELECT 
        measurement_date,
        weight,
        body_fat_percentage,
        chest,
        waist,
        hips,
        biceps,
        thighs,
        calves
      FROM body_measurements
      WHERE user_id = $1 
        AND measurement_date >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      ORDER BY measurement_date ASC
    `;

    const result = await pool.query(query, [userId]);

    // Calculate changes
    let changes = null;
    if (result.rows.length >= 2) {
      const first = result.rows[0];
      const latest = result.rows[result.rows.length - 1];
      
      changes = {
        weight: latest.weight ? (parseFloat(latest.weight) - parseFloat(first.weight || 0)).toFixed(2) : null,
        bodyFat: latest.body_fat_percentage ? (parseFloat(latest.body_fat_percentage) - parseFloat(first.body_fat_percentage || 0)).toFixed(2) : null,
        waist: latest.waist ? (parseFloat(latest.waist) - parseFloat(first.waist || 0)).toFixed(2) : null
      };
    }

    res.json({
      data: result.rows,
      changes,
      period: `${days} days`
    });

  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

// Get latest measurement
router.get('/latest/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const query = `
      SELECT * FROM body_measurements
      WHERE user_id = $1
      ORDER BY measurement_date DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      return res.json({ measurement: null });
    }

    res.json({ measurement: result.rows[0] });

  } catch (error) {
    console.error('Error fetching latest measurement:', error);
    res.status(500).json({ error: 'Failed to fetch latest measurement' });
  }
});

module.exports = router;
