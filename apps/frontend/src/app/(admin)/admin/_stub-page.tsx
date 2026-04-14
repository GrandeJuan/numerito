export function ComingSoonPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="max-w-xl text-muted-foreground">{description}</p>
      <p className="text-sm text-muted-foreground">Esta sección estará disponible próximamente.</p>
    </div>
  );
}
