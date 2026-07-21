# Vox Editorial / Newspaper Cutout Poster — HTML Techniques

> Reference for canvas-design skill. Covers Vox-style editorial posters, paper grain
> global overlays, 2-color image processing, newspaper clippings with torn edges,
> and paint-stroke grunge elements. Verified 2026-06-16.

---

## 1. Core Aesthetic: Vox Editorial / Magazine Style

| Element | Description |
|---------|-------------|
| **Paper grain** | Global feTurbulence overlay covering everything (z-index 99) |
| **Newsprint dots** | Radial-gradient pattern simulating newspaper halftone |
| **Paper overlay** | Horizontal repeating lines for paper texture |
| **2-color images** | Threshold-processed B&W images (pure black + off-white only) |
| **Red accent** | Single accent color (typically dark red / maroon) |
| **Serif + sans chaos** | Mix of editorial serifs (Playfair Display) and grunge displays |
| **Paint strokes** | SVG paint strokes in white and black, prominent over the image |

### Key Difference from David Carson Style

| Dimension | David Carson | Vox Editorial |
|-----------|-------------|---------------|
| Image | Fragmented, overlapping | Full-background, B&W 2-color |
| Texture | Grunge grain only | Paper grain + newsprint dots + paper lines |
| Typography | Rotations, illegible | Editorial serifs + chaotic displays |
| Layout | Absolute chaos everywhere | Background person + interactive overlays |
| Paint | Subtle red/black | Prominent white AND black strokes |
| Cutouts | Abstract fragments | Newspaper clipping with article text |

---

## 2. Global Paper Grain (Covers EVERYTHING)

The key Vox technique: **3 layers of paper texture at z-index 97-99** that cover the entire poster, affecting everything including images, text, and design elements.

### Layer 1: SVG feTurbulence Paper Grain (z-index 98)
```html
<svg class="layer paper-grain" viewBox="0 0 100 100" preserveAspectRatio="none">
  <filter id="paper-grain-filter">
    <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch"/>
    <feColorMatrix type="matrix"
      values="1.3 0 0 0 0.04
              1.1 0 0 0 0.02
              0.9 0 0 0 0
              0 0 0 0.5 0"/>
  </filter>
  <rect width="100" height="100" filter="url(#paper-grain-filter)" opacity="0.5"/>
</svg>
```
- `mix-blend-mode: multiply` to integrate granulation
- `opacity: 0.25-0.5` depending on how aggressive you want the texture
- `z-index: 98` (just below the paper overlay)
- The feColorMatrix tints the grain warm (paper tone)

### Layer 2: Paper Overlay (z-index 99)
```css
.paper-overlay {
  z-index: 99;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 2px,
    rgba(230,220,210,0.012) 2px, rgba(230,220,210,0.012) 4px
  );
  mix-blend-mode: overlay;
  opacity: 0.3-0.35;
  pointer-events: none;
  animation: paper-shift 10s ease-in-out infinite;
}
```
- Subtle horizontal lines mimicking paper grain direction
- `mix-blend-mode: overlay`

### Layer 3: Newsprint Dot Pattern (z-index 97)
```css
.newsprint {
  z-index: 97;
  background-image: radial-gradient(circle, rgba(200,180,160,0.03-0.04) 1px, transparent 1px);
  background-size: 3px 3px;
  mix-blend-mode: overlay;
  pointer-events: none;
}
```
- Simulates halftone newsprint dots
- Very subtle (opacity 0.03-0.04)
- 3px size for fine newspaper texture

### Paper Shift Animation
```css
@keyframes paper-shift {
  0% { transform: translate(0, 0); }
  50% { transform: translate(0.5px, 0.3px); }
  100% { transform: translate(0, 0); }
}
```
- Subtle micro-movement gives the paper a "breathing" effect
- Duration: 8-10s, ease: ease-in-out

---

## 3. Newspaper Clipping with Torn Paper Edges

### Torn Paper Clip-Path
Generate an irregular polygon with ~80-100 points. Alternate between 0-4% offsets for realistic torn edges:

```css
.newspaper-clipping {
  clip-path: polygon(
    0% 4%, 3% 0%, 7% 1%, 11% 0%, 15% 1%, 19% 0%, 23% 2%, 27% 0%,
    32% 1%, 36% 0%, 40% 2%, 44% 0%, 48% 1%, 52% 0%, 56% 2%, 60% 0%,
    65% 1%, 69% 0%, 73% 2%, 77% 0%, 81% 1%, 85% 0%, 90% 2%, 94% 0%,
    97% 1%, 100% 4%,
    /* right edge jagged down */
    99% 10%, 100% 16%, 98% 22%, 100% 28%, 99% 34%, 100% 40%, 98% 46%,
    100% 52%, 99% 58%, 100% 64%, 98% 70%, 100% 76%, 99% 82%, 100% 88%, 98% 94%,
    /* bottom edge jagged */
    96% 100%, 92% 99%, 88% 100%, 84% 98%, 80% 100%, 76% 99%, 72% 100%, 68% 98%,
    64% 100%, 60% 99%, 56% 100%, 52% 98%, 48% 100%, 44% 99%, 40% 100%, 36% 98%,
    32% 100%, 28% 99%, 24% 100%, 20% 98%, 16% 100%, 12% 99%, 8% 100%, 4% 98%,
    /* left edge jagged up */
    1% 96%, 0% 90%, 2% 84%, 0% 78%, 1% 72%, 0% 66%, 2% 60%, 0% 54%,
    1% 48%, 0% 42%, 2% 36%, 0% 30%, 1% 24%, 0% 18%, 2% 12%
  );
}
```

### Newspaper Content Structure
```html
<div class="newspaper-clipping" style="bottom: 6%; left: 6%; width: 32vmin;">
  <div class="headline">✦ THE PASSION OF JOAN OF ARC</div>
  <div class="body-text">
    <p>Article text here...</p>
    <p>More text...</p>
  </div>
  <div class="quote">"Sweetness, sweetness I was only joking" — M.</div>
</div>
```

### Newspaper Typography
```css
.headline {
  font-family: 'Playfair Display', serif;
  font-size: clamp(0.7rem, 1.2vw, 1rem);
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0.05em;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}
.body-text {
  font-family: 'Playfair Display', serif;
  font-size: clamp(0.45rem, 0.8vw, 0.7rem);
  font-style: italic;
  column-count: 2;
  column-gap: 0.5em;
}
.quote {
  font-family: 'Rock Salt', cursive;
  font-size: clamp(0.4rem, 0.7vw, 0.6rem);
  border-top: 1px solid rgba(255,255,255,0.06);
}
```

### Newspaper clipping visual styling
```css
.newspaper-clipping {
  background: rgba(230,218,200,0.085);
  backdrop-filter: blur(1px);
  padding: 1.2em 1em 1em 1em;
  box-shadow: 2px 2px 8px rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.06);
}
```
- `backdrop-filter: blur(1px)` gives slight paper opacity
- `box-shadow` makes it feel physically pasted on

---

## 4. Paint Strokes in White & Black

For Vox editorial grunge, paint strokes should be **prominent** — white AND black, higher opacity and stroke width:

### Thick White Paint Stroke
```svg
<path d="M-8 42 Q15 36 30 44 T55 38 T75 46 T95 40 T110 45"
      stroke="rgba(255,255,255,0.3-0.35)" stroke-width="2.5-2.8" fill="none"
      stroke-linecap="round" stroke-linejoin="round"/>
```

### Thick Black Paint Stroke
```svg
<path d="M5 58 Q20 52 35 60 T55 54 T72 62 T90 56 T105 62"
      stroke="rgba(0,0,0,0.35-0.4)" stroke-width="2.2-2.5" fill="none"
      stroke-linecap="round" stroke-linejoin="round"/>
```

### Scratch Lines — White
```svg
<line x1="5" y1="15" x2="38" y2="12" stroke="rgba(255,255,255,0.1-0.15)" stroke-width="0.15-0.2"/>
```

### Scratch Lines — Black
```svg
<line x1="80" y1="52" x2="99" y2="50" stroke="rgba(0,0,0,0.2-0.3)" stroke-width="0.1-0.15"/>
```

### Ink Splatters — Black
```svg
<ellipse cx="84" cy="20" rx="9" ry="6" fill="rgba(0,0,0,0.08-0.12)" transform="rotate(-25,84,20)"/>
<circle cx="8" cy="80" r="2-3" fill="rgba(0,0,0,0.08-0.1)"/>
```

### Ink Splatters — White
```svg
<ellipse cx="15" cy="38" rx="5-6" ry="3-4" fill="rgba(255,255,255,0.04-0.06)" transform="rotate(12,15,38)"/>
```

### Key Variables for Paint Stroke Prominence
| Element | Opacity | Stroke Width | Color |
|---------|---------|-------------|-------|
| Thick white stroke | 0.30-0.35 | 2.5-2.8px | #fff |
| Thick black stroke | 0.35-0.40 | 2.2-2.5px | #000 |
| White scratches | 0.10-0.15 | 0.15-0.2px | #fff |
| Black scratches | 0.20-0.30 | 0.10-0.15px | #000 |
| Black ink splatters | 0.05-0.15 | — | #000 |
| White ink splatters | 0.03-0.06 | — | #fff |

---

## 5. Python Pillow Image Preprocessing for 2-Color Vox Style

Process images before using them in the poster. All techniques use only Python stdlib + Pillow (no numpy required, but numpy is faster for pixel ops).

### A. Hard 2-Color Threshold (Pure B&W)
```python
from PIL import Image, ImageEnhance

img = Image.open("input.jpg").convert("L")
enhancer = ImageEnhance.Contrast(img)
img_high = enhancer.enhance(2.5)

import numpy as np
arr = np.array(img_high, dtype=np.uint8)
threshold = 128
bw = np.where(arr > threshold, 245, 15).astype(np.uint8)
Image.fromarray(bw).save("output-2color.png")
```

### B. 3-Level Posterization
```python
levels = np.zeros_like(arr, dtype=np.uint8)
levels[arr < 80] = 15       # Near black
levels[(arr >= 80) & (arr < 160)] = 128  # Mid gray
levels[arr >= 160] = 240    # Near white
Image.fromarray(levels).save("output-3level.png")
```

### C. Floyd-Steinberg Dithering (Newspaper Halftone Look)
```python
arr_d = np.array(img_high, dtype=np.float32).copy()
h, w = arr_d.shape
for y in range(h-1):
    for x in range(1, w-1):
        old = arr_d[y, x]
        new = 245 if old > 128 else 15
        arr_d[y, x] = new
        error = old - new
        arr_d[y, x+1] += error * 7/16
        arr_d[y+1, x-1] += error * 3/16
        arr_d[y+1, x] += error * 5/16
        arr_d[y+1, x+1] += error * 1/16
Image.fromarray(np.clip(arr_d, 0, 255).astype(np.uint8)).save("output-dithered.png")
```
**Warning:** This is O(n²) — fine for images <1000px. For larger images, use Pillow's built-in dithering:
```python
img_dithered = img_high.convert("1")  # 1-bit dither
img_dithered.save("output-1bit.png")
```

### D. Duotone (Red/Black or Any Color)
```python
arr = np.array(img_posterized, dtype=np.uint8)
h, w = arr.shape
duotone = np.zeros((h, w, 3), dtype=np.uint8)
duotone[:,:,0] = np.clip(arr * 1.0, 80, 220)  # Red channel strong
duotone[:,:,1] = np.clip(arr * 0.15, 0, 80)   # Green minimal
duotone[:,:,2] = np.clip(arr * 0.1, 0, 50)    # Blue minimal
Image.fromarray(duotone).save("output-duotone.png")
```

### E. Halftone Approximation (4x4 Dither Matrix)
```python
dither_matrix = np.array([[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]]) * 16
out = np.zeros_like(arr)
for y in range(h):
    for x in range(w):
        threshold = dither_matrix[y % 4, x % 4]
        out[y, x] = 245 if arr[y, x] > threshold else 15
Image.fromarray(out.astype(np.uint8)).save("output-halftone.png")
```

### Batch Processing Flow
```python
img = Image.open("source.jpg").convert("L")
img.thumbnail((1200, 1800), Image.LANCZOS)  # Web-appropriate size
names = ["2color", "3level", "dithered", "duotone", "halftone"]
# ... apply each technique and save
```

---

## 6. Design Interacting with Background Person

A key Vox/collage technique: **the main person is the background**, and design elements overlap/interact with specific facial features.

### Position Map for a Face-Centered Background
| Facial Area | Typical Position (top%, left%) | Element Type |
|-------------|-------------------------------|--------------|
| Forehead | 12-18% | Horizontal text, paint stroke |
| Eye | 28-36% | Large letter, arrow, circle doodle |
| Cheek | 50-58% | Brush text, paint stroke |
| Mouth | 58-65% | Tiny text, small paint streak |
| Chin | 65-72% | Text, black stroke |

### Implementation Pattern
```css
/* Element crossing forehead */
.t-forehead {
  top: 15%; left: 25%;
  transform: rotate(-20deg);
}
/* Large letter over eye area */
.big-letter {
  position: absolute;
  top: 28%; left: 38%;
  font-size: clamp(10rem, 28vw, 24rem);
  opacity: 0.3;
}
/* Paint stroke crossing face */
.paint-cross {
  position: absolute;
  top: 38%; /* crosses forehead */
}
```

### Arrow/Circle Pointing to Eye
```svg
<!-- Hand-drawn arrow -->
<path d="M52 35 L58 38 L56 34" stroke="rgba(255,255,255,0.15)" stroke-width="0.2" fill="none"/>
<line x1="42" y1="36" x2="52" y2="36" stroke="rgba(255,255,255,0.1)" stroke-width="0.12"/>
<circle cx="42" cy="36" r="1.5" stroke="rgba(255,255,255,0.08)" stroke-width="0.1" fill="none"/>
```

---

## 7. Additional Graphical Elements

### Stitch / Thread Lines
```svg
<path d="M12 22 Q28 27 42 22 Q56 17 70 22"
      stroke="rgba(255,255,255,0.1-0.12)" stroke-width="0.1-0.12"
      stroke-dasharray="0.6 1.4" fill="none" stroke-linecap="round"/>
```

### Paper Cutout Shapes (Torn Corners)
```svg
<path d="M72 3 Q75 6 79 4 Q83 8 87 5 Q91 9 93 6 L96 18 L91 21 L88 14 L83 18 L79 12 L74 16 Z"
      fill="rgba(255,255,255,0.05-0.06)" stroke="rgba(255,255,255,0.1-0.12)" stroke-width="0.12-0.15"/>
```

### Hand-Drawn Scribble Circle
```svg
<path d="M8 10 Q4 20 12 30 Q18 38 26 33 Q34 26 30 16 Q26 8 18 7 Q10 5 8 10"
      stroke="rgba(255,255,255,0.06-0.08)" stroke-width="0.15" fill="none" stroke-linecap="round"/>
```

---

## 8. Carlos's Workflow Pattern (Iterative Poster Refinement)

This pattern emerged over multiple sessions with user Carlos, and governs how HTML posters are iterated:

### Phase 1: Core Image
1. Search for the best public-domain portrait of the subject
2. Download to `public/joan-images/` (or project-appropriate dir)
3. Process with Python Pillow → 2-3 stylized versions (2color, duotone, screenprint)
4. Use the clearest one as the main visual element

### Phase 2: First Draft
1. Build HTML with the image as foreground element or full background
2. Add 6-7 Google Fonts (mix of monumental, serif, handwriting, glitch, gothic)
3. Add GSAP timeline with multidirectional entries
4. Add SVG grunge textures (grain, scratches, tape)
5. Add paint strokes and ink splatters

### Phase 3: Iteration (Carlos's correction patterns)
When Carlos says "add more chaos/grunge":
- Add MORE paint strokes (increase opacity + width)
- Add paper cutout shapes
- Distort more text (increase rotation, use clip-path)

When Carlos says "make person clearer":
- Use 2-color B&W threshold (remove red from person's image)
- Move person to background if they said "fondo"
- Position design elements to interact with specific facial features

When Carlos says "paper/magazine style":
- Add global paper grain (z-index 99 feTurbulence)
- Add newsprint dots
- Add newspaper clipping with torn edges
- Use serif for newspaper text (Playfair Display)

### Phase 4: Verification
Run Karpathy system check (70-80 criteria) before declaring done. Verify:
- Image processing matches the requested style
- Typography variety covers 8+ different fonts
- All graphical elements present (paint, scratches, ink, paper, stitches)
- GSAP animations work (no broken timeline entries)
- Global paper grain covers everything

---

## 9. Common Pitfalls

- **Paper grain too aggressive**: Keep opacity 0.25-0.5 and rely on `mix-blend-mode: multiply` to integrate. Aggressive grain destroys image clarity.
- **Newspaper clipping too large**: Keep under 35vmin. It's an accent, not the main element.
- **Too many fonts loading slowly**: Max 12 Google Fonts families. Use `display=swap` and `fonts.ready` wrapper.
- **Paint strokes covering the subject's face**: Position strokes to cross but not obscure key features (eyes, mouth).
- **2-color image lacks contrast**: Ensure the source image has strong contrast before processing. Enhance contrast 2-3× before thresholding.
- **Floyd-Steinberg dithering too slow on large images**: Use `img.convert("1")` for built-in 1-bit dithering on images >1500px.
- **GSAP `back.out` easing too extreme on entry**: Use `back.out(1.2-1.4)` for springy but controlled entries. Higher values look glitchy.
- **Forgetting `pointer-events: none` on overlay layers**: Always add `pointer-events: none` to all `.layer` elements so text can't be blocked.

---

## 10. Visual References

- Vox.com editorial design (2018-present) — paper grain, 2-color images, serif body
- The Guardian Weekend Magazine — editorial spreads with cutout typography
- David Carson — "The End of Print" (chaotic anti-grid roots, evolved into editorial)
- Russian Constructivist posters — 2-color printing, bold geometry
- Wolfgang Weingart — Swiss Punk typography
- Neville Brody — The Face magazine (1980s editorial chaos)

---

*Added 2026-06-16 during poster iteration for "La Passion de Jeanne d'Arc" / "Bigmouth Strikes Again" project.*
*Style direction: Vox editorial, B&W 2-color, paper grain, newspaper clipping, paint strokes.*
*Iteration pattern: Carlos workflow (background person, design interaction, paper magazine style).*
