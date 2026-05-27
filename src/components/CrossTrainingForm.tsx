import { useState } from 'react';
import type { Session, CTBloc, CTForTimeBloc, CTAmrapBloc, CTFinisherBloc, CTAmrapExercise, CTFinisherExercise, CTBreak, CTGrip } from '../types';
import { CT_EXERCISES } from '../types';
import { generateId } from '../utils/storage';
import { Plus, Trash2, X, ChevronDown, ChevronUp, Timer, RefreshCw, Zap } from 'lucide-react';

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
          return (
            <ForTimeBlocForm key={bloc.id} bloc={bloc} {...shared}
              onUpdate={p => setBlocs(blocs.map(b => b.id === bloc.id ? { ...b, ...p } as CTBloc : b))} />
          );
        }
        if (bloc.blocType === 'amrap') {
          return (
            <AmrapBlocForm key={bloc.id} bloc={bloc} {...shared}
              onUpdate={p => setBlocs(blocs.map(b => b.id === bloc.id ? { ...b, ...p } as CTBloc : b))} />
          );
        }
        return (
          <FinisherBlocForm key={bloc.id} bloc={bloc} {...shared}
            onUpdate={p => setBlocs(blocs.map(b => b.id === bloc.id ? { ...b, ...p } as CTBloc : b))} />
        );
      })}

      <div className="flex gap-2">
        <button onClick={() => setBlocs([...blocs, emptyForTime()])}
          className="btn-secondary flex-1 justify-center text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
          <Timer size={14} /> For Time
        </button>
        <button onClick={() => setBlocs([...blocs, emptyAmrap()])}
          className="btn-secondary flex-1 justify-center text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
          <RefreshCw size={14} /> AMRAP
        </button>
        <button onClick={() => setBlocs([...blocs, emptyFinisher()])}
          className="btn-secondary flex-1 justify-center text-amber-600 border-amber-200 hover:bg-amber-50 text-xs">
          <Zap size={14} /> Finisher
        </button>
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

  const addBreak = () => onUpdate({ breaks: [...bloc.breaks, { repsDone: 0 }] });
  const updateBreak = (i: number, p: Partial<CTBreak>) =>
    onUpdate({ breaks: bloc.breaks.map((b, idx) => idx === i ? { ...b, ...p } : b) });
  const removeBreak = (i: number) =>
    onUpdate({ breaks: bloc.breaks.filter((_, idx) => idx !== i) });

  return (
    <div className="card border-2 border-amber-100 !p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Timer size={14} className="text-amber-600" />
          <span className="font-semibold text-amber-700 text-sm">Bloc {index + 1} · For Time</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="text-amber-400 hover:text-amber-600 p-1">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button onClick={onRemove} className="text-amber-300 hover:text-red-500 p-1"><Trash2 size={15} /></button>
        </div>
      </div>

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
                  <select
                    value={b.grip ?? ''}
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

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
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
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <RefreshCw size={14} className="text-amber-600" />
          <span className="font-semibold text-amber-700 text-sm">Bloc {index + 1} · AMRAP</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="text-amber-400 hover:text-amber-600 p-1">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button onClick={onRemove} className="text-amber-300 hover:text-red-500 p-1"><Trash2 size={15} /></button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            {bloc.exercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
                <input type="text" list="ct-ex-list" placeholder="Exercice"
                  value={ex.name}
                  onChange={e => updateEx(ex.id, { name: e.target.value })}
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
                <button onClick={() => removeEx(ex.id)} className="text-gray-200 hover:text-red-400 shrink-0">
                  <X size={14} />
                </button>
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

// ── Finisher ───────────────────────────────────────────────────

function FinisherBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: CTFinisherBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<CTFinisherBloc>) => void; onRemove: () => void;
}) {
  const [timeInput, setTimeInput] = useState(bloc.finalTime !== undefined ? secsToMmss(bloc.finalTime) : '');

  const addEx = () => onUpdate({ exercises: [...bloc.exercises, emptyFinisherEx()] });
  const removeEx = (id: string) => onUpdate({ exercises: bloc.exercises.filter(e => e.id !== id) });
  const updateEx = (id: string, p: Partial<CTFinisherExercise>) =>
    onUpdate({ exercises: bloc.exercises.map(e => e.id === id ? { ...e, ...p } : e) });

  return (
    <div className="card border-2 border-amber-100 !p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border-b border-amber-100">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-amber-600" />
          <span className="font-semibold text-amber-700 text-sm">Bloc {index + 1} · Finisher</span>
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
            <span className="w-4 shrink-0" />
            <span className="w-14 shrink-0 text-center">Reps</span>
            <span className="flex-1">Exercice</span>
            <span className="w-20 shrink-0 text-center">Variante</span>
            <span className="w-14 shrink-0 text-center">kg</span>
            <span className="w-6 shrink-0" />
          </div>
          {bloc.exercises.map((ex, i) => (
            <div key={ex.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
              <input type="number" min="0" placeholder="—"
                value={ex.targetReps ?? ''}
                onChange={e => updateEx(ex.id, { targetReps: e.target.value ? +e.target.value : undefined })}
                className="input !w-14 !py-1 text-center text-sm shrink-0" />
              <input type="text" list="ct-ex-list" placeholder="Exercice"
                value={ex.name}
                onChange={e => updateEx(ex.id, { name: e.target.value })}
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

export function CTExerciseDatalist() {
  return (
    <datalist id="ct-ex-list">
      {CT_EXERCISES.map(s => <option key={s} value={s} />)}
    </datalist>
  );
}
