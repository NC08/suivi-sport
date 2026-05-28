import { useState } from 'react';
import type {
  Session, HyroxBloc, HyroxStationsBloc, HyroxPartnerAmrapBloc, HyroxPartnerFinisherBloc,
  HyroxStation, HyroxExercise, HyroxPartnerAmrapExercise,
  CTForTimeBloc, CTFinisherBloc, CTFinisherExercise, CTBreak, CTGrip,
} from '../types';
import { HYROX_EXERCISES } from '../types';
import { generateId } from '../utils/storage';
import { Plus, Trash2, X, ChevronDown, ChevronUp, Layers, Users, Flag, Timer, Zap } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  session: Session;
  onChange: (patch: Partial<Session>) => void;
}

function secsToMmss(secs: number): string {
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

// ── Factory helpers ────────────────────────────────────────────

function emptyStations(): HyroxStationsBloc {
  return { id: generateId(), blocType: 'hyroxStations', workTimeMins: 7, recoveryMins: 2, stations: [emptyStation()] };
}
function emptyStation(): HyroxStation {
  return { id: generateId(), exercises: [emptyHyroxEx()] };
}
function emptyHyroxEx(): HyroxExercise {
  return { id: generateId(), name: '' };
}
function emptyPartnerAmrap(): HyroxPartnerAmrapBloc {
  return { id: generateId(), blocType: 'partnerAmrap', p1Exercise: '', p2Exercises: [emptyPartnerAmrapEx()] };
}
function emptyPartnerAmrapEx(): HyroxPartnerAmrapExercise {
  return { id: generateId(), name: '' };
}
function emptyPartnerFinisher(): HyroxPartnerFinisherBloc {
  return { id: generateId(), blocType: 'partnerFinisher', mainExercise: '' };
}
function emptyForTime(): CTForTimeBloc {
  return { id: generateId(), blocType: 'forTime', exerciseName: '', breaks: [], penaltyRounds: 3 };
}
function emptyFinisher(): CTFinisherBloc {
  return { id: generateId(), blocType: 'finisher', exercises: [emptyFinisherEx()] };
}
function emptyFinisherEx(): CTFinisherExercise {
  return { id: generateId(), name: '' };
}

// ── Root form ──────────────────────────────────────────────────

export default function HyroxForm({ session, onChange }: Props) {
  const blocs: HyroxBloc[] = session.hyroxBlocs ?? [];
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const setBlocs = (updated: HyroxBloc[]) => onChange({ hyroxBlocs: updated });
  const removeBloc = (id: string) => setBlocs(blocs.filter(b => b.id !== id));
  const toggle = (id: string) => setCollapsed(c => ({ ...c, [id]: !c[id] }));
  const updateBloc = (id: string, patch: Partial<HyroxBloc>) =>
    setBlocs(blocs.map(b => b.id === id ? { ...b, ...patch } as HyroxBloc : b));

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input type="checkbox"
            checked={!!session.warmupDone}
            onChange={e => onChange({ warmupDone: e.target.checked || undefined })}
            className="w-4 h-4 rounded accent-emerald-500" />
          <span className="text-sm font-medium text-gray-700">Warm-up effectué</span>
        </label>
      </div>

      {blocs.map((bloc, bi) => {
        const shared = { index: bi, collapsed: !!collapsed[bloc.id], onToggle: () => toggle(bloc.id), onRemove: () => removeBloc(bloc.id) };
        if (bloc.blocType === 'hyroxStations')
          return <StationsBlocForm key={bloc.id} bloc={bloc} {...shared} onUpdate={p => updateBloc(bloc.id, p)} />;
        if (bloc.blocType === 'partnerAmrap')
          return <PartnerAmrapBlocForm key={bloc.id} bloc={bloc} {...shared} onUpdate={p => updateBloc(bloc.id, p)} />;
        if (bloc.blocType === 'partnerFinisher')
          return <PartnerFinisherBlocForm key={bloc.id} bloc={bloc} {...shared} onUpdate={p => updateBloc(bloc.id, p)} />;
        if (bloc.blocType === 'forTime')
          return <ForTimeBlocForm key={bloc.id} bloc={bloc} {...shared} onUpdate={p => updateBloc(bloc.id, p)} />;
        return <FinisherBlocForm key={bloc.id} bloc={bloc} {...shared} onUpdate={p => updateBloc(bloc.id, p)} />;
      })}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setBlocs([...blocs, emptyStations()])}
          className="btn-secondary justify-center text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">
          <Layers size={13} /> Stations
        </button>
        <button onClick={() => setBlocs([...blocs, emptyPartnerAmrap()])}
          className="btn-secondary justify-center text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">
          <Users size={13} /> Partner AMRAP
        </button>
        <button onClick={() => setBlocs([...blocs, emptyPartnerFinisher()])}
          className="btn-secondary justify-center text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">
          <Flag size={13} /> Partner Finisher
        </button>
        <button onClick={() => setBlocs([...blocs, emptyForTime()])}
          className="btn-secondary justify-center text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">
          <Timer size={13} /> For Time
        </button>
        <button onClick={() => setBlocs([...blocs, emptyFinisher()])}
          className="btn-secondary col-span-2 justify-center text-emerald-600 border-emerald-200 hover:bg-emerald-50 text-xs">
          <Zap size={13} /> Finisher / Straight
        </button>
      </div>
    </div>
  );
}

// ── Shared header ──────────────────────────────────────────────

function BlocHeader({ icon, title, subtitle, collapsed, onToggle, onRemove }: {
  icon: React.ReactNode; title: string; subtitle?: string; collapsed: boolean;
  onToggle: () => void; onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-semibold text-emerald-700 text-sm">{title}</span>
        {subtitle && <span className="text-xs text-emerald-400">{subtitle}</span>}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onToggle} className="text-emerald-400 hover:text-emerald-600 p-1">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        <button onClick={onRemove} className="text-emerald-300 hover:text-red-500 p-1"><Trash2 size={15} /></button>
      </div>
    </div>
  );
}

// ── Stations ───────────────────────────────────────────────────

function StationsBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: HyroxStationsBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<HyroxStationsBloc>) => void; onRemove: () => void;
}) {
  const addStation = () => onUpdate({ stations: [...bloc.stations, emptyStation()] });
  const removeStation = (id: string) => onUpdate({ stations: bloc.stations.filter(s => s.id !== id) });
  const updateStation = (id: string, p: Partial<HyroxStation>) =>
    onUpdate({ stations: bloc.stations.map(s => s.id === id ? { ...s, ...p } : s) });
  const addExercise = (stId: string) => {
    const st = bloc.stations.find(s => s.id === stId);
    if (st) updateStation(stId, { exercises: [...st.exercises, emptyHyroxEx()] });
  };
  const removeExercise = (stId: string, exId: string) => {
    const st = bloc.stations.find(s => s.id === stId);
    if (st) updateStation(stId, { exercises: st.exercises.filter(e => e.id !== exId) });
  };
  const updateExercise = (stId: string, exId: string, p: Partial<HyroxExercise>) => {
    const st = bloc.stations.find(s => s.id === stId);
    if (st) updateStation(stId, { exercises: st.exercises.map(e => e.id === exId ? { ...e, ...p } : e) });
  };

  return (
    <div className="card border-2 border-emerald-100 !p-0 overflow-hidden">
      <BlocHeader
        icon={<Layers size={14} className="text-emerald-600" />}
        title={`Bloc ${index + 1} · Stations`}
        subtitle={`${bloc.stations.length} station${bloc.stations.length > 1 ? 's' : ''}`}
        collapsed={collapsed} onToggle={onToggle} onRemove={onRemove} />

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Temps de travail (min)</label>
              <input type="number" min="1" placeholder="7"
                value={bloc.workTimeMins || ''}
                onChange={e => onUpdate({ workTimeMins: e.target.value ? +e.target.value : 7 })}
                className="input text-center" />
            </div>
            <div>
              <label className="label">Récupération (min)</label>
              <input type="number" min="0" placeholder="2"
                value={bloc.recoveryMins || ''}
                onChange={e => onUpdate({ recoveryMins: e.target.value ? +e.target.value : 0 })}
                className="input text-center" />
            </div>
          </div>

          {bloc.stations.map((station, si) => (
            <div key={station.id} className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Station {si + 1}</span>
                {bloc.stations.length > 1 && (
                  <button onClick={() => removeStation(station.id)} className="text-gray-300 hover:text-red-400">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              <div className="grid text-xs text-gray-400 gap-1 px-1" style={{ gridTemplateColumns: '1fr 56px 64px 48px 20px' }}>
                <span>Exercice</span>
                <span className="text-center">Cible</span>
                <span className="text-center">Unité</span>
                <span className="text-center">kg</span>
                <span />
              </div>

              {station.exercises.map(ex => (
                <div key={ex.id} className="grid items-center gap-1" style={{ gridTemplateColumns: '1fr 56px 64px 48px 20px' }}>
                  <input type="text" list="hyrox-ex-list" placeholder="Exercice"
                    value={ex.name}
                    onChange={e => updateExercise(station.id, ex.id, { name: e.target.value })}
                    className="input !py-1 text-sm" />
                  <input type="number" min="0" placeholder="—"
                    value={ex.target ?? ''}
                    onChange={e => updateExercise(station.id, ex.id, { target: e.target.value ? +e.target.value : undefined })}
                    className="input !py-1 text-center text-sm" />
                  <select value={ex.unit ?? ''}
                    onChange={e => updateExercise(station.id, ex.id, { unit: (e.target.value as 'm' | 'reps' | 'cal') || undefined })}
                    className="select !py-1 text-xs">
                    <option value="">—</option>
                    <option value="reps">reps</option>
                    <option value="m">m</option>
                    <option value="cal">cal</option>
                  </select>
                  <input type="number" min="0" step="0.5" placeholder="—"
                    value={ex.weight ?? ''}
                    onChange={e => updateExercise(station.id, ex.id, { weight: e.target.value ? +e.target.value : undefined })}
                    className="input !py-1 text-center text-sm" />
                  <button onClick={() => removeExercise(station.id, ex.id)} className="text-gray-200 hover:text-red-400 flex justify-center">
                    <X size={13} />
                  </button>
                </div>
              ))}

              <button onClick={() => addExercise(station.id)}
                className="text-xs text-emerald-500 hover:text-emerald-700 flex items-center gap-1">
                <Plus size={12} /> Exercice
              </button>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <span className="text-xs text-gray-500 shrink-0">Transition</span>
                <input type="text" list="hyrox-ex-list" placeholder="ex: Run"
                  value={station.trExercise ?? ''}
                  onChange={e => updateStation(station.id, { trExercise: e.target.value || undefined })}
                  className="input !py-1 flex-1 text-sm" />
                <input type="number" min="0" placeholder="—"
                  value={station.trReps ?? ''}
                  onChange={e => updateStation(station.id, { trReps: e.target.value ? +e.target.value : undefined })}
                  className="input !py-1 !w-16 text-center text-sm shrink-0" />
                <span className="text-xs text-gray-400 shrink-0">m/reps</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 shrink-0">Dépassement cap</span>
                <input type="number" min="0" placeholder="—"
                  value={station.overtime ?? ''}
                  onChange={e => updateStation(station.id, { overtime: e.target.value ? +e.target.value : undefined })}
                  className="input !py-1 !w-20 text-center text-sm" />
                <span className="text-xs text-gray-400 shrink-0">sec</span>
                {station.overtime !== undefined && (
                  <span className="text-xs text-orange-500 font-medium">+{secsToMmss(station.overtime)}</span>
                )}
              </div>
            </div>
          ))}

          <button onClick={addStation} className="text-xs text-emerald-500 hover:text-emerald-700 flex items-center gap-1">
            <Plus size={13} /> Station
          </button>
        </div>
      )}
    </div>
  );
}

// ── Partner AMRAP ──────────────────────────────────────────────

function PartnerAmrapBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: HyroxPartnerAmrapBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<HyroxPartnerAmrapBloc>) => void; onRemove: () => void;
}) {
  const addEx = () => onUpdate({ p2Exercises: [...bloc.p2Exercises, emptyPartnerAmrapEx()] });
  const removeEx = (id: string) => onUpdate({ p2Exercises: bloc.p2Exercises.filter(e => e.id !== id) });
  const updateEx = (id: string, p: Partial<HyroxPartnerAmrapExercise>) =>
    onUpdate({ p2Exercises: bloc.p2Exercises.map(e => e.id === id ? { ...e, ...p } : e) });

  return (
    <div className="card border-2 border-emerald-100 !p-0 overflow-hidden">
      <BlocHeader
        icon={<Users size={14} className="text-emerald-600" />}
        title={`Bloc ${index + 1} · Partner AMRAP`}
        collapsed={collapsed} onToggle={onToggle} onRemove={onRemove} />

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="bg-emerald-50 rounded-xl p-3 space-y-2">
            <span className="text-xs font-semibold text-emerald-700">Partenaire 1</span>
            <div className="flex items-center gap-2">
              <input type="text" list="hyrox-ex-list" placeholder="Exercice P1"
                value={bloc.p1Exercise}
                onChange={e => onUpdate({ p1Exercise: e.target.value })}
                className="input flex-1" />
              <input type="number" min="0" placeholder="Total"
                value={bloc.p1Total ?? ''}
                onChange={e => onUpdate({ p1Total: e.target.value ? +e.target.value : undefined })}
                className="input !w-20 text-center" />
              <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0 cursor-pointer">
                <input type="checkbox"
                  checked={!!bloc.p1IsDistance}
                  onChange={e => onUpdate({ p1IsDistance: e.target.checked || undefined })} />
                m
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-600">Partenaire 2</span>
            {bloc.p2Exercises.map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4 shrink-0 text-center">{i + 1}</span>
                <input type="text" list="hyrox-ex-list" placeholder="Exercice"
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
                <button onClick={() => removeEx(ex.id)} className="text-gray-200 hover:text-red-400 shrink-0"><X size={14} /></button>
              </div>
            ))}
            <button onClick={addEx} className="text-xs text-emerald-500 hover:text-emerald-700 flex items-center gap-1">
              <Plus size={13} /> Exercice P2
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
              <label className="label">Rounds P2</label>
              <input type="number" min="0" placeholder="—"
                value={bloc.p2TotalRounds ?? ''}
                onChange={e => onUpdate({ p2TotalRounds: e.target.value ? +e.target.value : undefined })}
                className="input text-center" />
            </div>
            <div>
              <label className="label">+ partiel</label>
              <input type="number" min="0" max={bloc.p2Exercises.length} placeholder="—"
                value={bloc.p2PartialExercises ?? ''}
                onChange={e => onUpdate({ p2PartialExercises: e.target.value ? +e.target.value : undefined })}
                className="input text-center" />
            </div>
          </div>

          <div className="flex items-center gap-2">
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

// ── Partner Finisher ───────────────────────────────────────────

function PartnerFinisherBlocForm({ bloc, index, collapsed, onToggle, onUpdate, onRemove }: {
  bloc: HyroxPartnerFinisherBloc; index: number; collapsed: boolean;
  onToggle: () => void; onUpdate: (p: Partial<HyroxPartnerFinisherBloc>) => void; onRemove: () => void;
}) {
  const [durationInput, setDurationInput] = useState(bloc.duration !== undefined ? secsToMmss(bloc.duration) : '');

  return (
    <div className="card border-2 border-emerald-100 !p-0 overflow-hidden">
      <BlocHeader
        icon={<Flag size={14} className="text-emerald-600" />}
        title={`Bloc ${index + 1} · Partner Finisher`}
        collapsed={collapsed} onToggle={onToggle} onRemove={onRemove} />

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="label">Exercice principal</label>
            <input type="text" list="hyrox-ex-list" placeholder="ex: Push-up hand release"
              value={bloc.mainExercise}
              onChange={e => onUpdate({ mainExercise: e.target.value })}
              className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Max reps total (à deux)</label>
              <input type="number" min="0" placeholder="—"
                value={bloc.mainTotal ?? ''}
                onChange={e => onUpdate({ mainTotal: e.target.value ? +e.target.value : undefined })}
                className="input text-center" />
            </div>
            <div>
              <label className="label">Dépassement cap (sec)</label>
              <input type="number" min="0" placeholder="—"
                value={bloc.overtime ?? ''}
                onChange={e => onUpdate({ overtime: e.target.value ? +e.target.value : undefined })}
                className={clsx('input text-center', bloc.overtime !== undefined && bloc.overtime > 0 && 'border-orange-300 text-orange-600')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Pénalité (optionnel)</label>
              <input type="text" placeholder="ex: 10 burpees"
                value={bloc.penaltyDesc ?? ''}
                onChange={e => onUpdate({ penaltyDesc: e.target.value || undefined })}
                className="input text-sm" />
            </div>
            <div>
              <label className="label">× tours</label>
              <input type="number" min="1" placeholder="—"
                value={bloc.penaltyRounds ?? ''}
                onChange={e => onUpdate({ penaltyRounds: e.target.value ? +e.target.value : undefined })}
                className="input" />
            </div>
          </div>

          <div>
            <label className="label">Durée (mm:ss)</label>
            <input type="text" placeholder="10:00"
              value={durationInput}
              onChange={e => {
                setDurationInput(e.target.value);
                const s = mmssToSecs(e.target.value);
                if (s !== undefined) onUpdate({ duration: s });
              }}
              className="input !w-32 text-center font-mono" />
          </div>
        </div>
      )}
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
  const removeBreak = (i: number) => onUpdate({ breaks: bloc.breaks.filter((_, idx) => idx !== i) });

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
    <div className="card border-2 border-emerald-100 !p-0 overflow-hidden">
      <BlocHeader
        icon={<Timer size={14} className="text-emerald-600" />}
        title={`Bloc ${index + 1} · For Time`}
        collapsed={collapsed} onToggle={onToggle} onRemove={onRemove} />

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Exercice</label>
              <input type="text" list="hyrox-ex-list" placeholder="ex: Tractions"
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

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-medium shrink-0">
              <button onClick={() => onUpdate({ segmentInterval: undefined, segmentTimes: undefined })}
                className={clsx('px-3 py-1.5 transition-colors',
                  !isStructured ? 'bg-gray-700 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
                Par breaks
              </button>
              <button onClick={() => onUpdate({ segmentInterval: 20, breaks: [] })}
                className={clsx('px-3 py-1.5 transition-colors',
                  isStructured ? 'bg-emerald-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50')}>
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

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="label">Pénalité</label>
              <input type="text" placeholder="ex: 10 pu + 5 burpees"
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
                <p className="text-xs text-emerald-600 font-medium">Temps total : {secsToMmss(totalSegTime)}</p>
              )}
            </div>
          ) : (
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
              <button onClick={addBreak} className="text-xs text-emerald-500 hover:text-emerald-700 flex items-center gap-1 mt-2">
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

// ── Finisher / Straight ────────────────────────────────────────

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
    <div className="card border-2 border-emerald-100 !p-0 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-emerald-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-emerald-600" />
          <span className="font-semibold text-emerald-700 text-sm">Bloc {index + 1} ·</span>
          <select value={label}
            onChange={e => onUpdate({ label: e.target.value })}
            className="text-sm font-semibold text-emerald-700 bg-transparent border-0 outline-none cursor-pointer">
            <option value="For Time">For Time</option>
            <option value="Finisher">Finisher</option>
            <option value="Straight">Straight</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onToggle} className="text-emerald-400 hover:text-emerald-600 p-1">
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
          <button onClick={onRemove} className="text-emerald-300 hover:text-red-500 p-1"><Trash2 size={15} /></button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-3">
          <div className="flex text-xs text-gray-400 gap-2 px-1">
            <span className="w-4 shrink-0" /><span className="w-14 shrink-0 text-center">Reps</span>
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
              <input type="text" list="hyrox-ex-list" placeholder="Exercice"
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
          <button onClick={addEx} className="text-xs text-emerald-500 hover:text-emerald-700 flex items-center gap-1">
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

// ── Datalist ───────────────────────────────────────────────────

export function HyroxExerciseDatalist() {
  return (
    <datalist id="hyrox-ex-list">
      {HYROX_EXERCISES.map(e => <option key={e} value={e} />)}
    </datalist>
  );
}
