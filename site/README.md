# Hemline — designer hub

A static website for independent clothing and fashion designers: profiles, a gallery of
pieces, and a small number of **exclusive spots** per season. No build step, no backend.

Open `site/index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080 --directory site
```

## Pages (hash routes)

| Route | What it shows |
|---|---|
| `#home` | Hero, live ticker, this season's front row, new pieces, directory preview, how it works |
| `#designers` | Directory with discipline filter and search |
| `#d-<slug>` | Designer profile and their pieces |
| `#pieces` | Gallery with category and season filters |
| `#p-<slug>` | Full-screen piece card (fabric, edition, sizes, price); arrow keys move between pieces |
| `#exclusive` | The six Front Row seats, the Showroom tier, countdown to applications closing |
| `#join` / `#join-spot` | Designer application / exclusive spot application |

## Adding a designer or a piece

Everything is in `site/data/data.js`. Add an object to `designers` (give it a unique
`slug`) and objects to `pieces` with `designer` set to that slug. A piece without an
`image` renders a generated fabric swatch from its `palette` and `angle`; add
`image: "img/your-photo.jpg"` to show a photo instead.

Exclusive spots live in `spots`. Front Row has six `seats`, each `taken` (with a
`designer` slug), `open` or `waitlist`. Showroom lists its `holders` and how many are `open`.
Season, dates and contact details are in `site`.

The designers and pieces shipped here are **fictional samples**. Replace them.

## Forms

The join and spot forms validate in the browser, store each application in the visitor's
`localStorage` under `hemline.submissions`, and show a reference number. Nothing is emailed.
To receive applications, point the form at a form service: in `assets/app.js` inside
`bindForm`, after `const data = ...`, send `data` with `fetch` to Formspree, Basin, Getform
or your own endpoint, or replace the form with a Google Form embed link.

## Deploying

`.github/workflows/pages.yml` publishes the `site/` folder to GitHub Pages on every push to
`main` that touches it. Enable it once in the repository: **Settings → Pages → Source:
GitHub Actions**. The site works at any path, so a project page URL is fine.
