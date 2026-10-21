import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AlertBanner from './components/AlertBanner';
import KpiStrip from './components/KpiStrip';
import VideoPanel from './components/VideoPanel';
import IncidentLog from './components/IncidentLog';
import ConfidenceChart from './components/ConfidenceChart';
import FloorMap from './components/FloorMap';
import ResponsePanel, { type Ack } from './components/ResponsePanel';
import ImageModal from './components/ImageModal';
import IncidentsPage from './pages/IncidentsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import { useDetections } from './hooks/useDetections';
import { useVideoClock } from './hooks/useVideoClock';
import { useAlarmSound } from './hooks/useAlarmSound';
import { buildTimeline, statusAt, statusRank } from './lib/rules';
import { loadSettings, saveSettings, type Settings } from './lib/settings';
import type { Detections, FwEvent, Page, Status } from './types';

type Theme = 'dark' | 'light';

function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('firewatch.theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* ignore */
    }
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('firewatch.theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return { theme, toggle: useCallback(() => setTheme((th) => (th === 'dark' ? 'light' : 'dark')), []) };
}

export default function App() {
  const { data, error } = useDetections();
  if (error)
    return (
      <div className="center-msg">
        <b>Could not load the detection data</b>
        <span>{error}</span>
        <span>Check that public/detections.json exists, then refresh the page.</span>
      </div>
    );
  if (!data)
    return (
      <div className="center-msg">
        <span className="spinner" />
        Loading FireWatch AI…
      </div>
    );
  return <Dashboard data={data} />;
}

function Dashboard({ data }: { data: Detections }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const clock = useVideoClock(videoRef);
  const [page, setPage] = useState<Page>('live');
  const [settings, setSettingsState] = useState<Settings>(() => loadSettings(data.thresholds));
  const [toastHidden, setToastHidden] = useState(false);
  const [modalImg, setModalImg] = useState<string | null>(null);
  const [ack, setAck] = useState<Ack | null>(null);
  const [resolved, setResolved] = useState(false);
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const sound = useAlarmSound(!settings.sound);
  const { theme, toggle: toggleTheme } = useTheme();

  const setSettings = useCallback((s: Settings) => {
    setSettingsState(s);
    saveSettings(s);
  }, []);

  const th = settings.thresholds;
  const tl = useMemo(() => buildTimeline(data, th), [data, th]);
  const t = clock.t;
  const status: Status = statusAt(tl, t);
  const frame = data.frames[Math.min(data.frames.length - 1, Math.max(0, Math.round(t * data.video.fps)))];

  // Going back before the alarm (restart, scrub, jump) clears the response state.
  useEffect(() => {
    if (status === 'clear' && (ack || resolved || Object.keys(manual).length)) {
      setAck(null);
      setResolved(false);
      setManual({});
    }
  }, [status, ack, resolved, manual]);

  const events: FwEvent[] = useMemo(() => {
    const list = tl.events.filter((e) => e.t <= t + 1e-3);
    if (ack) list.push({ t: ack.videoT, kind: 'acknowledged', title: resolved ? 'Incident resolved' : 'Alert acknowledged', detail: `Shift Supervisor · ${ack.wall}` });
    return list.sort((a, b) => b.t - a.t);
  }, [tl.events, t, ack, resolved]);

  // Alarm sound + toast when the level goes up.
  const prev = useRef<Status>('clear');
  useEffect(() => {
    if (statusRank[status] > statusRank[prev.current] && clock.playing && !ack) {
      if (status === 'fire') sound.siren();
      else if (status === 'smoke') sound.beep();
    }
    if (status !== prev.current) setToastHidden(false);
    if (status === 'clear') sound.stop();
    prev.current = status;
  }, [status, clock.playing, sound, ack]);

  const jump = (at?: number) => {
    if (at !== undefined) {
      setPage('live');
      clock.seek(Math.max(0, at - 1));
    }
  };

  const doAck = () => {
    setAck({ videoT: Math.round(t * 10) / 10, wall: new Date().toLocaleTimeString('en-GB', { hour12: false }) });
    sound.stop();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'TR') return;
      if (e.code === 'Space') {
        e.preventDefault();
        clock.toggle();
      } else if (e.key === 'r' || e.key === 'R') clock.restart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clock]);

  const openIncidents = status !== 'clear' && !resolved ? 1 : 0;
  const bannerConf = status === 'fire' ? frame?.fire ?? 0 : frame?.smoke ?? 0;
  const markers = [
    ...(tl.smokeWarnAt !== undefined ? [{ t: tl.smokeWarnAt, tone: 'warn' as const }] : []),
    ...(tl.fireAlertAt !== undefined ? [{ t: tl.fireAlertAt, tone: 'crit' as const }] : []),
  ];

  return (
    <div className={`shell ${status}`}>
      <Sidebar page={page} onPage={setPage} openIncidents={openIncidents} status={status} />
      <div className="main">
        <TopBar
          page={page}
          status={status}
          sound={settings.sound}
          onSound={() => setSettings({ ...settings, sound: !settings.sound })}
          theme={theme}
          onTheme={toggleTheme}
        />
        <AlertBanner status={resolved ? 'clear' : status} conf={bannerConf} acknowledged={!!ack} onRespond={() => setPage('live')} />

        <div className="page-body" hidden={page !== 'live'}>
          <KpiStrip tl={tl} status={status} t={t} />
          <div className="live-grid">
            <VideoPanel
              videoRef={videoRef}
              data={data}
              frame={frame}
              status={status}
              boxes={settings.boxes}
              t={t}
              playing={clock.playing}
              ended={clock.ended}
              slow={clock.slow}
              toastHidden={toastHidden}
              onHideToast={() => setToastHidden(true)}
              onToggle={clock.toggle}
              onRestart={clock.restart}
              onSlow={() => clock.setSlow(!clock.slow)}
              onBoxes={() => setSettings({ ...settings, boxes: !settings.boxes })}
              onJumpSmoke={() => jump(tl.firstSmokeAt)}
              onJumpFire={() => jump(tl.flameAt)}
              onSeek={(s) => clock.seek(s)}
              markers={markers}
            />
            <IncidentLog events={events} onOpenImage={setModalImg} />
          </div>
          <section className="panel">
            <div className="panel-head">
              <span className="eyebrow">What the AI saw, frame by frame</span>
              <button className="link-btn" onClick={() => setPage('analytics')}>Open analytics →</button>
            </div>
            <ConfidenceChart data={data} tl={tl} th={th} t={t} onSeek={(s) => clock.seek(s)} />
          </section>
          <div className="two-col map-row">
            <FloorMap status={resolved ? 'clear' : status} />
            <ResponsePanel
              status={status}
              events={events}
              manual={manual}
              onManual={(id) => setManual((m) => ({ ...m, [id]: !m[id] }))}
              ack={ack}
              resolved={resolved}
              onAck={doAck}
              onResolve={() => setResolved(true)}
            />
          </div>
          <Footer />
        </div>

        {page === 'incidents' && (
          <IncidentsPage tl={tl} status={status} t={t} ack={ack} resolved={resolved} onAck={doAck} onResolve={() => setResolved(true)} onOpenLive={() => setPage('live')} />
        )}
        {page === 'analytics' && <AnalyticsPage data={data} tl={tl} th={th} t={t} onSeek={(s) => clock.seek(s)} />}
        {page === 'settings' && <SettingsPage settings={settings} defaults={data.thresholds} tl={tl} onChange={setSettings} />}
      </div>
      <ImageModal src={modalImg} onClose={() => setModalImg(null)} />
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      Footage: free sample from the{' '}
      <a href="https://unidata.pro/datasets/smoke-and-fire-detection-videos-dataset/" target="_blank" rel="noreferrer">
        Unidata Smoke and Fire Detection Videos dataset
      </a>
      . Demo: box positions follow the real smoke and flames in the clip and confidence values are pre-computed for this video. SMS, siren, PLC and
      Teams alerts, the floor plan and earlier incidents are simulated.
    </footer>
  );
}
