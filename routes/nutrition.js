const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Log nutrition entry
router.post('/', async (req, res) => {
  try {
    const { user_id, meal_type, food_item, calories, protein_g, carbs_g, fats_g, notes, meal_date } = req.body;

    if (!user_id || !meal_type || !food_item) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
      INSERT INTO nutrition_logs (user_id, meal_type, food_item, calories, protein, carbs, fats, notes, meal_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      user_id,
      meal_type,
      food_item,
      calories || null,
      protein_g || null,
      carbs_g || null,
      fats_g || null,
      notes || null,
      meal_date || new Date()
    ];

    const result = await pool.query(query, values);

    res.json({
      success: true,
      nutrition: result.rows[0]
    });

  } catch (error) {
    console.error('Error logging nutrition:', error);
    res.status(500).json({ error: 'Failed to log nutrition' });
  }
});

// Get daily nutrition summary
router.get('/daily/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const query = `
      SELECT 
        meal_type,
        SUM(calories) as total_calories,
        SUM(protein) as total_protein,
        SUM(carbs) as total_carbs,
        SUM(fats) as total_fats,
        COUNT(*) as meal_count,
        array_agg(json_build_object(
          'food_item', food_item,
          'calories', calories,
          'protein', protein,
          'carbs', carbs,
          'fats', fats,
          'notes', notes,
          'meal_date', meal_date
        )) as meals
      FROM nutrition_logs
      WHERE user_id = $1 AND meal_date >= $2 AND meal_date <= $3
      GROUP BY meal_type
      ORDER BY 
        CASE meal_type
          WHEN 'breakfast' THEN 1
          WHEN 'lunch' THEN 2
          WHEN 'dinner' THEN 3
          WHEN 'snack' THEN 4
          ELSE 5
        END
    `;

    const result = await pool.query(query, [userId, startOfDay, endOfDay]);

    // Calculate daily totals
    const dailyTotals = result.rows.reduce((acc, meal) => ({
      calories: (acc.calories || 0) + (parseFloat(meal.total_calories) || 0),
      protein: (acc.protein || 0) + (parseFloat(meal.total_protein) || 0),
      carbs: (acc.carbs || 0) + (parseFloat(meal.total_carbs) || 0),
      fats: (acc.fats || 0) + (parseFloat(meal.total_fats) || 0),
    }), {});

    res.json({
      date: targetDate.toISOString().split('T')[0],
      meals: result.rows,
      dailyTotals
    });

  } catch (error) {
    console.error('Error fetching daily nutrition:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition data' });
  }
});

// Get nutrition history
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;

    const query = `
      SELECT * FROM nutrition_logs
      WHERE user_id = $1
      ORDER BY meal_date DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [userId, limit]);

    res.json({ nutritionLogs: result.rows });

  } catch (error) {
    console.error('Error fetching nutrition history:', error);
    res.status(500).json({ error: 'Failed to fetch nutrition history' });
  }
});

module.exports = router;
