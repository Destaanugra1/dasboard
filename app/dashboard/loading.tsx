export default function DashboardLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="glass-card h-24 animate-pulse" />
      ))}
    </div>
  );
}
