# David Carson / Chaotic Abstract Poster — HTML Techniques

> Reference for canvas-design skill. Covers chaotic/abstract/composition techniques
> inspired by David Carson, grunge typography, and systematic pre-design analysis.
> Verified 2026-06-16.

---

## 1. Core David Carson Principles (for HTML)

| Principle | HTML Implementation |
|-----------|-------------------|
| **Type as Image** | Text that bleeds off edges, overlaps images, set at extreme sizes (4rem + 18vw in same layout) |
| **Anti-grid** | No flexbox/grid centering — use `position: absolute` + z-index layering for every text element |
| **Scale drama** | Enormous letters (18vw) beside tiny text (0.5rem) — `clamp()` per element, not globally |
| **Rotations** | `transform: rotate(-12deg)` through `rotate(25deg)` — never 0 or 90 alone |
| **Fragmentation** | Same image rendered 3-5× with different `clip-path`, `mix-blend-mode`, `opacity`, `transform` |
| **Collage aesthetic** | Tape strips, ink splatters (SVG), hand-drawn scribbles (SVG circles) as overlay layers |

## 2. Image Fragmentation (clip-path strategies)

Render the SAME `<img src="...">` multiple times with different clip-paths and blend modes:

```html
<!-- Full face — background layer -->
<div class="face-bg"><img src="photo.jpg" style="mix-blend-mode:difference;opacity:0.25"></div>

<!-- Circular crop (eye) — floating on top -->
<div class="eye" style="clip-path:circle(45% at 50% 50%);mix-blend-mode:luminosity"><img src="photo.jpg"></div>

<!-- Jagged polygon crop (chaotic fragment) -->
<div class="face-warm" style="clip-path:polygon(10% 5%, 95% 0%, 85% 95%, 0% 90%);mix-blend-mode:exclusion"><img src="photo.jpg"></div>

<!-- Horizontal slice (mouth area) -->
<div class="mouth" style="clip-path:polygon(0% 20%, 100% 0%, 100% 80%, 0% 100%);mix-blend-mode:difference"><img src="photo.jpg"></div>

<!-- Elliptical silhouette — dark abstract mass -->
<div class="silhouette" style="clip-path:ellipse(35% 45% at 55% 50%);mix-blend-mode:multiply"><img src="photo.jpg"></div>
```

**Key parameters per fragment:**
- `object-position`: offset each crop to show different face areas
- `filter: contrast() brightness() grayscale()`: vary tonal range per layer
- `mix-blend-mode`: `difference` / `exclusion` / `multiply` / `luminosity` / `screen` — never the same on adjacent layers
- `opacity`: 0.15–0.5 for background layers, 0.3–0.8 for focal fragments

## 3. Anti-grid Layout

No flexbox or CSS grid for text positioning (except the poster container itself). Use absolute positioning:

```css
.text-piece {
  position: absolute;
  z-index: 30;
  user-select: none;
}

.t-title {
  top: 6%;
  left: -4%;           /* bleeds off left edge — Carson signature */
  font-size: clamp(4rem, 14vw, 11rem);
  transform: rotate(-12deg);
  mix-blend-mode: difference;
}

.t-vertical {
  right: 2%;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  transform: rotate(180deg);
}

.t-huge-letter {
  font-size: clamp(5rem, 18vw, 14rem);  /* single letter as abstract shape */
}

.t-tiny-text {
  font-size: clamp(0.5rem, 1.2vw, 0.9rem); /* barely legible */
}
```

**Rules:**
- Every text piece at a different rotation (no two elements at same angle)
- At least one element bleeds off-page
- At least one element is vertical
- One element is almost illegibly small
- One element is comically large

## 4. Multi-blend-mode Layering

Layer the same image 3-5× with different blend modes for rich texture:

```css
/* Layer stack (back to front) */
.face-layer-1 { mix-blend-mode: difference; opacity: 0.25; filter: grayscale(50%) contrast(1.4); }
.face-layer-2 { mix-blend-mode: exclusion; opacity: 0.35; filter: contrast(1.6) brightness(0.6); }
.face-layer-3 { mix-blend-mode: multiply; opacity: 0.5; filter: grayscale(100%) contrast(3) brightness(0.2); }
```

The interaction of difference + exclusion + multiply creates a distressed, high-contrast, almost solarized effect that's pure grunge.

## 5. Karpathy Systematic Image Analysis (pre-design)

Before designing, analyze every image the poster will use through 10 systematic lenses:

1. **Composition** — rule of thirds, focal point, leading lines
2. **Expression** — emotion, gaze direction, mood
3. **Light & shadow** — light source, contrast zones, shadow shapes useful for cutouts
4. **Texture** — grain, skin detail, hair texture, paper wear
5. **Morphology** — geometric forms extractable (oval of face, arch of brow, jaw line)
6. **Color** — palette, dominant tones, accent possibilities
7. **Collage potential** — which parts would work cropped/isolated (eyes, mouth, silhouette)
8. **Mood** — what emotion does it project? How does it contrast/align with text?
9. **Key fragments** — 3-4 specific visual fragments that would work independently
10. **Tonal range** — zone of highest contrast, zone of deepest shadow

Use `vision_analyze` on each image with specific questions for each lens. Accept limitations of vision models — Carson-style work can succeed even with imperfect analyses.

## 6. GSAP Multidirectional Entry

Every element enters from a different direction and angle:

```javascript
const tl = gsap.timeline();

tl.from('#title',      { x: -200, y: -100, rotation: -25, opacity: 0, duration: 1.6 }, 0.2);
tl.from('#subtitle',   { y: 300,  rotation: -15, opacity: 0, duration: 1.4, ease: 'back.out(1.4)' }, 0.5);
tl.from('#vertical',   { x: 200,  opacity: 0, duration: 1.2 }, 0.6);
tl.from('#quote-main', { x: 150,  y: 100, rotation: 10, opacity: 0, duration: 1.5 }, 0.8);
tl.from('#tiny',       { y: -50,  opacity: 0, duration: 1.6 }, 1.2);
```

Each element gets its own `from()` with unique x/y offsets and rotation deltas. No two share the same entry vector.

## 7. Typographic Chaos — Font Selection

Use MAXIMUM font variety (6-7 different faces per poster):

| Font | Style | Role |
|------|-------|------|
| Bebas Neue | Sans, monumental | Main title (huge, rotated) |
| Gravitas One | Serif, heavy | Quote (weight contrasts with Bebas) |
| Fredericka the Great | Handwriting | "Tiny hidden message" (almost illegible) |
| Rubik Glitch | Glitch/deconstructed | Echo text, glitch animation |
| Oswald | Sans, light | Subtle secondary text |
| JetBrains Mono | Mono, thin | Technical details, year, hidden words |
| UnifrakturMaguntia | Blackletter | Rubber stamp / religious accent |

## 8. SVG Decorative Elements

Inline SVG for hand-drawn feel (no external assets):

```html
<svg class="hand-circle" viewBox="0 0 200 200">
  <circle cx="100" cy="100" r="70" fill="none" stroke="red" stroke-width="1.5"
    stroke-dasharray="8 6 15 4 6 8"/>
</svg>

<svg class="splatter" viewBox="0 0 100 100">
  <circle cx="30" cy="40" r="8" fill="var(--blood)"/>
  <circle cx="45" cy="35" r="4" fill="var(--red)"/>
  <circle cx="55" cy="50" r="6" fill="var(--dark-red)"/>
</svg>
```

Tape strips: absolutely-positioned `div` with `background: rgba(200,180,150,0.12)` rotated 15-25°.

## 9. Pitfalls Specific to Chaotic Posters

- **Too much unintentional readability**: If text is too legible, increase rotation, reduce font size, or overlap more aggressively. Carson said "Don't confuse legibility with communication."
- **GSAP cannot target `::before`/`::after`**: Use CSS `@keyframes` for pseudo-elements.
- **Same blend-mode on adjacent layers**: They cancel out. Use difference/exclusion/multiply in sequence.
- **Sub-agents with weak models (llama-3.3-70b) hallucinate design research**: Always verify sub-agent creative output or do the design work directly.
- **Font loading**: Always wrap GSAP animations in `document.fonts.ready.then(() => { ... })`.
- **Memory variable in CSS var()**: Ensure `--custom: value;` is correctly referenced as `var(--custom)` in all contexts.

## 10. Vox Editorial Evolution

For a related but distinct editorial style (paper grain, B&W 2-color images, newspaper clipping, paint strokes), see `references/vox-editorial-poster.md`. The David Carson chaotic style and Vox editorial style can be combined: use Carson's anti-grid typography + scale drama on top of Vox's 2-color background + paper grain for a hybrid look.

## 11. Visual References

- David Carson — Ray Gun magazine (1992-1998), "The End of Print"
- Kyle Cooper — Se7en title sequence (distressed typography + film grain)
- Saul Bass — Anatomy of a Murder (asymmetric composition, cutout figures)
- Polish Poster School — Walerjan Borowczyk, Franciszek Starowieyski
- True Grit Texture Supply — professional distressed textures, ink splatters

---

*Added 2026-06-16 during poster iteration for "La Passion de Jeanne d'Arc" / "Bigmouth Strikes Again" project.*
*Style direction: chaotic, abstract, David Carson homage, Karpathy system verification.*
