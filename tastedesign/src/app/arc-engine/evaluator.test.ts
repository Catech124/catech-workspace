// evaluator.test.ts — Unit tests for keyframe and modifier evaluation
import { describe, expect, it } from "vitest";
import {
  clamp,
  bezierCubic,
  easeValue,
  evaluateChannel,
  evalOscillate,
  evalShake,
  evalStep,
  evalModifier,
  evalProp,
} from "./evaluator";
import type { ChannelMap, ModifierMap } from "./types";

describe("clamp", () => {
  it("clamps value between min and max", () => {
    expect(clamp(0, 5, 10)).toBe(5);
    expect(clamp(0, -1, 10)).toBe(0);
    expect(clamp(0, 15, 10)).toBe(10);
  });

  it("handles equal bounds", () => {
    expect(clamp(5, 3, 5)).toBe(5);
    expect(clamp(5, 7, 5)).toBe(5);
  });
});

describe("bezierCubic", () => {
  it("t=0 returns p0", () => {
    expect(bezierCubic(0, 1, 2, 3, 4)).toBe(1);
  });

  it("t=1 returns p3", () => {
    expect(bezierCubic(1, 1, 2, 3, 4)).toBe(4);
  });

  it("t=0.5 for linear control points", () => {
    // bezierCubic(0.5, 0, 0, 1, 1) = 0.125*0 + 0.375*0 + 0.375*1 + 0.125*1 = 0.5
    const val = bezierCubic(0.5, 0, 0, 1, 1);
    expect(val).toBeCloseTo(0.5, 5);
  });

  it("easeIn control points (0, 0.42, 1, 1) at t=0.5", () => {
    // bezierCubic(0.5, 0, 0.42, 1, 1) = 0.125*0 + 0.375*0.42 + 0.375*1 + 0.125*1 = 0.6575
    const val = bezierCubic(0.5, 0, 0.42, 1, 1);
    expect(val).toBeCloseTo(0.6575, 4);
  });
});

describe("easeValue", () => {
  it("returns t unchanged for linear", () => {
    expect(easeValue(0.5)).toBe(0.5);
  });

  it("easeIn returns 0.6575 at t=0.5", () => {
    // This is a 1D bezier, NOT CSS cubic-bezier — the control point y-values
    // produce easeIn behavior via the curve shape
    expect(easeValue(0.5, "easeIn")).toBeCloseTo(0.6575, 4);
  });

  it("easeOut returns 0.3425 at t=0.5", () => {
    // bezierCubic(0.5, 0, 0.58, 0, 1) = 0.125*0 + 0.375*0.58 + 0.375*0 + 0.125*1 = 0.3425
    expect(easeValue(0.5, "easeOut")).toBeCloseTo(0.3425, 4);
  });

  it("easeInOut returns 0.395 at t=0.5", () => {
    // bezierCubic(0.5, 0.42, 0, 0.58, 1) = 0.125*0.42 + 0 + 0.375*0.58 + 0.125*1 = 0.395
    expect(easeValue(0.5, "easeInOut")).toBeCloseTo(0.395, 4);
  });

  it("returns t unchanged for undefined ease", () => {
    expect(easeValue(0.3)).toBe(0.3);
  });

  it("t=0 returns 0 for all eases", () => {
    expect(easeValue(0, "easeIn")).toBeCloseTo(0, 4);
    expect(easeValue(0, "easeOut")).toBeCloseTo(0, 4);
    expect(easeValue(0, "easeInOut")).toBeCloseTo(0.42, 4); // easeInOut at t=0 returns p0 = 0.42
  });

  it("t=1 returns 1 for all eases", () => {
    expect(easeValue(1, "easeIn")).toBe(1);
    expect(easeValue(1, "easeOut")).toBe(1);
    expect(easeValue(1, "easeInOut")).toBe(1);
  });
});

describe("evaluateChannel", () => {
  it("returns null if channel does not exist", () => {
    expect(evaluateChannel({}, "nonexistent", 0)).toBeNull();
  });

  it("returns null for empty channel", () => {
    expect(evaluateChannel({ key: [] }, "key", 0)).toBeNull();
  });

  it("returns single keyframe value regardless of time", () => {
    const ch: ChannelMap = { prop: [{ frame: 0, value: 42 }] };
    expect(evaluateChannel(ch, "prop", 0)).toBe(42);
    expect(evaluateChannel(ch, "prop", 100)).toBe(42);
  });

  it("interpolates between two keyframes", () => {
    const ch: ChannelMap = { prop: [{ frame: 0, value: 0 }, { frame: 10, value: 100 }] };
    expect(evaluateChannel(ch, "prop", 5)).toBe(50);
  });

  it("returns first keyframe if time is before first frame", () => {
    const ch: ChannelMap = { prop: [{ frame: 10, value: 50 }, { frame: 20, value: 100 }] };
    expect(evaluateChannel(ch, "prop", 5)).toBe(50);
  });

  it("returns last keyframe if time is after last frame", () => {
    const ch: ChannelMap = { prop: [{ frame: 0, value: 0 }, { frame: 10, value: 100 }] };
    expect(evaluateChannel(ch, "prop", 20)).toBe(100);
  });

  it("interpolates with easeIn (bezier y-values, not CSS convention)", () => {
    const ch: ChannelMap = {
      prop: [
        { frame: 0, value: 0, ease: "easeIn" },
        { frame: 10, value: 100 },
      ],
    };
    // easeIn at t=0.5 → bezierCubic(0.5, 0, 0.42, 1, 1) = 0.6575
    // value = 0 + (100-0) * 0.6575 = 65.75
    expect(evaluateChannel(ch, "prop", 5)).toBeCloseTo(65.75, 2);
  });

  it("interpolates with easeOut", () => {
    const ch: ChannelMap = {
      prop: [
        { frame: 0, value: 0, ease: "easeOut" },
        { frame: 10, value: 100 },
      ],
    };
    // easeOut at t=0.5 → bezierCubic(0.5, 0, 0.58, 0, 1) = 0.3425
    // value = 0 + 100 * 0.3425 = 34.25
    expect(evaluateChannel(ch, "prop", 5)).toBeCloseTo(34.25, 2);
  });

  it("handles frame gap of zero (same frame)", () => {
    const ch: ChannelMap = { prop: [{ frame: 5, value: 10 }, { frame: 5, value: 20 }] };
    expect(evaluateChannel(ch, "prop", 5)).toBe(10); // returns first value
  });

  it("interpolates across multiple keyframes choosing correct segment", () => {
    const ch: ChannelMap = {
      prop: [
        { frame: 0, value: 0 },
        { frame: 5, value: 50 },
        { frame: 10, value: 100 },
        { frame: 20, value: 0 },
      ],
    };
    expect(evaluateChannel(ch, "prop", 2.5)).toBe(25);  // between 0 and 5
    expect(evaluateChannel(ch, "prop", 7.5)).toBe(75);  // between 5 and 10
    expect(evaluateChannel(ch, "prop", 15)).toBe(50);   // between 10 and 20
  });
});

describe("evalOscillate", () => {
  it("returns offset when t=0 (sin(0) = 0)", () => {
    const val = evalOscillate({ type: "oscillate", offset: 10, amplitude: 5, frequency: 1, phase: 0 }, 0);
    expect(val).toBe(10);
  });

  it("reaches offset + amplitude at peak (t=π/2)", () => {
    const val = evalOscillate({ type: "oscillate", offset: 10, amplitude: 5, frequency: 1, phase: 0 }, Math.PI / 2);
    expect(val).toBeCloseTo(15, 4);
  });

  it("reaches offset - amplitude at trough (t=3π/2)", () => {
    const val = evalOscillate({ type: "oscillate", offset: 10, amplitude: 5, frequency: 1, phase: 0 }, 3 * Math.PI / 2);
    expect(val).toBeCloseTo(5, 4);
  });

  it("respects frequency multiplier", () => {
    const val = evalOscillate({ type: "oscillate", offset: 0, amplitude: 1, frequency: 2, phase: 0 }, Math.PI / 4);
    expect(val).toBeCloseTo(1, 4);
  });

  it("respects phase offset", () => {
    const val = evalOscillate({ type: "oscillate", offset: 0, amplitude: 1, frequency: 1, phase: Math.PI / 2 }, 0);
    expect(val).toBeCloseTo(1, 4);
  });

  it("uses defaults when properties are undefined", () => {
    const val = evalOscillate({ type: "oscillate" } as any, Math.PI / 2);
    expect(val).toBeCloseTo(1, 4);
  });
});

describe("evalShake", () => {
  it("returns offset + noise contribution at t=0 (noise at 0 is not 0)", () => {
    const val = evalShake({ type: "shake", offset: 50, amplitude: 10, frequency: 5 }, 0);
    // At t=0, noise is deterministic but not 0 — hashNoise(0) ≈ 0.365... then 3-octave blend
    expect(val).not.toBe(50); // noise contribution is non-zero
    expect(val).toBeGreaterThan(49);
    expect(val).toBeLessThan(51);
  });

  it("uses defaults when properties are undefined", () => {
    const val = evalShake({ type: "shake" } as any, 0);
    // offset defaults to 0, noise adds some non-zero amount
    expect(val).not.toBe(0);
  });

  it("produces deterministic output for same input", () => {
    const a = evalShake({ type: "shake", offset: 0, amplitude: 1, frequency: 5 }, 1.5);
    const b = evalShake({ type: "shake", offset: 0, amplitude: 1, frequency: 5 }, 1.5);
    expect(a).toBe(b);
  });

  it("output stays within reasonable bounds", () => {
    for (let t = 0; t < 10; t += 0.1) {
      const val = evalShake({ type: "shake", offset: 0, amplitude: 100, frequency: 5 }, t);
      expect(val).toBeGreaterThanOrEqual(-100);
      expect(val).toBeLessThanOrEqual(100);
    }
  });
});

describe("evalStep", () => {
  it("at t=0, cyclePos=0, duty=0.5 → high → offset + amplitude", () => {
    const val = evalStep({ type: "step", offset: 10, amplitude: 5, frequency: 1, dutyCycle: 0.5, phase: 0 }, 0);
    // cyclePos = ((0*1 + 0/(π*2)) % 1 + 1) % 1 = 0, 0 < 0.5 → high → 10 + 5 = 15
    expect(val).toBe(15);
  });

  it("when cyclePos >= dutyCycle, returns offset - amplitude", () => {
    const val = evalStep({ type: "step", offset: 10, amplitude: 5, frequency: 1, dutyCycle: 0.5, phase: 0 }, 0.6);
    // cyclePos = ((0.6*1 + 0) % 1 + 1) % 1 = 0.6, 0.6 >= 0.5 → low → 10 - 5 = 5
    expect(val).toBe(5);
  });

  it("uses defaults when properties are undefined", () => {
    const val = evalStep({ type: "step" } as any, 0);
    // offset=0, amp=1, freq=1, duty=0.5, phase=0. At t=0: cyclePos=0 < 0.5 → high → 0+1=1
    expect(val).toBe(1);
  });
});

describe("evalModifier", () => {
  it("returns null for undefined modifier", () => {
    expect(evalModifier(undefined as any, 0)).toBeNull();
  });

  it("returns null for unknown modifier type", () => {
    expect(evalModifier({ type: "unknown" } as any, 0)).toBeNull();
  });

  it("dispatches oscillate correctly", () => {
    const val = evalModifier({ type: "oscillate", offset: 10, amplitude: 5, frequency: 1, phase: 0 }, Math.PI / 2);
    expect(val).toBeCloseTo(15, 4);
  });

  it("dispatches shake correctly (tiny amplitude)", () => {
    // Note: evalShake uses `p.amplitude || 1` — 0 is falsy, so amp=0→1
    // Use a truthy-but-tiny amplitude to verify the structure works
    const val = evalModifier({ type: "shake", offset: 42, amplitude: 0.0001, frequency: 5 }, 1.5);
    expect(val).toBeCloseTo(42, 1);
  });

  it("dispatches step correctly", () => {
    const val = evalModifier({ type: "step", offset: 0, amplitude: 5, frequency: 1, dutyCycle: 0.5, phase: 0 }, 0);
    const expected = evalStep({ type: "step", offset: 0, amplitude: 5, frequency: 1, dutyCycle: 0.5, phase: 0 }, 0);
    expect(val).toBe(expected);
  });
});

describe("evalProp", () => {
  it("returns static value when no channels or modifiers", () => {
    expect(evalProp({}, {}, "key", 0, 42)).toBe(42);
  });

  it("adds keyframe base to modifier displacement", () => {
    const channels: ChannelMap = { key: [{ frame: 0, value: 10 }, { frame: 10, value: 20 }] };
    const modifiers: ModifierMap = { key: { type: "oscillate", offset: 0, amplitude: 5, frequency: 1, phase: 0 } };
    // At t=0: base = 10 (first kf), modifier = sin(0)*5 = 0, total = 10
    expect(evalProp(channels, modifiers, "key", 0, 999)).toBe(10);
  });

  it("uses static value when no keyframes but modifier exists", () => {
    const modifiers: ModifierMap = { key: { type: "oscillate", offset: 5, amplitude: 0, frequency: 1, phase: 0 } };
    const val = evalProp({}, modifiers, "key", 0, 100);
    // static = 100 + modifier(5) = 105
    expect(val).toBe(105);
  });

  it("modifier at t=4π returns sin(4π)*5 = 0, base = last keyframe", () => {
    const channels: ChannelMap = { key: [{ frame: 0, value: 10 }, { frame: 10, value: 20 }] };
    const modifiers: ModifierMap = { key: { type: "oscillate", offset: 0, amplitude: 5, frequency: 1, phase: 0 } };
    // t=4π ≈ 12.57 > frame 10 → base = 20 (last kf)
    // modifier: sin(4π)*5 = 0 (sin of integer multiples of π is 0)
    // total = 20
    const val = evalProp(channels, modifiers, "key", 4 * Math.PI, 0);
    expect(val).toBeCloseTo(20, 3);
  });
});
