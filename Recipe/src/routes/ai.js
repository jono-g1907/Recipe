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

async function callGemini(prompt) {
  const apiKey = process.env.GOOGLE_API_KEY;

  // Local dev fallback when no key present
  if (!apiKey) {
    return {
      summary: 'Unable to contact AI service. Returning sample feedback for development use only.',
      score: 45,
      concerns: ['High saturated fat from bacon and heavy cream.', 'Limited fiber due to refined pasta.'],
      suggestions: [
        'Swap in whole wheat pasta to add fiber.',
        'Use turkey bacon and replace half the cream with Greek yogurt.'
      ]
    };
  }

  if (typeof fetch !== 'function') {
    throw new Error('Fetch API is not available in this environment.');
  }

  const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const REQUEST_TIMEOUT_MS = parseInt(process.env.AI_REQUEST_TIMEOUT_MS || '12000', 10);
  const MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES || '4', 10);
  const BACKOFF_BASE_MS = parseInt(process.env.AI_BACKOFF_BASE_MS || '300', 10);
  const BACKOFF_MAX_MS = parseInt(process.env.AI_BACKOFF_MAX_MS || '4000', 10);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  function sleep(ms) { return new Promise(res => setTimeout(res, ms)); }

  function parseIngredientsFromPrompt(p) {
    // Extract lines after "Ingredients:" and strip "1. ", "2. ", etc.
    const out = [];
    const idx = p.indexOf('Ingredients:');
    if (idx >= 0) {
      const lines = p.slice(idx).split('\n').slice(1);
      for (const line of lines) {
        const m = line.trim().match(/^\d+\.\s*(.+)$/);
        if (m && m[1]) out.push(m[1].trim());
      }
    }
    return out;
  }

  function localHeuristicAnalysis(p) {
    const items = parseIngredientsFromPrompt(p);
    const text = items.join(' ').toLowerCase();

    const bad = ['bacon','cream','butter','sugar','syrup','shortening','lard','processed','deep fried','salt','sodium','sausage','palm oil'];
    const good = ['broccoli','spinach','kale','oat','whole','brown rice','lentil','bean','legume','olive oil','tomato','carrot','berry','nuts','seeds','yogurt','fish'];

    let score = 60;
    let concerns = [];
    let suggestions = [];

    for (const k of bad) {
      if (text.includes(k)) { score -= 7; concerns.push(`Contains ${k}`); }
    }
    for (const k of good) {
      if (text.includes(k)) { score += 5; suggestions.push(`Good: includes ${k}`); }
    }
    score = Math.max(0, Math.min(100, score));

    // A few constructive suggestions
    if (!/whole/.test(text)) suggestions.push('Consider whole-grain swaps for more fiber.');
    if (!/vegetable|broccoli|spinach|kale|tomato|carrot/.test(text)) suggestions.push('Add a serve of vegetables.');
    if (/cream|butter/.test(text)) suggestions.push('Reduce saturated fat (e.g., yogurt or olive-oil based alternatives).');

    // De-duplicate and trim
    concerns = Array.from(new Set(concerns)).slice(0, 6);
    suggestions = Array.from(new Set(suggestions)).slice(0, 6);

    return {
      summary: 'Heuristic estimate due to temporary AI unavailability.',
      score,
      concerns,
      suggestions
    };
  }

  async function sendRequest(body) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP_${res.status}: ${text}`);
      return JSON.parse(text);
    } finally {
      clearTimeout(timer);
    }
  }

  async function sendWithRetry(body) {
    let attempt = 0;
    let lastErr;

    while (attempt <= MAX_RETRIES) {
      try {
        return await sendRequest(body);
      } catch (err) {
        const msg = String(err.message || '');
        const retriable =
          /UNAVAILABLE|OVERLOADED|RESOURCE_EXHAUSTED|timeout|ETIMEDOUT|ECONNRESET|HTTP_429|HTTP_5\d\d/i.test(msg);

        if (!retriable || attempt === MAX_RETRIES) {
          lastErr = err;
          break;
        }

        const backoff = Math.min(
          BACKOFF_BASE_MS * (2 ** attempt) + Math.floor(Math.random() * 250),
          BACKOFF_MAX_MS
        );
        await sleep(backoff);
        attempt++;
      }
    }

    throw lastErr;
  }

  const baseBody = {
    contents: [{
      role: 'user',
      parts: [{ text: ['You are a nutritionist that only replies with valid JSON.', prompt].join('\n\n') }]
    }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json'
    }
  };

  const withSchema = {
    ...baseBody,
    generationConfig: {
      ...baseBody.generationConfig,
      // Minimal supported schema (no additionalProperties)
      responseSchema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          score: { type: 'number' },
          concerns: { type: 'array', items: { type: 'string' } },
          suggestions: { type: 'array', items: { type: 'string' } }
        },
        required: ['summary', 'score', 'concerns', 'suggestions']
      }
    }
  };

  try {
    // Try schema first (better structure), fall back to no-schema if the API rejects it
    let payload;
    try {
      payload = await sendWithRetry(withSchema);
    } catch (err) {
      const msg = String(err.message || '');
      if (/response_schema|INVALID_ARGUMENT/i.test(msg)) {
        payload = await sendWithRetry(baseBody);
      } else {
        throw err;
      }
    }

    const content = payload?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!content) throw new Error('AI response was empty.');
    try {
      return JSON.parse(content);
    } catch {
      throw new Error('AI response was not valid JSON.');
    }
  } catch (err) {
    // Graceful degradation on persistent 503/5xx/429/timeouts
    const msg = String(err.message || '');
    if (/UNAVAILABLE|OVERLOADED|RESOURCE_EXHAUSTED|timeout|ETIMEDOUT|ECONNRESET|HTTP_429|HTTP_5\d\d/i.test(msg)) {
      return localHeuristicAnalysis(prompt);
    }
    // Non-retriable errors: surface to your error middleware
    throw err;
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
    const analysis = await callGemini(prompt);

    res.json({ analysis });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
