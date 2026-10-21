export type Cls = 'smoke' | 'fire';

export interface Box {
  cls: Cls;
  conf: number;
  /** normalised 0-1 coordinates */
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
  | 'lookalike'
  | 'possible_smoke'
  | 'smoke_warning'
  | 'supervisor'
  | 'flame_seen'
  | 'fire_alert'
  | 'siren'
  | 'fire_team'
  | 'incident';

export interface FwEvent {
  t: number;
  kind: EventKind;
  title: string;
  detail: string;
  image?: string | null;
}

export interface Detections {
  video: { src: string; width: number; height: number; fps: number; duration: number; frames: number };
  camera: { id: string; name: string; meta: string };
  thresholds: {
    smoke: number;
    fire: number;
    smokeWindow: number;
    smokeRatio: number;
    fireWindow: number;
    fireRatio: number;
  };
  frames: FrameRec[];
  events: FwEvent[];
  stats: {
    leadTime: number;
    smokeToWarning: number;
    falseAlarms: number;
    lookalikes: number;
    framesChecked: number;
  };
}

export type Status = 'clear' | 'smoke' | 'fire';
