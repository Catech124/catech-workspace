import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Camera,
  Film,
  ChevronRight,
  ChevronLeft,
  RotateCw,
} from "lucide-react";

// ─── Export types (Toolcraft contract) ───────────────────────────────────────
type VideoResolution = "current" | "4k";
type ImageResolution = "current" | "2k" | "4k" | "8k";

const VIDEO_MAX_SIZES: Record<Exclude<VideoResolution, "current">, { width: number; height: number }> = {
  "4k": { width: 3840, height: 2160 },
};

const IMAGE_LONG_EDGES: Record<Exclude<ImageResolution, "current">, number> = {
  "2k": 2048,
  "4k": 4096,
  "8k": 8192,
};

function roundVideoDim(v: number): number {
  return Math.max(2, Math.round(v / 2) * 2);
}

function getVideoExportSize(resolution: VideoResolution, cssW: number, cssH: number) {
  const target = VIDEO_MAX_SIZES[resolution as Exclude<VideoResolution, "current">];
  if (!target) {
    return { width: roundVideoDim(cssW), height: roundVideoDim(cssH) };
  }
  const ratio = Math.min(target.width / cssW, target.height / cssH);
  return { width: roundVideoDim(cssW * ratio), height: roundVideoDim(cssH * ratio) };
}

function getImageExportSize(resolution: ImageResolution, cssW: number, cssH: number) {
  const longEdge = IMAGE_LONG_EDGES[resolution as Exclude<ImageResolution, "current">];
  if (!longEdge) {
    return { width: Math.ceil(cssW * 2), height: Math.ceil(cssH * 2) };
  }
  const dominant = Math.max(cssW, cssH);
  const ratio = longEdge / dominant;
  return {
    width: cssW >= cssH ? longEdge : Math.max(1, Math.round(cssW * ratio)),
    height: cssW >= cssH ? Math.max(1, Math.round(cssH * ratio)) : longEdge,
  };
}

// ─── Design config type ──────────────────────────────────────────────────────
type DesignConfig = {
  // Text
  text: string;
  chineseText: string;
  fontSize: number;
  baseFontWeight: number;
  fontFamily: string;
  textColor: string;
  bgColor: string;
  // Animation
  duration: number;
  stretchAmount: number;
  reformAmount: number;
  stagger: number;
  // Effects
  chromaticIntensity: number;
  glowIntensity: number;
  scanlineIntensity: number;
  vignetteIntensity: number;
  // Chinese chars
  chineseFontSize: number;
  chineseColor: string;
  // Phase timing (% of total)
  initialEnd: number;
  stretchEnd: number;
  // Export settings
  videoResolution: VideoResolution;
  imageResolution: ImageResolution;
  videoFps: number;
  videoBitrate: number;
};

const DEFAULT_CONFIG: DesignConfig = {
  text: "EVERYTHINGEVERYWHEREALLATONCE",
  chineseText: "天馬行空",
  fontSize: 2.5,
  baseFontWeight: 300,
  fontFamily: "system-ui, sans-serif",
  textColor: "#ffffff",
  bgColor: "#000000",
  duration: 7,
  stretchAmount: 35,
  reformAmount: 12,
  stagger: 0.08,
  chromaticIntensity: 1,
  glowIntensity: 1,
  scanlineIntensity: 1,
  vignetteIntensity: 1,
  chineseFontSize: 14,
  chineseColor: "#ffffff",
  initialEnd: 25,
  stretchEnd: 65,
  // Export defaults
  videoResolution: "current",
  imageResolution: "current",
  videoFps: 30,
  videoBitrate: 8,
};

// ─── Color helpers ──────────────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "");
  const full = h.length === 3
    ? h.split("").map((c) => c + c).join("")
    : h;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// ─── Math helpers ────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Letter style computation ────────────────────────────────────────────────
function getLetterStyle(
  index: number,
  total: number,
  progress: number,
  config: DesignConfig,
) {
  const normalizedIndex = index / total;
  const offsetFromCenter = Math.abs(normalizedIndex - 0.5);
  const centerBias = 1 - offsetFromCenter * 0.6;
  const edgeSkew = Math.sin(normalizedIndex * Math.PI) * 4;
  const staggerOffset = offsetFromCenter * config.stagger;

  const iEnd = config.initialEnd / 100;
  const sEnd = config.stretchEnd / 100;

  if (progress < iEnd) {
    const fadeIn = smoothstep(0, 0.1, progress);
    return {
      scaleY: 1,
      skewX: 0,
      opacity: fadeIn,
      textShadow: "none",
      letterSpacing: "0.05em",
      fontWeight: config.baseFontWeight,
    };
  }

  if (progress < sEnd) {
    const sp = smoothstep(iEnd + staggerOffset, sEnd - staggerOffset, progress);
    const scaleY = lerp(1, 1 + config.stretchAmount * centerBias, easeOutCubic(sp));
    const redOffset = lerp(0, 3, sp) * config.chromaticIntensity;
    const glow = lerp(0, 25, sp) * config.glowIntensity;

    return {
      scaleY,
      skewX: lerp(0, edgeSkew, sp),
      opacity: 1,
      textShadow: [
        `${redOffset}px 0 0 rgba(255, 0, 0, ${0.8 * sp * config.chromaticIntensity})`,
        `${-redOffset}px 0 0 rgba(0, 255, 255, ${0.8 * sp * config.chromaticIntensity})`,
        `0 0 ${glow}px rgba(255, 255, 255, ${0.5 * sp * config.glowIntensity})`,
      ].join(", "),
      letterSpacing: lerp(0.05, 0.07, sp) + "em",
      fontWeight: lerp(config.baseFontWeight, 100, sp),
    };
  }

  const rp = smoothstep(sEnd + staggerOffset * 0.5, 1.0, progress);
  const snapBack = easeInOutCubic(rp);
  const scaleY = lerp(
    1 + config.stretchAmount * centerBias,
    1 + config.reformAmount * centerBias,
    snapBack,
  );
  const chromatic = lerp(1, 0.4, snapBack) * config.chromaticIntensity;
  const glow = lerp(25, 8, snapBack) * config.glowIntensity;

  return {
    scaleY,
    skewX: lerp(edgeSkew, edgeSkew * 0.3, snapBack),
    opacity: 1,
    textShadow: [
      `${chromatic * 1.5}px 0 0 rgba(255, 0, 0, ${(0.4 + 0.4 * (1 - snapBack)) * config.chromaticIntensity})`,
      `${-chromatic * 1.5}px 0 0 rgba(0, 255, 255, ${(0.4 + 0.4 * (1 - snapBack)) * config.chromaticIntensity})`,
      `0 0 ${glow}px rgba(255, 255, 255, ${(0.2 + 0.3 * (1 - snapBack)) * config.glowIntensity})`,
    ].join(", "),
    letterSpacing: lerp(0.07, 0.06, snapBack) + "em",
    fontWeight: lerp(100, 200, snapBack),
  };
}

// ─── Settings panel primitives ───────────────────────────────────────────────
function SliderParam({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/50 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[10px] font-mono text-white/70 tabular-nums">
          {Number.isInteger(step) ? value : value.toFixed(step < 0.1 ? 2 : 1)}
          {unit || ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 appearance-none bg-white/10 rounded-full outline-none
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,255,255,0.3)]"
      />
    </div>
  );
}

function ColorParam({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/50 uppercase tracking-wider">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-white/40">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-5 h-5 rounded border border-white/10 cursor-pointer bg-transparent"
        />
      </div>
    </div>
  );
}

function TextParam({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-white/50 uppercase tracking-wider">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1 text-[11px] font-mono text-white/80 bg-white/5 border border-white/10 rounded outline-none focus:border-white/30"
      />
    </div>
  );
}

function SelectParam({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/50 uppercase tracking-wider">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2 py-1 text-[10px] font-mono text-white/80 bg-white/5 border border-white/10 rounded outline-none cursor-pointer
          [&>option]:bg-black [&>option]:text-white"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold text-white/30 uppercase tracking-widest border-b border-white/5 pb-1 mb-2">
      {children}
    </h3>
  );
}

// ─── Export hook (Toolcraft-compliant) ──────────────────────────────────────
function useExportVideo(
  renderFrame: (progress: number, w: number, h: number) => Promise<void>,
  config: DesignConfig,
) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportPhase, setExportPhase] = useState("");

  const exportVideo = useCallback(async () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#animation-canvas");
    if (!canvas) return;

    const cssW = 1920;
    const cssH = 1080;
    const { width: exportW, height: exportH } = getVideoExportSize(
      config.videoResolution, cssW, cssH,
    );

    setIsExporting(true);
    setExportProgress(0);
    setExportPhase("Rendering frames...");

    try {
      // Set canvas dimensions BEFORE captureStream (Toolcraft contract)
      canvas.width = exportW;
      canvas.height = exportH;

      const fps = config.videoFps;
      const totalFrames = Math.ceil(config.duration * fps);
      const stream = canvas.captureStream(fps);

      // Determine MIME type with fallback (Toolcraft contract)
      // Note: MP4 via MediaRecorder is not supported in browsers;
      // WebM is the baseline. MP4 export would need an external transcoder.
      const mimeCandidates = [
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];

      let mimeType = "";
      for (const candidate of mimeCandidates) {
        if (MediaRecorder.isTypeSupported(candidate)) {
          mimeType = candidate;
          break;
        }
      }
      if (!mimeType) {
        throw new Error(
          `No supported WebM MIME type. ` +
          `Tried: ${mimeCandidates.join(", ")}`,
        );
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: config.videoBitrate * 1_000_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      // Reject recorder errors (Toolcraft contract)
      const recorderError = new Promise<never>((_, reject) => {
        recorder.onerror = () => {
          reject(new Error("MediaRecorder error during video export"));
        };
      });

      const done = new Promise<void>((resolve, reject) => {
        recorder.onstop = () => {
          try {
            const blob = new Blob(chunks, { type: mimeType });
            if (blob.size === 0) {
              reject(new Error("Exported video blob is empty — corrupt output."));
              return;
            }
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const ext = "webm";
            a.download = `typography-${Date.now()}.${ext}`;
            a.click();
            URL.revokeObjectURL(url);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
      });

      recorder.start();

      // Render frames with frame-based progress (Toolcraft contract)
      for (let i = 0; i <= totalFrames; i++) {
        const p = i / totalFrames;
        setExportPhase(`Rendering frame ${i}/${totalFrames}`);
        await renderFrame(p, exportW, exportH);
        // Wait for canvas paint
        await new Promise((r) => requestAnimationFrame(r));
        setExportProgress(Math.round((i / totalFrames) * 80));
      }

      setExportPhase("Encoding video...");
      setExportProgress(85);
      recorder.stop();

      await Promise.race([done, recorderError]);
      setExportProgress(100);
    } catch (err) {
      console.error("Video export failed:", err);
      alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setExportPhase("");
    }
  }, [config, renderFrame]);

  const exportPNG = useCallback(async () => {
    const canvas = document.querySelector<HTMLCanvasElement>("#animation-canvas");
    if (!canvas) return;

    const cssW = 1920;
    const cssH = 1080;
    const { width: exportW, height: exportH } = getImageExportSize(
      config.imageResolution, cssW, cssH,
    );

    setIsExporting(true);
    setExportPhase("Rendering PNG...");

    try {
      canvas.width = exportW;
      canvas.height = exportH;
      await renderFrame(0, exportW, exportH);
      await new Promise((r) => requestAnimationFrame(r));

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `typography-${config.imageResolution}-${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setIsExporting(false);
      setExportPhase("");
    }
  }, [config, renderFrame]);

  return { exportVideo, exportPNG, isExporting, exportProgress, exportPhase };
}

// ─── Main component ──────────────────────────────────────────────────────────
export function TypographyAnimation(): React.JSX.Element {
  const [config, setConfig] = useState<DesignConfig>(DEFAULT_CONFIG);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showPanel, setShowPanel] = useState(true);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const lastFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animContainerRef = useRef<HTMLDivElement>(null);

  const letters = useMemo(() => config.text.split(""), [config.text]);
  const iEnd = config.initialEnd / 100;
  const sEnd = config.stretchEnd / 100;

  // ── Render to canvas for export ──
  const renderFrameToCanvas = useCallback(
    async (p: number, w: number, h: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = config.bgColor;
      ctx.fillRect(0, 0, w, h);

      // Chinese characters
      const showChinese = p > iEnd + 0.01;
      if (showChinese) {
        const cp = getChineseCharProps(p, iEnd, sEnd);
        ctx.save();
        ctx.globalAlpha = cp.opacity;
        ctx.filter = `blur(${cp.blur}px)`;
        ctx.fillStyle = config.chineseColor;
        ctx.font = `700 ${config.chineseFontSize * 10}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(255,255,255,0.3)";
        ctx.shadowBlur = 40;
        ctx.fillText(config.chineseText, w / 2, h / 2 + cp.y * 3);
        ctx.restore();
      }

      // Letters
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fontSizePx = config.fontSize * (w / 100);
      const totalWidth = letters.length * fontSizePx * 0.65;
      const startX = (w - totalWidth) / 2;

      letters.forEach((letter, index) => {
        const style = getLetterStyle(index, letters.length, p, config);
        ctx.save();
        const x = startX + index * fontSizePx * 0.65 + fontSizePx * 0.325;
        const y = h / 2;
        ctx.translate(x, y);
        ctx.scale(1, style.scaleY);
        ctx.rotate((style.skewX * Math.PI) / 180);
        ctx.globalAlpha = style.opacity;
        ctx.fillStyle = config.textColor;
        ctx.font = `${style.fontWeight} ${config.fontSize * 10}px ${config.fontFamily}`;
        ctx.shadowColor = "rgba(255,255,255,0.3)";
        ctx.shadowBlur = 10 * config.glowIntensity;
        ctx.fillText(letter, 0, 0);
        ctx.restore();
      });
    },
    [config, letters, iEnd, sEnd],
  );

  // ── Export ──
  const { exportVideo, exportPNG, isExporting, exportProgress, exportPhase } =
    useExportVideo(renderFrameToCanvas, config);

  // ── Animation loop ──
  useEffect(() => {
    if (!isPlaying || isDraggingScrubber) {
      lastFrameRef.current = null;
      return;
    }

    let rafId: number;
    const tick = (timestamp: number) => {
      if (lastFrameRef.current === null) lastFrameRef.current = timestamp;
      const delta = (timestamp - lastFrameRef.current) / 1000;
      lastFrameRef.current = timestamp;

      setProgress((prev) => {
        const next = prev + (delta * speed) / config.duration;
        if (next >= 1) {
          setIsPlaying(false);
          return 1;
        }
        return next;
      });

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speed, isDraggingScrubber, config.duration]);

  const handleReplay = useCallback(() => {
    setProgress(0);
    lastFrameRef.current = null;
    setIsPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (progress >= 1) {
      setProgress(0);
      lastFrameRef.current = null;
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [progress]);

  // ── Scrubber ──
  const scrubberCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => () => scrubberCleanupRef.current?.(), []);

  const handleScrubberPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      setIsDraggingScrubber(true);
      setIsPlaying(false);

      const update = (clientX: number) => {
        const el = scrubberRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setProgress(
          Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
        );
      };

      update(e.clientX);
      const onMove = (ev: PointerEvent) => update(ev.clientX);
      const onUp = () => {
        setIsDraggingScrubber(false);
        scrubberCleanupRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      scrubberCleanupRef.current = onUp;
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [],
  );

  // ── Keyboard ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "k") {
        e.preventDefault();
        handleTogglePlay();
      }
      if (e.key === "r") handleReplay();
      if (e.key === "ArrowLeft")
        setProgress((p) => Math.max(0, p - 0.02));
      if (e.key === "ArrowRight")
        setProgress((p) => Math.min(1, p + 0.02));
      if (e.key === "Escape") setShowPanel((s) => !s);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleTogglePlay, handleReplay]);

  // ── Derived ──
  const chineseProps = getChineseCharProps(progress, iEnd, sEnd);
  const showChinese = progress > iEnd + 0.01;
  const scanlineOpacity = getScanlineOpacity(
    progress, iEnd, sEnd, config.scanlineIntensity,
  );
  const progressPercent = (progress * 100).toFixed(1);
  const currentTime = (progress * config.duration).toFixed(1);

  // ── Export size preview ──
  const videoSize = getVideoExportSize(config.videoResolution, 1920, 1080);
  const imageSize = getImageExportSize(config.imageResolution, 1920, 1080);

  return (
    <div
      className="relative flex overflow-hidden bg-black"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Hidden canvas for export */}
      <canvas ref={canvasRef} className="hidden" id="animation-canvas" />

      {/* ── Animation stage ── */}
      <div
        ref={animContainerRef}
        className="relative flex-1 flex items-center justify-center"
        style={{ perspective: "1000px" }}
      >
        {/* Chinese characters */}
        {showChinese && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              opacity: chineseProps.opacity,
              transform: `scale(${chineseProps.scale}) translateY(${chineseProps.y}px)`,
              filter: `blur(${chineseProps.blur}px)`,
              willChange: "transform, opacity, filter",
              transition: isDraggingScrubber ? "none" : undefined,
            }}
          >
            <span
              className="font-serif"
              style={{
                fontSize: `clamp(3rem, ${config.chineseFontSize}vw, ${config.chineseFontSize}rem)`,
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: config.chineseColor,
                textShadow: `0 0 40px ${config.chineseColor}4d, 0 0 80px ${config.chineseColor}1a`,
              }}
            >
              {config.chineseText}
            </span>
          </div>
        )}

        {/* Main text */}
        <div
          className="relative z-10 flex flex-wrap justify-center items-center"
          style={{ maxWidth: "90vw", gap: 0 }}
        >
          {letters.map((letter, index) => {
            const style = getLetterStyle(index, letters.length, progress, config);
            return (
              <span
                key={index}
                className="inline-block"
                style={{
                  fontSize: `clamp(0.5rem, ${config.fontSize}vw, ${config.fontSize}rem)`,
                  transformOrigin: "center center",
                  display: "inline-block",
                  fontFamily: config.fontFamily,
                  transform: `scaleY(${style.scaleY}) skewX(${style.skewX}deg)`,
                  opacity: style.opacity,
                  textShadow: style.textShadow,
                  letterSpacing: style.letterSpacing,
                  fontWeight: style.fontWeight,
                  color: config.textColor,
                  willChange: "transform",
                  transition: isDraggingScrubber ? "none" : undefined,
                }}
              >
                {letter}
              </span>
            );
          })}
        </div>

        {/* Scanlines */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            opacity: scanlineOpacity,
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)`,
            willChange: "opacity",
            transition: isDraggingScrubber ? "none" : undefined,
          }}
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: (() => {
              const { r, g, b } = hexToRgb(config.bgColor);
              return `radial-gradient(ellipse at center, transparent 0%, transparent ${55 + config.vignetteIntensity * 15}%, rgba(${r},${g},${b},${(config.vignetteIntensity * 0.8).toFixed(2)}) 100%)`;
            })(),
          }}
        />

        {/* Panel toggle */}
        <button
          onClick={() => setShowPanel((s) => !s)}
          className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-black/50 text-white/50 hover:text-white hover:bg-black/70 transition-all backdrop-blur-sm"
          title={showPanel ? "Hide panel (Esc)" : "Show panel (Esc)"}
          type="button"
        >
          {showPanel ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Export progress overlay */}
        {isExporting && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Film className="h-8 w-8 text-white animate-pulse" />
              <span className="text-sm text-white/80">{exportPhase}</span>
              <span className="text-xs text-white/50">{exportProgress}%</span>
              <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white/60 transition-all duration-150"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Settings panel ── */}
      <div
        className="relative z-40 flex flex-col bg-black/80 backdrop-blur-md border-l border-white/5 overflow-y-auto transition-all duration-300"
        style={{
          width: showPanel ? "18rem" : "0",
          opacity: showPanel ? 1 : 0,
          minWidth: showPanel ? "18rem" : "0",
        }}
      >
        <div className="flex flex-col gap-4 p-4 min-w-[18rem]">
          {/* ── Image Export ── */}
          <SectionTitle>Image Export</SectionTitle>
          <SelectParam
            label="Resolution"
            value={config.imageResolution}
            options={[
              { label: `Current (${imageSize.width}×${imageSize.height})`, value: "current" },
              { label: "2K (2048px)", value: "2k" },
              { label: "4K (4096px)", value: "4k" },
              { label: "8K (8192px)", value: "8k" },
            ]}
            onChange={(v) => setConfig((c) => ({ ...c, imageResolution: v as ImageResolution }))}
          />
          <button
            onClick={exportPNG}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg transition-all disabled:opacity-50"
            type="button"
          >
            <Camera className="h-3.5 w-3.5" />
            Export PNG
          </button>

          {/* ── Video Export ── */}
          <SectionTitle>Video Export</SectionTitle>
          <SelectParam
            label="Resolution"
            value={config.videoResolution}
            options={[
              { label: `Current (${videoSize.width}×${videoSize.height})`, value: "current" },
              { label: "4K (3840×2160)", value: "4k" },
            ]}
            onChange={(v) => setConfig((c) => ({ ...c, videoResolution: v as VideoResolution }))}
          />
          <SliderParam
            label="FPS"
            value={config.videoFps}
            min={24}
            max={60}
            step={1}
            onChange={(v) => setConfig((c) => ({ ...c, videoFps: v }))}
          />
          <SliderParam
            label="Bitrate"
            value={config.videoBitrate}
            min={2}
            max={30}
            step={1}
            unit="Mbps"
            onChange={(v) => setConfig((c) => ({ ...c, videoBitrate: v }))}
          />
          <button
            onClick={exportVideo}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-medium text-white bg-white/10 hover:bg-white/15 rounded-lg transition-all disabled:opacity-50"
            type="button"
          >
            <Film className="h-3.5 w-3.5" />
            Export Video
          </button>

          {/* ── Text ── */}
          <SectionTitle>Text</SectionTitle>
          <TextParam
            label="Main text"
            value={config.text}
            onChange={(v) => setConfig((c) => ({ ...c, text: v }))}
          />
          <TextParam
            label="Chinese text"
            value={config.chineseText}
            onChange={(v) => setConfig((c) => ({ ...c, chineseText: v }))}
          />

          {/* ── Typography ── */}
          <SectionTitle>Typography</SectionTitle>
          <SliderParam
            label="Font size"
            value={config.fontSize}
            min={0.5}
            max={6}
            step={0.1}
            unit="vw"
            onChange={(v) => setConfig((c) => ({ ...c, fontSize: v }))}
          />
          <SliderParam
            label="Base weight"
            value={config.baseFontWeight}
            min={100}
            max={700}
            step={100}
            onChange={(v) => setConfig((c) => ({ ...c, baseFontWeight: v }))}
          />
          <SliderParam
            label="Chinese size"
            value={config.chineseFontSize}
            min={4}
            max={24}
            step={0.5}
            unit="vw"
            onChange={(v) => setConfig((c) => ({ ...c, chineseFontSize: v }))}
          />

          {/* ── Colors ── */}
          <SectionTitle>Colors</SectionTitle>
          <TextParam
            label="Font family"
            value={config.fontFamily}
            onChange={(v) => setConfig((c) => ({ ...c, fontFamily: v }))}
          />
          <ColorParam
            label="Text"
            value={config.textColor}
            onChange={(v) => setConfig((c) => ({ ...c, textColor: v }))}
          />
          <ColorParam
            label="Background"
            value={config.bgColor}
            onChange={(v) => setConfig((c) => ({ ...c, bgColor: v }))}
          />
          <ColorParam
            label="Chinese"
            value={config.chineseColor}
            onChange={(v) => setConfig((c) => ({ ...c, chineseColor: v }))}
          />

          {/* ── Animation ── */}
          <SectionTitle>Animation</SectionTitle>
          <SliderParam
            label="Duration"
            value={config.duration}
            min={2}
            max={20}
            step={0.5}
            unit="s"
            onChange={(v) => setConfig((c) => ({ ...c, duration: v }))}
          />
          <SliderParam
            label="Stretch"
            value={config.stretchAmount}
            min={5}
            max={60}
            step={1}
            onChange={(v) => setConfig((c) => ({ ...c, stretchAmount: v }))}
          />
          <SliderParam
            label="Reform"
            value={config.reformAmount}
            min={2}
            max={30}
            step={1}
            onChange={(v) => setConfig((c) => ({ ...c, reformAmount: v }))}
          />
          <SliderParam
            label="Stagger"
            value={config.stagger}
            min={0}
            max={0.2}
            step={0.01}
            onChange={(v) => setConfig((c) => ({ ...c, stagger: v }))}
          />

          {/* ── Phase timing ── */}
          <SectionTitle>Phase timing</SectionTitle>
          <SliderParam
            label="Initial end"
            value={config.initialEnd}
            min={5}
            max={45}
            step={1}
            unit="%"
            onChange={(v) => setConfig((c) => ({ ...c, initialEnd: v }))}
          />
          <SliderParam
            label="Stretch end"
            value={config.stretchEnd}
            min={30}
            max={85}
            step={1}
            unit="%"
            onChange={(v) => setConfig((c) => ({ ...c, stretchEnd: v }))}
          />

          {/* ── Effects ── */}
          <SectionTitle>Effects</SectionTitle>
          <SliderParam
            label="Chromatic"
            value={config.chromaticIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => setConfig((c) => ({ ...c, chromaticIntensity: v }))}
          />
          <SliderParam
            label="Glow"
            value={config.glowIntensity}
            min={0}
            max={3}
            step={0.1}
            onChange={(v) => setConfig((c) => ({ ...c, glowIntensity: v }))}
          />
          <SliderParam
            label="Scanlines"
            value={config.scanlineIntensity}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => setConfig((c) => ({ ...c, scanlineIntensity: v }))}
          />
          <SliderParam
            label="Vignette"
            value={config.vignetteIntensity}
            min={0}
            max={2}
            step={0.1}
            onChange={(v) => setConfig((c) => ({ ...c, vignetteIntensity: v }))}
          />

          {/* ── Reset ── */}
          <button
            onClick={() => setConfig(DEFAULT_CONFIG)}
            className="flex items-center justify-center gap-2 px-3 py-2 text-[11px] text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all border border-white/5"
            type="button"
          >
            <RotateCw className="h-3 w-3" />
            Reset all
          </button>

          {/* ── Keyboard shortcuts ── */}
          <div className="text-[9px] text-white/20 font-mono leading-relaxed border-t border-white/5 pt-3">
            <p>Space/K: Play/Pause</p>
            <p>R: Replay</p>
            <p>←/→: Seek ±2%</p>
            <p>Esc: Toggle panel</p>
          </div>
        </div>
      </div>

      {/* ── Bottom playback bar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-40 flex flex-col items-center gap-2 px-4 pb-4">
        {/* Scrubber */}
        <div
          ref={scrubberRef}
          className="relative w-full max-w-2xl h-6 cursor-pointer group"
          onPointerDown={handleScrubberPointerDown}
          role="slider"
          aria-label="Timeline"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          tabIndex={0}
        >
          <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 rounded-full bg-white/10 group-hover:bg-white/15 transition-colors" />
          <div
            className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-white/60"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="absolute top-1/2 h-2.5 -translate-y-1/2 w-px bg-white/20"
            style={{ left: `${iEnd * 100}%` }}
          />
          <div
            className="absolute top-1/2 h-2.5 -translate-y-1/2 w-px bg-white/20"
            style={{ left: `${sEnd * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)] group-hover:scale-125 transition-transform"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        {/* Transport */}
        <div className="flex items-center justify-between w-full max-w-2xl">
          <div className="font-mono text-[11px] text-white/50 tabular-nums w-24">
            {currentTime}s / {config.duration}s
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReplay}
              className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-all"
              title="Replay (R)"
              type="button"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleTogglePlay}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
              type="button"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
          </div>
          <div className="flex items-center gap-3 w-24 justify-end">
            <span className="font-mono text-[10px] text-white/30 tabular-nums">
              {progressPercent}%
            </span>
            <div className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-white/40" />
              {[0.25, 0.5, 1, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-1 py-0.5 text-[9px] font-mono rounded transition-all ${
                    speed === s
                      ? "bg-white/20 text-white"
                      : "text-white/40 hover:text-white/70"
                  }`}
                  type="button"
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Scanline / Chinese helpers ──────────────────────────────────────────────
function getScanlineOpacity(
  progress: number,
  iEnd: number,
  sEnd: number,
  intensity: number,
): number {
  if (progress < iEnd) return 0.08 * intensity;
  if (progress < sEnd) {
    return lerp(0.08, 0.35, smoothstep(iEnd, sEnd * 0.8, progress)) * intensity;
  }
  return lerp(0.35, 0.12, smoothstep(sEnd, 1.0, progress)) * intensity;
}

function getChineseCharProps(progress: number, iEnd: number, sEnd: number) {
  if (progress < iEnd + 0.05) {
    return { opacity: 0, scale: 0.85, blur: 20, y: 20 };
  }
  if (progress < sEnd) {
    const enter = smoothstep(iEnd + 0.05, iEnd + 0.25, progress);
    return {
      opacity: enter,
      scale: lerp(0.85, 1, enter),
      blur: lerp(20, 0, enter),
      y: lerp(20, 0, enter),
    };
  }
  const exit = smoothstep(sEnd, 0.95, progress);
  return {
    opacity: lerp(1, 0, exit),
    scale: lerp(1, 1.15, exit),
    blur: lerp(0, 25, exit),
    y: lerp(0, -10, exit),
  };
}
