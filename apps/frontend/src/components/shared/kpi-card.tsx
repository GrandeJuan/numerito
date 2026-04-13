import { CARD_CLASSES, KPI_ICON_STYLE } from '@/lib/design-tokens';

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
}

export function KpiCard({ icon, label, value }: KpiCardProps) {
  return (
    <div className={`${CARD_CLASSES.full} p-6`}>
      <div className="flex items-center gap-3">
        <div className={`${KPI_ICON_STYLE.className} rounded-lg p-2.5`}>
          <span className={`material-symbols-outlined ${KPI_ICON_STYLE.text} text-xl`}>{icon}</span>
        </div>
        <div>
          <p className="text-sm text-[#45474c] dark:text-[#a0a3a8]">{label}</p>
          <p className="text-2xl font-bold text-[#091426] dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}
