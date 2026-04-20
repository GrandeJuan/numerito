import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-5 py-12">
      <div className="max-w-2xl mx-auto prose-sm">
        <Link href="/login" className="text-[13px] text-[var(--text-3)] hover:text-[var(--text-2)] no-underline mb-8 inline-block">
          ← Volver al login
        </Link>

        <h1 className="text-[28px] font-semibold tracking-[-0.02em] mb-2">Política de Privacidad</h1>
        <p className="text-[12px] text-[var(--text-4)] mb-8">Última actualización: abril 2026</p>

        <div className="space-y-6 text-[13.5px] text-[var(--text-2)] leading-relaxed">
          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">1. Responsable del Tratamiento</h2>
            <p>Numerito S.A.S. (&quot;Numerito&quot;), con domicilio en la Ciudad Autónoma de Buenos Aires, República Argentina, es responsable del tratamiento de los datos personales recopilados a través de la plataforma.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">2. Datos que Recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Datos de registro:</strong> nombre, apellido, email, contraseña (almacenada con hash).</li>
              <li><strong>Datos del estudio:</strong> razón social, CUIT, condición ante IVA, dirección fiscal.</li>
              <li><strong>Datos de clientes del estudio:</strong> información fiscal y contable ingresada por el estudio para gestión de sus clientes.</li>
              <li><strong>Datos de uso:</strong> logs de acceso, acciones realizadas en la plataforma, preferencias de configuración.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">3. Finalidad del Tratamiento</h2>
            <p>Los datos son utilizados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Prestación del servicio de gestión contable.</li>
              <li>Autenticación y seguridad de la cuenta.</li>
              <li>Comunicaciones relacionadas con el servicio (vencimientos, actualizaciones, soporte).</li>
              <li>Mejora del servicio mediante análisis agregados y anónimos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">4. Base Legal</h2>
            <p>El tratamiento de datos se realiza conforme a la Ley 25.326 de Protección de Datos Personales de la República Argentina y su Decreto Reglamentario 1558/2001. La base legal es el consentimiento del titular y la ejecución del contrato de servicio.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">5. Almacenamiento y Seguridad</h2>
            <p>Los datos se almacenan en servidores con cifrado en reposo y en tránsito (TLS 1.3). Los backups se realizan diariamente con retención de 30 días. Las contraseñas se almacenan con hash bcrypt y nunca en texto plano.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">6. Compartición de Datos</h2>
            <p>Numerito no vende, alquila ni comparte datos personales con terceros, excepto:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Proveedores de infraestructura (AWS) bajo acuerdos de procesamiento de datos.</li>
              <li>Requerimiento judicial o administrativo conforme a la legislación argentina vigente.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">7. Derechos del Titular</h2>
            <p>Conforme a la Ley 25.326, tenés derecho a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Acceso:</strong> solicitar qué datos tenemos sobre vos.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Supresión:</strong> solicitar la eliminación de tus datos.</li>
              <li><strong>Portabilidad:</strong> exportar tus datos en formato estándar.</li>
            </ul>
            <p className="mt-2">Para ejercer estos derechos, escribí a <a href="mailto:privacidad@numerito.ar" className="text-[var(--brand)] hover:underline">privacidad@numerito.ar</a>.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">8. Retención de Datos</h2>
            <p>Los datos se conservan mientras la cuenta esté activa. Tras la cancelación del servicio, los datos se mantienen disponibles para exportación durante 30 días y luego son eliminados de forma permanente.</p>
          </section>

          <section>
            <h2 className="text-[16px] font-semibold text-[var(--text)] mb-2">9. Contacto</h2>
            <p>Para consultas sobre privacidad: <a href="mailto:privacidad@numerito.ar" className="text-[var(--brand)] hover:underline">privacidad@numerito.ar</a></p>
            <p className="mt-2 text-[12px] text-[var(--text-4)]">Dirección Nacional de Protección de Datos Personales — Órgano de Control de la Ley 25.326: <a href="https://www.argentina.gob.ar/aaip" className="text-[var(--brand)] hover:underline" target="_blank" rel="noopener noreferrer">www.argentina.gob.ar/aaip</a></p>
          </section>
        </div>
      </div>
    </main>
  );
}
