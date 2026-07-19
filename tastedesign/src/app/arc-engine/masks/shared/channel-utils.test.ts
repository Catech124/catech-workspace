// channel-utils.test.ts — Unit tests for channel utilities
import { describe, expect, it } from "vitest";
import { getChannelValue, remapChannels } from "./channel-utils";
import type { ChannelMapping } from "./channel-utils";

describe("getChannelValue", () => {
  const data = new Uint8ClampedArray([10, 20, 30, 200, 50, 60, 70, 255]);

  it("extracts red channel", () => {
    expect(getChannelValue(data, 0, "red")).toBe(10);
    expect(getChannelValue(data, 4, "red")).toBe(50);
  });

  it("extracts green channel", () => {
    expect(getChannelValue(data, 0, "green")).toBe(20);
  });

  it("extracts blue channel", () => {
    expect(getChannelValue(data, 0, "blue")).toBe(30);
  });

  it("extracts alpha channel", () => {
    expect(getChannelValue(data, 0, "alpha")).toBe(200);
    expect(getChannelValue(data, 4, "alpha")).toBe(255);
  });

  it("computes luminance", () => {
    // luma = 10*0.299 + 20*0.587 + 30*0.114 = 2.99 + 11.74 + 3.42 = 18.15 → 18
    const luma = getChannelValue(data, 0, "luminance");
    expect(luma).toBe(Math.round(10 * 0.299 + 20 * 0.587 + 30 * 0.114));
  });

  it("returns 0 for zero channel", () => {
    expect(getChannelValue(data, 0, "zero")).toBe(0);
  });

  it("returns 255 for one channel", () => {
    expect(getChannelValue(data, 0, "one")).toBe(255);
  });

  it("returns 0 when data is null", () => {
    expect(getChannelValue(null, 0, "red")).toBe(0);
    expect(getChannelValue(null, 0, "alpha")).toBe(0);
  });

  it("handles full white pixel luminance", () => {
    const white = new Uint8ClampedArray([255, 255, 255, 255]);
    expect(getChannelValue(white, 0, "luminance")).toBe(255);
  });

  it("handles full black pixel luminance", () => {
    const black = new Uint8ClampedArray([0, 0, 0, 255]);
    expect(getChannelValue(black, 0, "luminance")).toBe(0);
  });
});

describe("remapChannels", () => {
  const firstData = new Uint8ClampedArray([10, 20, 30, 200, 50, 60, 70, 255]);

  it("identity mapping (first source)", () => {
    const mapping: ChannelMapping = {
      r: { source: "first", channel: "red" },
      g: { source: "first", channel: "green" },
      b: { source: "first", channel: "blue" },
      a: { source: "first", channel: "alpha" },
    };
    const result = remapChannels(firstData, null, mapping);
    expect(result[0]).toBe(10);
    expect(result[1]).toBe(20);
    expect(result[2]).toBe(30);
    expect(result[3]).toBe(200);
    expect(result[4]).toBe(50);
    expect(result[7]).toBe(255);
  });

  it("alpha from luminance", () => {
    const mapping: ChannelMapping = {
      r: { source: "first", channel: "red" },
      g: { source: "first", channel: "green" },
      b: { source: "first", channel: "blue" },
      a: { source: "first", channel: "luminance" },
    };
    const result = remapChannels(firstData, null, mapping);
    const expectedLuma = Math.round(10 * 0.299 + 20 * 0.587 + 30 * 0.114);
    expect(result[3]).toBe(expectedLuma);
  });

  it("invert flips all channels", () => {
    const mapping: ChannelMapping = {
      r: { source: "first", channel: "red" },
      g: { source: "first", channel: "green" },
      b: { source: "first", channel: "blue" },
      a: { source: "first", channel: "alpha" },
      invert: true,
    };
    const result = remapChannels(firstData, null, mapping);
    expect(result[0]).toBe(255 - 10);
    expect(result[1]).toBe(255 - 20);
    expect(result[2]).toBe(255 - 30);
    expect(result[3]).toBe(255 - 200);
  });

  it("zero/one channels produce correct values", () => {
    const mapping: ChannelMapping = {
      r: { source: "first", channel: "zero" },
      g: { source: "first", channel: "one" },
      b: { source: "first", channel: "zero" },
      a: { source: "first", channel: "one" },
    };
    const result = remapChannels(firstData, null, mapping);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(255);
    expect(result[2]).toBe(0);
    expect(result[3]).toBe(255);
  });
});
