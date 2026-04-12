export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="glass-card p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">Module</p>
      <h2 className="mt-2 text-xl font-semibold text-textPrimary">{title}</h2>
      <p className="mt-2 text-sm text-muted">{description}</p>
    </div>
  );
}
