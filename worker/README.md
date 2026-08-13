# Groq proxy

The site in `public/` is static and served publicly by GitHub Pages. It cannot
hold a secret: anything the browser can read, a visitor can read. This Worker
exists so the Groq key stays server-side.

```
browser  ──POST──▶  Worker (holds the key)  ──▶  api.groq.com
```

## Setup

One-time, from this directory:

```sh
npm install -g wrangler
wrangler login
wrangler secret put GROQ_API_KEY     # paste the key when prompted
wrangler deploy
```

`wrangler secret put` sends the key straight to Cloudflare's secret store. It is
never written to disk, never enters this repo, and cannot be read back out, only
overwritten.

Deploy prints your Worker URL, e.g. `https://maidan-groq-proxy.<you>.workers.dev`.

## Wire the site to it

```js
const res = await fetch('https://maidan-groq-proxy.<you>.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userText }),
});
const { reply } = await res.json();
```

No key appears anywhere in that code, which is the point.

## Local development

```sh
echo "GROQ_API_KEY=your_key_here" > .dev.vars   # gitignored
wrangler dev
```

## What this Worker already guards against

- **Origin allowlist.** Only the Pages site and localhost may call it. Without
  this, anyone can point their own app at your Worker and spend your credit.
- **Model pinned server-side.** The client cannot ask for a costlier model.
- **`max_tokens` and input length capped**, bounding cost per request.
- **Upstream errors are logged, not returned**, so error text cannot leak
  request context to the caller.

## What it does not do yet

There is **no rate limiting**. The origin check stops casual abuse, but an
`Origin` header is trivially forged outside a browser, so a determined caller
can still hammer it. Before this handles real traffic, add either Cloudflare
Rate Limiting rules on the Worker route, or a KV/Durable Object counter keyed on
`request.headers.get('CF-Connecting-IP')`.

Also set a **spend limit in the Groq console**. It is the only backstop that
does not depend on code being correct.

## If the key ever leaks

Rotate it in the Groq console first, then `wrangler secret put GROQ_API_KEY`
again. Deleting a commit does not un-leak a key, since it stays in the git
history and in anything that already cloned or scraped the repo.
