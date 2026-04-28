const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get all completions for a user (optionally filtered by date range)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT wc.*, ts.day_of_week, ts.workout_type, ts.exercises
      FROM workout_completions wc
      JOIN training_schedules ts ON wc.schedule_id = ts.id
      WHERE wc.user_id = $1
    `;
    const params = [userId];
    
    if (startDate) {
      query += ` AND wc.completion_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND wc.completion_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    
    query += ' ORDER BY wc.completion_date DESC';
    
    const result = await pool.query(query, params);
    res.json({ completions: result.rows });
  } catch (error) {
    console.error('Error fetching completions:', error);
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

// Check if a specific workout is completed on a date
router.get('/:userId/check/:scheduleId/:date', async (req, res) => {
  try {
    const { userId, scheduleId, date } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM workout_completions WHERE user_id = $1 AND schedule_id = $2 AND completion_date = $3',
      [userId, scheduleId, date]
    );
    
    res.json({ 
      completed: result.rows.length > 0,
      completion: result.rows[0] || null
    });
  } catch (error) {
    console.error('Error checking completion:', error);
    res.status(500).json({ error: 'Failed to check completion' });
  }
});

// Mark a workout as complete
router.post('/', async (req, res) => {
  try {
    const { user_id, schedule_id, completion_date, notes, exercises_completed } = req.body;
    
    console.log('📝 Marking workout complete:', { user_id, schedule_id, completion_date });
    
    if (!user_id || !schedule_id || !completion_date) {
      console.error('❌ Missing required fields:', { user_id, schedule_id, completion_date });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Upsert: insert or update if already exists
    const result = await pool.query(
      `INSERT INTO workout_completions 
        (user_id, schedule_id, completion_date, notes, exercises_completed)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, schedule_id, completion_date)
      DO UPDATE SET 
        notes = EXCLUDED.notes,
        exercises_completed = EXCLUDED.exercises_completed,
        completed_at = CURRENT_TIMESTAMP
      RETURNING *`,
      [user_id, schedule_id, completion_date, notes, JSON.stringify(exercises_completed)]
    );
    
    console.log('✅ Workout marked complete:', result.rows[0]);
    
    res.json({ 
      success: true,
      message: 'Workout marked as complete!',
      completion: result.rows[0]
    });
  } catch (error) {
    console.error('❌ Error marking workout complete:', error);
    res.status(500).json({ error: 'Failed to mark workout complete', details: error.message });
  }
});

// Update completion notes
router.put('/:completionId', async (req, res) => {
  try {
    const { completionId } = req.params;
    const { notes, exercises_completed } = req.body;
    
    const result = await pool.query(
      `UPDATE workout_completions 
      SET notes = $1, exercises_completed = $2
      WHERE id = $3
      RETURNING *`,
      [notes, JSON.stringify(exercises_completed), completionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Completion not found' });
    }
    
    res.json({ 
      success: true,
      completion: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating completion:', error);
    res.status(500).json({ error: 'Failed to update completion' });
  }
});

// Delete a completion (unmark as done)
router.delete('/:completionId', async (req, res) => {
  try {
    const { completionId } = req.params;
    
    const result = await pool.query(
      'DELETE FROM workout_completions WHERE id = $1 RETURNING *',
      [completionId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Completion not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Workout unmarked'
    });
  } catch (error) {
    console.error('Error deleting completion:', error);
    res.status(500).json({ error: 'Failed to delete completion' });
  }
});

module.exports = router;
