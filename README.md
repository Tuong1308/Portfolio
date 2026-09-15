# Do Tan Tuong — Portfolio

Personal portfolio: **React 19 + Vite + TypeScript + three.js** (raw WebGL, no wrapper library).

## Run locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs to dist/
npm run preview  # preview the production build
```

## Deploy (pick one — all free)

**Vercel (recommended, ~1 minute):**
1. Push this code to a new GitHub repo.
2. Go to vercel.com → Add New → Project → select the repo.
3. Vercel detects Vite automatically. Framework Preset: `Vite`, Build: `npm run build`, Output: `dist`.
4. Deploy. Done.

**Netlify:** drag and drop the `dist/` folder onto netlify.com/drop.

**GitHub Pages:** add `base: "/<repo-name>/"` to `vite.config.ts`, then deploy `dist/`.

## Structure

```
src/
  App.tsx              # the shell: skip link, nav, the seven sections, footer
  data.ts              # ⭐ EDIT PERSONAL DETAILS HERE (name, email, phone, projects, skills…)
  hooks.ts             # scroll reveal, active nav link, typewriter, reduced-motion,
                       #   and useScrollEngine (the one rAF loop that drives scenes)
  styles.css           # design tokens + responsive rules (mobile / tablet / desktop)

  components/
    Section.tsx        # a section that is also a scene — owns the two transition layers,
                       #   so no section can forget them and the markup exists once
    Reveal.tsx         # a block that arrives when it scrolls into view
    icons.tsx          # one icon set: one 24px grid, one stroke weight
    Nav.tsx            # pill nav, active link, mobile panel (inert when closed)
    SkillMarquee.tsx   # the running tool strip, brand marks from simple-icons
    CopyLine.tsx       # a value with a copy button and honest feedback
    GlowCursor.tsx  ToTop.tsx  Footer.tsx

  sections/
    Hero.tsx  About.tsx  Experience.tsx  Projects.tsx  Skills.tsx  Education.tsx
    Contact.tsx        # layout only
    ContactForm.tsx    # form state, plus `validate` and `buildMailto` as pure functions
                       #   that can be reasoned about without a browser

  three/
    HeroScene.tsx      # GLSL particle shader, pointer repulsion, parallax, fresnel halo
    PipelineScene.tsx  # ⭐ focal moment: a data packet travels Browser→API→DB→Docker→Insight,
                       #   the rail lights up behind it, nodes fire as it lands,
                       #   HTML labels track 3D coordinates, layout flips horizontal ↔ vertical
    SkillsOrb.tsx      # skills sphere: drag to spin, raycast hover on each node
```

No file is over 200 lines except the three WebGL scenes, where the setup genuinely belongs
together. Section components hold layout and copy; anything with logic worth testing on its own
(`validate`, `buildMailto`, every hook) lives outside the JSX.

## QA

```bash
node qa/shot.mjs    # screenshots at 1440 / 820 / 390px, plus checks for console errors,
                    # horizontal overflow, anchors hidden under the nav, focus leaks in the mobile menu
node qa/audit.mjs   # WCAG contrast (with proper alpha compositing), 44px touch targets,
                    # heading order, tab order, a real touch gesture on the skills sphere,
                    # staggered reveals, idle-when-offscreen, and the reduced-motion path
node qa/marquee.mjs # tool strip: both rows move, in opposite directions, and one repeat
                    # is always wider than the viewport so the loop never shows a gap
node qa/perf.mjs    # no lurch when a nav anchor jumps the page, no layout shift while running
node qa/scenes.mjs  # the veil tracks scroll on every section, overlays never block clicks
node qa/motion.mjs  # ⭐ pixel-truth: drives a real mouse wheel and diffs the captured
                    # frames. Reading computed styles proves CSS was set; this proves
                    # something actually moved on screen.
node qa/contact.mjs # the form: labels, validation, focus handling, the mailto it builds,
                    # copy-to-clipboard, tab order, and layout from 340px to 1440px
```

## The contact form

`FORM_ENDPOINT` at the top of `src/Contact.tsx` is empty, so submitting opens the visitor's
mail client with the subject and body already filled in. The button says **Compose email** and
the status line says the mail app was opened — it never claims a message was delivered, because
with no backend nothing was.

To make it send for real, paste a form endpoint into that one constant:

```ts
const FORM_ENDPOINT = "https://formspree.io/f/xxxxxxxx";   // or Web3Forms, or your own route
```

The same form then POSTs the fields there, the button becomes **Send message**, and success and
failure both get honest wording. `qa/contact.mjs` asserts the status never says "sent" while the
form is in mailto mode.

**If nothing animates in your browser**, check in this order:

1. **Your OS "reduce motion" setting.** This is the usual answer. Windows: Settings →
   Accessibility → Visual effects → *Animation effects*. macOS: System Settings →
   Accessibility → Display → *Reduce motion*. Paste this in the browser console to see what
   the page is being told:
   ```js
   matchMedia('(prefers-reduced-motion: reduce)').matches   // true = the OS asked for calm
   ```
   With it on the page runs **calmer, not still**: the tool strip keeps drifting but slower and
   without the scroll-reactive lean, and section transitions become a plain cross-fade with no
   sweeping line. Nothing freezes. (An earlier version did freeze here — that is the bug this
   note exists for.)
2. `npm install` — the tool strip needs `simple-icons`; a missing dep stops the app rendering
   at all.
3. Serve over http (`npm run dev` or `npm run preview`). Opening `dist/index.html` from the
   filesystem fails: module scripts do not load over `file://`.
4. `node qa/motion.mjs` — if that passes, the build is fine and the problem is local.
Both run against `dist/`, so run `npm run build` first.

## Scene transitions

Each section is a scene. Scrolling into one lifts a dark veil off its leading edge while a
thin accent line sweeps down across it; the progress is bound to scroll position rather than
just triggered by it.

`useScrollEngine` drives this from a single rAF loop in every browser. It deliberately does
**not** use `animation-timeline: view()`: that feature is missing in several shipping browsers,
and it silently binds to the wrong scrollport whenever an ancestor computes to
`overflow: hidden auto` — a failure mode with no error and no visible effect. One engine means
one behaviour to verify.

The engine marks `<html class="js">` before anything else, and only `.js .reveal` is allowed to
start hidden. If the engine ever fails, the page stays fully readable instead of blank.

## Technical notes
- Both 3D scenes **stop rendering** when scrolled out of view or when the tab is hidden — saves battery.
- `devicePixelRatio` is capped at 1.5 on mobile, and the particle count drops to 2,600 there (6,200 on desktop).
- The tool strip runs continuously in every browser. `prefers-reduced-motion` makes it slower
  (20 px/s instead of 34) and removes the scroll-reactive lean and the sweeping scene line, but
  never stops it. The preference is re-read live, so toggling it in the OS updates the open page.
- There is **no visible stop control** — a deliberate call by the owner of the site. Hovering a
  row (or focusing into it) halts that row and releases it on leave, which is the remaining way
  to stop the motion. Note the trade-off: WCAG 2.2.2 asks for a pause mechanism on content that
  moves on its own for more than five seconds, and hover alone does not cover keyboard-only or
  touch users. `qa/motion.mjs` asserts hover halts the hovered row, leaves its neighbour running,
  and that the row resumes afterwards.
- If the browser has no WebGL, the page still renders normally.
- Keyboard support throughout: skip link, visible focus rings, the closed mobile menu is `inert`.
