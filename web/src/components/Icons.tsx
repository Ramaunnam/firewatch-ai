type P = { size?: number };
const base = (size = 18) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const Flame = ({ size = 18 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M12 2c.8 3.4 5 5.3 5 10.6A5 5 0 0 1 7 12.6c0-2.6 1.6-4.3 2.6-5.1 0 1.7.8 2.7 1.8 2.9C10.6 7.6 11.2 4.6 12 2z" />
  </svg>
);
export const Monitor = ({ size }: P) => (
  <svg {...base(size)}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /><circle cx="12" cy="10" r="2.2" /></svg>
);
export const Bell = ({ size }: P) => (
  <svg {...base(size)}><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>
);
export const Chart = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 20V4M4 20h16" /><path d="m7 15 4-5 3 3 5-6" /></svg>
);
export const Sliders = ({ size }: P) => (
  <svg {...base(size)}><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
);
export const Speaker = ({ size, off }: P & { off?: boolean }) => (
  <svg {...base(size)}>
    <path d="M11 5 6 9H3v6h3l5 4V5z" />
    {off ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
  </svg>
);
export const Check = ({ size }: P) => (
  <svg {...base(size)}><path d="m5 12 4.5 4.5L19 7" /></svg>
);
export const Camera = ({ size }: P) => (
  <svg {...base(size)}><path d="M3 8h11l4-3v14l-4-3H3z" /></svg>
);
export const Close = ({ size }: P) => (
  <svg {...base(size)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Shield = ({ size }: P) => (
  <svg {...base(size)}><path d="M12 3 5 6v6c0 4.2 3 7.5 7 9 4-1.5 7-4.8 7-9V6z" /><path d="m9 12 2 2 4-4" /></svg>
);
export const Sun = ({ size }: P) => (
  <svg {...base(size)}><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" /></svg>
);
export const Moon = ({ size }: P) => (
  <svg {...base(size)}><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" /></svg>
);
