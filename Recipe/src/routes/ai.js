const express = require('express');

const router = express.Router();

function buildPrompt(ingredients) {
  const list = ingredients.map((item, index) => `${index + 1}. ${item}`).join('\n');
  return [
    'Analyze the healthiness of this recipe based on the ingredients provided.',
    'Return a short JSON object with the following keys:',
    'summary: one sentence overview of overall nutrition quality.',
    'score: number from 0-100 where higher is healthier.',
    'concerns: array of specific nutrition issues.',
    'suggestions: array of improvement ideas with brief explanations.',
    `Ingredients:\n${list}`
  ].join('\n');
}

async function callOpenAI(prompt) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      summary: 'Unable to contact AI service. Returning sample feedback for development use only.',
      score: 45,
      concerns: [
        'High saturated fat from bacon and heavy cream.',
        'Limited fiber due to refined pasta.'
      ],
      suggestions: [
        'Swap in whole wheat pasta to add fiber.',
        'Use turkey bacon and reduce the amount of cream by replacing half with Greek yogurt.'
      ]
    };
  }

  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is not available in this environment.');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a nutritionist that only replies with valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI request failed: ${response.status} ${errorText}`);
  }

  const payload = await response.json();
  const message = payload && payload.choices && payload.choices[0] && payload.choices[0].message;
  const content = message && message.content ? message.content.trim() : '';

  if (!content) {
    throw new Error('AI response was empty.');
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error('AI response was not valid JSON.');
  }
}

router.post('/ai/analyze-31477046', async (req, res, next) => {
  try {
    const ingredients = Array.isArray(req.body?.ingredients)
      ? req.body.ingredients
          .map((item) => {
            if (typeof item === 'string') {
              return item.trim();
            }
            if (item && typeof item === 'object') {
              const name = typeof item.name === 'string' ? item.name : item.ingredientName;
              const quantity = item.quantity ? `${item.quantity}` : '';
              const unit = typeof item.unit === 'string' ? item.unit : '';
              return [quantity, unit, name].filter(Boolean).join(' ').trim();
            }
            return '';
          })
          .filter((value) => value)
      : [];

    if (!ingredients.length) {
      return res.status(400).json({
        error: 'validation_failed',
        message: 'Ingredients are required for analysis.'
      });
    }

    const prompt = buildPrompt(ingredients);
    const analysis = await callOpenAI(prompt);

    res.json({ analysis });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
