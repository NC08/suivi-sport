import { useState } from 'react';
import type { Session, MuscuItem, MuscuExercise, MuscuSuperset, MuscuSet, SupersetExercise } from '../types';
import { MUSCU_EXERCISES, MUSCU_VARIATIONS } from '../types';
import { generateId } from '../utils/storage';
import { Plus, Trash2, X, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  session: Session;
  onChange: (patch: Partial<Session>) => void;
}

function emptySet(n: number): MuscuSet { return { setNumber: n }; }
function emptyExercise(): MuscuExercise {
  return { id: generateId(), itemType: 'exercise', name: '', sets: [emptySet(1), emptySet(2), emptySet(3)] };
}
function emptySupersetExercise(): SupersetExercise { return { id: generateId(), name: '' }; }
function emptySuperset(rounds = 3): MuscuSuperset {
  return { id: generateId(), itemType: 'superset', rounds, exercises: [emptySupersetExercise(), emptySupersetExercise()] };
}

export default function MuscuForm({ session, onChange }: Props) {
  const items: MuscuItem[] = session.muscuItems ?? [emptyExercise()];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const setItems = (updated: MuscuItem[]) => onChange({ muscuItems: updated });
  const addExercise = () => setItems([...items, emptyExercise()]);
  const addSuperset = () => setItems([...items, emptySuperset()]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  const updateItem = (id: string, patch: Partial<MuscuItem>) =>
    setItems(items.map(i => i.id === id ? { ...i, ...patch } as MuscuItem : i));

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        item.itemType === 'exercise' ? (
          <ExerciseCard key={item.id} exercise={item} index={idx}
            collapsed={!!collapsed[item.id]}
            onToggleCollapse={() => setCollapsed(c => ({ ...c, [item.id]: !c[item.id] }))}
            onUpdate={patch => updateItem(item.id, patch as Partial<MuscuItem>)}
            onRemove={() => removeItem(item.id)} />
        ) : (
          <SupersetCard key={item.id} superset={item} index={idx}
            collapsed={!!collapsed[item.id]}
            onToggleCollapse={() => setCollapsed(c => ({ ...c, [item.id]: !c[item.id] }))}
            onUpdate={patch => updateItem(item.id, patch as Partial<MuscuItem>)}
            onRemove={() => removeItem(item.id)} />
        )
      ))}
      <div className="flex gap-2">
        <button onClick={addExercise} className="btn-secondary flex-1 justify-center text-blue-600 border-blue-200 hover:bg-blue-50">
          <Plus size={16} /> Exercice
        </button>
        <button onClick={addSuperset} className="btn-secondary flex-1 justify-center text-violet-600 border-violet-200 hover:bg-violet-50">
          <Layers size={16} /> Superset
        </button>
      </div>
    </div>
  );
}

interface ExerciseCardProps {
  exercise: MuscuExercise; index: number; collapsed: boolean;
  onToggleCollapse: () => void; onUpdate: (p: Partial<MuscuExercise>) => void; onRemove: () => void;
}

function ExerciseCard({ exercise, index, collapsed, onToggleCollapse, onUpdate, onRemove }: ExerciseCardProps) {
  const num = (v: string) => v === '' ? undefined : parseFloat(v);
  const updateSet = (n: number, key: keyof MuscuSet, raw: string) =>
    onUpdate({ sets: exercise.sets.map(s => s.setNumber === n ? { ...s, [key]: num(raw) } : s) });
  const addSet = () => onUpdate({ sets: [...exercise.sets, emptySet(exercise.sets.length + 1)] });
  const removeSet = (n: number) => onUpdate({
    sets: exercise.sets.filter(s => s.setNumber !== n).map((s, i) => ({ ...s, setNumber: i + 1 })),
  });

  return (
    <div className="card border-2 border-blue-100 !p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border-b border-blue-100">
        <span className="text-xs font-bold text-blue-400 w-5 text-center shrink-0">{index + 1}</span>
        <div className="flex-1 min-w-0">
          <input type="text" list="muscu-exercises" placeholder="Nom de l'exercice"
            value={exercise.name} onChange={e => onUpdate({ name: e.target.value })} className="input !py-1.5 !text-sm" />
          <datalist id="muscu-exercises">{MUSCU_EXERCISES.map(s => <option key={s} value={s} />)}</datalist>
        </div>
        <button onClick={onToggleCollapse} className="text-blue-300 hover:text-blue-500 p-1 shrink-0">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <button onClick={onRemove} className="text-gray-300 hover:text-red-500 p-1 shrink-0"><Trash2 size={15} /></button>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-3">
          <div>
            <label className="label">Variation (optionnel)</label>
            <input type="text" list="muscu-variations" placeholder="ex: Sans banc, Debout…"
              value={exercise.variation ?? ''} onChange={e => onUpdate({ variation: e.target.value || undefined })} className="input text-sm" />
            <datalist id="muscu-variations">{MUSCU_VARIATIONS.map(v => <option key={v} value={v} />)}</datalist>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400">
                  <th className="text-center pb-1.5 w-6">#</th>
                  <th className="text-center pb-1.5 px-1">Poids (kg)</th>
                  <th className="text-center pb-1.5 px-1">Reps cible</th>
                  <th className="text-center pb-1.5 px-1">Reps réelles</th>
                  <th className="w-5" />
                </tr>
              </thead>
              <tbody>
                {exercise.sets.map(s => (
                  <tr key={s.setNumber}>
                    <td className="text-center text-gray-400 py-1">{s.setNumber}</td>
                    <td className="px-1 py-1"><input type="number" min="0" step="0.5" placeholder="—" value={s.weight ?? ''} onChange={e => updateSet(s.setNumber, 'weight', e.target.value)} className="input !py-1 text-center" /></td>
                    <td className="px-1 py-1"><input type="number" min="0" placeholder="—" value={s.targetReps ?? ''} onChange={e => updateSet(s.setNumber, 'targetReps', e.target.value)} className="input !py-1 text-center" /></td>
                    <td className="px-1 py-1">
                      <input type="number" min="0" placeholder="=" value={s.actualReps ?? ''}
                        onChange={e => updateSet(s.setNumber, 'actualReps', e.target.value)}
                        className={clsx('input !py-1 text-center', s.actualReps !== undefined && s.targetReps !== undefined && s.actualReps < s.targetReps ? 'border-orange-300 bg-orange-50 text-orange-700' : '')} />
                    </td>
                    <td className="pl-1"><button onClick={() => removeSet(s.setNumber)} className="text-gray-200 hover:text-red-400"><X size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addSet} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1.5"><Plus size={12} /> Série</button>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Récup</span>
              <input type="number" min="0" step="0.5" placeholder="—" value={exercise.recoveryAfter ?? ''} onChange={e => onUpdate({ recoveryAfter: e.target.value ? +e.target.value : undefined })} className="input !w-16 text-center" />
              <span className="text-xs text-gray-400">min</span>
              <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer ml-1">
                <input type="checkbox" checked={!!exercise.recoveryIsAvg} onChange={e => onUpdate({ recoveryIsAvg: e.target.checked })} className="rounded" />
                moy
              </label>
            </div>
            <input type="text" placeholder="Notes…" value={exercise.notes ?? ''} onChange={e => onUpdate({ notes: e.target.value || undefined })} className="input text-xs flex-1 min-w-32" />
          </div>
        </div>
      )}
    </div>
  );
}

interface SupersetCardProps {
  superset: MuscuSuperset; index: number; collapsed: boolean;
  onToggleCollapse: () => void; onUpdate: (p: Partial<MuscuSuperset>) => void; onRemove: () => void;
}

function SupersetCard({ superset, index, collapsed, onToggleCollapse, onUpdate, onRemove }: SupersetCardProps) {
  const num = (v: string) => v === '' ? undefined : parseFloat(v);
  const rounds = superset.rounds || 3;
  const updateEx = (id: string, patch: Partial<SupersetExercise>) =>
    onUpdate({ exercises: superset.exercises.map(e => e.id === id ? { ...e, ...patch } : e) });
  const addEx = () => onUpdate({ exercises: [...superset.exercises, emptySupersetExercise()] });
  const removeEx = (id: string) => onUpdate({ exercises: superset.exercises.filter(e => e.id !== id) });
  const setActualRep = (exId: string, roundIdx: number, raw: string) => {
    onUpdate({
      exercises: superset.exercises.map(e => {
        if (e.id !== exId) return e;
        const arr = [...(e.actualRepsByRound ?? Array(rounds).fill(undefined))];
        arr[roundIdx] = raw === '' ? undefined : parseInt(raw);
        return { ...e, actualRepsByRound: arr.every(v => v === undefined) ? undefined : arr };
      }),
    });
  };

  return (
    <div className="card border-2 border-violet-100 !p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-2.5 bg-violet-50 border-b border-violet-100">
        <div className="flex items-center gap-1.5">
          <Layers size={14} className="text-violet-500" />
          <span className="text-xs font-bold text-violet-700">Superset {index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-violet-500">Rounds</span>
          <input type="number" min="1" max="10" value={rounds} onChange={e => onUpdate({ rounds: e.target.value ? +e.target.value : 3 })} className="input !w-14 text-center !py-1 text-xs" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-violet-500">Récup</span>
          <input type="number" min="0" step="0.5" value={superset.recoveryAfter ?? ''} onChange={e => onUpdate({ recoveryAfter: e.target.value ? +e.target.value : undefined })} className="input !w-14 text-center !py-1 text-xs" />
          <span className="text-xs text-gray-400">min</span>
          <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
            <input type="checkbox" checked={!!superset.recoveryIsAvg} onChange={e => onUpdate({ recoveryIsAvg: e.target.checked })} className="rounded" />
            moy
          </label>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button onClick={onToggleCollapse} className="text-violet-300 hover:text-violet-500 p-1">{collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</button>
          <button onClick={onRemove} className="text-gray-300 hover:text-red-500 p-1"><Trash2 size={15} /></button>
        </div>
      </div>
      {!collapsed && (
        <div className="p-3 space-y-3">
          {superset.exercises.map((ex, ei) => (
            <div key={ex.id} className="bg-violet-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-violet-500 shrink-0">{ei + 1}.</span>
                <input type="text" list="muscu-exercises-ss" placeholder="Nom de l'exercice" value={ex.name} onChange={e => updateEx(ex.id, { name: e.target.value })} className="input !py-1.5 !text-sm flex-1" />
                <datalist id="muscu-exercises-ss">{MUSCU_EXERCISES.map(s => <option key={s} value={s} />)}</datalist>
                {superset.exercises.length > 2 && <button onClick={() => removeEx(ex.id)} className="text-gray-300 hover:text-red-400 shrink-0"><X size={14} /></button>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="label">Poids (kg)</label>
                  <input type="number" min="0" step="0.5" placeholder="—" value={ex.weight ?? ''} onChange={e => updateEx(ex.id, { weight: num(e.target.value) })} className="input text-center" />
                </div>
                <div>
                  <label className="label">Reps cible</label>
                  <input type="number" min="0" placeholder="—" value={ex.targetReps ?? ''} onChange={e => updateEx(ex.id, { targetReps: num(e.target.value) })} className="input text-center" />
                </div>
                <div>
                  <label className="label">Variation</label>
                  <input type="text" list="muscu-variations-ss" placeholder="—" value={ex.variation ?? ''} onChange={e => updateEx(ex.id, { variation: e.target.value || undefined })} className="input text-sm" />
                  <datalist id="muscu-variations-ss">{MUSCU_VARIATIONS.map(v => <option key={v} value={v} />)}</datalist>
                </div>
              </div>
              <div>
                <label className="label">Reps réelles par round (si différentes)</label>
                <div className="flex gap-2">
                  {Array.from({ length: rounds }).map((_, ri) => (
                    <div key={ri} className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 text-center mb-1">R{ri + 1}</div>
                      <input type="number" min="0" placeholder="=" value={ex.actualRepsByRound?.[ri] ?? ''}
                        onChange={e => setActualRep(ex.id, ri, e.target.value)}
                        className={clsx('input text-center !py-1', ex.actualRepsByRound?.[ri] !== undefined && ex.targetReps !== undefined && (ex.actualRepsByRound[ri] as number) < ex.targetReps ? 'border-orange-300 bg-orange-50 text-orange-700' : '')} />
                    </div>
                  ))}
                </div>
              </div>
              <input type="text" placeholder="Notes…" value={ex.notes ?? ''} onChange={e => updateEx(ex.id, { notes: e.target.value || undefined })} className="input text-xs" />
            </div>
          ))}
          <button onClick={addEx} className="text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1"><Plus size={13} /> Exercice dans le superset</button>
          <div className="pt-2 border-t border-gray-100">
            <input type="text" placeholder="Notes du superset…" value={superset.notes ?? ''} onChange={e => onUpdate({ notes: e.target.value || undefined })} className="input text-xs" />
          </div>
        </div>
      )}
    </div>
  );
}
