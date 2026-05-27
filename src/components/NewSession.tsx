import { useState, useEffect } from 'react';
import type { Session, SessionType, Exercise, ExerciseSet, MetricKey } from '../types';
import { SESSION_TYPE_LABELS, SUGGESTED_EXERCISES, SESSION_METRICS, METRIC_LABELS } from '../types';
import { addSession, updateSession, generateId } from '../utils/storage';
import { Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  sessions: Session[];
  editing: Session | null;
  onSaved: () => void;
  onCancel: () => void;
}

const TYPE_COLORS: Record<SessionType, string> = {
  cardio: 'border-red-300 bg-red-50 text-red-700',
  musculation: 'border-blue-300 bg-blue-50 text-blue-700',
  hyrox: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  crosstraining: 'border-amber-300 bg-amber-50 text-amber-700',
};

function emptySet(n: number): ExerciseSet {
  return { setNumber: n };
}

function emptyExercise(): Exercise {
  return { id: generateId(), name: '', sets: [emptySet(1)] };
}

export default function NewSession({ editing, onSaved, onCancel }: Props) {
  const [type, setType] = useState<SessionType>(editing?.type ?? 'musculation');
  const [date, setDate] = useState(editing?.date ?? new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState(editing?.title ?? '');
  const [totalDuration, setTotalDuration] = useState<string>(editing?.totalDuration?.toString() ?? '');
  const [notes, setNotes] = useState(editing?.notes ?? '');
  const [exercises, setExercises] = useState<Exercise[]>(
    editing?.exercises ?? [emptyExercise()]
  );
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!editing) {
      setExercises([emptyExercise()]);
    }
  }, [type, editing]);

  const metrics = SESSION_METRICS[type];

  // -- Exercise helpers --
  const updateExercise = (id: string, patch: Partial<Exercise>) => {
    setExercises(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  };

  const removeExercise = (id: string) => {
    setExercises(prev => prev.filter(e => e.id !== id));
  };

  const addExercise = () => {
    setExercises(prev => [...prev, emptyExercise()]);
  };

  // -- Set helpers --
  const updateSet = (exId: string, setNum: number, key: keyof ExerciseSet, raw: string) => {
    const val = raw === '' ? undefined : parseFloat(raw);
    setExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      return {
        ...e,
        sets: e.sets.map(s =>
          s.setNumber === setNum ? { ...s, [key]: isNaN(val as number) ? undefined : val } : s
        ),
      };
    }));
  };

  const addSet = (exId: string) => {
    setExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      return { ...e, sets: [...e.sets, emptySet(e.sets.length + 1)] };
    }));
  };

  const removeSet = (exId: string, setNum: number) => {
    setExercises(prev => prev.map(e => {
      if (e.id !== exId) return e;
      const filtered = e.sets.filter(s => s.setNumber !== setNum).map((s, i) => ({ ...s, setNumber: i + 1 }));
      return { ...e, sets: filtered };
    }));
  };

  const handleSave = () => {
    const session: Session = {
      id: editing?.id ?? generateId(),
      type,
      date,
      title: title || undefined,
      exercises: exercises.filter(e => e.name.trim()),
      totalDuration: totalDuration ? parseInt(totalDuration) : undefined,
      notes: notes || undefined,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    };
    if (editing) {
      updateSession(session);
    } else {
      addSession(session);
    }
    onSaved();
  };

  const canSave = exercises.some(e => e.name.trim());

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          {editing ? 'Modifier la séance' : 'Nouvelle séance'}
        </h1>
        <button onClick={onCancel} className="btn-secondary !px-3 !py-2">
          <X size={16} />
        </button>
      </div>

      {/* Type selector */}
      <div className="card space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Type de séance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.entries(SESSION_TYPE_LABELS) as [SessionType, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={clsx(
                'py-3 px-2 rounded-xl border-2 text-sm font-medium transition-all',
                type === t ? TYPE_COLORS[t] : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">Durée totale (min)</label>
            <input
              type="number" min="0" placeholder="ex: 60"
              value={totalDuration}
              onChange={e => setTotalDuration(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Titre (optionnel)</label>
          <input
            type="text" placeholder={`ex: ${SESSION_TYPE_LABELS[type]} du matin`}
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            Exercices ({exercises.length})
          </h2>
        </div>

        {exercises.map((ex, exIdx) => (
          <ExerciseCard
            key={ex.id}
            exercise={ex}
            index={exIdx}
            metrics={metrics}
            type={type}
            collapsed={!!collapsed[ex.id]}
            onToggleCollapse={() => setCollapsed(c => ({ ...c, [ex.id]: !c[ex.id] }))}
            onUpdate={patch => updateExercise(ex.id, patch)}
            onRemove={() => removeExercise(ex.id)}
            onAddSet={() => addSet(ex.id)}
            onRemoveSet={n => removeSet(ex.id, n)}
            onUpdateSet={(n, k, v) => updateSet(ex.id, n, k, v)}
          />
        ))}

        <button onClick={addExercise} className="btn-secondary w-full justify-center">
          <Plus size={16} /> Ajouter un exercice
        </button>
      </div>

      {/* Notes */}
      <div className="card">
        <label className="label">Notes de séance</label>
        <textarea
          rows={3}
          placeholder="Sensations, remarques..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className="input resize-none"
        />
      </div>

      {/* Save */}
      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1 justify-center">Annuler</button>
        <button onClick={handleSave} disabled={!canSave} className={clsx('btn-primary flex-1 justify-center', !canSave && 'opacity-40 cursor-not-allowed')}>
          {editing ? 'Enregistrer les modifications' : 'Sauvegarder la séance'}
        </button>
      </div>
    </div>
  );
}

// ---- ExerciseCard ----

interface ExerciseCardProps {
  exercise: Exercise;
  index: number;
  metrics: MetricKey[];
  type: SessionType;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onUpdate: (patch: Partial<Exercise>) => void;
  onRemove: () => void;
  onAddSet: () => void;
  onRemoveSet: (n: number) => void;
  onUpdateSet: (n: number, k: keyof ExerciseSet, v: string) => void;
}

function ExerciseCard({
  exercise, index, metrics, type, collapsed,
  onToggleCollapse, onUpdate, onRemove, onAddSet, onRemoveSet, onUpdateSet,
}: ExerciseCardProps) {
  const suggestions = SUGGESTED_EXERCISES[type];

  return (
    <div className="card border border-gray-200 !p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-100">
        <span className="text-xs font-bold text-gray-400 w-5 text-center">{index + 1}</span>
        <div className="flex-1 relative">
          <input
            type="text"
            list={`ex-suggestions-${exercise.id}`}
            placeholder="Nom de l'exercice"
            value={exercise.name}
            onChange={e => onUpdate({ name: e.target.value })}
            className="input !py-1.5"
          />
          <datalist id={`ex-suggestions-${exercise.id}`}>
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
        <button onClick={onToggleCollapse} className="text-gray-400 hover:text-gray-600 p-1">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-500 p-1">
          <Trash2 size={15} />
        </button>
      </div>

      {/* Sets table */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          {/* Column headers */}
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `24px repeat(${metrics.length}, 1fr) 24px` }}>
            <span className="text-xs text-gray-400 text-center">#</span>
            {metrics.map(m => (
              <span key={m} className="text-xs text-gray-400 text-center truncate px-1">
                {METRIC_LABELS[m].split(' ')[0]}
              </span>
            ))}
            <span />
          </div>

          {/* Set rows */}
          {exercise.sets.map(s => (
            <div key={s.setNumber} className="grid gap-1.5 items-center" style={{ gridTemplateColumns: `24px repeat(${metrics.length}, 1fr) 24px` }}>
              <span className="text-xs text-center text-gray-400">{s.setNumber}</span>
              {metrics.map(m => (
                <input
                  key={m}
                  type="number"
                  min="0"
                  step={m === 'weight' ? '0.5' : '1'}
                  placeholder="—"
                  value={s[m as keyof ExerciseSet] ?? ''}
                  onChange={e => onUpdateSet(s.setNumber, m as keyof ExerciseSet, e.target.value)}
                  className="input !py-1 text-center text-sm"
                />
              ))}
              <button onClick={() => onRemoveSet(s.setNumber)} className="text-gray-200 hover:text-red-400 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}

          <button onClick={onAddSet} className="text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1 mt-1">
            <Plus size={13} /> Série
          </button>
        </div>
      )}
    </div>
  );
}
