import { useState } from 'react';
import type {
  Session, CTBloc, CTForTimeBloc, CTAmrapBloc, CTFinisherBloc, CTEmomBloc, CTDeathByBloc,
  CTAmrapExercise, CTFinisherExercise, CTEmomExercise, CTDeathByBlock,
  CTBreak, CTGrip,
} from '../types';
import { CT_EXERCISES, CARDIO_MACHINES } from '../types';
import { generateId } from '../utils/storage';
import { Plus, Trash2, X, ChevronDown, ChevronUp, Timer, RefreshCw, Zap, Clock, Activity } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  session: Session;
  onChange: (patch: Partial<Session>) => void;
}

export function secsToMmss(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function mmssToSecs(val: string): number | undefined {
  const match = val.match(/^(\d{1,3}):(\d{0,2})$/);
  if (!match) return undefined;
  const total = parseInt(match[1]) * 60 + parseInt(match[2] || '0');
  return isNaN(total) ? undefined : total;
}

const DEFAULT_INTERVALS = [
  { effortSecs: 40, restSecs: 20 },
  { effortSecs: 45, restSecs: 15 },
  { effortSecs: 50, restSecs: 10 },
];

function emptyForTime(): CTForTimeBloc {
  return { id: generateId(), blocType: 'forTime', exerciseName: '', breaks: [], penaltyRounds: 3 };
}
function emptyAmrap(): CTAmrapBloc {
  return { id: generateId(), blocType: 'amrap', exercises: [emptyAmrapEx()] };
}
function emptyAmrapEx(): CTAmrapExercise { return { id: generateId(), name: '' }; }
function emptyFinisher(): CTFinisherBloc {
  return { id: generateId(), blocType: 'finisher', exercises: [emptyFinisherEx()] };
}
function emptyFinisherEx(): CTFinisherExercise { return { id: generateId(), name: '' }; }
function emptyEmom(): CTEmomBloc {
  return { id: generateId(), blocType: 'emom', totalMinutes: 20, exercises: [emptyEmomEx()] };
}
function emptyEmomEx(): CTEmomExercise { return { id: generateId(), name: '', actualReps: [] }; }
function emptyDeathBy(): CTDeathByBloc {
  return {
    id: generateId(), blocType: 'deathBy', recoveryBetween: 1,
    blocks: [
      { id: generateId(), machine: 'Rameur', intervals: DEFAULT_INTERVALS.map(i => ({ ...i })) },
      { id: generateId(), machine: 'Ski Erg', intervals: DEFAULT_INTERVALS.map(i => ({ ...i })) },
    ],
  };
}

export default function CrossTrainingForm({ session, onChange }: Props) {
  const blocs: CTBloc[] = session.ctBlocs ?? [];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const setBlocs = (updated: CTBloc[]) => onChange({ ctBlocs: updated });
  const removeBloc = (id: string) => setBlocs(blocs.filter(b => b.id !== id));
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox"
            checked={!!session.warmupDone}
            onChange={e => onChange({ warmupDone: e.target.checked || undefined })}
            className="w-4 h-4 rounded accent-amber-500" />
          <span className="text-sm font-medium text-gray-700">Warm-up effectué</span>
        </label>
      </div>

      {blocs.map((bloc, bi) => {
        const shared = {
          index: bi,
          collapsed: !!collapsed[bloc.id],
          onToggle: () => toggle(bloc.id),
          onRemove: () => removeBloc(bloc.id),
        };
        if (bloc.blocType === 'forTime') {
          return <ForTimeBlocForm key={bloc.id} bloc={bloc} {...shared}
            onUpdate={p => setBlocs(blocs.map(b => b.id === bloc.id ? { ...b, ...p } as CTBloc : b))} />;
        }
        if (bloc.blocType === 'amrap') {
          return <AmrapBlocForm key={bloc.id} bloc={bloc} {...shared}
            onUpdate={p => setBlocs(blocs.map(b => b.id === bloc.id ? { ...b, ...p } as CTBloc : b))} />;
        }
        if (bloc.blocType === 'finisher') {
          return <FinisherBlocForm key={bloc.id} bloc={bloc} {...shared}
            onUpdate={p => setBlocs(blocs.map(b => b.id === bloc.id ? { ...b, ...p } as CTBloc : b))} />;
        }
        if (bloc.blocType === 'emom') {
          return <EmomBlocForm key={bloc.id} bloc={bloc} {...shared}
            onUpdate={p => setBlocs(blocs.map(b => b.id === bloc.id ? { ...b, ...p } as CTBloc : b))} />;
        }
        return <DeathByBlocForm key={bloc.id} bloc={bloc} {...shared}
          onUpdate={p => setBlocs(blocs.map(b => b.id === bloc.id ? { ...b, ...p } as CTBloc : b))} />;
      })}

      <div className="grid grid-cols-3 gap-2">
        <button onClick={() => setBlocs([...blocs, emptyForTime()])}
          className="btn-secondary justify-center text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
          <Timer size={13} /> For Time
        </button>
        <button onClick={() => setBlocs([...blocs, emptyAmrap()])}
          className="btn-secondary justify-center text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
          <RefreshCw size={13} /> AMRAP
        </button>
        <button onClick={() => setBlocs([...blocs, emptyEmom()])}
          className="btn-secondary justify-center text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
          <Clock size={13} /> EMOM
        </button>
        <button onClick={() => setBlocs([...blocs, emptyDeathBy()])}
          className="btn-secondary justify-center text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
          <Activity size={13} /> Death by
        </button>
        <button onClick={() => setBlocs([...blocs, emptyFinisher()])}
          className="btn-secondary col-span-2 justify-center text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
          <Zap size={13} /> Séquence (For Time / Finisher)
        </button>
      </div>
    </div>
  );
}

// ── Shared header ───────────────────────────────────────────────

function BlocHeader({ icon, title, collapsed, onToggle, onRemove }: {
  icon: React.ReactNode; title: string; collapsed: boolean;
  onToggle: () => void; onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
      <div className="flex items-center gap-2">{icon}<span className="font-semibold text-amber-700 text-sm">{title}</span></div>
      <div className="flex items-center gap-1">
        <button onClick={onToggle} className="text-amber-400 hover:text-amber-600 p-1">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <button onClick={onRemove} className="text-amber-300 hover:text-red-500 p-1"><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

// ── For Time ───────────────────────────────────────────────────

function ForTimeBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: CTForTimeBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<CTForTimeBloc>) => void; onRemove: () => void;
}) {
  const [timeInput, setTimeInput] = useState(bloc.finalTime !== undefined ? secsToMmss(bloc.finalTime) : '');
  const [segInputs, setSegInputs] = useState<Record<number, string>>(() => {
    const r: Record<number, string> = {};
    (bloc.segmentTimes ?? []).forEach((t, i) => { if (t !== undefined) r[i] = secsToMmss(t); });
    return r;
  });

  const isStructured = bloc.segmentInterval !== undefined;
  const numSegments = isStructured && bloc.targetReps && bloc.segmentInterval
    ? Math.ceil(bloc.targetReps / bloc.segmentInterval) : 0;

  const addBreak = () => onUpdate({ breaks: [...bloc.breaks, { repsDone: 0 }] });
  const updateBreak = (i: number, p: Partial<CTBreak>) =>
    onUpdate({ breaks: bloc.breaks.map((b, idx) => idx === i ? { ...b, ...p } : b) });
  const removeBreak = (i: number) =>
    onUpdate({ breaks: bloc.breaks.filter((_, idx) => idx !== i) });

  const updateSegTime = (i: number, val: string) => {
    setSegInputs(prev => ({ ...prev, [i]: val }));
    const s = mmssToSecs(val);
    if (s !== undefined) {
      const t = [...(bloc.segmentTimes ?? [])];
      while (t.length <= i) t.push(0);
      t[i] = s;
      onUpdate({ segmentTimes: t });
    }
  };

  const totalSegTime = (bloc.segmentTimes ?? []).reduce((s, t) => s + (t ?? 0), 0);

  return (
    <div className="card border-2 border-amber-100 !p-0 overflow-hidden">
      <BlocHeader
        icon={<Timer size={14} className="text-amber-600" />}
        title={`Bloc ${index + 1} · For Time`}
        collapsed={collapsed} onToggle={onToggle} onRemove={onRemove} />

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Exercice</label>
              <input type="text" list="ct-ex-list" placeholder="ex: Tractions"
                value={bloc.exerciseName}
                onChange={e => onUpdate({ exerciseName: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="label">Reps cible</label>
              <input type="number" min="0" placeholder="100"
                value={bloc.targetReps ?? ''}
                onChange={e => onUpdate({ targetReps: e.target.value ? +e.target.value : undefined })}
                className="input" />
            </div>
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-medium shrink-0">
              <button onClick={() => onUpdate({ segmentInterval: undefined, segmentTimes: undefined })}
                className={clsx('px-3 py-1.5 transition-colors',
                  !isStructured ? 'bg-gray-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
                Par breaks
              </button>
              <button onClick={() => onUpdate({ segmentInterval: 20, breaks: [] })}
                className={clsx('px-3 py-1.5 transition-colors',
                  isStructured ? 'bg-amber-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
                Chaque X reps
              </button>
            </div>
            {isStructured && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">tous les</span>
                <input type="number" min="1" placeholder="20"
                  value={bloc.segmentInterval ?? ''}
                  onChange={e => onUpdate({ segmentInterval: e.target.value ? +e.target.value : undefined })}
                  className="input !w-20 text-center" />
                <span className="text-xs text-gray-400">reps</span>
              </div>
            )}
          </div>

          {/* Penalty */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Pénalité</label>
              <input type="text" placeholder="ex: 10 pu + 5 burpees + 15 squats"
                value={bloc.penaltyDesc ?? ''}
                onChange={e => onUpdate({ penaltyDesc: e.target.value || undefined })}
                className="input text-sm" />
            </div>
            <div>
              <label className="label">× tours</label>
              <input type="number" min="1" placeholder="3"
                value={bloc.penaltyRounds ?? ''}
                onChange={e => onUpdate({ penaltyRounds: e.target.value ? +e.target.value : undefined })}
                className="input" />
            </div>
          </div>

          {isStructured ? (
            /* Structured mode: segment times */
            <div className="space-y-2">
              <label className="label">Temps par segment</label>
              {numSegments === 0 && (
                <p className="text-xs text-gray-400">Renseigne "Reps cible" et "tous les X reps" pour voir les segments.</p>
              )}
              {Array.from({ length: numSegments }, (_, i) => {
                const start = i * (bloc.segmentInterval ?? 0) + 1;
                const end = Math.min((i + 1) * (bloc.segmentInterval ?? 0), bloc.targetReps ?? 0);
                return (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
                    <span className="text-xs text-gray-500 w-20 shrink-0">rep {start}→{end}</span>
                    <input type="text" placeholder="mm:ss"
                      value={segInputs[i] ?? ''}
                      onChange={e => updateSegTime(i, e.target.value)}
                      className="input !py-1 !w-24 text-center font-mono" />
                  </div>
                );
              })}
              {numSegments > 0 && totalSegTime > 0 && (
                <p className="text-xs text-amber-600 font-medium">
                  Temps total : {secsToMmss(totalSegTime)}
                </p>
              )}
            </div>
          ) : (
            /* Breaks mode */
            <div>
              <label className="label">Breaks ({bloc.breaks.length})</label>
              <div className="space-y-2 mt-1">
                {bloc.breaks.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
                    <input type="number" min="0" placeholder="reps"
                      value={b.repsDone || ''}
                      onChange={e => updateBreak(i, { repsDone: e.target.value ? +e.target.value : 0 })}
                      className="input !py-1 !w-20 text-center" />
                    <span className="text-xs text-gray-400 shrink-0">reps</span>
                    <select value={b.grip ?? ''}
                      onChange={e => updateBreak(i, { grip: (e.target.value as CTGrip) || undefined })}
                      className="select !py-1 text-xs flex-1">
                      <option value="">Prise —</option>
                      <option value="pronation">Pronation</option>
                      <option value="supination">Supination</option>
                      <option value="neutre">Neutre</option>
                    </select>
                    <button onClick={() => removeBreak(i)} className="text-gray-200 hover:text-red-400 p-1 shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={addBreak} className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-1 mt-2">
                <Plus size={13} /> Break
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            {!isStructured && (
              <div>
                <label className="label">Temps final (mm:ss)</label>
                <input type="text" placeholder="15:32"
                  value={timeInput}
                  onChange={e => {
                    setTimeInput(e.target.value);
                    const s = mmssToSecs(e.target.value);
                    if (s !== undefined) onUpdate({ finalTime: s });
                  }}
                  className="input text-center font-mono" />
              </div>
            )}
            <div>
              <label className="label">Récup après (min)</label>
              <input type="text" placeholder="3-5"
                value={bloc.recoveryAfter ?? ''}
                onChange={e => onUpdate({ recoveryAfter: e.target.value || undefined })}
                className="input text-center" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── AMRAP ──────────────────────────────────────────────────────

function AmrapBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: CTAmrapBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<CTAmrapBloc>) => void; onRemove: () => void;
}) {
  const addEx = () => onUpdate({ exercises: [...bloc.exercises, emptyAmrapEx()] });
  const removeEx = (id: string) => onUpdate({ exercises: bloc.exercises.filter(e => e.id !== id) });
  const updateEx = (id: string, p: Partial<CTAmrapExercise>) =>
    onUpdate({ exercises: bloc.exercises.map(e => e.id === id ? { ...e, ...p } : e) });

  return (
    <div className="card border-2 border-amber-100 !p-0 overflow-hidden">
      <BlocHeader icon={<RefreshCw size={14} className="text-amber-600" />}
        title={`Bloc ${index + 1} · AMRAP`}
        collapsed={collapsed} onToggle={onToggle} onRemove={onRemove} />

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            {bloc.exercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
                <input type="text" list="ct-ex-list" placeholder="Exercice"
                  value={ex.name} onChange={e => updateEx(ex.id, { name: e.target.value })}
                  className="input flex-1 min-w-0" />
                <input type="number" min="0" placeholder="—"
                  value={ex.targetReps ?? ''}
                  onChange={e => updateEx(ex.id, { targetReps: e.target.value ? +e.target.value : undefined })}
                  className="input !w-14 !py-1 text-center text-sm shrink-0" />
                <span className="text-xs text-gray-400 shrink-0">reps</span>
                <input type="number" min="0" placeholder="—"
                  value={ex.targetCals ?? ''}
                  onChange={e => updateEx(ex.id, { targetCals: e.target.value ? +e.target.value : undefined })}
                  className="input !w-12 !py-1 text-center text-sm shrink-0" />
                <span className="text-xs text-gray-400 shrink-0">cal</span>
                <button onClick={() => removeEx(ex.id)} className="text-gray-200 hover:text-red-400 shrink-0"><X size={14} /></button>
              </div>
            ))}
            <button onClick={addEx} className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-1">
              <Plus size={13} /> Exercice
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            <div>
              <label className="label">Durée (min)</label>
              <input type="number" min="0" placeholder="—"
                value={bloc.duration ?? ''}
                onChange={e => onUpdate({ duration: e.target.value ? +e.target.value : undefined })}
                className="input text-center" />
            </div>
            <div>
              <label className="label">Rounds complets</label>
              <input type="number" min="0" placeholder="—"
                value={bloc.roundsCompleted ?? ''}
                onChange={e => onUpdate({ roundsCompleted: e.target.value ? +e.target.value : undefined })}
                className="input text-center" />
            </div>
            <div>
              <label className="label">+ partiel (ex.)</label>
              <input type="number" min="0" max={bloc.exercises.length} placeholder="—"
                value={bloc.partialRoundExercises ?? ''}
                onChange={e => onUpdate({ partialRoundExercises: e.target.value ? +e.target.value : undefined })}
                className="input text-center" />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500 shrink-0">Récupération après</span>
            <input type="text" placeholder="3-5"
              value={bloc.recoveryAfter ?? ''}
              onChange={e => onUpdate({ recoveryAfter: e.target.value || undefined })}
              className="input !w-20 text-center" />
            <span className="text-xs text-gray-400">min</span>
          </div>
        </div>
      )}
    </div>
  );
}

function finisherQty(ex: CTFinisherExercise): number | '' {
  const m = ex.metric ?? 'reps';
  if (m === 'km') return ex.targetDistance ?? '';
  if (m === 'cal') return ex.targetCals ?? '';
  return ex.targetReps ?? '';
}
function finisherQtyPatch(ex: CTFinisherExercise, val: string): Partial<CTFinisherExercise> {
  const num = val ? +val : undefined;
  const m = ex.metric ?? 'reps';
  if (m === 'km') return { targetDistance: num };
  if (m === 'cal') return { targetCals: num };
  return { targetReps: num };
}

// ── Séquence (For Time / Finisher) ─────────────────────────────

function FinisherBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: CTFinisherBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<CTFinisherBloc>) => void; onRemove: () => void;
}) {
  const [timeInput, setTimeInput] = useState(bloc.finalTime !== undefined ? secsToMmss(bloc.finalTime) : '');
  const label = bloc.label ?? 'Finisher';

  const addEx = () => onUpdate({ exercises: [...bloc.exercises, emptyFinisherEx()] });
  const removeEx = (id: string) => onUpdate({ exercises: bloc.exercises.filter(e => e.id !== id) });
  const updateEx = (id: string, p: Partial<CTFinisherExercise>) =>
    onUpdate({ exercises: bloc.exercises.map(e => e.id === id ? { ...e, ...p } : e) });

  return (
    <div className="card border-2 border-amber-100 !p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-600" />
          <span className="font-semibold text-amber-700 text-sm">Bloc {index + 1} ·</span>
          <select value={label}
            onChange={e => onUpdate({ label: e.target.value })}
            className="text-sm font-semibold text-amber-700 bg-transparent border-0 outline-none cursor-pointer">
            <option value="For Time">For Time</option>
            <option value="Finisher">Finisher</option>
            <option value="Straight">Straight</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="text-amber-400 hover:text-amber-600 p-1">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button onClick={onRemove} className="text-amber-300 hover:text-red-500 p-1"><Trash2 size={15} /></button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <div className="flex text-xs text-gray-400 gap-2 px-1">
            <span className="w-4 shrink-0" /><span className="w-28 shrink-0 text-center">Qté</span>
            <span className="flex-1">Exercice</span>
            <span className="w-20 shrink-0 text-center">Variante</span>
            <span className="w-14 shrink-0 text-center">kg</span>
            <span className="w-6 shrink-0" />
          </div>
          {bloc.exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
              <div className="flex items-center gap-1 w-28 shrink-0">
                <input type="number" min="0" step={ex.metric === 'km' ? '0.1' : '1'} placeholder="—"
                  value={finisherQty(ex)}
                  onChange={e => updateEx(ex.id, finisherQtyPatch(ex, e.target.value))}
                  className="input !w-12 !py-1 text-center text-sm" />
                <select value={ex.metric ?? 'reps'}
                  onChange={e => updateEx(ex.id, { metric: e.target.value as 'reps' | 'km' | 'cal' })}
                  className="select !py-1 text-xs flex-1">
                  <option value="reps">reps</option>
                  <option value="km">km</option>
                  <option value="cal">cal</option>
                </select>
              </div>
              <input type="text" list="ct-ex-list" placeholder="Exercice"
                value={ex.name} onChange={e => updateEx(ex.id, { name: e.target.value })}
                className="input flex-1 min-w-0" />
              <input type="text" placeholder="—"
                value={ex.variant ?? ''}
                onChange={e => updateEx(ex.id, { variant: e.target.value || undefined })}
                className="input !w-20 !py-1 text-sm shrink-0" />
              <input type="number" min="0" step="0.5" placeholder="—"
                value={ex.weight ?? ''}
                onChange={e => updateEx(ex.id, { weight: e.target.value ? +e.target.value : undefined })}
                className="input !w-14 !py-1 text-center text-sm shrink-0" />
              <button onClick={() => removeEx(ex.id)} className="text-gray-200 hover:text-red-400 w-6 shrink-0 flex justify-center">
                <X size={14} />
              </button>
            </div>
          ))}
          <button onClick={addEx} className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-1">
            <Plus size={13} /> Exercice
          </button>

          <div className="pt-2 border-t border-gray-100">
            <label className="label">Temps final (mm:ss)</label>
            <input type="text" placeholder="15:32"
              value={timeInput}
              onChange={e => {
                setTimeInput(e.target.value);
                const s = mmssToSecs(e.target.value);
                if (s !== undefined) onUpdate({ finalTime: s });
              }}
              className="input !w-32 text-center font-mono" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── EMOM ───────────────────────────────────────────────────────

function EmomBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: CTEmomBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<CTEmomBloc>) => void; onRemove: () => void;
}) {
  const rounds = bloc.exercises.length > 0 && bloc.totalMinutes > 0
    ? Math.floor(bloc.totalMinutes / bloc.exercises.length) : 0;

  const addEx = () => onUpdate({ exercises: [...bloc.exercises, emptyEmomEx()] });
  const removeEx = (id: string) => onUpdate({ exercises: bloc.exercises.filter(e => e.id !== id) });
  const updateEx = (id: string, p: Partial<CTEmomExercise>) =>
    onUpdate({ exercises: bloc.exercises.map(e => e.id === id ? { ...e, ...p } : e) });
  const updateActualRep = (exId: string, ri: number, val: string) => {
    onUpdate({
      exercises: bloc.exercises.map(ex => {
        if (ex.id !== exId) return ex;
        const arr = [...(ex.actualReps ?? [])];
        while (arr.length <= ri) arr.push(undefined);
        arr[ri] = val ? +val : undefined;
        return { ...ex, actualReps: arr };
      }),
    });
  };

  return (
    <div className="card border-2 border-amber-100 !p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-amber-600" />
          <span className="font-semibold text-amber-700 text-sm">Bloc {index + 1} · EMOM</span>
          {rounds > 0 && <span className="text-xs text-amber-400">{rounds} rounds</span>}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="text-amber-400 hover:text-amber-600 p-1">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button onClick={onRemove} className="text-amber-300 hover:text-red-500 p-1"><Trash2 size={15} /></button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="label !mb-0">Durée totale</label>
            <input type="number" min="1" placeholder="20"
              value={bloc.totalMinutes || ''}
              onChange={e => onUpdate({ totalMinutes: e.target.value ? +e.target.value : 0 })}
              className="input !w-20 text-center" />
            <span className="text-xs text-gray-400">min</span>
          </div>

          <div className="space-y-2">
            {bloc.exercises.map((ex, i) => (
              <div key={ex.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
                  <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer shrink-0">
                    <input type="checkbox" checked={!!ex.isRest}
                      onChange={e => updateEx(ex.id, { isRest: e.target.checked || undefined, name: e.target.checked ? 'REST' : '' })} />
                    rest
                  </label>
                  <input type="text" list="ct-ex-list" placeholder="Exercice"
                    value={ex.name} onChange={e => updateEx(ex.id, { name: e.target.value })}
                    disabled={!!ex.isRest}
                    className={clsx('input flex-1 min-w-0', ex.isRest && 'opacity-40')} />
                  <button onClick={() => removeEx(ex.id)} className="text-gray-200 hover:text-red-400 shrink-0">
                    <X size={14} />
                  </button>
                </div>

                {!ex.isRest && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 shrink-0">Cible</span>
                      <input type="number" min="0" placeholder="min"
                        value={ex.targetRepsMin ?? ''}
                        onChange={e => updateEx(ex.id, { targetRepsMin: e.target.value ? +e.target.value : undefined })}
                        className="input !w-16 !py-1 text-center text-sm" />
                      <span className="text-xs text-gray-400">-</span>
                      <input type="number" min="0" placeholder="max"
                        value={ex.targetRepsMax ?? ''}
                        onChange={e => updateEx(ex.id, { targetRepsMax: e.target.value ? +e.target.value : undefined })}
                        className="input !w-16 !py-1 text-center text-sm" />
                      <span className="text-xs text-gray-400">reps</span>
                    </div>

                    {rounds > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-gray-400 shrink-0">Rounds</span>
                        {Array.from({ length: rounds }, (_, ri) => (
                          <input key={ri} type="number" min="0" placeholder={`R${ri + 1}`}
                            value={(ex.actualReps ?? [])[ri] ?? ''}
                            onChange={e => updateActualRep(ex.id, ri, e.target.value)}
                            className="input !w-14 !py-1 text-center text-sm" />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            <button onClick={addEx} className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-1">
              <Plus size={13} /> Exercice
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Death by ───────────────────────────────────────────────────

function DeathByBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: CTDeathByBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<CTDeathByBloc>) => void; onRemove: () => void;
}) {
  const addBlock = () => onUpdate({
    blocks: [...bloc.blocks, { id: generateId(), machine: '', intervals: DEFAULT_INTERVALS.map(i => ({ ...i })) }],
  });
  const removeBlock = (id: string) => onUpdate({ blocks: bloc.blocks.filter(b => b.id !== id) });
  const updateBlock = (id: string, p: Partial<CTDeathByBlock>) =>
    onUpdate({ blocks: bloc.blocks.map(b => b.id === id ? { ...b, ...p } : b) });
  const updateInterval = (blockId: string, ii: number, p: Partial<{ effortSecs: number; restSecs: number; avgWatts?: number; avgRpm?: number }>) =>
    onUpdate({
      blocks: bloc.blocks.map(b => b.id !== blockId ? b : {
        ...b,
        intervals: b.intervals.map((iv, idx) => idx === ii ? { ...iv, ...p } : iv),
      }),
    });
  const addInterval = (blockId: string) =>
    onUpdate({
      blocks: bloc.blocks.map(b => b.id !== blockId ? b : {
        ...b, intervals: [...b.intervals, { effortSecs: 30, restSecs: 30 }],
      }),
    });
  const removeInterval = (blockId: string, ii: number) =>
    onUpdate({
      blocks: bloc.blocks.map(b => b.id !== blockId ? b : {
        ...b, intervals: b.intervals.filter((_, idx) => idx !== ii),
      }),
    });

  return (
    <div className="card border-2 border-amber-100 !p-0 overflow-hidden">
      <BlocHeader icon={<Activity size={14} className="text-amber-600" />}
        title={`Bloc ${index + 1} · Death by`}
        collapsed={collapsed} onToggle={onToggle} onRemove={onRemove} />

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">Récup entre machines</span>
            <input type="number" min="0" placeholder="1"
              value={bloc.recoveryBetween ?? ''}
              onChange={e => onUpdate({ recoveryBetween: e.target.value ? +e.target.value : undefined })}
              className="input !w-16 text-center" />
            <span className="text-xs text-gray-400">min</span>
          </div>

          {bloc.blocks.map((block, bi) => (
            <div key={block.id} className="bg-gray-50 rounded-xl p-3 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 shrink-0">Machine {bi + 1}</span>
                <input type="text" list="ct-machines-list" placeholder="ex: Rameur"
                  value={block.machine ?? ''}
                  onChange={e => updateBlock(block.id, { machine: e.target.value || undefined })}
                  className="input flex-1" />
                {bloc.blocks.length > 1 && (
                  <button onClick={() => removeBlock(block.id)} className="text-gray-300 hover:text-red-400 shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="grid text-xs text-gray-400 gap-1 px-1" style={{ gridTemplateColumns: '16px 50px 50px 1fr 1fr 20px' }}>
                  <span /><span className="text-center">Effort</span><span className="text-center">Récup</span>
                  <span className="text-center">Watts moy</span><span className="text-center">RPM moy</span><span />
                </div>
                {block.intervals.map((iv, ii) => (
                  <div key={ii} className="grid items-center gap-1" style={{ gridTemplateColumns: '16px 50px 50px 1fr 1fr 20px' }}>
                    <span className="text-xs text-gray-400 text-center">{ii + 1}</span>
                    <div className="flex items-center gap-0.5">
                      <input type="number" min="0" value={iv.effortSecs}
                        onChange={e => updateInterval(block.id, ii, { effortSecs: +e.target.value || 0 })}
                        className="input !py-1 text-center text-sm w-full" />
                      <span className="text-xs text-gray-400">''</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <input type="number" min="0" value={iv.restSecs}
                        onChange={e => updateInterval(block.id, ii, { restSecs: +e.target.value || 0 })}
                        className="input !py-1 text-center text-sm w-full" />
                      <span className="text-xs text-gray-400">''</span>
                    </div>
                    <input type="number" min="0" placeholder="—"
                      value={iv.avgWatts ?? ''}
                      onChange={e => updateInterval(block.id, ii, { avgWatts: e.target.value ? +e.target.value : undefined })}
                      className="input !py-1 text-center text-sm" />
                    <input type="number" min="0" placeholder="—"
                      value={iv.avgRpm ?? ''}
                      onChange={e => updateInterval(block.id, ii, { avgRpm: e.target.value ? +e.target.value : undefined })}
                      className="input !py-1 text-center text-sm" />
                    <button onClick={() => removeInterval(block.id, ii)}
                      className="text-gray-200 hover:text-red-400 flex justify-center">
                      <X size={13} />
                    </button>
                  </div>
                ))}
                <button onClick={() => addInterval(block.id)}
                  className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-1 mt-1">
                  <Plus size={12} /> Intervalle
                </button>
              </div>
            </div>
          ))}

          <button onClick={addBlock} className="text-xs text-amber-500 hover:text-amber-700 flex items-center gap-1">
            <Plus size={13} /> Machine
          </button>
        </div>
      )}
    </div>
  );
}

export function CTExerciseDatalist() {
  return (
    <>
      <datalist id="ct-ex-list">
        {CT_EXERCISES.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="ct-machines-list">
        {CARDIO_MACHINES.map(m => <option key={m} value={m} />)}
      </datalist>
    </>
  );
}
