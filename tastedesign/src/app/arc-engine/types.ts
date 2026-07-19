// types.ts — Shared types for ARC Engine
// ARC Video Editor — Toolcraft Integration

// ═══ Animation System ═══

export interface Keyframe {
  frame: number;
  value: number;
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

export type ChannelMap = Record<string, Keyframe[]>;

export interface OscillateModifier {
  type: 'oscillate';
  offset?: number;
  amplitude?: number;
  frequency?: number;
  phase?: number;
}

export interface ShakeModifier {
  type: 'shake';
  offset?: number;
  amplitude?: number;
  frequency?: number;
}

export interface StepModifier {
  type: 'step';
  offset?: number;
  amplitude?: number;
  frequency?: number;
  dutyCycle?: number;
  phase?: number;
}

export type Modifier = OscillateModifier | ShakeModifier | StepModifier;

export type ModifierMap = Record<string, Modifier>;

// ═══ Node System ═══

export interface NodeConnection {
  nodeId: string;
  output?: string;
}

export interface NodeInput {
  type?: string;
  name?: string;
  connection?: NodeConnection;
}

export interface NodeOutput {
  name: string;
}

export interface NodeProps {
  [key: string]: unknown;
}

export interface NodeDef {
  name: string;
  color: string;
  icon: string;
  cat: string;
  desc: string;
  inputs: string[];
  outputs: string[];
  props: Record<string, unknown>;
  maskInput?: boolean;
  toolbar?: boolean;
}

export interface EditorNode {
  id: string;
  type: string;
  props: NodeProps;
  inputs: NodeInput[];
  outputs?: NodeOutput[];
  isAnchor?: boolean;
  isAutoLayer?: boolean;
  start?: number;
  duration?: number;
}

// ═══ Pipeline ═══

export type BlendMode = GlobalCompositeOperation;

export interface PipelineContext {
  W: number;
  H: number;
  t: number;
  channels: ChannelMap;
  modifiers: ModifierMap;
}

export interface PipelineConfig {
  effectMask: boolean;
  nodeSizing: boolean;
  powerWindow: boolean;
  outputGain: boolean;
}

// ═══ Media Cache ═══

export interface LRUCacheEntry<T> {
  value: T;
  lastAccess: number;
}

// ═══ Color ═══

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
}

// ═══ Point & Curve ═══

export interface Point2D {
  x: number;
  y: number;
}

export interface BezierHandle {
  right: Point2D;
  left: Point2D;
}

// ═══ Mask & Channel ═══

export type ChannelSource = 'red' | 'green' | 'blue' | 'alpha' | 'luminance' | 'zero' | 'one';

export interface ChannelMapping {
  r: { source: 'first' | 'second'; channel: ChannelSource };
  g: { source: 'first' | 'second'; channel: ChannelSource };
  b: { source: 'first' | 'second'; channel: ChannelSource };
  a: { source: 'first' | 'second'; channel: ChannelSource };
  invert?: boolean;
}

// ═══ Power Window ═══

export type PowerWindowShape = 'none' | 'circle' | 'rectangle' | 'polygon' | 'gradient';

// ═══ Node Sizing ═══

export interface NodeSizingProps {
  sizingZoom?: number;
  sizingPanX?: number;
  sizingPanY?: number;
  sizingRotate?: number;
  sizingFlipH?: boolean;
  sizingFlipV?: boolean;
  sizingCropL?: number;
  sizingCropR?: number;
  sizingCropT?: number;
  sizingCropB?: number;
}

// ═══ 3D ═══

export type Mat4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
];

export type Vec4 = [number, number, number, number];

// ═══ Warp (Distortion) ═══

export type WarpFn = (x: number, y: number, i: number, t: number) => { sx: number; sy: number } | null;

// ═══ Node Category Colors (Fusion-inspired) ═══

export const CATEGORY_COLORS: Record<string, string> = {
  source: '#5a7a4a',
  generate: '#3a9a6a',
  effects: '#d4782a',
  blur: '#4a7a7a',
  color: '#7a5a4a',
  keyer: '#4a8a4a',
  distort: '#b84444',
  mask: '#6a6a8a',
  channel: '#8a6a6a',
  composite: '#6a4a8a',
  transform: '#8a6a3a',
  '3d': '#8a4aaa',
  output: '#aa8822',
};
