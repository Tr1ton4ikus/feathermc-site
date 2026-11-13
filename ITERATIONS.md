# FeatherMC — Player-Driven Redesign Log

Branch: `redesign/player-driven-overhaul`

Method: an **independent Player subagent** evaluates the actual rendered site (real
desktop + mobile screenshots) each round and returns a brutal, structured critique
+ a 0–10 satisfaction score. The **Developer** (orchestrator) then implements real
code changes, which are verified in a browser and committed. Ten iterations.

Honesty constraints respected throughout: the server IP (`feathermc.com`), launch
date (14 Nov 2026, 17:00 MSK), Russian content language, and all real server info
are preserved. **No invented player counts, screenshots, features, or statistics.**

---

## Iteration 1 — Brutal first impression & major design problems

**Player score: 5/10.** "A competent, pretty template with one genuinely good hero…
but it stops at *nice*." Key P0s: a confidence-killing "Не в сети" offline dot on a
pre-launch page; three competing primary CTAs; a near-invisible welcome section in the
static capture; the sunset vanishing into flat-black boxes below the fold; an
English marquee on a Russian site.

**Implemented:**
- **Launch pill, not "offline".** Hero status now reads *"Открытие 14 ноября · 17:00 МСК"*
  (warm, pulsing dot) and only turns green ("Сервер онлайн — заходи!") when the live
  check reports the server truly online. The detailed technical status card in the
  join section still shows the real В сети/Не в сети state.
- **One primary action.** Nav CTA changed from gold "ИГРАТЬ" to gold "Скопировать IP"
  (the single site-wide primary action). "Открыть мир" stays secondary.
- **Sunset threads the whole page.** Added warm radial horizon glows behind the
  welcome / features / join / final-CTA sections so it no longer hard-cuts to flat black.
- **Russian marquee.** "YOUR STORY STARTS HERE / BUILD YOUR DREAM / EXPLORE TOGETHER /
  JUST ONE MORE SUNSET" → "ТВОЯ ИСТОРИЯ НАЧИНАЕТСЯ ЗДЕСЬ / СТРОЙ СВОЮ МЕЧТУ /
  ИССЛЕДУЙ ВМЕСТЕ / ЕЩЁ ОДИН ЗАКАТ" (brand "FEATHERMC" kept).

**Deliberately NOT done** (would require fabrication, forbidden by the brief):
real in-game screenshot gallery, and a live "127 игроков ждут" social-proof counter.

**Verification:** rendered at 1280px desktop — no console errors; launch pill, single
gold CTA, feature/join sections all readable; reveal-on-scroll intact.

---

## Iteration 2 — Visual identity: typography, palette, feature cards

**Player score: 6.5/10** (up from 5). "Genuinely attractive, cohesive, usable — a clear
step above generic. But it's a polished template with a gorgeous photo, not yet a place
with a soul." Three P0s: the pixel font is overused as the house voice (buttons, labels);
the palette is "one gold deep" — the sunset lives only in the photo, not the UI; and the
three feature cards are a generic SaaS icon-box grid.

**Implemented:**
- **Pixel font demoted to a spice.** Buttons (`.button*`, `.nav-cta`) and small UI labels
  (`.micro-label`, `.info-label`) now use the clean Trebuchet sans. Pixel font (`Tiny5 Duo`)
  is kept only where it reads as intentional retro flavor: section kickers/eyebrows and the
  countdown. Verified via computed styles (button font-family → Trebuchet MS).
- **Deeper sunset palette.** Added real secondary tokens — `--fx-rose #ff8db0`,
  `--fx-amber #ffb63f`, `--fx-dusk #b78cf2`, `--fx-peach` — echoing the hero's pastel
  feather chips (previously the page's best colour, used only once).
- **Feature cards → sunset vignettes.** Each of the three cards now owns a distinct dusk
  hue: card 1 amber, card 2 rose, card 3 dusk-violet — bold gradient-filled icons (white
  glyph on coloured gradient), matching tinted `/01 /02 /03` indices and corner glows.
- **Under-fold ambience deepened** with rose + dusk radial glows (not just amber).
- **"Открыть мир" → "Что тебя ждёт"** — clearer that the secondary button leads into content.

**Verification:** cache-busted render confirms icon gradients (amber/rose/dusk), sans button
font, tinted indices; no console errors. (Note: browser pane needed a tab recreate after
heavy viewport toggling — unrelated to the site.)
