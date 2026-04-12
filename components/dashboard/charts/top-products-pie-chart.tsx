"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

type ProductShare = {
  name: string;
  value: number;
};

const COLORS = ["#4A90D9", "#2DD4BF", "#8B7CF6", "#90CAF9", "#4DB6AC"];

export function TopProductsPieChart({ data }: { data: ProductShare[] }) {
  return (
    <div className="glass-card h-72 p-4">
      <p className="mb-3 text-sm font-medium text-textPrimary">Top Products</p>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={88}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(22,27,39,0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
