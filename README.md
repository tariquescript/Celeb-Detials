# LUMINA — Celebrity Intelligence

A real-time celebrity search app wrapped in a hand-built WebGL scene. Type a
name and LUMINA queries a live API for that person's occupation, nationality,
height, birthday and estimated net worth, then shows the matches as
interactive cards.

The landing screen is laid out like a magazine cover: an issue line, a
giant Bodoni masthead reading **ICONS**, cover lines and a ticker of names.
The "O" in the masthead is a live 3D orb rendered with custom shaders, and
it reacts to what the search is doing.

## Highlights

**The cover**
- The orb is typeset: the scene measures an empty slot in the masthead and
  fits the orb to it, using a straight-on camera so on-screen pixels map
  linearly onto world units. It stays exactly in its letter at every
  breakpoint, from 320px phones to ultrawide.
- The masthead is sized by viewport width *and* height, so the whole cover
  — issue line to ticker — fits one screen.
- A ticker of names runs along the foot of the cover. Each one starts a
  live search; the band pauses on hover and focus, and becomes a manual
  scroller under `prefers-reduced-motion`.
- The issue line is dated with the current month, like a print edition.

**3D scene (three.js + GLSL, no model files)**
- A liquid "light" orb whose surface is displaced by layered 3D simplex noise
  in the vertex shader. Normals are recalculated from the displaced surface,
  so the lighting follows the moving shape.
- Fresnel rim light, a two-light setup and angle-dependent iridescence in the
  fragment shader.
- A spiral particle galaxy (up to 8,000 points), three near-flat energy
  rings that orbit behind the letters with light pulses travelling around
  them, orbiting satellites and a parallax starfield.
- **Reacts to the app:** while a request is loading, or while the pointer is
  over the orb, its displacement, glow and orbit speed increase, then settle.
- Pointer parallax turns the orbits around the orb's own centre, so the orb
  never leaves its slot. Scrolling away loosens the rings outward.
- Performance: pixel ratio is capped, particle counts and mesh detail are
  lower on small screens, rendering stops whenever the cover is off-screen
  or the tab is hidden, WebGL context loss is handled, and all GPU
  resources are released on unmount.
- If WebGL is unavailable, a CSS-drawn orb holds the "O" so the masthead
  still reads, over a CSS aurora background. With `prefers-reduced-motion`,
  the scene renders a single still frame.

**Search experience**
- Glass search field with a rotating conic-gradient border and a typewriter
  placeholder that cycles through example names.
- Requests are debounced, and a new keystroke cancels any request still in
  flight (`AbortController`), so only the latest query's results are shown.
- Separate UI states for idle, loading (skeleton cards), results, no match
  and error. Error messages are specific for network failures, rejected
  API keys (401/403), rate limiting (429) and server errors, and the error
  state has a working retry button.
- Keyboard: `/` focuses the search from anywhere, `Esc` clears it, `Enter`
  scrolls to the results.

**Result cards**
- 3D tilt and a spotlight that follow the pointer. These are driven by CSS
  custom properties, so mouse movement doesn't cause React re-renders.
- Each name gets its own accent gradient, derived from a hash of the name.
- Country flags and names come from ISO codes via `Intl.DisplayNames`.
  Net worth, dates and height (metric and imperial) are formatted for
  reading.
- The net-worth bar uses a log scale from $100K to $100B, so bar lengths
  can be compared across cards.

**Built to production standards**
- Fully responsive from 320px to ultrawide, checked for horizontal overflow
  at every breakpoint. The cover keeps one centred axis at every size; on
  narrow screens the cover lines fold beneath the lede.
- Accessible: labelled controls, a single link per card that covers the
  whole card, `aria-live` results, visible focus rings, a mobile menu that
  closes with Escape and locks page scrolling while open, and body text
  that meets WCAG AA contrast.
- A small design system built from CSS custom properties. No UI framework.

## Tech stack

| Layer     | Choice                                                   |
| --------- | -------------------------------------------------------- |
| UI        | React 16 (hooks only)                                    |
| 3D        | three.js r137 with custom `ShaderMaterial`s              |
| Shaders   | GLSL: simplex-noise displacement, fresnel, point sprites |
| Data      | API Ninjas Celebrity endpoint via RapidAPI               |
| Type      | Bodoni Moda (masthead), Sora, Inter, JetBrains Mono      |
| Styling   | Plain CSS with design tokens                             |
| Tooling   | Create React App 3                                       |

## Getting started

```bash
npm install
```

Create a `.env` file in the project root with your RapidAPI key:

```bash
REACT_APP_RAPIDAPI_KEY=your_key_here
```

Start the dev server (set `PORT` if 3000 is already in use):

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Project structure

```
src/
├── Main.js                 # page composition, search state, fetch lifecycle
├── components/
│   ├── Scene/              # three.js scene + GLSL shader sources
│   ├── Ticker/             # looping band of names on the cover
│   ├── SearchBar/          # search field, typewriter placeholder, shortcuts
│   ├── Card/               # result card with tilt and spotlight
│   ├── Header/             # sticky glass nav + mobile menu
│   └── Footer/
└── utils/format.js         # money, dates, height, flags, accent colours
```

---

Designed and built by **[Tarique Shaikh](https://tariquescript.vercel.app)**.
