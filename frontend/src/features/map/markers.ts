import L from 'leaflet';

export type MarkerRole = 'start' | 'stop' | 'destination';

const ROLE_STYLE: Record<MarkerRole, { bg: string; border: string }> = {
  start: { bg: '#0f2a21', border: '#34d399' },
  stop: { bg: '#0d1b33', border: '#4f8cff' },
  destination: { bg: '#1c1633', border: '#8b7cf6' },
};

/** Numbered circular marker built with a Leaflet divIcon (no image assets). */
export function stopIcon(role: MarkerRole, number: number): L.DivIcon {
  const style = ROLE_STYLE[role];
  return L.divIcon({
    className: 'lumina-marker',
    html: `
      <div
        style="
          width:26px;height:26px;display:flex;align-items:center;justify-content:center;
          border-radius:9999px;font:600 11px 'Inter',sans-serif;color:#e8ecf4;
          background:${style.bg};border:2px solid ${style.border};
          box-shadow:0 2px 10px rgba(0,0,0,0.5);
          position:relative;letter-spacing:0.02em;
        "
      >${number}</div>
      <div style="
        position:absolute;left:50%;top:100%;width:2px;height:4px;transform:translateX(-50%);
        background:${style.border};
      "></div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 30],
    popupAnchor: [0, -30],
  });
}

/** Plain soft dot for unnumbered fleet markers (dashboard). */
export function dotIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: 'lumina-marker',
    html: `
      <div style="
        position:relative;width:14px;height:14px;border-radius:9999px;
        background:${color};border:2px solid rgba(255,255,255,0.75);
        box-shadow:0 0 0 4px ${color}22, 0 2px 8px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}