import { CARD_CLASSES, CHART_THEME } from '@/lib/design-tokens';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  delta?: string;
  deltaUp?: boolean;
  sparkline?: number[];
}

function SparkLine({ data, color = CHART_THEME.primaryFill }: { data: number[]; color?: string }) {
  const points = data.map((v, i) => ({ v, i }));
  const gradientId = `spark-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function KpiCard({ icon, label, value, delta, deltaUp, sparkline }: KpiCardProps) {
  return (
    <div
      className={`${CARD_CLASSES.full} p-4 hover:shadow-md hover:shadow-[#091426]/10 transition-all group`}
    >
      <div className="flex items-start justify-between mb-1">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#75777d] dark:text-[#a0a3a8]">
          {label}
        </span>
        <div className="w-8 h-8 rounded-lg bg-[#091426]/5 dark:bg-white/5 flex items-center justify-center group-hover:bg-[#4edea3]/10 transition-colors">
          <span className="material-symbols-outlined text-[#45474c] dark:text-[#a0a3a8] group-hover:text-[#00a472] transition-colors text-lg">
            {icon}
          </span>
        </div>
      </div>
      <p className="text-2xl font-bold text-[#131b2e] dark:text-white tracking-tight">
        {value}
      </p>
      {delta != null && (
        <div className="flex items-center gap-1 mt-0.5 mb-2">
          <span
            className={`text-xs font-semibold ${
              deltaUp ? 'text-[#00a472]' : 'text-[#93000a] dark:text-red-400'
            }`}
          >
            {delta}
          </span>
          <span className="text-[10px] text-[#75777d] dark:text-[#a0a3a8]">vs mes ant.</span>
        </div>
      )}
      {sparkline && sparkline.length > 0 && <SparkLine data={sparkline} />}
    </div>
  );
}
