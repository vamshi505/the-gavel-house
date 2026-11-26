// Vercel Serverless Function: /api/ai
// Multi-Provider Free AI Failover Chain:
// Gemini (up to 6 keys) -> Groq -> Cerebras -> OpenRouter -> Mistral
// Add any combination of these in Vercel Project Settings -> Environment Variables:
// GEMINI_API_KEY (.._6), GROQ_API_KEY, CEREBRAS_API_KEY, OPENROUTER_API_KEY, MISTRAL_API_KEY

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQ = 45;
const ipHits = new Map();

const GEMINI_MODELS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-3.8'
];

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_WINDOW_MS;
  }
  entry.count++;
  ipHits.set(ip, entry);
  return entry.count > RATE_MAX_REQ;
}

function extractJSON(rawText) {
  if (!rawText) return null;
  const cleaned = String(rawText).replace(/^`{3}(?:json)?\s*/i, '').replace(/`{3}$/i, '').trim();
  try { return JSON.parse(cleaned); } catch (e) {}
  const m = cleaned.match(/\{[\s\S]*\}/);
  if (m) {
    try { return JSON.parse(m[0]); } catch (e) {}
  }
  return null;
}

async function callOpenAICompatible(url, apiKey, model, prompt, temperature, extraHeaders = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are an expert IPL Cricket Auction & Analytics AI. Always return ONLY valid JSON.' },
        { role: 'user', content: prompt }
      ],
      temperature
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  const rawText = data?.choices?.[0]?.message?.content || '';
  return extractJSON(rawText);
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const clientIp = (req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'anon').split(',')[0].trim();
  if (isRateLimited(clientIp)) {
    return res.status(429).json({ error: 'Rate limit reached. Smart Offline Engine active.' });
  }

  const body = (typeof req.body === 'string') ? JSON.parse(req.body || '{}') : (req.body || {});
  const prompt = String(body.prompt || '').slice(0, 14000);
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.75;
  const grounded = Boolean(body.grounded);
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  // 1. GEMINI (Up to 6 keys, round-robin)
  const allGemini = [
    process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2, process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4, process.env.GEMINI_API_KEY_5, process.env.GEMINI_API_KEY_6
  ].filter(Boolean);
  const startIdx = Math.floor(Math.random() * Math.max(1, allGemini.length));
  const geminiKeys = allGemini.length ? [...allGemini.slice(startIdx), ...allGemini.slice(0, startIdx)] : [];

  for (const key of geminiKeys) {
    for (const model of GEMINI_MODELS) {
      try {
        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: grounded ? { temperature } : { responseMimeType: 'application/json', temperature }
        };
        if (grounded) payload.tools = [{ google_search: {} }];
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!r.ok) {
          if (r.status === 429 || r.status === 401 || r.status === 403) break;
          continue;
        }
        const data = await r.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        let rawText = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('').trim();
        if (!rawText && parts.length) rawText = parts.map(p => p.text || '').join('').trim();
        const parsed = extractJSON(rawText);
        if (parsed && typeof parsed === 'object') {
          if (grounded) parsed._webGrounded = Boolean(data?.candidates?.[0]?.groundingMetadata);
          parsed._provider = 'gemini';
          return res.status(200).json(parsed);
        }
      } catch (e) {}
    }
  }

  // 2. GROQ (Ultra-fast free tier)
  if (process.env.GROQ_API_KEY) {
    for (const model of ['llama-3.3-70b-versatile', 'openai/gpt-oss-120b']) {
      try {
        const parsed = await callOpenAICompatible(
          'https://api.groq.com/openai/v1/chat/completions',
          process.env.GROQ_API_KEY, model, prompt, temperature
        );
        if (parsed) { parsed._provider = 'groq'; return res.status(200).json(parsed); }
      } catch (e) {}
    }
  }

  // 3. CEREBRAS (Optional)
  if (process.env.CEREBRAS_API_KEY) {
    for (const model of ['gpt-oss-120b', 'llama-3.3-70b']) {
      try {
        const parsed = await callOpenAICompatible(
          'https://api.cerebras.ai/v1/chat/completions',
          process.env.CEREBRAS_API_KEY, model, prompt, temperature
        );
        if (parsed) { parsed._provider = 'cerebras'; return res.status(200).json(parsed); }
      } catch (e) {}
    }
  }

  // 4. OPENROUTER (Free Models Router)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const parsed = await callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        process.env.OPENROUTER_API_KEY, 'openrouter/free', prompt, temperature,
        { 'HTTP-Referer': 'https://the-gavel-house.vercel.app', 'X-Title': 'The Gavel House' }
      );
      if (parsed) { parsed._provider = 'openrouter'; return res.status(200).json(parsed); }
    } catch (e) {}
  }

  // 5. MISTRAL (Free / Experiment tier)
  if (process.env.MISTRAL_API_KEY) {
    try {
      const parsed = await callOpenAICompatible(
        'https://api.mistral.ai/v1/chat/completions',
        process.env.MISTRAL_API_KEY, 'mistral-small-latest', prompt, temperature
      );
      if (parsed) { parsed._provider = 'mistral'; return res.status(200).json(parsed); }
    } catch (e) {}
  }

  return res.status(502).json({ error: 'All configured AI providers busy — using Smart Offline Engine' });
};
