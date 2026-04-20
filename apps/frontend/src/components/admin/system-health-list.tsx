'use client';

export interface ServiceStatus {
  name: string;
  detail: string;
  uptime: string;
  status: 'ok' | 'warn' | 'err';
}

const STATUS_CLS: Record<ServiceStatus['status'], string> = {
  ok: 'bg-[var(--brand)] shadow-[0_0_0_2px_rgba(46,230,168,0.15)]',
  warn: 'bg-[var(--amber)] shadow-[0_0_0_2px_rgba(251,191,36,0.15)]',
  err: 'bg-[var(--rose)] shadow-[0_0_0_2px_rgba(251,113,133,0.15)]',
};

const UPTIME_COLOR: Record<ServiceStatus['status'], string> = {
  ok: 'text-[var(--text-2)]',
  warn: 'text-[var(--amber)]',
  err: 'text-[var(--rose)]',
};

export function SystemHealthList({ services }: { services: ServiceStatus[] }) {
  return (
    <div className="py-2.5">
      {services.map((s, i) => (
        <div
          key={s.name}
          className={`flex items-center justify-between px-[18px] py-2.5 ${
            i === 0 ? '' : 'border-t border-[var(--border)]'
          }`}
        >
          <div>
            <div className="text-[13px] flex items-center gap-1.5">
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${STATUS_CLS[s.status]}`} />
              {s.name}
            </div>
            <div className="text-[11px] text-[var(--text-3)] font-mono mt-[3px] ml-3">
              {s.detail}
            </div>
          </div>
          <div className={`font-mono text-[12px] ${UPTIME_COLOR[s.status]}`}>{s.uptime}</div>
        </div>
      ))}
    </div>
  );
}
