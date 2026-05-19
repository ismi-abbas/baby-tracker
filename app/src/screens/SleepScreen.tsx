import React, { useState, useEffect } from 'react';
import { T } from '../tokens';
import { BackBtn, useTimer, useNav, DateTimeField } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import type { Sleep } from '../types';
import { cn } from '../lib/utils';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function SleepScreen() {
  const { back } = useNav();
  const { babyApi: api } = useBaby();
  const { editId, record: editRecord } = useEditRecord<Sleep>(id => api.sleeps.get(id) as Promise<Sleep>);
  const [entryMode, setEntryMode] = useState<'live' | 'manual'>('live');
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const elapsed = useTimer(running, startTime ?? undefined);
  const [manualStart, setManualStart] = useState(() => { const d = new Date(); d.setHours(d.getHours() - 1); return toLocalDT(d); });
  const [manualEnd, setManualEnd] = useState(() => toLocalDT(new Date()));
  const [location, setLocation] = useState('crib');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (entryMode === 'manual' && running) setRunning(false); }, [entryMode]);

  useEffect(() => {
    if (!editRecord) return;
    setEntryMode('manual');
    setManualStart(toLocalDT(new Date(editRecord.startedAt)));
    setManualEnd(editRecord.endedAt ? toLocalDT(new Date(editRecord.endedAt)) : toLocalDT(new Date(editRecord.startedAt)));
    if (editRecord.location) setLocation(editRecord.location);
    if (editRecord.notes) setNotes(editRecord.notes);
  }, [editRecord]);

  async function startSleep() {
    const t = new Date(); setStartTime(t); setRunning(true);
    const res = await (api.sleeps.create({ location, startedAt: t.toISOString(), loggedBy: 'You' }) as Promise<{ id: string }>).catch(() => null);
    if (res) setSessionId(res.id);
  }

  async function wakeUp() {
    setSaving(true); setRunning(false);
    if (sessionId) await (api.sleeps.update(sessionId, { endedAt: new Date().toISOString(), durationSeconds: elapsed, notes: notes || null }) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  async function saveManual() {
    setSaving(true);
    const start = new Date(manualStart); const end = new Date(manualEnd);
    const durSec = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
    const payload = { location, notes: notes || null, loggedBy: 'You', startedAt: start.toISOString(), endedAt: end.toISOString(), durationSeconds: durSec };
    if (editId) await (api.sleeps.update(editId, payload) as Promise<unknown>).catch(() => {});
    else await (api.sleeps.create(payload) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const starPositions = [
    'left-10 top-[90px]', 'left-[300px] top-20', 'left-[60px] top-[250px]',
    'left-[280px] top-[290px]', 'left-[120px] top-[540px]', 'left-[330px] top-[520px]',
  ];
  const barHeightClasses = [
    'h-7', 'h-[34px]', 'h-[34px]', 'h-[29px]', 'h-5', 'h-3', 'h-1.5', 'h-2',
    'h-[18px]', 'h-[29px]', 'h-[34px]', 'h-[33px]', 'h-[26px]', 'h-[18px]', 'h-[13px]', 'h-[14px]',
    'h-5', 'h-[27px]', 'h-[28px]', 'h-[26px]', 'h-[21px]', 'h-[18px]', 'h-[19px]', 'h-[25px]',
    'h-[33px]', 'h-[38px]', 'h-[38px]', 'h-8', 'h-[21px]', 'h-[11px]', 'h-1.5', 'h-1',
  ];
  const bars = Array.from({ length: 32 }).map((_, i) => ({
    heightClass: barHeightClasses[i],
    active: running && i < Math.min(32, elapsed / 60 * 2),
  }));
  const manualDurMin = manualStart && manualEnd
    ? Math.max(0, Math.round((new Date(manualEnd).getTime() - new Date(manualStart).getTime()) / 60000))
    : 0;
  const locations = ['crib', 'bassinet', 'pram', 'arms', 'car'];

  return (
    <div className="relative box-border flex min-h-full w-full flex-col bg-[#2A3327] pt-[max(20px,env(safe-area-inset-top))] font-sans text-[#EDE7D6]">
      {starPositions.map((position, i) => (
        <div key={i} className={cn('absolute h-[3px] w-[3px] rounded-sm bg-[#EDE7D6]/50', position)} />
      ))}
      <div className="pointer-events-none absolute top-[110px] left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(126,149,117,0.18),transparent_70%)]" />

      <div className="relative flex items-center gap-2.5 px-5 pt-1.5">
        <BackBtn dark />
        <div className="flex-1 text-center text-[13px] font-bold tracking-[0.4px] text-[#EDE7D6] uppercase">{editId ? 'Edit Sleep' : 'Sleep'}</div>
        <button className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-card/8"><div className="h-[18px] w-[18px] text-honey">{I.moon}</div></button>
      </div>

      <div className="relative flex justify-center py-2.5">
        <div className="inline-flex rounded-[10px] bg-card/10 p-[3px]">
          {(['live', 'manual'] as const).map(mode => (
            <button key={mode} onClick={() => { if (!running) setEntryMode(mode); }} className={cn('rounded-lg border-0 px-[18px] py-[7px] text-[12.5px] font-bold transition-all duration-150', running ? 'cursor-not-allowed' : 'cursor-pointer', entryMode === mode ? 'bg-card/18 text-sage' : 'bg-transparent text-[#EDE7D6]/50')}>
              {mode === 'live' ? '⏱ Live' : '✎ Manual'}
            </button>
          ))}
        </div>
      </div>

      {entryMode === 'live' ? (
        <>
          <div className="relative px-4 pt-[30px] text-center">
            <div className="text-xs font-bold tracking-[0.6px] text-[#EDE7D6]/55 uppercase">{running ? 'Asleep for' : 'Start sleep timer'}</div>
            <div className="mt-2 font-serif text-8xl leading-none font-normal tracking-[-3px] text-[#EDE7D6] tabular-nums">
              {h}<span className="italic text-sage">:</span>{String(m).padStart(2, '0')}
            </div>
            {startTime && (<div className="mt-1.5 font-serif text-lg italic text-sage">hours · since {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>)}
            {running && (<div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sage/18 px-3 py-[5px] text-[11.5px] font-semibold text-sage"><span className="h-1.5 w-1.5 rounded-full bg-sage" />{location}</div>)}
          </div>
          <div className="relative px-6 pt-6">
            <div className="flex h-[50px] items-end gap-[3px]">
              {bars.map((b, i) => (<div key={i} className={cn(b.heightClass, 'flex-1 rounded-sm', b.active ? 'bg-sage/55' : 'bg-[#EDE7D6]/18')} />))}
            </div>
            {startTime && (<div className="mt-1.5 flex justify-between font-mono text-[10px] text-[#EDE7D6]/45"><span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span>now</span></div>)}
          </div>
        </>
      ) : (
        <div className="relative flex flex-col gap-3 px-4">
          <div className="flex flex-col gap-3.5 rounded-[18px] bg-card/8 px-4 py-3.5">
            <DateTimeField label="Fell asleep at" value={manualStart} onChange={setManualStart} />
            <DateTimeField label="Woke up at" value={manualEnd} onChange={setManualEnd} />
          </div>
          {manualDurMin > 0 && (<div className="text-center font-serif text-lg italic text-sage">{manualDurMin >= 60 ? `${Math.floor(manualDurMin / 60)}h ${manualDurMin % 60}m` : `${manualDurMin} min`}</div>)}
        </div>
      )}

      <div className="relative px-4 pt-4">
        <div className="mb-2 text-[11px] font-bold tracking-[0.5px] text-[#EDE7D6]/55 uppercase">Location</div>
        <div className="flex flex-wrap gap-1.5">
          {locations.map(loc => (<button key={loc} onClick={() => setLocation(loc)} className={cn('cursor-pointer rounded-full border-0 px-3.5 py-[7px] text-xs font-semibold capitalize transition-all duration-150', location === loc ? 'bg-sage text-[#1F2A1D]' : 'bg-card/8 text-[#EDE7D6]/70')}>{loc}</button>))}
        </div>
      </div>

      {(running || entryMode === 'manual') && (
        <div className="relative px-4 pt-3">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)…"
            className="box-border min-h-[52px] w-full resize-none rounded-[14px] border-0 bg-card/8 px-3.5 py-3 text-[13px] text-[#EDE7D6] outline-none" />
        </div>
      )}

      <div className="relative flex gap-2.5 px-4 pt-5">
        {entryMode === 'live' && !running ? (
          <button onClick={startSleep} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-sage p-4 text-[15px] font-bold text-[#1F2A1D]">
            <div className="h-3.5 w-3.5">{I.sleep}</div>Start sleep
          </button>
        ) : entryMode === 'live' ? (
          <button onClick={wakeUp} disabled={saving} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-sage p-3.5 text-sm font-bold text-[#1F2A1D]">
            <div className="h-3.5 w-3.5">{I.stop}</div>{saving ? 'Saving…' : 'Wake up'}
          </button>
        ) : (
          <button onClick={saveManual} disabled={saving || !manualStart || !manualEnd} className="flex-1 cursor-pointer rounded-2xl border-0 bg-sage p-[15px] text-[15px] font-bold text-[#1F2A1D]">
            {saving ? 'Saving…' : editId ? 'Update sleep' : 'Save sleep'}
          </button>
        )}
      </div>
    </div>
  );
}
