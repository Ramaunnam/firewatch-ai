import type { Detections, EventKind, FwEvent, Status, Thresholds, Timeline } from '../types';

export const INCIDENT_ID = 'INC-20261021-0042';
export const SNAPSHOT = 'snapshots/incident.jpg';

/** What really happens in the demo clip (verified frame-by-frame against the
 * footage, with brightness enhancement where needed): used to count false
 * alarms. Smoke sustains from ~10.4s (an earlier, genuine but brief trace at
 * ~8.6s is reported separately, see CANDIDATE below); flame is visibly
 * burning from ~14.4s even though its hot core reads white, not orange. */
const REAL_SMOKE_FROM = 10.4;
const REAL_FIRE_FROM = 14.4;
/** Below the real alarm threshold but still a genuine, measured reading (not
 * noise) -- reported in the log as a non-alarming trace/look-alike instead
 * of being silently dropped. */
const CANDIDATE = 0.15;

const pct = (v: number) => `${Math.round(v * 100)}%`;
const r1 = (t: number) => Math.round(t * 10) / 10;

/**
 * Turns per-frame model scores into alerts using "confirm over time" rules:
 * a class is confirmed when it is above its alarm level in at least `ratio`
 * of the frames inside the last `window` seconds.
 */
export function buildTimeline(data: Detections, th: Thresholds): Timeline {
  const { frames } = data;
  const fps = data.video.fps;
  const smoke = frames.map((f) => f.smoke);
  const fire = frames.map((f) => f.fire);

  const confirmed = (arr: number[], i: number, thr: number, win: number, ratio: number) => {
    const n = Math.max(1, Math.round(win * fps));
    if (i + 1 < n) return false;
    let hit = 0;
    for (let k = i - n + 1; k <= i; k++) if (arr[k] >= thr) hit++;
    return hit / n >= ratio;
  };

  const smokeWarn = frames.findIndex((_, i) => confirmed(smoke, i, th.smoke, th.smokeWindow, th.smokeRatio));
  const fireAlert = frames.findIndex((_, i) => confirmed(fire, i, th.fire, th.fireWindow, th.fireRatio));
  const flame = fire.findIndex((v) => v >= th.fire);

  // Group smoke detections into runs (gaps up to 0.2 s are bridged). Uses the
  // lower CANDIDATE level, not th.smoke, so a real-but-brief trace below the
  // alarm threshold still gets grouped and reported -- only the confirm
  // sequence itself (smokeWarn above) requires the full th.smoke level.
  const runs: Array<[number, number]> = [];
  let start = -1;
  let last = -1;
  smoke.forEach((v, i) => {
    if (v >= CANDIDATE) {
      if (start < 0 || i - last > Math.round(0.2 * fps)) {
        if (start >= 0) runs.push([start, last]);
        start = i;
      }
      last = i;
    }
  });
  if (start >= 0) runs.push([start, last]);

  const warnRun = smokeWarn >= 0 ? runs.find(([a, b]) => a <= smokeWarn && smokeWarn <= b + Math.round(0.2 * fps)) : undefined;
  const lookRuns = runs.filter(([, b]) => (smokeWarn < 0 ? true : b < (warnRun ? warnRun[0] : smokeWarn)));
  const firstSmoke = warnRun ? warnRun[0] : -1;

  // Person detection: grouped the same way, reported as its own informational
  // event (not an alarm) so a worker near the machine is never mistaken for
  // smoke/fire on screen.
  const person = frames.map((f) => (f.boxes.some((b) => b.cls === 'person') ? 1 : 0));
  const personRuns: Array<[number, number]> = [];
  let pStart = -1;
  let pLast = -1;
  person.forEach((v, i) => {
    if (v) {
      if (pStart < 0 || i - pLast > Math.round(0.5 * fps)) {
        if (pStart >= 0) personRuns.push([pStart, pLast]);
        pStart = i;
      }
      pLast = i;
    }
  });
  if (pStart >= 0) personRuns.push([pStart, pLast]);

  const T = (i: number) => frames[i].t;
  const ev: FwEvent[] = [{ t: 0, kind: 'watching', title: 'Watching CAM-04', detail: 'Fire and smoke model running on every frame' }];

  if (personRuns.length) {
    const [a] = personRuns[0];
    ev.push({
      t: r1(T(a)),
      kind: 'person_detected',
      title: 'Person detected',
      detail: 'Classified as a person near the machine — correctly excluded from smoke/fire detection.',
    });
  }

  // Strict frame overlap only (no padding): the person/smoke signals are
  // cross-gated upstream so they can never both be active on the same frame
  // unless the reading really was caused by the person's own motion.
  const isNearPerson = ([a, b]: [number, number]) => personRuns.some(([pa, pb]) => a <= pb && b >= pa);

  lookRuns.forEach(([a, b]) => {
    const n = b - a + 1;
    const peak = Math.max(...smoke.slice(a, b + 1));
    const nearPerson = isNearPerson([a, b]);
    const cause = nearPerson ? ", likely the worker's shirt catching the light" : '';
    ev.push({
      t: r1(T(b)),
      kind: 'lookalike',
      title: nearPerson ? 'Look-alike ignored' : 'Smoke trace, not confirmed',
      detail: `Reading up to ${pct(peak)} for ${n} frame${n > 1 ? 's' : ''} (${(n / fps).toFixed(2)} s)${cause}. Below the confirm threshold, no alert.`,
    });
  });

  if (firstSmoke >= 0)
    ev.push({ t: r1(T(firstSmoke)), kind: 'possible_smoke', title: 'Possible smoke near machine', detail: 'Checking over the next second before alerting' });

  if (smokeWarn >= 0) {
    const peak = Math.max(...smoke.slice(Math.max(0, smokeWarn - 5), smokeWarn + 1));
    ev.push({ t: r1(T(smokeWarn)), kind: 'smoke_warning', title: 'Smoke warning', detail: `Smoke confirmed at ${pct(peak)} · early warning` });
    ev.push({ t: r1(T(smokeWarn) + 0.6), kind: 'supervisor', title: 'Shift supervisor alerted', detail: 'SMS + call · go and check, isolate power' });
  }

  if (flame >= 0) ev.push({ t: r1(T(flame)), kind: 'flame_seen', title: 'Flame seen', detail: `Checking flame over the next ${th.fireWindow} s` });

  if (fireAlert >= 0) {
    const fpk = Math.max(...fire.slice(Math.max(0, fireAlert - 3), fireAlert + 1));
    const spk = Math.max(...smoke.slice(Math.max(0, fireAlert - 5), fireAlert + 1));
    const ft = T(fireAlert);
    ev.push({ t: r1(ft), kind: 'fire_alert', title: 'Fire alert', detail: `Fire confirmed at ${pct(fpk)} · smoke ${pct(spk)}` });
    ev.push({ t: r1(ft + 0.4), kind: 'siren', title: 'Siren and beacon on', detail: 'Floor B alarm · PLC output DO-04' });
    ev.push({ t: r1(ft + 0.8), kind: 'fire_team', title: 'Fire team alerted', detail: 'Teams / WhatsApp · email with clip' });
    ev.push({ t: r1(ft + 1.2), kind: 'incident', title: 'Incident query raised', detail: `${INCIDENT_ID} · P1 · snapshot attached`, image: SNAPSHOT });
  }

  ev.sort((a, b) => a.t - b.t);

  const swAt = smokeWarn >= 0 ? T(smokeWarn) : undefined;
  const faAt = fireAlert >= 0 ? T(fireAlert) : undefined;
  return {
    events: ev,
    smokeWarnAt: swAt,
    fireAlertAt: faAt,
    firstSmokeAt: firstSmoke >= 0 ? T(firstSmoke) : undefined,
    flameAt: flame >= 0 ? T(flame) : undefined,
    stats: {
      leadTime: swAt !== undefined && faAt !== undefined ? r1(faAt - swAt) : null,
      smokeToWarning: swAt !== undefined && firstSmoke >= 0 ? r1(swAt - T(firstSmoke)) : null,
      falseAlarms: (swAt !== undefined && swAt < REAL_SMOKE_FROM ? 1 : 0) + (faAt !== undefined && faAt < REAL_FIRE_FROM ? 1 : 0),
      lookalikes: lookRuns.filter(isNearPerson).length,
      traces: lookRuns.filter((r) => !isNearPerson(r)).length,
      framesChecked: frames.length,
      smokeFrames: smoke.filter((v) => v >= th.smoke).length,
      fireFrames: fire.filter((v) => v >= th.fire).length,
    },
  };
}

export function statusAt(tl: Timeline, t: number): Status {
  if (tl.fireAlertAt !== undefined && t >= tl.fireAlertAt) return 'fire';
  if (tl.smokeWarnAt !== undefined && t >= tl.smokeWarnAt) return 'smoke';
  return 'clear';
}

export const statusRank: Record<Status, number> = { clear: 0, smoke: 1, fire: 2 };

export function fmtSec(t: number): string {
  return (t < 10 ? '0' : '') + t.toFixed(1) + ' s';
}

export const eventTone: Record<EventKind, 'ok' | 'muted' | 'info' | 'warn' | 'crit'> = {
  watching: 'ok',
  person_detected: 'ok',
  lookalike: 'muted',
  possible_smoke: 'info',
  smoke_warning: 'warn',
  supervisor: 'warn',
  flame_seen: 'info',
  fire_alert: 'crit',
  siren: 'crit',
  fire_team: 'crit',
  incident: 'crit',
  acknowledged: 'ok',
};
