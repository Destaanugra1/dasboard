"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type OrdersPoint = {
  label: string;
  total: number;
};

export function OrdersBarChart({ data }: { data: OrdersPoint[] }) {
  return (
    <div className="glass-card h-72 p-4">
      <p className="mb-3 text-sm font-medium text-textPrimary">Orders (Weekly)</p>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke="#7C8DB0" />
          <YAxis stroke="#7C8DB0" />
          <Tooltip
            contentStyle={{
              background: "rgba(22,27,39,0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
            }}
          />
          <Bar dataKey="total" fill="#2DD4BF" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
