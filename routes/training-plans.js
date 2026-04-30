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

// Get all training plans for a user (alias for /:userId)
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if it's a numeric user ID
    if (!/^\d+$/.test(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const planResult = await pool.query(
      `SELECT * FROM training_plans 
       WHERE user_id = $1 
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );
    
    if (planResult.rows.length === 0) {
      return res.json({ plans: [] });
    }
    
    const plan = planResult.rows[0];
    
    // Get workouts for this plan
    const workoutsResult = await pool.query(
      `SELECT * FROM daily_workouts 
       WHERE plan_id = $1 
       ORDER BY workout_date ASC`,
      [plan.id]
    );
    
    // Return plan with schedule
    res.json({ 
      plans: [{
        ...plan,
        schedule: workoutsResult.rows
      }]
    });
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

// Create a new training plan (simplified endpoint)
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      goal_race_distance,
      goal_race_date,
      goal_time,
      current_weekly_mileage,
      training_days_per_week,
      experience_level,
      recent_race_distance,
      recent_race_time
    } = req.body;
    
    console.log('🏃 Creating training plan:', req.body);
    
    // Calculate VDOT from recent race if provided, otherwise estimate
    let vdot;
    if (recent_race_distance && recent_race_time) {
      vdot = calculateVDOT(recent_race_distance, recent_race_time);
      console.log(`📊 Calculated VDOT from recent race: ${vdot.toFixed(1)}`);
    } else {
      // Estimate VDOT based on experience level
      const vdotEstimates = {
        beginner: 35,
        intermediate: 45,
        advanced: 55
      };
      vdot = vdotEstimates[experience_level] || 45;
      console.log(`📊 Estimated VDOT from experience level: ${vdot}`);
    }
    
    // Set plan start date to tomorrow
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const planStartDate = startDate.toISOString().split('T')[0];
    
    // Calculate plan duration in weeks
    const raceDate = new Date(goal_race_date);
    const weeksToRace = Math.floor((raceDate - startDate) / (7 * 24 * 60 * 60 * 1000));
    
    if (weeksToRace < 4) {
      return res.status(400).json({ 
        error: 'Race date must be at least 4 weeks away' 
      });
    }
    
    // Generate plan name
    const distanceNames = {
      5: '5K',
      10: '10K',
      21.1: 'Half Marathon',
      42.2: 'Marathon'
    };
    const planName = `${distanceNames[goal_race_distance] || goal_race_distance + 'K'} Training Plan`;
    
    // Generate the training plan using the algorithm
    const planData = generateTrainingPlan({
      currentVDOT: vdot,
      goalRaceDate: goal_race_date,
      planStartDate: planStartDate,
      currentWeeklyMileage: current_weekly_mileage || 20,
      trainingDaysPerWeek: training_days_per_week,
      goalRaceDistance: goal_race_distance
    });
    
    console.log(`📅 Generated ${planData.schedule.length} weeks of training`);
    
    // Calculate plan end date (1 day before race)
    const endDate = new Date(goal_race_date);
    endDate.setDate(endDate.getDate() - 1);
    
    // Calculate predicted race time if goal time provided
    let predictedTime = null;
    if (goal_time) {
      predictedTime = goal_time; // For now, use goal time as predicted
    } else if (vdot) {
      // Estimate race time from VDOT (simplified)
      const paces = calculateTrainingPaces(vdot);
      predictedTime = Math.round(goal_race_distance * paces.threshold);
    }
    
    // Insert training plan
    const planResult = await pool.query(
      `INSERT INTO training_plans 
        (user_id, plan_name, goal_race_distance, goal_race_date, goal_time, 
         current_vdot, plan_start_date, plan_duration_weeks, training_days_per_week, 
         predicted_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        user_id,
        planName,
        goal_race_distance,
        goal_race_date,
        goal_time,
        vdot.toFixed(2),
        planStartDate,
        planData.schedule.length,
        training_days_per_week,
        predictedTime
      ]
    );
    
    const planId = planResult.rows[0].id;
    console.log(`✅ Created plan with ID: ${planId}`);
    
    // Insert training zones
    const paces = calculateTrainingPaces(vdot);
    const zones = [
      { name: 'easy', pace: paces.easy, description: 'Comfortable, conversational pace' },
      { name: 'tempo', pace: paces.tempo, description: 'Comfortably hard, controlled effort' },
      { name: 'threshold', pace: paces.threshold, description: 'Hard but sustainable pace' },
      { name: 'interval', pace: paces.interval, description: 'Very hard effort, short repeats' },
      { name: 'repetition', pace: paces.repetition, description: 'Near maximum effort, very short repeats' }
    ];
    
    for (const zone of zones) {
      await pool.query(
        `INSERT INTO training_zones (plan_id, zone_name, pace_per_km, description)
         VALUES ($1, $2, $3, $4)`,
        [planId, zone.name, secondsToInterval(zone.pace), zone.description]
      );
    }
    
    // Insert planned workouts
    for (const week of planData.schedule) {
      for (const workout of week.workouts) {
        await pool.query(
          `INSERT INTO daily_workouts 
            (plan_id, workout_date, week_number, day_of_week, workout_type, distance, 
             target_pace, warmup_distance, cooldown_distance, intervals_json, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            planId,
            workout.date,
            week.weekNumber,
            workout.dayOfWeek,
            workout.type,
            workout.distance || 0,
            workout.pace ? secondsToInterval(workout.pace) : null,
            workout.warmup || 0,
            workout.cooldown || 0,
            workout.intervals ? JSON.stringify(workout.intervals) : null,
            workout.description || ''
          ]
        );
      }
    }
    
    // Get the complete plan with workouts to return
    const workoutsResult = await pool.query(
      `SELECT * FROM daily_workouts 
       WHERE plan_id = $1 
       ORDER BY workout_date ASC`,
      [planId]
    );
    
    console.log('✅ Training plan created successfully!');
    
    res.json({
      success: true,
      plan: planResult.rows[0],
      schedule: workoutsResult.rows,
      message: `${planData.schedule.length}-week training plan created successfully!`
    });
  } catch (error) {
    console.error('❌ Error creating training plan:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create training plan',
      details: error.message 
    });
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
