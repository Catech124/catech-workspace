# CodePen References for Editorial Poster Design

## karabharat/wBWeOex — CSS-Only Morph Effect (PRIMARY REFERENCE)

**URL:** https://codepen.io/karabharat/pen/wBWeOex

### Technique
Pure CSS word rotation with SVG threshold filter for gooey morph effect.

### Key Elements
1. **SVG filter** with `feColorMatrix` (alpha 25, offset -9) + `feComposite` atop
2. **Container** applies `filter: url(#threshold)`
3. **CSS `@keyframes`** animate opacity, filter blur, and scale
4. **Staggered `animation-delay`** per word
5. **Space Grotesk** font
6. **Noise texture** via SVG data URI `background-image`

### Keyframe Pattern
```css
@keyframes rotate-words {
  0% { opacity: 0; filter: blur(20px); transform: translate(-50%, -50%) scale(0.8); }
  5% { opacity: 0.5; filter: blur(10px); }
  15%, 35% { opacity: 1; filter: blur(0px); transform: translate(-50%, -50%) scale(1); }
  45% { opacity: 0.5; filter: blur(10px); }
  50%, 100% { opacity: 0; filter: blur(20px); transform: translate(-50%, -50%) scale(1.2); }
}
```

---

## hzrd149/PPeZGa — SVG Grunge Mask & Pattern

**URL:** https://codepen.io/hzrd149/pen/PPeZGa

### Technique
SVG pattern with grunge texture image used as a mask.

### Key Elements
1. **Alpha filter** converts image to alpha channel
2. **Pattern** tiles the alpha-converted image
3. **Mask** uses the pattern to cut holes in content
4. Produces distressed / worn edges

### Implementation
```svg
<filter id="alpha">
  <feComponentTransfer>
    <feFuncR type="table" tableValues="0 1"/>
    <feFuncG type="table" tableValues="0 1"/>
    <feFuncB type="table" tableValues="0 1"/>
    <feFuncA type="identity"/>
  </feComponentTransfer>
</filter>
<pattern id="pattern1" width="323" height="200" patternUnits="userSpaceOnUse">
  <image filter="url(#alpha)" xlink:href="[grunge-texture-image]"/>
</pattern>
<mask id="mask">
  <rect width="100%" height="100%" fill="url(#pattern1)"/>
</mask>
```

**Note:** This technique requires an external grunge texture image. The original pen used a now-defunct URL. For reliable results, generate noise with SVG `feTurbulence` instead.

---

## ZevanRosser/jOwPMVV — Creative Coding Greyscale Circle Texture

**URL:** https://codepen.io/ZevanRosser/pen/jOwPMVV

### Technique
Canvas-based generative art that draws organic circles and connecting lines.

### Key Elements
1. **Canvas** fills viewport
2. **Brush functions** generate organic circle patterns
3. **Continuous animation** via `requestAnimationFrame`
4. **Fade effect** slowly blends canvas to gray

### Implementation Details
- Canvas must have matching CSS and JS dimensions
- Uses `innerWidth`/`innerHeight` for canvas size
- Each brush draws a cluster of dots/lines every frame
- Background slowly fades with `rgba(155,155,155,0.0018)`

**Note:** Canvas overlay didn't render reliably in testing. CSS `radial-gradient()` approach is more reliable for circle textures.

---

## Carlos's SVG Specular Lighting Noise (2026-06-16)

No CodePen — Carlos provided this SVG directly. Uses `feTurbulence` + `feSpecularLighting` for a paper-bump texture overlay.

### Key Parameters
- `baseFrequency="0.185"` — medium grain
- `numOctaves="4"` — rich detail
- `surfaceScale="19"` — prominent bump height
- `specularExponent="20"` — moderately shiny
- `elevation="188"` — light from above-left

### Recommended Usage
```html
<svg ... style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;
     z-index:9999;mix-blend-mode:multiply;opacity:0.08;">
```
Start at 8% opacity for subtle texture, increase gradually on request.
