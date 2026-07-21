# HTML Effects for Poster Design — Research Compendium

> Techniques verified 2026-06-16 for HTML-based poster creation (grunge, editorial, distressed styles)

---

## 1. CSS Film Grain (No Images Required)

SVG `feTurbulence` filter embedded as data URI in a pseudo-element. No HTTP requests, no image files.

**Source**: [ibelick.com](https://ibelick.com/blog/create-grainy-backgrounds-with-css) — working code
**Source**: [CSS-Tricks Grainy Gradients](https://css-tricks.com/grainy-gradients/) — gradient + noise combo
**Source**: [Codepen: CSS Grain Background](https://codepen.io/ValentinBossens/pen/BaKRwea) — live demo

**Parameters to tweak**:
- `baseFrequency="0.65"` — lower = larger grain, higher = finer noise
- `numOctaves="3"` — more octaves = richer but more expensive
- `opacity: 0.06` — keep subtle (< 0.12) unless going for heavy grunge
- `background-size: 180px` — larger = more visible grain structure

## 2. Duotone / Color Overlay on Images

Layer a `<div>` or `::after` pseudo-element with `mix-blend-mode: multiply`, `screen`, or `overlay` over the image.

**Classic grunge palette**: red + black + off-white
```css
.grunge-overlay {
  background: linear-gradient(135deg, rgba(196,30,30,0.35), rgba(10,10,10,0.7));
  mix-blend-mode: multiply;
}
```

## 3. GSAP for Poster Animations

**CDN**: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js`

**Text stagger pattern**:
```js
gsap.from('.word-reveal span', {
  opacity: 0, y: 50, rotateX: -40,
  duration: 0.9, stagger: 0.12, ease: 'power3.out'
});
```

**Key constraint**: GSAP cannot target `::before`/`::after` pseudo-elements. Use CSS `@keyframes` for those.

**Font readiness**: Always wrap GSAP animations in `document.fonts.ready.then(() => { ... })`.

**Source**: [GSAP Docs](https://gsap.com/docs/)

## 4. Typography for Poster Aesthetics

| Font | Style | Best For |
|------|-------|----------|
| Bebas Neue | Sans, monumental, compact | Titles, headers |
| Oswald | Sans, condensed, 200-700 | Body, subtext |
| UnifrakturMaguntia | Blackletter | Grunge, gothic |
| Rubik Glitch | Glitch/distorted | Digital grunge |
| Anton | Sans ultra-bold | Heavy titles |
| Fraunces | Variable serif | Editorial contrast |

## 5. Public Domain Film Imagery

**Wikimedia Commons**: `https://commons.wikimedia.org/wiki/Category:La_Passion_de_Jeanne_d%27Arc`
- "La Passion de Jeanne d'Arc" (1928) entered US public domain Jan 2024
- Best still: Falconetti close-up cropped from English poster (907×1406, 2MB PNG)
- Download: `curl -L -o filename "URL"`

## 6. Equivalent After Effects → HTML Map

| AE Effect | HTML Equivalent |
|-----------|----------------|
| Grain/Noise | SVG `feTurbulence` + CSS opacity |
| Blend Modes | CSS `mix-blend-mode` |
| Displacement Map | SVG `feDisplacementMap` |
| Blur/Glow | CSS `filter: blur()` / `drop-shadow()` |
| Text Animation | GSAP stagger + ScrollTrigger |
| Particle Systems | Canvas API / Three.js |
| Glitch / RGB Split | Canvas + CSS animation with random offsets |
| Shatter | CSS `clip-path` with animated polygon |
| Color Grading | CSS `filter` (brightness, contrast, saturate, sepia) |

## 7. Visual References for Grunge Poster Design

- **The After Hour Activities** — editorial bold, red/black/white
- **RED AND GREEN CO LTD** — underground/post-punk
- **Neville Brody** — punk/editorial typography 1980s
- **David Carson** — grunge typography, distressed layouts
- **True Grit Texture Supply** — professional distressed textures

## 8. Tools CDN Quick Reference

```
GSAP:      https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js
GSAP ScrollTrigger: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js
Anime.js:  https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js
PixiJS:    https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js
Three.js:  https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js
p5.js:     https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js
```

---

*Generated 2026-06-16 during poster creation for "Bigmouth Strikes Again" / "La Passion de Jeanne d'Arc" project.*
