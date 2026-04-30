const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { 
  calculateVDOT, 
  calculateTrainingPaces, 
  generateTrainingPlan, 
  secondsToInterval 
} = require('../utils/trainingPlanAlgorithm');

// Get all training plans for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM training_plans 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    
    res.json({ plans: result.rows });
  } catch (error) {
    console.error('Error fetching training plans:', error);
    res.status(500).json({ error: 'Failed to fetch training plans' });
  }
});

// Get specific training plan with all workouts
router.get('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    
    // Get plan details
    const planResult = await pool.query(
      'SELECT * FROM training_plans WHERE id = $1',
      [planId]
    );
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Training plan not found' });
    }
    
    // Get all workouts for this plan
    const workoutsResult = await pool.query(
      `SELECT * FROM planned_workouts 
       WHERE plan_id = $1 
       ORDER BY workout_date ASC`,
      [planId]
    );
    
    // Get training zones
    const zonesResult = await pool.query(
      'SELECT * FROM training_zones WHERE plan_id = $1',
      [planId]
    );
    
    res.json({
      plan: planResult.rows[0],
      workouts: workoutsResult.rows,
      zones: zonesResult.rows
    });
  } catch (error) {
    console.error('Error fetching training plan:', error);
    res.status(500).json({ error: 'Failed to fetch training plan' });
  }
});

// Get fitness tests for a user
router.get('/fitness-tests/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM user_fitness_tests 
       WHERE user_id = $1 
       ORDER BY test_date DESC`,
      [userId]
    );
    
    res.json({ tests: result.rows });
  } catch (error) {
    console.error('Error fetching fitness tests:', error);
    res.status(500).json({ error: 'Failed to fetch fitness tests' });
  }
});

// Add a fitness test
router.post('/fitness-tests', async (req, res) => {
  try {
    const { user_id, test_date, test_distance, test_time, notes } = req.body;
    
    // Convert time string (HH:MM:SS) to seconds for VDOT calculation
    const timeParts = test_time.split(':').map(Number);
    const timeInSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
    
    // Calculate VDOT
    const vdot = calculateVDOT(test_distance, timeInSeconds);
    
    const result = await pool.query(
      `INSERT INTO user_fitness_tests 
        (user_id, test_date, test_distance, test_time, estimated_vdot, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, test_date, test_distance, test_time, vdot.toFixed(2), notes]
    );
    
    res.json({
      success: true,
      test: result.rows[0],
      message: 'Fitness test added successfully!'
    });
  } catch (error) {
    console.error('Error adding fitness test:', error);
    res.status(500).json({ error: 'Failed to add fitness test' });
  }
});

// Generate and save a new training plan
router.post('/generate', async (req, res) => {
  try {
    const {
      user_id,
      plan_name,
      goal_race_distance,
      goal_race_date,
      goal_time,
      current_vdot,
      plan_start_date,
      training_days_per_week,
      current_weekly_mileage
    } = req.body;
    
    console.log('🏃 Generating training plan:', {
      user_id,
      plan_name,
      goal_race_distance,
      training_days_per_week
    });
    
    // Generate the training plan using the algorithm
    const planData = generateTrainingPlan({
      currentVDOT: parseFloat(current_vdot),
      goalRaceDate: goal_race_date,
      planStartDate: plan_start_date,
      currentWeeklyMileage: parseFloat(current_weekly_mileage),
      trainingDaysPerWeek: parseInt(training_days_per_week),
      goalRaceDistance: parseFloat(goal_race_distance)
    });
    
    // Calculate plan end date (1 day before race)
    const endDate = new Date(goal_race_date);
    endDate.setDate(endDate.getDate() - 1);
    
    // Insert training plan
    const planResult = await pool.query(
      `INSERT INTO training_plans 
        (user_id, plan_name, goal_race_distance, goal_race_date, goal_time, 
         current_vdot, plan_start_date, plan_end_date, training_days_per_week, 
         current_weekly_mileage, target_weekly_mileage)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        user_id,
        plan_name,
        goal_race_distance,
        goal_race_date,
        goal_time,
        current_vdot,
        plan_start_date,
        endDate.toISOString().split('T')[0],
        training_days_per_week,
        current_weekly_mileage,
        planData.summary.peakMileage
      ]
    );
    
    const planId = planResult.rows[0].id;
    
    // Insert training zones
    const paces = calculateTrainingPaces(parseFloat(current_vdot));
    const zones = [
      { name: 'easy', pace: secondsToInterval(paces.easy), description: 'Comfortable, conversational pace' },
      { name: 'tempo', pace: secondsToInterval(paces.tempo), description: 'Comfortably hard, controlled effort' },
      { name: 'threshold', pace: secondsToInterval(paces.threshold), description: 'Hard but sustainable pace' },
      { name: 'interval', pace: secondsToInterval(paces.interval), description: 'Very hard effort, short repeats' },
      { name: 'repetition', pace: secondsToInterval(paces.repetition), description: 'Near maximum effort, very short repeats' }
    ];
    
    for (const zone of zones) {
      await pool.query(
        `INSERT INTO training_zones (plan_id, zone_name, pace_per_km, description)
         VALUES ($1, $2, $3, $4)`,
        [planId, zone.name, zone.pace, zone.description]
      );
    }
    
    // Insert planned workouts
    for (const week of planData.schedule) {
      let dayOffset = 0;
      for (const workout of week.workouts) {
        const workoutDate = new Date(week.weekStartDate);
        workoutDate.setDate(workoutDate.getDate() + dayOffset);
        
        await pool.query(
          `INSERT INTO planned_workouts 
            (plan_id, workout_date, week_number, workout_type, distance, target_pace,
             warmup_distance, cooldown_distance, intervals_json, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            planId,
            workoutDate.toISOString().split('T')[0],
            week.weekNumber,
            workout.type,
            workout.distance || 0,
            workout.pace || null,
            workout.warmup || 0,
            workout.cooldown || 0,
            workout.intervals ? JSON.stringify(workout.intervals) : null,
            workout.description
          ]
        );
        
        dayOffset++;
      }
    }
    
    console.log('✅ Training plan generated successfully!');
    
    res.json({
      success: true,
      plan: planResult.rows[0],
      summary: planData.summary,
      message: `${planData.summary.totalWeeks}-week training plan created successfully!`
    });
  } catch (error) {
    console.error('❌ Error generating training plan:', error);
    res.status(500).json({ 
      error: 'Failed to generate training plan',
      details: error.message 
    });
  }
});

// Update workout completion
router.put('/workouts/:workoutId/complete', async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { 
      actual_distance, 
      actual_duration, 
      actual_pace, 
      perceived_effort, 
      notes 
    } = req.body;
    
    const result = await pool.query(
      `UPDATE planned_workouts 
       SET completed = true,
           actual_distance = $1,
           actual_duration = $2,
           actual_pace = $3,
           perceived_effort = $4,
           notes = $5,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [actual_distance, actual_duration, actual_pace, perceived_effort, notes, workoutId]
    );
    
    res.json({
      success: true,
      workout: result.rows[0],
      message: 'Workout completed!'
    });
  } catch (error) {
    console.error('Error completing workout:', error);
    res.status(500).json({ error: 'Failed to complete workout' });
  }
});

// Get workouts for a specific date range
router.get('/workouts/:userId/range', async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    const result = await pool.query(
      `SELECT pw.*, tp.plan_name 
       FROM planned_workouts pw
       JOIN training_plans tp ON pw.plan_id = tp.id
       WHERE tp.user_id = $1 
         AND pw.workout_date >= $2 
         AND pw.workout_date <= $3
       ORDER BY pw.workout_date ASC`,
      [userId, startDate, endDate]
    );
    
    res.json({ workouts: result.rows });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// Delete a training plan
router.delete('/:planId', async (req, res) => {
  try {
    const { planId } = req.params;
    
    await pool.query('DELETE FROM training_plans WHERE id = $1', [planId]);
    
    res.json({
      success: true,
      message: 'Training plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training plan:', error);
    res.status(500).json({ error: 'Failed to delete training plan' });
  }
});

module.exports = router;
