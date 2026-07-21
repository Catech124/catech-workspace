---
name: editorial-poster-design
description: HTML/CSS artistic posters with CSS-only morph typography, SVG threshold filters, texture overlays, and image processing. Editorial/grunge/punk aesthetic with David Carson / Vox style.
---

# Editorial Poster Design

> HTML posters with animated typography, grunge textures, and image processing.
> Used for lyric videos, promotional posters, and editorial-style visual pieces.

---

## 1. CSS-Only Morph Typography

**Reference:** `karabharat/wBWeOex` (CSS-only morph with SVG threshold filter)

### 1.A SVG Threshold Filter (Gooey Morph)

The core technique uses an SVG filter that creates a fluid morph effect when two words overlap during blur transitions:

```svg
<svg class="filters">
  <defs>
    <filter id="threshold">
      <feColorMatrix in="SourceGraphic" type="matrix"
        values="1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 25 -9" result="goo"/>
      <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
    </filter>
  </defs>
</svg>
```

- The `feColorMatrix` with alpha gain 25 and offset -9 creates a threshold effect
- Semitransparent pixels become either fully opaque or fully transparent
- When two words overlap during transition, this creates the "gooey" morph
- Apply via `filter: url(#threshold)` on the **container** (morph-wrap), NOT on individual words

### 1.B CSS Animation Keyframes

```css
@keyframes morph-cycle {
  0% { opacity: 0; filter: blur(20px); transform: translate(0, -50%) scale(0.7); }
  6% { opacity: 0.6; filter: blur(8px); }
  12%, 20% { opacity: 1; filter: blur(0px); transform: translate(0, -50%) scale(1); }
  22% { opacity: 0.5; filter: blur(10px); }
  23% { opacity: 0; filter: blur(20px); transform: translate(0, -50%) scale(1.2); }
  23%, 100% { opacity: 0; filter: blur(20px); }
}
```

Key timing rules:
- **Entry blur → clear:** ~12% of cycle (1.2s at 10s cycle)
- **Hold visible:** 12%-20% of cycle (short, 0.8s)
- **Exit blur:** 20%-23% of cycle (VERY fast, 0.3s) — prevents words intertwining
- **Hidden:** 23%-100% of cycle

### 1.C Word Positioning & Timing

- All `.word` elements are `position: absolute`, stacked in the same container
- Stagger delays with `animation-delay` per word
- Words can be positioned side-by-side (not stacked) by setting different `left` values per word

```css
.word:nth-child(N) { left: 0; }       /* left-aligned */
.word:nth-child(M) { left: 52%; }     /* right-aligned, side by side */

.word:nth-child(1) { animation-delay: 0s; }
.word:nth-child(2) { animation-delay: 2s; }
```

**CRITICAL:** DO NOT use GSAP for morph animations. GSAP's `filter` property overrides conflict with SVG filters. Pure CSS `@keyframes` is the correct approach.

**CRITICAL:** DO NOT apply `filter: url(#paper-edge)` or any other SVG filter to `.word` elements — they conflict with the `filter: blur()` in the animation keyframes. Apply texture via overlay elements instead.

### 1.D Required Font & Layout

```css
font-family: 'Space Grotesk', sans-serif;
font-weight: 700;
text-transform: uppercase;
```

Container setup:
```css
.morph-wrap {
  position: absolute; z-index: 20;
  pointer-events: none;
  top: 35%; left: 5%; width: 80%;
  filter: url(#threshold);
  user-select: none;
}
.word-rotator {
  position: relative; height: 1.3em; width: 100%;
  display: flex; align-items: center;
}
```

---

## 2. Texture Application Methods

When Carlos asks for textures/distressed effects, use these methods in priority order:

### 2.A CSS Noise Overlay (RELIABLE — always works)

SVG feTurbulence noise as a CSS background on a pseudo-element:

```css
.word-rotator::after {
  content: '';
  position: absolute;
  top: 0; left: -5%; width: 110%; height: 100%;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.2;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='nf'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23nf)'/%3E%3C/svg%3E");
  background-size: cover;
}
```

### 2.B CSS Radial-Gradient Circles (RELIABLE)

Creates circle-blob texture using multiple `radial-gradient()` values:

```css
.circle-tex {
  position: absolute; z-index: 19;
  top: 30%; left: 5%; width: 80%; height: 25%;
  pointer-events: none;
  mix-blend-mode: multiply;
  opacity: 0.6;
  background:
    radial-gradient(35px at 80px 40px, rgba(0,0,0,0.15), transparent),
    radial-gradient(25px at 200px 80px, rgba(0,0,0,0.1), transparent),
    /* ... more circles at different positions */;
  background-repeat: no-repeat;
}
```

### 2.C SVG feTurbulence + feSpecularLighting Texture (RELIABLE)

Full-screen SVG overlay using specular lighting for a paper-like bump texture. This is Carlos's preferred texture method.

```html
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 700 700" width="100%" height="100%" preserveAspectRatio="none"
  style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;mix-blend-mode:multiply;opacity:0.08;">
  <defs>
    <filter id="nnnoise-filter" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.185" numOctaves="4" seed="15" stitchTiles="stitch" result="turbulence"/>
      <feSpecularLighting surfaceScale="19" specularConstant="1" specularExponent="20" lighting-color="#ffffff" in="turbulence" result="specularLighting">
        <feDistantLight azimuth="3" elevation="188"/>
      </feSpecularLighting>
    </filter>
  </defs>
  <rect width="700" height="700" fill="#151414ff"/>
  <rect width="700" height="700" fill="#ffffff" filter="url(#nnnoise-filter)"/>
</svg>
```

**How it works:**
- `feTurbulence` generates fractal noise
- `feSpecularLighting` creates 3D bump highlights from the noise (like paper fibers)
- Dark base rect (`#151414ff`) + white specular highlights create the texture
- `preserveAspectRatio="none"` stretches the 700×700 viewport to fill any screen
- Best with `mix-blend-mode: multiply` at low opacity (8-15% for subtle, up to 70% for heavy texture)

**Parameters to tweak:**
- `baseFrequency` (0.185): higher = finer grain, lower = larger patches
- `surfaceScale` (19): height of the paper bumps, higher = more contrast
- `specularExponent` (20): shininess, lower = softer highlights
- `elevation` (188): light angle, affects which edges catch light

### 2.D SVG Mask with feTurbulence (UNRELIABLE — test first)

SVG mask approach for distressed text (from `hzrd149/PPeZGa`). May conflict with threshold filter.

```svg
<filter id="grunge-noise">
  <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="noise"/>
  <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.1 -0.05" in="noise" result="contrast"/>
</filter>
<mask id="grunge-mask">
  <rect x="0" y="0" width="100%" height="100%" filter="url(#grunge-noise)"/>
</mask>
```

Apply via CSS: `mask: url(#grunge-mask); -webkit-mask: url(#grunge-mask);`

**Pitfall:** SVG mask on `.word` elements conflicts with `filter` animation (blur). Apply to container instead, or avoid when animation uses `filter` property.

### 2.D Canvas Generative Texture (UNRELIABLE — browser dependent)

From `ZevanRosser/jOwPMVV`. Works in some browsers, fails silently in others. Canvas must have both CSS `width/height` AND JS `innerWidth/innerHeight` set identically.

**Pitfall:** Canvas often doesn't render on `file://` protocol or when CSS sizes don't match JS dimensions.

---

## 3. Image Processing for Poster Backgrounds

When Carlos provides an image and wants grunge/paint effects:

### 3.A Python Pillow Pipeline (RELIABLE — always works)

1. Download/save the image to `public/joan-images/`
2. Process with Pillow:
   - Increase contrast (`ImageEnhance.Contrast`)
   - Darken (`ImageEnhance.Brightness`)
   - Add noise (NumPy random)
   - Composite paint strokes (PIL `ImageDraw` with random lines/circles)
   - Use blend modes (screen for light, multiply for dark)
3. Save output as PNG
4. Update HTML to reference the processed image

### 3.B image_generate (CREATES NEW IMAGE — doesn't edit)

The `image_generate` tool (FAL Flux Pro via Nous subscription) creates **new images from text prompts**. It cannot edit existing images. Use it when:
- Carlos wants a new variation of an image
- You need texture elements (paint strokes, grunge overlays) with transparent backgrounds
- The prompt should describe the reference image plus desired effects

### 3.C Gemini API Image Editing (QUOTA-LIMITED)

Gemini image-capable models (`gemini-2.5-flash-image`, `gemini-3.1-flash-image-preview`) can edit existing images via the API. Requires `GOOGLE_API_KEY` from `.env`. Free tier quota is very limited.

---

## 4. Carlos's Workflow Preferences

- **Iterative:** Show results, let him test, adjust incrementally
- **One thing at a time:** When something doesn't work, focus on fixing that ONE thing before moving on
- **Subtle textures:** Start subtle, increase gradually on request
- **CSS over JS:** Prefer pure CSS solutions over JavaScript when possible
- **Specific references:** He provides CodePen URLs as references — ALWAYS check the exact technique in the pen
- **Fast iterations:** When he says "más rápido" (faster), reduce cycle times significantly
- **Side-by-side:** Words can be positioned side-by-side with `left` percentages, not stacked
- **No GSAP for morph:** GSAP's filter handling conflicts with SVG filters — use CSS @keyframes instead

---

## 5. Project Structure

```
mi-video-musical/
├── poster-juana-carson-v3.html    # Current working poster
├── public/
│   └── joan-images/
│       └── passion-bg-v2.png      # Current background image
└── (other project files)
```

When saving new images, use `public/joan-images/` with descriptive names.
