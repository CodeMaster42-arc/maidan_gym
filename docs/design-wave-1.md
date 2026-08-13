# Maidan Gym – Static Front‑End Design (Wave 1)

## Overview
A minimal, **desktop‑only** static website cloned from Gymbox to showcase Maidan Gym's branding and class offerings.
No back‑end/API – the site will be a pure static HTML/CSS/JS bundle suitable for CDN hosting or GitHub Pages.

## File Structure

```txt
public/
├─ index.html                # main entry
├─ assets/
│  ├─ css/
│  │  ├─ normalize.css
│  │  ├─ layout.css
│  │  ├─ components.css
│  │  └─ main.css
│  ├─ images/
│  │  ├─ maidan_gym_logo.png     # your custom logo
│  │  ├─ hero-bg.jpg
│  │  ├─ class-aerial.webp
│  │  ├─ class-strength.webp
│  │  └─ ... (10+ class images)
│  └─ js/
│     └─ smooth-scroll.js
└─ js/
   └─ main.js
```

## Core Components

| Component | Purpose | Key HTML/CSS |
|-----------|---------|--------------|
| Header | Logo + navigation | `<header> → <nav>` |
| Hero | Welcome banner with call-to-action | `<section id="hero">` |
| Classes | Grid of class cards | `<section id="classes">` |
| Footer | Contact / social | `<footer>` |

## Mermaid Diagram

```mermaid
graph TD
  A[Client] --> B[Browser]
  B --> C[Request index.html]
  C --> D[Serve static HTML]
  D --> E[Load CSS]
  D --> F[Load JS]
  D --> G[Load Assets (images, logo)]

  subgraph Site Layout
    H[Header] --> I[Hero]
    I --> J[Classes]
    J --> K[Footer]
  end
```

## Next Steps (Wave 2)
1. Optimize images for web.
2. Add meta tags and SEO-friendly structure.
3. Prepare for deployment.