"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { stroke: "#6b7688", fontSize: 12 };
const GRID = "#1f2430";

const tooltipStyle = {
  backgroundColor: "#161922",
  border: "1px solid #2b3240",
  borderRadius: "0.75rem",
  color: "#e6eaf2",
  fontSize: "0.875rem",
};

export type TrendPoint = {
  date: string;
  pain: number;
  average: number | null;
};

export function PainTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="date" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={AXIS}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: GRID }} />
        <Line
          type="monotone"
          dataKey="pain"
          name="Pain"
          stroke="#4ade80"
          strokeWidth={2}
          dot={{ r: 3, fill: "#4ade80" }}
        />
        <Line
          type="monotone"
          dataKey="average"
          name="4-session avg"
          stroke="#fbbf24"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export type IntensityPoint = {
  intensity: string;
  average: number;
  count: number;
};

export function PainByIntensityChart({ data }: { data: IntensityPoint[] }) {
  const colors = ["#4ade80", "#fbbf24", "#f87171"];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="intensity" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 10]}
          tick={AXIS}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
        <Bar dataKey="average" name="Avg pain" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={entry.intensity} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export type ScatterPoint = { x: number; y: number };

export function FactorScatterChart({
  data,
  xLabel,
}: {
  data: ScatterPoint[];
  xLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: -20 }}>
        <CartesianGrid stroke={GRID} />
        <XAxis
          type="number"
          dataKey="x"
          name={xLabel}
          tick={AXIS}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Pain"
          domain={[0, 10]}
          ticks={[0, 2, 4, 6, 8, 10]}
          tick={AXIS}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ strokeDasharray: "3 3", stroke: GRID }}
        />
        <Scatter data={data} fill="#4ade80" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
