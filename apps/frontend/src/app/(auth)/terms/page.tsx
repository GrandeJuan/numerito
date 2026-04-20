import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-5 py-12">
      <div className="max-w-2xl mx-auto prose-sm">
        <Link href="/login" className="text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)] no-underline mb-8 inline-block">
          ← Volver al login
        </Link>

        <h1 className="text-[28px] font-semibold tracking-[-0.02em] mb-2">Términos y Condiciones</h1>
        <p className="text-[12px] text-[var(--text-4)] mb-8">Última actualización: abril 2026</p>

        <div className="space-y-6 text-[13.5px] text-[var(--text-2)] leading-relaxed">
          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">1. Aceptación</h2>
            <p>Al acceder y utilizar Numerito (&quot;el Servicio&quot;), aceptás estos Términos y Condiciones. Si no estás de acuerdo, no utilices el Servicio.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">2. Descripción del Servicio</h2>
            <p>Numerito es una plataforma SaaS de gestión contable diseñada para estudios contables en Argentina. El Servicio permite gestionar clientes, obligaciones fiscales, facturación, documentación y tareas internas del estudio.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">3. Registro y Cuenta</h2>
            <p>Para utilizar el Servicio debés crear una cuenta proporcionando información veraz y actualizada. Sos responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades realizadas bajo tu cuenta.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">4. Suscripción y Pagos</h2>
            <p>El Servicio opera bajo un modelo de suscripción mensual o anual. Los precios vigentes se publican en la plataforma. El estudio es responsable de mantener al día el pago de su suscripción. La falta de pago puede resultar en la suspensión del acceso.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">5. Propiedad de los Datos</h2>
            <p>Los datos ingresados por el estudio y sus clientes son propiedad exclusiva del estudio contable. Numerito actúa únicamente como procesador de datos y no utiliza la información con fines distintos a la prestación del Servicio.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">6. Disponibilidad</h2>
            <p>Numerito se compromete a mantener una disponibilidad del 99.5% mensual, excluyendo ventanas de mantenimiento programado que serán comunicadas con al menos 48 horas de anticipación.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">7. Limitación de Responsabilidad</h2>
            <p>Numerito no sustituye el criterio profesional del contador. El Servicio es una herramienta de gestión y organización. Las decisiones contables, impositivas y fiscales son responsabilidad exclusiva del profesional habilitado.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">8. Cancelación</h2>
            <p>Podés cancelar tu suscripción en cualquier momento. Al cancelar, mantenés el acceso hasta el final del período facturado. Tus datos estarán disponibles para exportación durante 30 días posteriores a la cancelación.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">9. Jurisdicción</h2>
            <p>Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia será sometida a la jurisdicción de los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">10. Contacto</h2>
            <p>Para consultas sobre estos términos: <a href="mailto:legal@numerito.ar" className="text-[var(--brand)] hover:underline">legal@numerito.ar</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
