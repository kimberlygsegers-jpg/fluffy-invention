const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Chat with AI for food consultation and general fitness advice
router.post('/', async (req, res) => {
  try {
    const { message, userId, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Check if OpenAI is configured
    if (!openai) {
      return res.status(503).json({ 
        error: 'AI chat is currently unavailable. Please add your OpenAI API key to enable this feature.' 
      });
    }

    // Build conversation context
    const messages = [
      {
        role: 'system',
        content: `You are a knowledgeable sports nutrition and fitness coach. You help users with:
- Nutritional advice and meal planning
- Workout recommendations
- Recovery strategies
- Progressive overload planning for strength training
- Cardio training advice for cycling, swimming, and running
Be conversational, supportive, and provide actionable advice. When users mention food, provide nutritional insights and recommendations.`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini (fast, affordable, available to all API tiers)
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Handle quota exceeded error specifically
    if (error.code === 'insufficient_quota') {
      return res.json({
        response: "🤖 AI Chat is currently unavailable (quota exceeded). However, you can still use all other features:\n\n✅ Log workouts (Strength & Cardio tabs)\n✅ Track nutrition (Nutrition tab)\n✅ Set weekly schedule (Schedule tab)\n✅ View progress (Progress tab)\n\nTo enable AI chat:\n1. Visit https://platform.openai.com/account/billing\n2. Add credits to your OpenAI account\n3. Or get a new API key with available credits",
        timestamp: new Date().toISOString(),
        isError: true
      });
    }
    
    // Handle other errors
    res.status(500).json({ 
      error: 'Failed to get AI response', 
      details: error.message,
      suggestion: 'The rest of the app still works! Try logging a workout or tracking nutrition.'
    });
  }
});

module.exports = router;
