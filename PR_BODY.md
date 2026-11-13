# Redesign: player-driven overhaul (10 iterations)

A full redesign of the FeatherMC pre-launch site, driven by **10 iterations** of an
independent "Player" critique (evaluating the real rendered site on desktop + mobile each
round) followed by implementation and in-browser verification. Final Player satisfaction
rose from **5/10 → 9/10** with **no production-blockers**.

Static GitHub Pages compatibility, the server IP (`feathermc.com`), the launch date
(14 Nov 2026, 17:00 MSK), the Russian content language, and all real server info are
preserved. **No invented player counts, screenshots, features, or statistics.**

## What changed
- **Launch-first framing.** Replaced a discouraging "Не в сети" dot with a warm launch pill;
  the live CONNECT card now reads "Открытие 14 ноября · 17:00" (honest *and* anticipatory),
  turning green only when the server is genuinely online.
- **Signature voxel skyline.** A pure-SVG pixel town with windows that glow/flicker sits along
  the hero's base — the site's unmistakably *Minecraft* moment. Opacity-only, reduced-motion aware.
- **Hero WOW.** The live countdown now anchors the hero; animated gold-shimmer wordmark;
  contrast scrim (theme-aware: dark in dark mode, soft light wash in light mode).
- **Visual identity.** Pixel font demoted to accents (kickers + countdown); rose/amber/dusk
  sunset palette; feature cards became an even triptych with bespoke house/sunset/friends icons.
- **Navigation / IA.** Nav reordered join-first with an amber-accented "Как играть"; a single
  dominant gold "Скопировать IP" CTA (secondary demoted to a ghost).
- **Motion layer.** Countdown digit-roll, copy→check icon morph, feather-logo sway, calmer
  faded marquee, gentler "breathing" pre-launch dots — all `prefers-reduced-motion` aware.
- **Mobile fix (was broken).** Eliminated horizontal overflow on the CONNECT card (card 399→339px,
  zero clipping); stacked the address + copy button into a full-width tap block; single-column status.
- **Accessibility & polish.** WCAG-AA contrast (measured ≥9:1 on previously faint text); focus
  rings + skip-link; even card elevation; light + dark themes both cohesive.

## Verification
No console errors on the homepage, FeatherWiki, Gradient Studio, or Map page; light and dark
themes both render cleanly; mobile 375px has no horizontal scroll; contrast ratios measured in
the browser. See `ITERATIONS.md` for the full per-iteration log (Player feedback → changes →
verification).

## Notes for the reviewer
- Please review and merge manually — do not auto-merge.
- Remaining limitation: a pre-launch site cannot show a live community (no real data to display);
  feature-card copy stays cozy, referencing only features documented in the server's own wiki.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
