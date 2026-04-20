'use client';

/** Sparkline de línea con área gradient. Default brand. */
export function SparkLine({
  points,
  color = 'var(--brand)',
  width = 96,
  height = 36,
  id = 'sp-grad',
}: {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
  id?: string;
}) {
  if (!points.length) return null;
  const stepX = width / (points.length - 1 || 1);
  const toY = (v: number) => height - 4 - v * (height - 8);
  const lineD = points.map((v, i) => `${i === 0 ? 'M' : 'L'}${i * stepX} ${toY(v)}`).join(' ');
  const areaD = `${lineD} L${width} ${height} L0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${id})`} />
      <path
        d={lineD}
        stroke={color}
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Mini bar chart con opacidades crecientes. */
export function SparkBars({
  values,
  color = 'var(--brand)',
  width = 96,
  height = 36,
}: {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const gap = 4;
  const barW = (width - gap * (values.length - 1)) / values.length;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {values.map((v, i) => {
        const h = Math.max(2, v * (height - 4));
        return (
          <rect
            key={i}
            x={i * (barW + gap)}
            y={height - h}
            width={barW}
            height={h}
            rx="1"
            fill={color}
            opacity={0.35 + (i / values.length) * 0.65}
          />
        );
      })}
    </svg>
  );
}

/** Uptime bars — cada barra es un día (ok/warn/err). */
export function UptimeBars({
  statuses,
  width = 96,
  height = 36,
}: {
  statuses: Array<'ok' | 'warn' | 'err'>;
  width?: number;
  height?: number;
}) {
  const gap = 1;
  const barW = (width - gap * (statuses.length - 1)) / statuses.length;
  const color = { ok: 'var(--brand)', warn: 'var(--amber)', err: 'var(--rose)' };
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      {statuses.map((s, i) => (
        <rect
          key={i}
          x={i * (barW + gap)}
          y={height * 0.28}
          width={barW}
          height={height * 0.55}
          fill={color[s]}
        />
      ))}
    </svg>
  );
}
