import { useState, useMemo } from 'react';
import type { Session, SessionType, MetricKey } from '../types';
import { SESSION_TYPE_LABELS, METRIC_LABELS, SESSION_METRICS, SESSION_TYPE_COLORS } from '../types';
import { getExerciseProgressData, getExerciseVolumeData, getExercisesForType } from '../utils/chartData';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  sessions: Session[];
}

const TYPE_BG: Record<SessionType, string> = {
  cardio: 'bg-red-50 border-red-200 text-red-700',
  musculation: 'bg-blue-50 border-blue-200 text-blue-700',
  hyrox: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  crosstraining: 'bg-amber-50 border-amber-200 text-amber-700',
};

export default function ProgressCharts({ sessions }: Props) {
  const [activeType, setActiveType] = useState<SessionType>('musculation');
  const [activeExercise, setActiveExercise] = useState<string>('');
  const [activeMetric, setActiveMetric] = useState<MetricKey>('weight');

  const exerciseList = useMemo(
    () => getExercisesForType(sessions, activeType),
    [sessions, activeType]
  );

  const currentExercise = activeExercise || exerciseList[0] || '';
  const currentMetrics = SESSION_METRICS[activeType];

  // Auto-switch metric when type changes
  const effectiveMetric = currentMetrics.includes(activeMetric) ? activeMetric : currentMetrics[0];

  const progressData = useMemo(
    () => getExerciseProgressData(sessions, activeType, currentExercise, effectiveMetric),
    [sessions, activeType, currentExercise, effectiveMetric]
  );

  const volumeData = useMemo(
    () => getExerciseVolumeData(sessions, activeType, currentExercise),
    [sessions, activeType, currentExercise]
  );

  const color = SESSION_TYPE_COLORS[activeType];
  const trend = getTrend(progressData);
  const personalBest = progressData.length > 0 ? Math.max(...progressData.map(d => d.value)) : null;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <h1 className="text-xl font-bold text-gray-900">Progression</h1>

      {/* Type tabs */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(SESSION_TYPE_LABELS) as [SessionType, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => { setActiveType(t); setActiveExercise(''); }}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
              activeType === t
                ? `${TYPE_BG[t]} border`
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {exerciseList.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          Aucune donnée pour ce type de séance
        </div>
      ) : (
        <>
          {/* Exercise + metric pickers */}
          <div className="card grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Exercice</label>
              <select
                value={currentExercise}
                onChange={e => setActiveExercise(e.target.value)}
                className="select"
              >
                {exerciseList.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Métrique</label>
              <select
                value={effectiveMetric}
                onChange={e => setActiveMetric(e.target.value as MetricKey)}
                className="select"
              >
                {currentMetrics.map(m => (
                  <option key={m} value={m}>{METRIC_LABELS[m]}</option>
                ))}
                {currentMetrics.includes('weight') && currentMetrics.includes('reps') && (
                  <option value="_volume">Volume total (kg × reps)</option>
                )}
              </select>
            </div>
          </div>

          {/* Stats row */}
          {progressData.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Record" value={personalBest !== null ? `${personalBest}` : '—'} />
              <StatCard label="Dernière" value={progressData.at(-1)?.value.toString() ?? '—'} />
              <TrendCard trend={trend} />
            </div>
          )}

          {/* Main progress chart */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">
              {currentExercise} — {METRIC_LABELS[effectiveMetric]}
            </h2>
            {progressData.length < 2 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                Ajoutez au moins 2 séances avec cet exercice pour voir la progression
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={progressData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                  {personalBest !== null && (
                    <ReferenceLine y={personalBest} stroke={color} strokeDasharray="4 4" opacity={0.5} />
                  )}
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name={METRIC_LABELS[effectiveMetric]}
                    stroke={color}
                    strokeWidth={2.5}
                    fill="url(#colorGradient)"
                    dot={{ fill: color, strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Volume chart — only for strength metrics */}
          {volumeData.length >= 2 && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                {currentExercise} — Volume total (kg × reps)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={50} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                    formatter={(v) => [`${v} kg`, 'Volume']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    name="Volume"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#volGradient)"
                    dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* All exercises overview */}
          <AllExercisesOverview sessions={sessions} type={activeType} color={color} />
        </>
      )}
    </div>
  );
}

// ---- Helper sub-components ----

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card text-center !py-3">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function TrendCard({ trend }: { trend: number }) {
  const positive = trend > 0;
  const neutral = trend === 0;
  return (
    <div className="card text-center !py-3">
      <div className="text-xs text-gray-400 mb-1">Tendance</div>
      <div className={clsx('text-xl font-bold flex items-center justify-center gap-1',
        positive ? 'text-emerald-600' : neutral ? 'text-gray-400' : 'text-red-500'
      )}>
        {positive ? <TrendingUp size={18} /> : neutral ? <Minus size={18} /> : <TrendingDown size={18} />}
        {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
      </div>
    </div>
  );
}

function getTrend(data: { value: number }[]): number {
  if (data.length < 2) return 0;
  const first = data[0].value;
  const last = data[data.length - 1].value;
  if (first === 0) return 0;
  return ((last - first) / first) * 100;
}

function AllExercisesOverview({ sessions, type, color }: { sessions: Session[]; type: SessionType; color: string }) {
  const exercises = getExercisesForType(sessions, type);
  const metrics = SESSION_METRICS[type];

  if (exercises.length === 0) return null;

  return (
    <div className="card">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">
        Vue d'ensemble — {SESSION_TYPE_LABELS[type]}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {exercises.slice(0, 6).map(ex => {
          const data = getExerciseProgressData(sessions, type, ex, metrics[0]);
          if (data.length < 2) return null;
          return (
            <div key={ex} className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs font-semibold text-gray-600 mb-2 truncate">{ex}</div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <YAxis hide domain={['auto', 'auto']} />
                  <XAxis hide dataKey="date" />
                  <Tooltip
                    contentStyle={{ borderRadius: '10px', border: 'none', fontSize: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name={METRIC_LABELS[metrics[0]]}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
