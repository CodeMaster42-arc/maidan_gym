/**
 * Groq proxy for the Maidan site.
 *
 * The site is static and public, so it cannot hold a secret. This Worker is the
 * only thing that ever sees GROQ_API_KEY. The browser calls this Worker; this
 * Worker calls Groq. The key never crosses to the client.
 *
 * The key is set with `wrangler secret put GROQ_API_KEY` and lives in
 * Cloudflare's secret store. It is never in this file, in wrangler.toml, or in
 * the repo.
 */

// Only these origins may call the Worker. Without this, anyone can point their
// own site at your Worker and spend your Groq credit.
const ALLOWED_ORIGINS = [
  'https://codemaster42-arc.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000',
];

// Pinned server-side on purpose. If the client picked the model, a scraper
// could request the most expensive one available.
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

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = ALLOWED_ORIGINS.includes(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowed ? origin : ALLOWED_ORIGINS[0]),
      });
    }

    if (!allowed) return json({ error: 'Origin not allowed' }, 403, ALLOWED_ORIGINS[0]);
    if (request.method !== 'POST') return json({ error: 'POST only' }, 405, origin);

    // Fail loudly in logs if the secret was never set, but tell the client nothing.
    if (!env.GROQ_API_KEY) {
      console.error('GROQ_API_KEY is not set. Run: wrangler secret put GROQ_API_KEY');
      return json({ error: 'Server not configured' }, 500, origin);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON' }, 400, origin);
    }

    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) return json({ error: 'message is required' }, 400, origin);
    if (message.length > MAX_CHARS) {
      return json({ error: 'message too long' }, 413, origin);
    }

    let upstream;
    try {
      upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
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
      return json({ error: 'Upstream unavailable' }, 502, origin);
    }

    if (!upstream.ok) {
      // Log the detail, return none. Upstream errors can echo request context.
      console.error('Groq returned', upstream.status, await upstream.text());
      return json({ error: 'Upstream error' }, 502, origin);
    }

    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content ?? '';

    // Return only the text. Never pass the raw upstream payload through.
    return json({ reply }, 200, origin);
  },
};
