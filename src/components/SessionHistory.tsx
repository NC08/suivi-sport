import { useState } from 'react';
import type { Session, SessionType, MetricKey } from '../types';
import { SESSION_TYPE_LABELS, METRIC_UNITS } from '../types';
import { deleteSession } from '../utils/storage';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Trash2, Pencil, ChevronDown, ChevronUp, Filter, Flame, Dumbbell, Activity, Zap } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  sessions: Session[];
  onEdit: (s: Session) => void;
  onDelete: () => void;
}

const TYPE_ICON: Record<SessionType, React.ElementType> = {
  cardio: Flame, musculation: Dumbbell, hyrox: Zap, crosstraining: Activity,
};

const TYPE_BG: Record<SessionType, string> = {
  cardio: 'bg-red-100 text-red-700',
  musculation: 'bg-blue-100 text-blue-700',
  hyrox: 'bg-emerald-100 text-emerald-700',
  crosstraining: 'bg-amber-100 text-amber-700',
};

export default function SessionHistory({ sessions, onEdit, onDelete }: Props) {
  const [filter, setFilter] = useState<SessionType | 'all'>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.type === filter);

  const handleDelete = (id: string) => {
    deleteSession(id);
    setConfirmDelete(null);
    onDelete();
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Historique</h1>
        <span className="text-sm text-gray-400">{filtered.length} séance{filtered.length > 1 ? 's' : ''}</span>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
            filter === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
          )}
        >
          <Filter size={12} /> Tout
        </button>
        {(Object.entries(SESSION_TYPE_LABELS) as [SessionType, string][]).map(([t, label]) => {
          const Icon = TYPE_ICON[t];
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                filter === t
                  ? `${TYPE_BG[t]} border-transparent`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              <Icon size={12} /> {label}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          Aucune séance trouvée
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => {
            const Icon = TYPE_ICON[session.type];
            const isOpen = !!expanded[session.id];

            return (
              <div key={session.id} className="card !p-0 overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(e => ({ ...e, [session.id]: !e[session.id] }))}
                >
                  <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', TYPE_BG[session.type])}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">
                      {session.title || SESSION_TYPE_LABELS[session.type]}
                    </div>
                    <div className="text-xs text-gray-400 flex flex-wrap gap-x-3 mt-0.5">
                      <span>{format(parseISO(session.date), 'EEEE d MMMM yyyy', { locale: fr })}</span>
                      {session.totalDuration && <span>{session.totalDuration} min</span>}
                      <span>{session.exercises.length} exercice{session.exercises.length > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); onEdit(session); }}
                      className="p-2 text-gray-300 hover:text-indigo-500 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    {confirmDelete === session.id ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleDelete(session.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg">Oui</button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">Non</button>
                      </div>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDelete(session.id); }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                    {isOpen ? <ChevronUp size={16} className="text-gray-300" /> : <ChevronDown size={16} className="text-gray-300" />}
                  </div>
                </div>

                {/* Exercise details */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4 space-y-3">
                    {session.exercises.map(ex => (
                      <ExerciseDetail key={ex.id} exercise={ex} />
                    ))}
                    {session.notes && (
                      <p className="text-xs text-gray-400 italic border-t border-gray-100 pt-3">
                        {session.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ExerciseDetail({ exercise }: { exercise: import('../types').Exercise }) {
  const metrics: MetricKey[] = ['weight', 'reps', 'duration', 'distance', 'rpm', 'heartRate', 'calories'];
  const usedMetrics = metrics.filter(m => exercise.sets.some(s => s[m as keyof typeof s] !== undefined));

  const distanceOrDuration = (
    (exercise.totalDistance !== undefined) ||
    (exercise.totalDuration !== undefined)
  );

  return (
    <div>
      <div className="text-sm font-semibold text-gray-700 mb-1.5">{exercise.name}</div>
      {distanceOrDuration && (
        <div className="flex gap-4 text-xs text-gray-500 mb-1.5">
          {exercise.totalDistance !== undefined && (
            <span>{(exercise.totalDistance / 1000).toFixed(2)} km</span>
          )}
          {exercise.totalDuration !== undefined && (
            <span>{formatTime(exercise.totalDuration)}</span>
          )}
        </div>
      )}
      {exercise.sets.length > 0 && usedMetrics.length > 0 && (
        <div className="overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="text-gray-400">
                <th className="text-left font-medium pb-1 pr-3">#</th>
                {usedMetrics.map(m => (
                  <th key={m} className="text-right font-medium pb-1 px-2">
                    {m === 'weight' ? 'kg' : m === 'reps' ? 'reps' : m === 'duration' ? 'sec' : METRIC_UNITS[m]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exercise.sets.map(s => (
                <tr key={s.setNumber} className="border-t border-gray-50">
                  <td className="py-1 pr-3 text-gray-400">{s.setNumber}</td>
                  {usedMetrics.map(m => (
                    <td key={m} className="py-1 px-2 text-right text-gray-700">
                      {s[m as keyof typeof s] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
