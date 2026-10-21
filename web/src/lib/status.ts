import type { EventKind, FwEvent, Status } from '../types';

export function statusAt(events: FwEvent[], t: number): Status {
  const reached = (k: EventKind) => events.some((e) => e.kind === k && e.t <= t);
  if (reached('fire_alert')) return 'fire';
  if (reached('smoke_warning')) return 'smoke';
  return 'clear';
}

export const statusRank: Record<Status, number> = { clear: 0, smoke: 1, fire: 2 };

export function eventTime(events: FwEvent[], kind: EventKind): number | undefined {
  return events.find((e) => e.kind === kind)?.t;
}

export function fmtSec(t: number): string {
  const s = t.toFixed(1);
  return (t < 10 ? '0' : '') + s + ' s';
}

/** Colour family for each event kind, used for the left border in the log. */
export const eventTone: Record<EventKind, 'green' | 'grey' | 'blue' | 'amber' | 'red'> = {
  watching: 'green',
  lookalike: 'grey',
  possible_smoke: 'blue',
  smoke_warning: 'amber',
  supervisor: 'amber',
  flame_seen: 'blue',
  fire_alert: 'red',
  siren: 'red',
  fire_team: 'red',
  incident: 'red',
};
