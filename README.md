# maidan_gym

Static marketing site for **Maidan Athletic Club** — Banaswadi, Bengaluru. Est. 2019.

Plain HTML/CSS/JS, no build step, no backend. Deploys as-is to any static host.

## Run locally

```sh
python -m http.server 8000 --directory public
```

Then open <http://localhost:8000>.

## Layout

```
public/
├─ index.html, classes.html, memberships.html, trainers.html, contact.html
└─ assets/
   ├─ css/    main.css is an @import manifest — a new stylesheet is
   │          invisible to the site until it is imported there
   ├─ js/
   ├─ images/
   └─ video/
docs/design-wave-1.md   original design notes
```

## Contact

20, 3rd Floor, Dodda Banaswadi Main Rd, Shamanna Layout, Subaiya Reddy Layout,
Banaswadi, Bengaluru, Karnataka 560043 · 077603 44646
