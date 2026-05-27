import type { Session, SessionType } from '../types';
import { SESSION_TYPE_LABELS } from '../types';
import { getSessionCountByType, getWeeklySessionData } from '../utils/chartData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Flame, Dumbbell, Activity, Zap, TrendingUp, Calendar } from 'lucide-react';
import type { Page } from '../App';
import clsx from 'clsx';

interface Props {
  sessions: Session[];
  onNew: () => void;
  setPage: (p: Page) => void;
}

const TYPE_ICONS: Record<SessionType, React.ElementType> = {
  cardio: Flame,
  musculation: Dumbbell,
  hyrox: Zap,
  crosstraining: Activity,
};

const TYPE_ACCENT: Record<SessionType, string> = {
  cardio: 'bg-red-500',
  musculation: 'bg-blue-500',
  hyrox: 'bg-emerald-500',
  crosstraining: 'bg-amber-500',
};

const TYPE_CARD: Record<SessionType, string> = {
  cardio: 'border-red-100 bg-red-50',
  musculation: 'border-blue-100 bg-blue-50',
  hyrox: 'border-emerald-100 bg-emerald-50',
  crosstraining: 'border-amber-100 bg-amber-50',
};

const TYPE_TEXT: Record<SessionType, string> = {
  cardio: 'text-red-700',
  musculation: 'text-blue-700',
  hyrox: 'text-emerald-700',
  crosstraining: 'text-amber-700',
};

export default function Dashboard({ sessions, onNew, setPage }: Props) {
  const now = new Date();
  const thisMonth = sessions.filter(s => {
    const d = parseISO(s.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const lastSession = sessions[0];
  const daysSinceLast = lastSession
    ? differenceInDays(now, parseISO(lastSession.date))
    : null;

  const pieData = getSessionCountByType(sessions);
  const weeklyData = getWeeklySessionData(sessions, 10);

  const countByType = sessions.reduce<Record<SessionType, number>>(
    (acc, s) => { acc[s.type] = (acc[s.type] ?? 0) + 1; return acc; },
    { cardio: 0, musculation: 0, hyrox: 0, crosstraining: 0 }
  );

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(now, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        {daysSinceLast !== null && (
          <div className="card !p-3 flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-indigo-500" />
            <span className="text-gray-600">
              Dernière séance :{' '}
              <span className="font-semibold text-gray-900">
                {daysSinceLast === 0 ? "aujourd'hui" : `il y a ${daysSinceLast}j`}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.entries(countByType) as [SessionType, number][]).map(([type, count]) => {
          const Icon = TYPE_ICONS[type];
          return (
            <div key={type} className={clsx('rounded-2xl border p-4', TYPE_CARD[type])}>
              <div className="flex items-center justify-between mb-3">
                <span className={clsx('text-xs font-semibold uppercase tracking-wide', TYPE_TEXT[type])}>
                  {SESSION_TYPE_LABELS[type]}
                </span>
                <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center', TYPE_ACCENT[type])}>
                  <Icon size={16} className="text-white" />
                </div>
              </div>
              <div className={clsx('text-3xl font-bold', TYPE_TEXT[type])}>{count}</div>
              <div className="text-xs text-gray-500 mt-1">séances au total</div>
            </div>
          );
        })}
      </div>

      {/* This month + last sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart */}
        <div className="card lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Séances par semaine</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barSize={24}>
              <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={20} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 600 }}
              />
              <Bar dataKey="count" name="Séances" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="card flex flex-col">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Répartition</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11 }}>{value}</span>}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center mt-8">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Recent sessions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Séances récentes</h2>
          <button onClick={() => setPage('history')} className="text-xs text-indigo-600 hover:underline">
            Tout voir
          </button>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Aucune séance enregistrée</p>
            <button onClick={onNew} className="btn-primary">Commencer</button>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0, 5).map(s => {
              const Icon = TYPE_ICONS[s.type];
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', TYPE_ACCENT[s.type])}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {s.title || SESSION_TYPE_LABELS[s.type]}
                    </div>
                    <div className="text-xs text-gray-400">
                      {s.exercises.length} exercice{s.exercises.length > 1 ? 's' : ''}
                      {s.totalDuration ? ` · ${s.totalDuration} min` : ''}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0">
                    {format(parseISO(s.date), 'd MMM', { locale: fr })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick CTA */}
      <div className="card bg-gradient-to-r from-indigo-600 to-violet-600 border-0 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Ce mois-ci</h3>
            <p className="text-indigo-200 text-sm mt-0.5">
              {thisMonth.length} séance{thisMonth.length > 1 ? 's' : ''} enregistrée{thisMonth.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp size={32} className="text-indigo-300" />
            <button
              onClick={onNew}
              className="px-4 py-2 bg-white text-indigo-700 rounded-xl font-medium text-sm hover:bg-indigo-50 transition-colors"
            >
              + Séance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
