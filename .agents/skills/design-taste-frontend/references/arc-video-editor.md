# ARC Video Editor - Keyframe Timeline & Modifier Integration

For the ARC video editor project (editor.html), the visual approach combines:
- **CSS-only keyframe animation** with bezier easing (`bezierCubic` + `evaluateChannelValue`)
- **Per-property modifiers** (oscillate, shake) evaluated additively with keyframes
- **Timeline UI showing only diamond nodes** (`.kf-diamond`) on `.node-track` - no clip bars
- **Preview iframe** receiving `KF` + `MODS` via `postMessage` for real-time render
- **Morph text keyframes** with enter/hold/exit phases and bezier eases

## Key Implementation Patterns

```js
// Global keyframe store
animationChannels[key] = [{frame, value, ease, handleIn, handleOut}];

// Modifiers store
modifiers[key] = {type: 'oscillate'|'shake', offset, amplitude, frequency, phase, smoothness};

// Additive evaluation: keyframe + modifier
evaluatePropertyValue(layerId, prop, t) = evaluateChannelValue + evaluateModifier

// Oscillate: offset + amplitude * sin(t * frequency * 2π + phase)
evalOscillate(mod, t) = mod.offset + mod.amplitude * Math.sin(t * mod.frequency * 2 * Math.PI + mod.phase);

// Shake: multi-octave noise
evalShake(mod, t) = noise1D(t * mod.frequency) * mod.amplitude + mod.offset;

// Timeline: only .node-track + .kf-diamond (no .clip bars)
renderTimeline() → creates only diamond nodes on each track

// Preview iframe communication
rebuild() → injects KF + MODS into iframe srcdoc
iframe: evalKF + evalMod + render(t) at each frame
```

## UI Design Preferences

- Native file picker for local images/video (not drag-drop only)
- Visual editor with preview + timeline + adjustable parameters
- Decimal incremental timing adjustments (not integer snapping)
- CSS-only animations (NO GSAP) with `animationChannels` global engine
- Export via `html2canvas` + `canvas.captureStream` (not iframe.captureStream)
- Copilot integration via `copilot-server.py` → `hermes chat -q`
- Windows 10, Brave browser
- Sample packs NEVER deleted without asking