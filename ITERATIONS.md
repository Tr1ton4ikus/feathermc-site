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

---

## Iteration 3 — Hero section & immediate WOW factor

**Player score: 6.5/10.** "A countdown site that hides its countdown below the fold and
leaves half the hero empty hasn't earned the gasp yet." P0s: surface the live countdown in
the hero's empty right half; add a contrast scrim under the lower-left text; on mobile put
the countdown directly under the buttons (not below an icon row + card header).

**Implemented:**
- **Countdown now anchors the hero.** At desktop width the live ticking countdown card fills
  the previously empty right half of the sky — the single most WOW-capable element is now the
  hero's co-star, not a footnote. (Verified at 1366px.)
- **Contrast scrim** behind the lower-left hero text on desktop/tablet (a soft radial that
  fades to transparent), so the description reads crisply over bright clouds — scoped out on
  phones, where the text sits over darker sky and a boxed scrim looked like a stray panel.
- **Living gold-fade.** The "MC" of the wordmark now shimmers with a slow animated gold
  gradient (text is always fully painted, so it can never render blank).
- **Removed the twee pastel icon trio** ("Место для твоих воспоминаний") from the hero — two
  Players flagged it as cheapening the cinematic tone. Its removal also pulls the countdown
  **directly under the buttons on mobile** (solving the mobile ordering P0).

**Reverted during the round:** an initial hero entrance animation used `backwards` fill and
left the wordmark/buttons briefly blank on load — unacceptable for critical above-fold
content. Removed it; a JS-triggered safe version is deferred to the animations iteration.

**Verification:** desktop 1366px — countdown beside hero, scrim + gold shimmer present, no
console errors. Mobile 375px — full hero visible, countdown immediately under the buttons.
