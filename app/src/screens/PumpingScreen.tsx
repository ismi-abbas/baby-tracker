import React, { useState, useEffect } from 'react';
import { T } from '../tokens';
import { BackBtn, CircularTimer, useTimer, useNav, Chip, EntryModeToggle, DateTimeField, Card } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import { formatMilk, milkDeltaToMl, mlToDisplay, useUnitPrefs } from '../units';
import type { PumpingSession } from '../types';

type Storage = 'fridge' | 'freezer' | 'feed_now';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function PumpingScreen() {
  const { back } = useNav();
  const { babyApi: api } = useBaby();
  const { prefs } = useUnitPrefs();
  const { editId, record: editRecord } = useEditRecord<PumpingSession>(id => api.pumping.get(id) as Promise<PumpingSession>);
  const [entryMode, setEntryMode] = useState<'live' | 'manual'>('live');
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [leftMl, setLeftMl] = useState(0);
  const [rightMl, setRightMl] = useState(0);
  const [storage, setStorage] = useState<Storage>('fridge');
  const [manualStart, setManualStart] = useState(() => toLocalDT(new Date()));
  const [manualEnd, setManualEnd] = useState(() => toLocalDT(new Date()));
  const [saving, setSaving] = useState(false);
  const elapsed = useTimer(running, startTime ?? undefined);

  useEffect(() => {
    if (!editRecord) return;
    setEntryMode('manual');
    setManualStart(toLocalDT(new Date(editRecord.startedAt)));
    setManualEnd(editRecord.endedAt ? toLocalDT(new Date(editRecord.endedAt)) : toLocalDT(new Date(editRecord.startedAt)));
    setLeftMl(editRecord.leftMl ?? 0);
    setRightMl(editRecord.rightMl ?? 0);
    if (editRecord.storageType) setStorage(editRecord.storageType as Storage);
  }, [editRecord]);

  function startSession() { setStartTime(new Date()); setRunning(true); }

  async function endSession() {
    setSaving(true); setRunning(false);
    await (api.pumping.create({ leftMl, rightMl, totalMl: leftMl + rightMl, durationSeconds: elapsed, storageType: storage, startedAt: (startTime ?? new Date()).toISOString(), endedAt: new Date().toISOString(), loggedBy: 'You' }) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  async function saveManual() {
    setSaving(true);
    const start = new Date(manualStart); const end = new Date(manualEnd);
    const durSec = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
    const payload = { leftMl, rightMl, totalMl: leftMl + rightMl, durationSeconds: durSec, storageType: storage, startedAt: start.toISOString(), endedAt: end.toISOString(), loggedBy: 'You' };
    if (editId) await (api.pumping.update(editId, payload) as Promise<unknown>).catch(() => {});
    else await (api.pumping.create(payload) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  function adjust(side: 'left' | 'right', d: number) {
    const deltaMl = milkDeltaToMl(d, prefs.milkUnit);
    if (side === 'left') setLeftMl(v => Math.max(0, v + deltaMl));
    else setRightMl(v => Math.max(0, v + deltaMl));
  }

  function setVolume(side: 'left' | 'right', value: string) {
    const parsed = Number(value);
    const nextMl = Number.isFinite(parsed) ? milkDeltaToMl(Math.max(0, parsed), prefs.milkUnit) : 0;
    if (side === 'left') setLeftMl(nextMl);
    else setRightMl(nextMl);
  }

  const amountSteps = prefs.milkUnit === 'oz' ? [-1, -0.5, 0.5, 1] : [-10, -5, 5, 10];

  return (
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="flex items-center gap-2.5 px-5 pt-1.5">
        <BackBtn />
        <div className="flex-1 text-center text-[13px] font-bold tracking-[0.4px] text-ink uppercase">{editId ? 'Edit Pumping' : 'Pumping · Mom'}</div>
        <button className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-black/4"><div className="h-[18px] w-[18px] text-ink">{I.doc}</div></button>
      </div>
      <div className="flex justify-center py-2.5">
        <EntryModeToggle mode={entryMode} onChange={m => { if (!running) setEntryMode(m); }} />
      </div>
      {entryMode === 'live' && (<div className="flex justify-center py-2"><CircularTimer color={T.honey} soft={T.honeySoft} elapsed={elapsed} sub="Double pump" running={running} /></div>)}
      {entryMode === 'manual' && (<div className="px-4 pb-3"><Card pad={16}><div className="flex flex-col gap-3.5"><DateTimeField label="Session started" value={manualStart} onChange={setManualStart} /><DateTimeField label="Session ended" value={manualEnd} onChange={setManualEnd} /></div></Card></div>)}
      <div className="px-4">
        <div className="grid grid-cols-2 gap-2.5">
          {(['left', 'right'] as const).map(side => {
            const vol = side === 'left' ? leftMl : rightMl;
            const displayVol = prefs.milkUnit === 'oz' ? mlToDisplay(vol, prefs.milkUnit).toFixed(1) : String(vol);
            const pumpPercent = Math.min(100, (vol / 120) * 100);
            return (
              <div key={side} className="rounded-[18px] border border-rule bg-card p-3.5">
                <div className="mb-1 text-[11.5px] font-bold tracking-[0.6px] text-ink-mute uppercase">{side.charAt(0).toUpperCase() + side.slice(1)}</div>
                <div className="flex items-baseline gap-1">
                  <input
                    type="number"
                    min="0"
                    step={prefs.milkUnit === 'oz' ? '0.1' : '1'}
                    inputMode="decimal"
                    value={displayVol}
                    onChange={e => setVolume(side, e.target.value)}
                    className="w-[70px] border-0 bg-transparent p-0 font-serif text-[28px] font-medium text-ink tabular-nums outline-none"
                  />
                  <span className="text-[13px] italic text-ink-mute">{prefs.milkUnit}</span>
                </div>
                <svg className="mt-2 block h-[5px] w-full overflow-hidden rounded-[3px] bg-honey-soft" viewBox="0 0 100 5" preserveAspectRatio="none" aria-hidden="true">
                  <rect width={pumpPercent} height="5" fill={T.honey} />
                </svg>
                <div className="mt-2.5 flex gap-1">
                  {amountSteps.map(d => (<button key={d} onClick={() => adjust(side, d)} className="flex-1 cursor-pointer rounded-[9px] border border-rule bg-parchment py-[5px] font-mono text-[10.5px] font-semibold text-ink">{d > 0 ? `+${d}` : d}</button>))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-honey-soft px-4 py-3">
          <div className="text-[13px] font-bold text-[#7C5A21]">Total</div>
          <div className="font-serif text-[22px] font-semibold text-[#7C5A21]">{formatMilk(leftMl + rightMl, prefs.milkUnit)}</div>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5 rounded-2xl border border-rule bg-card px-3.5 py-3">
          <div className="flex-1 text-xs text-ink-soft">Store as</div>
          {(['fridge', 'freezer', 'feed_now'] as Storage[]).map(s => (<div key={s} onClick={() => setStorage(s)} className="cursor-pointer"><Chip color={s === storage ? T.sky : T.inkMute} soft={s === storage ? T.skySoft : 'rgba(0,0,0,0.04)'}>{s === 'fridge' ? '❄ Fridge' : s === 'freezer' ? 'Freezer' : 'Feed now'}</Chip></div>))}
        </div>
      </div>
      <div className="flex gap-2.5 px-4 pt-3.5">
        {entryMode === 'live' && !running ? (
          <button onClick={startSession} className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-honey p-3.5 text-[15px] font-bold text-[#3B2A0E]"><div className="h-3.5 w-3.5">{I.play}</div>Start pumping</button>
        ) : entryMode === 'live' ? (
          <><button onClick={() => setRunning(r => !r)} className="flex-1 cursor-pointer rounded-2xl border border-rule bg-card p-3.5 text-sm font-bold text-ink">{running ? 'Pause' : 'Resume'}</button><button onClick={endSession} disabled={saving} className="flex-[1.4] cursor-pointer rounded-2xl border-0 bg-honey p-3.5 text-sm font-bold text-[#3B2A0E]">{saving ? 'Saving…' : 'End session'}</button></>
        ) : (
          <button onClick={saveManual} disabled={saving || !manualStart} className="flex-1 cursor-pointer rounded-2xl border-0 bg-honey p-[15px] text-[15px] font-bold text-[#3B2A0E]">{saving ? 'Saving…' : editId ? 'Update session' : 'Save session'}</button>
        )}
      </div>
    </div>
  );
}
