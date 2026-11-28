# Hemline — designer hub design (2026-11-28)

## Intent
A public website where independent clothing and fashion designers get a profile, show
their pieces, and can take one of a limited number of **exclusive spots** (paid, time-boxed
featured placements). Visitors browse designers and pieces; designers apply to join or to
take a spot.

## Goals
- Designer directory with profiles (bio, city, discipline, contact, socials).
- Piece gallery with filters (category, season, designer) and a detail view with
  fabric, edition, sizes, price.
- Exclusive spots: a fixed, visibly scarce set of placements per season, each shown as
  open / taken / waitlist, with perks and an application form.
- Zero running cost: static files, deployable to GitHub Pages from this repo.

## Non-goals (this version)
- Accounts, logins, payments, uploads. Designers are added by editing one data file.
- A backend for forms. Forms validate and store a draft locally; the README says how to
  attach Formspree / Netlify Forms / a Google Form.

## Approaches considered
1. **Static single-page site, vanilla HTML/CSS/JS, data in one JS file** (chosen):
   works from `file://`, GitHub Pages and the Claude artifact preview; no build step;
   anyone can add a designer by editing `site/data/data.js`.
2. Next.js / Astro with a CMS: nicer authoring but a build chain, a hosted CMS and
   an account system this repo has no reason to carry yet.
3. Multi-page static HTML: simpler per page but duplicates nav/footer and needs query
   strings for profiles, which the artifact preview cannot route.

## Decisions (mine, stated so they can be overridden)
- Name: **Hemline** (placeholder; one string in `data.js`).
- Routing on the URL hash: `#home`, `#designers`, `#pieces`, `#exclusive`, `#join`,
  `#d-<slug>` for a designer, `#p-<slug>` for a piece.
- Exclusive spots: six **Front Row** spots per season (home-page takeover, lookbook
  feature, newsletter), plus **Showroom** spots (pinned in directory and gallery).
- Sample designers and pieces are fictional, flagged as samples in the README.
- Pieces without a photo render a generated fabric swatch from their palette.
