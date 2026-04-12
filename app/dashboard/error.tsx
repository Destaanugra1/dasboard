"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="glass-card p-6">
      <h2 className="text-lg font-semibold text-textPrimary">Something went wrong</h2>
      <p className="mt-2 text-sm text-muted">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-accentBlue px-4 py-2 text-sm font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
