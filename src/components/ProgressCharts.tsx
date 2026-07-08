"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SessionType } from "@prisma/client";
import type { ExercisePoint, WeeklyPoint } from "@/lib/progress";
import { SESSION_TYPE_LABELS, formatDuration } from "@/lib/domain";

// Palette validée (voir guide dataviz) : ordre fixe, jamais recyclé.
const TYPE_COLORS: Record<SessionType, string> = {
  CARDIO: "#2a78d6", // bleu
  CROSSFIT: "#1baf7a", // aqua
  HYROX: "#eda100", // jaune
  MUSCULATION: "#008300", // vert
};
const BLUE = "#2a78d6";
const AQUA = "#1baf7a";
const GRAY = "#c3c2b7"; // contexte / non réalisé
const GRID = "#e1e0d9";
const MUTED = "#898781";

const axisProps = {
  tick: { fill: MUTED, fontSize: 11 },
  axisLine: { stroke: GRAY },
  tickLine: false as const,
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: 8,
    border: `1px solid ${GRID}`,
    fontSize: 12,
    boxShadow: "0 2px 8px rgba(11,11,11,0.08)",
  },
  labelStyle: { color: "#0b0b0b", fontWeight: 600 },
  cursor: { fill: "rgba(11,11,11,0.04)" },
};

const legendStyle = { fontSize: 12, color: "#52514e" };

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      <div className="mt-3 h-56">{children}</div>
    </section>
  );
}

// ── Vue d'ensemble ──────────────────────────────────────────────

export function WeeklySessionsChart({ data }: { data: WeeklyPoint[] }) {
  const rows = data.map((w) => ({
    label: w.label,
    ...w.completedByType,
    nonRealisee: w.notCompleted,
  }));
  const types = Object.keys(SESSION_TYPE_LABELS) as SessionType[];
  return (
    <ChartCard
      title="Séances par semaine"
      subtitle="Terminées par type ; en gris, assignées non réalisées. Objectif : 4 / semaine."
    >
      <ResponsiveContainer>
        <BarChart data={rows} barSize={18}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            allowDecimals={false}
            width={24}
            domain={[0, (dataMax: number) => Math.max(5, Math.ceil(dataMax) + 1)]}
            {...axisProps}
          />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
          {types.map((type) => (
            <Bar
              key={type}
              dataKey={type}
              stackId="s"
              name={SESSION_TYPE_LABELS[type]}
              fill={TYPE_COLORS[type]}
              stroke="#ffffff"
              strokeWidth={1}
            />
          ))}
          <Bar
            dataKey="nonRealisee"
            stackId="s"
            name="Non réalisée"
            fill={GRAY}
            stroke="#ffffff"
            strokeWidth={1}
            radius={[4, 4, 0, 0]}
          />
          <ReferenceLine
            y={4}
            stroke={MUTED}
            strokeDasharray="4 4"
            label={{ value: "Objectif 4", position: "insideTopRight", fill: MUTED, fontSize: 11 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function WeeklyRpeChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <ChartCard title="RPE global moyen" subtitle="Effort perçu (1-10) sur les séances terminées.">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis domain={[0, 10]} width={24} {...axisProps} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${value}/10`, "RPE moyen"]}
          />
          <Line
            type="monotone"
            dataKey="avgRpe"
            name="RPE moyen"
            stroke={BLUE}
            strokeWidth={2}
            dot={{ r: 3, fill: BLUE, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function WeeklyVolumeChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <ChartCard
      title="Volume total"
      subtitle="Tonnage hebdomadaire : Σ répétitions × charge (kg)."
    >
      <ResponsiveContainer>
        <BarChart data={data} barSize={18}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis width={44} {...axisProps} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${Math.round(Number(value)).toLocaleString("fr-FR")} kg`, "Tonnage"]}
          />
          <Bar dataKey="volumeKg" name="Tonnage" fill={BLUE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ── Par exercice ────────────────────────────────────────────────

export function ExerciseStrengthChart({ data }: { data: ExercisePoint[] }) {
  return (
    <ChartCard
      title="Charge"
      subtitle="Charge max soulevée et 1RM estimé (Epley) par séance."
    >
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis width={36} {...axisProps} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name) => [`${value} kg`, name]}
          />
          <Legend wrapperStyle={legendStyle} iconType="circle" iconSize={8} />
          <Line
            type="monotone"
            dataKey="maxWeightKg"
            name="Charge max"
            stroke={BLUE}
            strokeWidth={2}
            dot={{ r: 3, fill: BLUE, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="e1rmKg"
            name="1RM estimé"
            stroke={AQUA}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={{ r: 3, fill: AQUA, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ExerciseVolumeChart({ data }: { data: ExercisePoint[] }) {
  return (
    <ChartCard title="Volume" subtitle="Σ répétitions × charge (kg) par séance.">
      <ResponsiveContainer>
        <BarChart data={data} barSize={18}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis width={44} {...axisProps} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value) => [`${Math.round(Number(value)).toLocaleString("fr-FR")} kg`, "Volume"]}
          />
          <Bar dataKey="volumeKg" name="Volume" fill={BLUE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function ExerciseTimeChart({ data }: { data: ExercisePoint[] }) {
  const rows = data.map((p) => ({
    ...p,
    durationMin:
      p.totalDurationSec !== null
        ? Math.round((p.totalDurationSec / 60) * 10) / 10
        : null,
  }));
  return (
    <ChartCard title="Temps" subtitle="Temps total par séance (comparer à distance/format équivalent).">
      <ResponsiveContainer>
        <LineChart data={rows}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis width={36} {...axisProps} />
          <Tooltip
            {...tooltipStyle}
            formatter={(_value, _name, item) => {
              const p = item.payload as (typeof rows)[number];
              const time =
                p.totalDurationSec !== null ? formatDuration(p.totalDurationSec) : "—";
              const dist =
                p.totalDistanceM !== null
                  ? p.totalDistanceM >= 1000
                    ? ` · ${p.totalDistanceM / 1000} km`
                    : ` · ${p.totalDistanceM} m`
                  : "";
              return [`${time}${dist}`, "Temps"];
            }}
          />
          <Line
            type="monotone"
            dataKey="durationMin"
            name="Temps (min)"
            stroke={BLUE}
            strokeWidth={2}
            dot={{ r: 3, fill: BLUE, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
