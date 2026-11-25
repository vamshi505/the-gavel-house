// Netlify Serverless Function: /.netlify/functions/ai
// Zero-setup Gemini AI proxy with in-memory IP rate-limiting (30 req / 10 min per IP)
// Set GEMINI_API_KEY (and optional GEMINI_API_KEY_2) in Netlify Site Environment Variables.

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_REQ = 30;
const ipHits = new Map();

const MODELS = [
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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const clientIp = (event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || 'anon').split(',')[0].trim();
  if (isRateLimited(clientIp)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Rate limit reached (30/10m). Try again shortly or add your own free key in Settings.' }) };
  }

  const keys = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter(Boolean);
  if (!keys.length) {
    return { statusCode: 503, headers, body: JSON.stringify({ error: 'Server GEMINI_API_KEY not configured on Netlify yet.' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const prompt = String(body.prompt || '').slice(0, 14000);
  const temperature = typeof body.temperature === 'number' ? body.temperature : 0.75;
  const grounded = Boolean(body.grounded);
  if (!prompt) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt' }) };
  }

  for (const key of keys) {
    for (const model of MODELS) {
      try {
        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: grounded ? { temperature } : { responseMimeType: 'application/json', temperature }
        };
        if (grounded) payload.tools = [{ google_search: {} }];

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          if (res.status === 429 || res.status === 401 || res.status === 403) break;
          continue;
        }
        const data = await res.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        let rawText = parts.filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('').trim();
        if (!rawText && parts.length) rawText = parts.map(p => p.text || '').join('').trim();
        rawText = rawText.replace(/^`{3}(?:json)?\s*/i, '').replace(/`{3}$/i, '').trim();
        let parsed = null;
        try { parsed = JSON.parse(rawText); } catch (e) {
          const m = rawText.match(/\{[\s\S]*\}/);
          if (m) parsed = JSON.parse(m[0]);
        }
        if (parsed && typeof parsed === 'object') {
          if (grounded) parsed._webGrounded = Boolean(data?.candidates?.[0]?.groundingMetadata);
          return { statusCode: 200, headers, body: JSON.stringify(parsed) };
        }
      } catch (e) {}
    }
  }

  return { statusCode: 502, headers, body: JSON.stringify({ error: 'Upstream Gemini models unavailable' }) };
};
