/**
 * Groq proxy, Vercel serverless function.
 *
 * Same job as worker/src/index.js, for Vercel instead of Cloudflare. Use one or
 * the other, not both.
 *
 * The site is static and public, so it cannot hold a secret. This function is
 * the only thing that ever sees GROQ_API_KEY. The browser calls /api/chat; this
 * calls Groq. The key never reaches the client.
 *
 * Set the key in the Vercel dashboard under Settings > Environment Variables.
 * Never put it in this file or anywhere else in the repo.
 */

// Same-origin on Vercel, so no CORS allowlist is needed for the site itself.
// These cover local preview against the deployed function.
const ALLOWED_ORIGINS = ['http://localhost:8000', 'http://127.0.0.1:8000'];

// Pinned server-side. If the client chose the model, a scraper could request
// the most expensive one available.
const MODEL = 'llama-3.3-70b-versatile';
const MAX_TOKENS = 500;
const MAX_CHARS = 2000;

const SYSTEM_PROMPT = [
  'You answer questions about Maidan Athletic Club, a gym at 20, 3rd Floor,',
  'Dodda Banaswadi Main Rd, Banaswadi, Bengaluru 560043. Phone 077603 44646.',
  'Open Mon to Sat 06:00-22:00 and Sun 10:00-18:00.',
  'Answer only about the gym: classes, memberships, trainers, hours, location.',
  'If you do not know something, say so and give the phone number.',
  'Never invent prices, offers, or facts about the gym.',
].join(' ');

export default async function handler(req, res) {
  const origin = req.headers.origin;

  // Requests from the site itself carry no Origin (same-origin), so only
  // cross-origin callers are checked against the allowlist.
  if (origin) {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return res.status(403).json({ error: 'Origin not allowed' });
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  // Fail loudly in logs if the env var was never set, tell the client nothing.
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in the Vercel project settings.');
    return res.status(500).json({ error: 'Server not configured' });
  }

  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'message is required' });
  if (message.length > MAX_CHARS) return res.status(413).json({ error: 'message too long' });

  let upstream;
  try {
    upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
      }),
    });
  } catch (err) {
    console.error('Groq request failed:', err);
    return res.status(502).json({ error: 'Upstream unavailable' });
  }

  if (!upstream.ok) {
    // Log the detail, return none. Upstream errors can echo request context.
    console.error('Groq returned', upstream.status, await upstream.text());
    return res.status(502).json({ error: 'Upstream error' });
  }

  const data = await upstream.json();

  // Return only the text. Never pass the raw upstream payload through.
  return res.status(200).json({ reply: data?.choices?.[0]?.message?.content ?? '' });
}
