import Link from 'next/link';

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-5 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/login" className="text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)] no-underline mb-8 inline-block">
          ← Volver al login
        </Link>

        <h1 className="text-[28px] font-semibold tracking-[-0.02em] mb-2">Soporte</h1>
        <p className="text-[14px] text-[var(--text-3)] mb-10 leading-relaxed">
          Estamos para ayudarte. Elegí el canal que más te convenga.
        </p>

        <div className="space-y-6">
          <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <h2 className="text-[16px] font-semibold mb-1">Email</h2>
            <p className="text-[13.5px] text-[var(--text-3)] mb-3">
              Escribinos y te respondemos en menos de 24 horas hábiles.
            </p>
            <a
              href="mailto:soporte@numerito.ar"
              className="text-[13.5px] text-[var(--brand)] hover:underline font-medium"
            >
              soporte@numerito.ar
            </a>
          </section>

          <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <h2 className="text-[16px] font-semibold mb-1">Horario de atención</h2>
            <p className="text-[13.5px] text-[var(--text-3)]">
              Lunes a viernes de 9:00 a 18:00 (hora Argentina, GMT-3).
            </p>
          </section>

          <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <h2 className="text-[16px] font-semibold mb-1">Preguntas frecuentes</h2>
            <ul className="text-[13.5px] text-[var(--text-3)] space-y-2 mt-3">
              <li><strong>¿Cómo agrego un cliente?</strong> — Desde el dashboard, ingresá a Clientes y hacé clic en &quot;Nuevo cliente&quot;.</li>
              <li><strong>¿Cómo configuro las integraciones con ARCA/ARBA?</strong> — En Configuración → Integraciones podés cargar las credenciales de cada organismo.</li>
              <li><strong>¿Cómo cambio mi plan?</strong> — Contactanos por email y gestionamos el cambio sin interrupción del servicio.</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
