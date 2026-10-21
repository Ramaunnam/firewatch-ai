import type { Page, Status } from '../types';
import { Bell, Chart, Flame, Monitor, Shield, Sliders } from './Icons';

interface Props {
  page: Page;
  onPage: (p: Page) => void;
  openIncidents: number;
  status: Status;
}

const items: Array<{ id: Page; label: string; icon: JSX.Element }> = [
  { id: 'live', label: 'Live monitor', icon: <Monitor /> },
  { id: 'incidents', label: 'Incidents', icon: <Bell /> },
  { id: 'analytics', label: 'Analytics', icon: <Chart /> },
  { id: 'settings', label: 'Alert settings', icon: <Sliders /> },
];

export default function Sidebar({ page, onPage, openIncidents, status }: Props) {
  return (
    <nav className="sidebar" aria-label="Main">
      <div className="brand">
        <div className="logo">
          <Flame size={17} />
        </div>
        <div className="brand-text">
          <div className="brand-name">FireWatch AI</div>
          <div className="brand-sub">Plant fire safety</div>
        </div>
      </div>
      <ul className="nav">
        {items.map((it) => (
          <li key={it.id}>
            <button className={`nav-item ${page === it.id ? 'active' : ''}`} onClick={() => onPage(it.id)} aria-current={page === it.id ? 'page' : undefined}>
              {it.icon}
              <span className="nav-label">{it.label}</span>
              {it.id === 'incidents' && openIncidents > 0 && <span className={`nav-badge ${status}`}>{openIncidents}</span>}
              {it.id === 'live' && status !== 'clear' && <span className={`nav-dot ${status}`} />}
            </button>
          </li>
        ))}
      </ul>
      <div className="side-foot">
        <div className="health">
          <Shield size={16} />
          <div>
            <div className="health-title">System healthy</div>
            <div className="health-sub">CAM-04 online · 25 fps</div>
          </div>
        </div>
        <div className="demo-tag">Demo site · simulated alerts</div>
      </div>
    </nav>
  );
}
