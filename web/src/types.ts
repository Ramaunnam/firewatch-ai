export type Cls = 'smoke' | 'fire' | 'person';

export interface Box {
  cls: Cls;
  conf: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FrameRec {
  t: number;
  smoke: number;
  fire: number;
  boxes: Box[];
}

export type EventKind =
  | 'watching'
  | 'person_detected'
  | 'lookalike'
  | 'possible_smoke'
  | 'smoke_warning'
  | 'supervisor'
  | 'flame_seen'
  | 'fire_alert'
  | 'siren'
  | 'fire_team'
  | 'incident'
  | 'acknowledged';

export interface FwEvent {
  t: number;
  kind: EventKind;
  title: string;
  detail: string;
  image?: string | null;
}

export interface Thresholds {
  smoke: number;
  fire: number;
  smokeWindow: number;
  smokeRatio: number;
  fireWindow: number;
  fireRatio: number;
}

export interface Detections {
  video: { src: string; width: number; height: number; fps: number; duration: number; frames: number };
  camera: { id: string; name: string; meta: string };
  thresholds: Thresholds;
  frames: FrameRec[];
  events: FwEvent[];
}

export interface Stats {
  leadTime: number | null;
  smokeToWarning: number | null;
  falseAlarms: number;
  /** Sub-threshold readings caused by a person's own shape/motion. */
  lookalikes: number;
  /** Sub-threshold but genuine (not person-caused) early readings -- real
   * signal, just too brief/faint to confirm yet. */
  traces: number;
  framesChecked: number;
  smokeFrames: number;
  fireFrames: number;
}

export interface Timeline {
  events: FwEvent[];
  stats: Stats;
  smokeWarnAt?: number;
  fireAlertAt?: number;
  firstSmokeAt?: number;
  flameAt?: number;
}

export type Status = 'clear' | 'smoke' | 'fire';
export type Page = 'live' | 'incidents' | 'analytics' | 'settings';
