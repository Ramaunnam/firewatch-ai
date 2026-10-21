import { useEffect, useState } from 'react';
import type { Page, Status } from '../types';
import { Speaker, Sun, Moon } from './Icons';

const titles: Record<Page, string> = {
  live: 'Live monitor',
  incidents: 'Incidents',
  analytics: 'Analytics',
  settings: 'Alert settings',
};
const pill: Record<Status, string> = { clear: 'All clear', smoke: 'Smoke warning', fire: 'Fire alert' };

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="clock">
      <span className="rec" aria-hidden="true" />
      <span className="mono">{now.toLocaleTimeString('en-GB', { hour12: false })}</span>
      <span className="clock-date">{now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    </div>
  );
}

interface Props {
  page: Page;
  status: Status;
  sound: boolean;
  onSound: () => void;
  theme: 'dark' | 'light';
  onTheme: () => void;
}

export default function TopBar({ page, status, sound, onSound, theme, onTheme }: Props) {
  return (
    <header className="topbar">
      <div className="crumbs">
        <span className="crumb-site">Steel Works · Production Floor B</span>
        <h1>{titles[page]}</h1>
      </div>
      <div className="top-right">
        <Clock />
        <button
          className="icon-btn"
          onClick={onTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button className="icon-btn" onClick={onSound} aria-label={sound ? 'Mute alarm sound' : 'Turn alarm sound on'} title={sound ? 'Mute alarm sound' : 'Turn alarm sound on'}>
          <Speaker off={!sound} size={17} />
        </button>
        <span className={`pill ${status}`} role="status" aria-live="polite">
          <span className="pill-dot" />
          {pill[status]}
        </span>
        <div className="user" title="Signed in as Shift Supervisor">
          <span className="avatar">SS</span>
          <span className="user-name">Shift Supervisor</span>
        </div>
      </div>
    </header>
  );
}
