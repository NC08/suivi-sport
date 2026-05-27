import type { Session, CardioBloc, CardioInterval } from '../types';
import { CARDIO_MACHINES } from '../types';
import { generateId } from '../utils/storage';
import { Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface Props {
  session: Session;
  onChange: (patch: Partial<Session>) => void;
}

function emptyInterval(): CardioInterval {
  return { id: generateId(), position: 'normal' };
}

function emptyBloc(): CardioBloc {
  return { id: generateId(), intervals: [emptyInterval()] };
}

export default function CardioForm({ session, onChange }: Props) {
  const blocs: CardioBloc[] = session.cardioBlocs ?? [emptyBloc()];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const setBlocs = (updated: CardioBloc[]) => onChange({ cardioBlocs: updated });

  const addBloc = () => setBlocs([...blocs, emptyBloc()]);
  const removeBloc = (id: string) => setBlocs(blocs.filter(b => b.id !== id));
  const updateBloc = (id: string, patch: Partial<CardioBloc>) =>
    setBlocs(blocs.map(b => b.id === id ? { ...b, ...patch } : b));

  const addInterval = (blocId: string) =>
    setBlocs(blocs.map(b => b.id === blocId
      ? { ...b, intervals: [...b.intervals, emptyInterval()] } : b));
  const removeInterval = (blocId: string, iid: string) =>
    setBlocs(blocs.map(b => b.id === blocId
      ? { ...b, intervals: b.intervals.filter(i => i.id !== iid) } : b));
  const updateInterval = (blocId: string, iid: string, patch: Partial<CardioInterval>) =>
    setBlocs(blocs.map(b => b.id === blocId
      ? { ...b, intervals: b.intervals.map(i => i.id === iid ? { ...i, ...patch } : i) } : b));

  return (
    <div className="space-y-4">
      {/* Machine + Warm-up / Cooldown */}
      <div className="card space-y-3">
        <div>
          <label className="label">Machine / Activité</label>
          <select value={session.machine ?? ''} onChange={e => onChange({ machine: e.target.value || undefined })} className="select">
            <option value="">Sélectionner…</option>
            {CARDIO_MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Warm-up (min)</label>
            <input type="number" min="0" placeholder="ex: 10"
              value={session.warmupDuration ?? ''}
              onChange={e => onChange({ warmupDuration: e.target.value ? +e.target.value : undefined })}
              className="input" />
          </div>
          <div>
            <label className="label">Récupération finale (min)</label>
            <input type="number" min="0" placeholder="ex: 10"
              value={session.cooldownDuration ?? ''}
              onChange={e => onChange({ cooldownDuration: e.target.value ? +e.target.value : undefined })}
              className="input" />
          </div>
        </div>
      </div>

      {/* Blocs */}
      {blocs.map((bloc, bi) => (
        <div key={bloc.id} className="card border-2 border-red-100 !p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-red-50 border-b border-red-100">
            <span className="font-semibold text-red-700 text-sm">Bloc {bi + 1}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCollapsed(c => ({ ...c, [bloc.id]: !c[bloc.id] }))} className="text-red-400 hover:text-red-600 p-1">
                {collapsed[bloc.id] ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              {blocs.length > 1 && (
                <button onClick={() => removeBloc(bloc.id)} className="text-red-300 hover:text-red-600 p-1">
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>

          {!collapsed[bloc.id] && (
            <div className="p-4 space-y-3">
              {bloc.intervals.map((interval, ii) => (
                <IntervalRow
                  key={interval.id}
                  interval={interval}
                  index={ii}
                  onUpdate={patch => updateInterval(bloc.id, interval.id, patch)}
                  onRemove={() => removeInterval(bloc.id, interval.id)}
                  canRemove={bloc.intervals.length > 1}
                />
              ))}

              <button onClick={() => addInterval(bloc.id)} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                <Plus size={13} /> Intervalle
              </button>

              <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                <span className="text-xs text-gray-500 shrink-0">Récupération après ce bloc</span>
                <input type="number" min="0" step="0.5" placeholder="—"
                  value={bloc.recoveryAfter ?? ''}
                  onChange={e => updateBloc(bloc.id, { recoveryAfter: e.target.value ? +e.target.value : undefined })}
                  className="input !w-20 text-center" />
                <span className="text-xs text-gray-400">min</span>
              </div>
            </div>
          )}
        </div>
      ))}

      <button onClick={addBloc} className="btn-secondary w-full justify-center text-red-600 border-red-200 hover:bg-red-50">
        <Plus size={16} /> Ajouter un bloc
      </button>
    </div>
  );
}

interface IntervalRowProps {
  interval: CardioInterval;
  index: number;
  onUpdate: (patch: Partial<CardioInterval>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function IntervalRow({ interval, index, onUpdate, onRemove, canRemove }: IntervalRowProps) {
  const num = (v: string) => v === '' ? undefined : parseFloat(v);

  return (
    <div className="bg-gray-50 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-500">Intervalle {index + 1}</span>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" checked={!!interval.isAvgBlock}
              onChange={e => onUpdate({ isAvgBlock: e.target.checked })} className="rounded" />
            Bloc moyen
          </label>
          {canRemove && (
            <button onClick={onRemove} className="text-gray-300 hover:text-red-400"><X size={14} /></button>
          )}
        </div>
      </div>

      {interval.isAvgBlock ? (
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="label">Durée (min)</label>
            <input type="number" min="0" placeholder="5" value={interval.avgDuration ?? ''}
              onChange={e => onUpdate({ avgDuration: num(e.target.value) })} className="input text-center" />
          </div>
          <div>
            <label className="label">RPM moy</label>
            <input type="number" min="0" placeholder="83" value={interval.avgRpm ?? ''}
              onChange={e => onUpdate({ avgRpm: num(e.target.value) })} className="input text-center" />
          </div>
          <div>
            <label className="label">Watts moy</label>
            <input type="number" min="0" placeholder="95" value={interval.avgWatts ?? ''}
              onChange={e => onUpdate({ avgWatts: num(e.target.value) })} className="input text-center" />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-2 items-end">
            <div>
              <label className="label">Niveau</label>
              <input type="number" min="1" placeholder="—" value={interval.niveau ?? ''}
                onChange={e => onUpdate({ niveau: num(e.target.value) })} className="input text-center" />
            </div>
            <div>
              <label className="label">RPM début</label>
              <input type="number" min="0" placeholder="—" value={interval.rpmStart ?? ''}
                onChange={e => onUpdate({ rpmStart: num(e.target.value) })} className="input text-center" />
            </div>
            <div>
              <label className="label">RPM fin</label>
              <input type="number" min="0" placeholder="—" value={interval.rpmEnd ?? ''}
                onChange={e => onUpdate({ rpmEnd: num(e.target.value) })} className="input text-center" />
            </div>
            <div>
              <label className="label">Watts début</label>
              <input type="number" min="0" placeholder="—" value={interval.wattsStart ?? ''}
                onChange={e => onUpdate({ wattsStart: num(e.target.value) })} className="input text-center" />
            </div>
            <div>
              <label className="label">Watts fin</label>
              <input type="number" min="0" placeholder="—" value={interval.wattsEnd ?? ''}
                onChange={e => onUpdate({ wattsEnd: num(e.target.value) })} className="input text-center" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 rounded-xl overflow-hidden border border-gray-200 text-xs font-medium">
              <button onClick={() => onUpdate({ position: 'normal' })}
                className={clsx('px-3 py-1.5 transition-colors',
                  interval.position === 'normal' || !interval.position
                    ? 'bg-gray-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
                Normal
              </button>
              <button onClick={() => onUpdate({ position: 'danseuse' })}
                className={clsx('px-3 py-1.5 transition-colors',
                  interval.position === 'danseuse' ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
                En danseuse
              </button>
            </div>

            {interval.position === 'danseuse' && (
              <div className="flex items-center gap-1">
                <input type="number" min="0" placeholder="durée"
                  value={interval.danseuseDuration ?? ''}
                  onChange={e => onUpdate({ danseuseDuration: num(e.target.value) })}
                  className="input !w-24 text-center" />
                <span className="text-xs text-gray-400">sec en danseuse</span>
              </div>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <span className="text-xs text-gray-400">Récup</span>
              <input type="number" min="0" step="0.5" placeholder="—"
                value={interval.recoveryAfter ?? ''}
                onChange={e => onUpdate({ recoveryAfter: num(e.target.value) })}
                className="input !w-16 text-center" />
              <span className="text-xs text-gray-400">min</span>
            </div>
          </div>

          <input type="text" placeholder="Notes (optionnel)"
            value={interval.notes ?? ''}
            onChange={e => onUpdate({ notes: e.target.value || undefined })}
            className="input text-xs" />
        </div>
      )}
    </div>
  );
}
