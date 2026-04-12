import { toCurrency } from "@/src/lib/format";

type StatCardProps = {
  label: string;
  value: number;
  kind?: "number" | "currency";
};

export function StatCard({ label, value, kind = "number" }: StatCardProps) {
  return (
    <article className="glass-card p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-textPrimary">
        {kind === "currency" ? toCurrency(value) : value.toLocaleString("en-US")}
      </p>
    </article>
  );
}
