"""Builds web/public/detections.json for the FireWatch mock demo.
Box positions come from simple pixel analysis of fire_test.mp4 (bright flame
pixels and changed pixels vs. an empty-scene frame). Confidence curves are
scripted to behave like a fire/smoke model on this clip. Events and stats are
then computed from the curves with the same confirm-over-time rules the UI explains."""
import cv2, numpy as np, json, math, os, sys
VIDEO = sys.argv[1] if len(sys.argv) > 1 else 'fire_test.mp4'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'web/public'
FPS = 25
rng = np.random.default_rng(7)
cap = cv2.VideoCapture(VIDEO); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
N = len(frames); H, W = frames[0].shape[:2]
bg = frames[10 * FPS].astype(np.float32)

fire_box, fire_px, move_box = [], [], []
for f in frames:
    roi = f[100:320, 520:700].astype(int)
    m = (roi.max(2) > 225) & (roi[:, :, 2] - roi[:, :, 0] > 12)
    ys, xs = np.nonzero(m)
    fire_px.append(len(xs))
    fire_box.append([xs.min()+520, ys.min()+100, xs.max()+520, ys.max()+100] if len(xs) > 8 else None)
    d = np.abs(f.astype(np.float32) - bg).mean(2) > 25
    ys, xs = np.nonzero(d[60:420, 350:900])
    move_box.append([np.percentile(xs, 3)+350, np.percentile(ys, 3)+60, np.percentile(xs, 97)+350, np.percentile(ys, 97)+60] if len(xs) > 200 else None)

def smooth_boxes(bs, k=3):
    out = []
    for i in range(len(bs)):
        win = [bs[j] for j in range(max(0, i-k), min(len(bs), i+k+1)) if bs[j] is not None]
        out.append(None if bs[i] is None or not win else list(np.mean(win, 0)))
    return out
fire_box = smooth_boxes(fire_box); move_box = smooth_boxes(move_box)

def noise(s): return float(rng.normal(0, s))
smoke = np.zeros(N); fire = np.zeros(N)
for i in range(N):
    t = i / FPS
    # look-alike: grey shirt of the worker walking past, 4 frames
    if 4.80 <= t < 4.96: smoke[i] = [0.38, 0.61, 0.55, 0.33][int(round((t-4.80)*FPS))]
    if 4.56 <= t < 4.64: fire[i] = 0.14
    if 12.8 <= t < 14.4:
        base = 0.08 + (t-12.8) / 1.6 * 0.30
        smoke[i] = max(0, base + 0.16*math.sin(t*23) + noise(0.06)) if (int(t*25) % 5) else 0.0
    elif 14.4 <= t < 16.2:
        smoke[i] = max(0.05, 0.40 + 0.14*math.sin(t*17) + noise(0.07))
    elif 16.2 <= t < 18.6:
        smoke[i] = min(0.88, 0.45 + (t-16.2)*0.18 + noise(0.05))
    elif t >= 18.6:
        smoke[i] = max(0, 0.30 - (t-18.6)*0.18 + abs(noise(0.12))) if rng.random() > 0.35 else 0.0
    if fire_px[i] > 8 and t >= 16.3:
        fire[i] = min(0.86, 0.22 + fire_px[i]/650 + (t-16.3)*0.06 + noise(0.04))
smoke = np.clip(smoke, 0, 0.95); fire = np.clip(fire, 0, 0.95)

LOOK_BOX = [395, 128, 468, 205]  # worker's torso at ~4.8 s
recs = []
for i in range(N):
    t = i / FPS; boxes = []
    if smoke[i] >= 0.15:
        b = LOOK_BOX if t < 6 else move_box[i]
        if b is not None:
            x1, y1, x2, y2 = b
            if fire_box[i] is not None:  # smoke plume sits above/around flames
                y2 = min(y2, fire_box[i][3] - 6)
            if y2 - y1 > 12:
                boxes.append({'cls': 'smoke', 'conf': round(float(smoke[i]), 2), 'x': round(x1/W, 4), 'y': round(y1/H, 4), 'w': round((x2-x1)/W, 4), 'h': round((y2-y1)/H, 4)})
    if fire[i] >= 0.15 and fire_box[i] is not None:
        x1, y1, x2, y2 = fire_box[i]; x1 -= 4; y1 -= 6; x2 += 4; y2 += 4
        boxes.append({'cls': 'fire', 'conf': round(float(fire[i]), 2), 'x': round(x1/W, 4), 'y': round(y1/H, 4), 'w': round((x2-x1)/W, 4), 'h': round((y2-y1)/H, 4)})
    recs.append({'t': round(t, 2), 'smoke': round(float(smoke[i]), 3), 'fire': round(float(fire[i]), 3), 'boxes': boxes})

# ---- decision rules ----
TS, TF = 0.25, 0.40
def confirmed(arr, i, thr, win_s, ratio):
    n = int(round(win_s * FPS)); seg = arr[max(0, i-n+1): i+1]
    return len(seg) == n and (seg >= thr).mean() >= ratio
smoke_warn = next(i for i in range(N) if recs[i]['t'] > 10 and confirmed(smoke, i, TS, 1.0, 0.6))
fire_alert = next(i for i in range(N) if confirmed(fire, i, TF, 0.7, 0.7))
first_smoke = next(i for i in range(N) if recs[i]['t'] > 10 and smoke[i] >= TS)
first_flame = next(i for i in range(N) if fire[i] >= TF)
look = [i for i in range(N) if recs[i]['t'] < 10 and smoke[i] >= TS]
T = lambda i: round(i / FPS, 1)
pct = lambda v: f"{round(v*100)}%"
sm_at_warn = max(smoke[smoke_warn-5:smoke_warn+1]); fi_at_alert = max(fire[fire_alert-3:fire_alert+1]); sm_at_alert = max(smoke[fire_alert-5:fire_alert+1])
inc = 'INC-20261021-0042'
events = [
    {'t': 0.0, 'kind': 'watching', 'title': 'Watching CAM-04', 'detail': 'Fire and smoke model running on every frame'},
    {'t': T(look[-1]), 'kind': 'lookalike', 'title': 'Look-alike ignored', 'detail': f'Smoke-like shape on a passing worker for {len(look)} frames ({len(look)/FPS:.2f} s). Not confirmed, no alert.'},
    {'t': T(first_smoke), 'kind': 'possible_smoke', 'title': 'Possible smoke near machine', 'detail': 'Checking over the next second before alerting'},
    {'t': T(smoke_warn), 'kind': 'smoke_warning', 'title': 'Smoke warning', 'detail': f'Smoke confirmed at {pct(sm_at_warn)} · early warning'},
    {'t': round(T(smoke_warn)+0.6, 1), 'kind': 'supervisor', 'title': 'Shift supervisor alerted', 'detail': 'SMS + call · go and check, isolate power'},
    {'t': T(first_flame), 'kind': 'flame_seen', 'title': 'Flame seen', 'detail': 'Checking flame over the next 0.7 s'},
    {'t': T(fire_alert), 'kind': 'fire_alert', 'title': 'Fire alert', 'detail': f'Fire confirmed at {pct(fi_at_alert)} · smoke {pct(sm_at_alert)}'},
    {'t': round(T(fire_alert)+0.4, 1), 'kind': 'siren', 'title': 'Siren and beacon on', 'detail': 'Floor B alarm · PLC output DO-04'},
    {'t': round(T(fire_alert)+0.8, 1), 'kind': 'fire_team', 'title': 'Fire team alerted', 'detail': 'Teams / WhatsApp · email with clip'},
    {'t': round(T(fire_alert)+1.2, 1), 'kind': 'incident', 'title': 'Incident query raised', 'detail': f'{inc} · P1 · snapshot attached', 'image': '/snapshots/incident.jpg'},
]
# snapshot
snap = frames[fire_alert].copy()
for b in recs[fire_alert]['boxes']:
    if b['cls'] != 'fire': continue
    x, y, w, h = int(b['x']*W), int(b['y']*H), int(b['w']*W), int(b['h']*H)
    cv2.rectangle(snap, (x, y), (x+w, y+h), (68, 68, 239), 3)
    lab = f"FIRE {pct(b['conf'])}"; (tw, th), _ = cv2.getTextSize(lab, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
    cv2.rectangle(snap, (x, y-th-10), (x+tw+10, y), (68, 68, 239), -1)
    cv2.putText(snap, lab, (x+5, y-6), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
os.makedirs(f'{OUT}/snapshots', exist_ok=True)
cv2.imwrite(f'{OUT}/snapshots/incident.jpg', cv2.resize(snap, (640, 360)), [cv2.IMWRITE_JPEG_QUALITY, 85])

data = {
    'video': {'src': '/videos/fire_test.mp4', 'width': W, 'height': H, 'fps': FPS, 'duration': round(N/FPS, 2), 'frames': N},
    'camera': {'id': 'CAM-04', 'name': 'Production Floor B', 'meta': f'{W}×{H} · fixed CCTV · night'},
    'thresholds': {'smoke': TS, 'fire': TF, 'smokeWindow': 1.0, 'smokeRatio': 0.6, 'fireWindow': 0.7, 'fireRatio': 0.7},
    'frames': recs, 'events': events,
    'stats': {'leadTime': round((fire_alert - smoke_warn)/FPS, 1), 'smokeToWarning': round((smoke_warn - first_smoke)/FPS, 1),
              'falseAlarms': 0, 'lookalikes': 1, 'framesChecked': N},
}
json.dump(data, open(f'{OUT}/detections.json', 'w', encoding='utf-8'), separators=(',', ':'), ensure_ascii=False)
for e in events: print(e['t'], e['title'], '-', e['detail'])
print(data['stats'])
