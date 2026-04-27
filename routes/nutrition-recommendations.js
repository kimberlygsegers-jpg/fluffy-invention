const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Get nutrition recommendations based on today's training
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;
    
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dayOfWeek = new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Get today's schedule
    const scheduleQuery = `
      SELECT * FROM training_schedules
      WHERE user_id = $1 AND day_of_week = $2
    `;
    
    const scheduleResult = await pool.query(scheduleQuery, [userId, dayOfWeek]);
    
    const hasTraining = scheduleResult.rows.length > 0;
    const workout = hasTraining ? scheduleResult.rows[0] : null;
    
    // Determine workout intensity
    let recommendations = {
      hasTraining,
      workoutType: workout?.workout_type || 'Rest Day',
      calories: { min: 1800, max: 2200 },
      protein: { min: 1.6, max: 2.2 }, // g per kg body weight
      carbs: { min: 2, max: 3 },
      fats: { min: 0.8, max: 1.0 },
      timing: {},
      meals: []
    };

    if (hasTraining) {
      const workoutType = workout.workout_type.toLowerCase();
      
      // Strength training day
      if (workoutType.includes('strength') || workoutType.includes('push') || workoutType.includes('pull') || workoutType.includes('leg')) {
        recommendations.calories = { min: 2200, max: 2800 };
        recommendations.protein = { min: 2.0, max: 2.5 };
        recommendations.carbs = { min: 3, max: 5 };
        
        recommendations.timing = {
          preworkout: '1-2 hours before: Complex carbs + protein (oatmeal with protein powder)',
          postworkout: 'Within 30 min: Fast protein + simple carbs (protein shake + banana)'
        };
        
        recommendations.meals = [
          { meal: 'Breakfast', suggestion: 'Oatmeal (80g) with protein powder (30g), berries, and nuts', calories: 450, protein: 35, carbs: 60, fats: 12 },
          { meal: 'Pre-Workout Snack', suggestion: 'Banana with almond butter', calories: 200, protein: 5, carbs: 30, fats: 8 },
          { meal: 'Post-Workout', suggestion: 'Protein shake (40g) with 2 bananas', calories: 350, protein: 42, carbs: 50, fats: 3 },
          { meal: 'Lunch', suggestion: 'Grilled chicken (200g), brown rice (150g), vegetables', calories: 550, protein: 45, carbs: 65, fats: 10 },
          { meal: 'Dinner', suggestion: 'Salmon (180g), sweet potato (200g), broccoli', calories: 600, protein: 42, carbs: 55, fats: 20 },
          { meal: 'Evening Snack', suggestion: 'Greek yogurt (200g) with berries', calories: 180, protein: 20, carbs: 15, fats: 5 }
        ];
      }
      // Cardio day
      else if (workoutType.includes('cardio') || workoutType.includes('running') || workoutType.includes('cycling') || workoutType.includes('hiit')) {
        recommendations.calories = { min: 2000, max: 2600 };
        recommendations.protein = { min: 1.6, max: 2.0 };
        recommendations.carbs = { min: 4, max: 6 };
        
        recommendations.timing = {
          preworkout: '1-2 hours before: High carbs, moderate protein (pasta with lean meat)',
          postworkout: 'Within 30-60 min: Carbs to replenish glycogen (fruit + protein shake)'
        };
        
        recommendations.meals = [
          { meal: 'Breakfast', suggestion: 'Whole grain toast (2 slices), eggs (3), avocado', calories: 500, protein: 25, carbs: 50, fats: 22 },
          { meal: 'Pre-Workout Snack', suggestion: 'Energy bar + dates', calories: 250, protein: 8, carbs: 45, fats: 6 },
          { meal: 'Post-Workout', suggestion: 'Smoothie: banana, berries, protein powder, oats', calories: 400, protein: 30, carbs: 55, fats: 8 },
          { meal: 'Lunch', suggestion: 'Turkey wrap with vegetables and quinoa', calories: 550, protein: 35, carbs: 65, fats: 15 },
          { meal: 'Dinner', suggestion: 'Lean beef (150g), pasta (150g), vegetables', calories: 650, protein: 40, carbs: 75, fats: 18 },
          { meal: 'Evening Snack', suggestion: 'Cottage cheese with fruit', calories: 180, protein: 18, carbs: 20, fats: 3 }
        ];
      }
      // Recovery day
      else {
        recommendations.calories = { min: 1800, max: 2200 };
        recommendations.carbs = { min: 2, max: 3 };
        
        recommendations.timing = {
          general: 'Focus on anti-inflammatory foods and adequate protein for recovery'
        };
        
        recommendations.meals = [
          { meal: 'Breakfast', suggestion: 'Greek yogurt bowl with granola and berries', calories: 400, protein: 25, carbs: 45, fats: 12 },
          { meal: 'Mid-Morning', suggestion: 'Handful of almonds and an apple', calories: 200, protein: 6, carbs: 25, fats: 10 },
          { meal: 'Lunch', suggestion: 'Grilled chicken salad with quinoa', calories: 500, protein: 40, carbs: 40, fats: 18 },
          { meal: 'Snack', suggestion: 'Hummus with vegetable sticks', calories: 180, protein: 8, carbs: 20, fats: 8 },
          { meal: 'Dinner', suggestion: 'Baked fish with roasted vegetables', calories: 450, protein: 38, carbs: 30, fats: 20 },
          { meal: 'Evening', suggestion: 'Herbal tea with a small piece of dark chocolate', calories: 100, protein: 2, carbs: 12, fats: 6 }
        ];
      }
    } else {
      // Rest day
      recommendations.timing = {
        general: 'Maintain protein intake, reduce carbs slightly. Focus on recovery nutrition.'
      };
      
      recommendations.meals = [
        { meal: 'Breakfast', suggestion: 'Scrambled eggs (3) with spinach and avocado', calories: 400, protein: 24, carbs: 12, fats: 28 },
        { meal: 'Mid-Morning', suggestion: 'Greek yogurt with berries', calories: 180, protein: 20, carbs: 15, fats: 5 },
        { meal: 'Lunch', suggestion: 'Chicken breast salad with olive oil dressing', calories: 450, protein: 42, carbs: 15, fats: 25 },
        { meal: 'Snack', suggestion: 'Protein shake with almond milk', calories: 200, protein: 25, carbs: 10, fats: 6 },
        { meal: 'Dinner', suggestion: 'Grilled salmon with vegetables', calories: 500, protein: 40, carbs: 20, fats: 30 },
        { meal: 'Evening', suggestion: 'Casein protein pudding', calories: 150, protein: 25, carbs: 8, fats: 3 }
      ];
    }

    // Calculate totals
    const totals = recommendations.meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fats: acc.fats + meal.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    recommendations.dailyTotals = totals;

    res.json(recommendations);

  } catch (error) {
    console.error('Error generating nutrition recommendations:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;
