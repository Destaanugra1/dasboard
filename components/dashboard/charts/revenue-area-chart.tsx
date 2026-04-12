"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type RevenuePoint = {
  label: string;
  total: number;
};

export function RevenueAreaChart({ data }: { data: RevenuePoint[] }) {
  return (
    <div className="glass-card h-72 p-4">
      <p className="mb-3 text-sm font-medium text-textPrimary">Revenue (Last 30 Days)</p>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4A90D9" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#4A90D9" stopOpacity={0.05} />
            </linearGradient>
          </defs>
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
          <Area type="monotone" dataKey="total" stroke="#4A90D9" fill="url(#revenueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
