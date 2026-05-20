import React, { useState, useEffect, useRef } from 'react';
import { T } from '../tokens';
import {
  BackBtn, CircularTimer,
  Card, EntryModeToggle, DateTimeField, useNav,
} from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import { formatMilk, milkDeltaToMl, mlToDisplay, useUnitPrefs, type MilkUnit } from '../units';
import { cn } from '../lib/utils';
import type { Feeding } from '../types';

type FeedMode = 'Breast' | 'Bottle' | 'Formula' | 'Solids';
type Side = 'left' | 'right' | 'both';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function FeedingScreen() {
  const { babyApi: api } = useBaby();
  const { prefs } = useUnitPrefs();
  const { back } = useNav();
  const { editId, record: editRecord } = useEditRecord<Feeding>(id => api.feedings.get(id) as Promise<Feeding>);
  const [feedMode, setFeedMode] = useState<FeedMode>('Breast');
  const [entryMode, setEntryMode] = useState<'live' | 'manual'>('live');

  // Live state
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [leftSec, setLeftSec] = useState(0);
  const [rightSec, setRightSec] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Manual state
  const [manualStart, setManualStart] = useState(() => toLocalDT(new Date()));
  const [manualEnd, setManualEnd] = useState(() => toLocalDT(new Date()));
  const [manualSide, setManualSide] = useState<Side>('left');
  const [amountStr, setAmountStr] = useState(() =>
    prefs.milkUnit === 'oz' ? mlToDisplay(90, 'oz').toFixed(1) : '90'
  );

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      if (activeSide === 'left') setLeftSec(s => s + 1);
      else setRightSec(s => s + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, activeSide]);

  useEffect(() => {
    if (entryMode === 'manual' && !editId) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      const now = new Date();
      setManualStart(toLocalDT(now));
      setManualEnd(toLocalDT(now));
    }
  }, [entryMode, editId]);

  // Pre-fill when editing an existing record
  useEffect(() => {
    if (!editRecord) return;
    const typeCap = (editRecord.type.charAt(0).toUpperCase() + editRecord.type.slice(1)) as FeedMode;
    setFeedMode(['Breast','Bottle','Formula','Solids'].includes(typeCap) ? typeCap : 'Breast');
    setEntryMode('manual');
    setManualStart(toLocalDT(new Date(editRecord.startedAt)));
    setManualEnd(editRecord.endedAt ? toLocalDT(new Date(editRecord.endedAt)) : toLocalDT(new Date(editRecord.startedAt)));
    if (editRecord.side) setManualSide(editRecord.side as Side);
    if (editRecord.amountMl) setAmountStr(
      prefs.milkUnit === 'oz'
        ? mlToDisplay(editRecord.amountMl, 'oz').toFixed(1)
        : String(editRecord.amountMl)
    );
    if (editRecord.notes) setNotes(editRecord.notes);
  }, [editRecord]);

  async function save() {
    setSaving(true);
    let payload: Record<string, unknown>;
    if (entryMode === 'live') {
      payload = {
        type: feedMode.toLowerCase(),
        side: feedMode === 'Breast' ? activeSide : null,
        durationSeconds: leftSec + rightSec,
        amountMl: needsAmount ? (milkDeltaToMl(parseFloat(amountStr) || 0, prefs.milkUnit) || null) : null,
        startedAt: (startTime ?? new Date()).toISOString(),
        endedAt: new Date().toISOString(),
      };
    } else {
      const start = new Date(manualStart);
      const end = new Date(manualEnd);
      payload = {
        type: feedMode.toLowerCase(),
        side: feedMode === 'Breast' ? manualSide : null,
        durationSeconds: feedMode !== 'Bottle' && feedMode !== 'Formula'
          ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000))
          : null,
        amountMl: needsAmount ? (milkDeltaToMl(parseFloat(amountStr) || 0, prefs.milkUnit) || null) : null,
        startedAt: start.toISOString(),
        endedAt: feedMode !== 'Bottle' && feedMode !== 'Formula' ? end.toISOString() : null,
      };
    }
    const full = { ...payload, notes: notes || null, loggedBy: 'You' };
    if (editId) {
      await (api.feedings.update(editId, full) as Promise<unknown>).catch(() => {});
    } else {
      await (api.feedings.create(full) as Promise<unknown>).catch(() => {});
    }
    setSaving(false);
    back();
  }

  const displaySec = activeSide === 'left' ? leftSec : rightSec;
  const fmtSide = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const needsAmount = feedMode === 'Bottle' || feedMode === 'Formula';
  const amountSteps = prefs.milkUnit === 'oz' ? [-1, -0.5, 0.5, 1] : [-10, -5, 5, 10];
  const amountMlVal = milkDeltaToMl(parseFloat(amountStr) || 0, prefs.milkUnit);

  function adjustAmount(delta: number) {
    setAmountStr(s => {
      const next = Math.max(0, (parseFloat(s) || 0) + delta);
      return (prefs.milkUnit as MilkUnit) === 'oz' ? next.toFixed(1) : String(Math.round(next));
    });
  }

  return (
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="flex items-center gap-2.5 px-5 pt-1.5">
        <BackBtn />
        <div className="flex-1 text-center text-[13px] font-bold tracking-[0.4px] text-ink uppercase">{editId ? 'Edit Feeding' : 'Feeding'}</div>
        <button className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-black/4"><div className="h-[18px] w-[18px] text-ink">{I.doc}</div></button>
      </div>

      {/* Type tabs */}
      <div className="px-4 pt-3">
        <div className="flex gap-0.5 rounded-[14px] bg-black/4 p-1">
          {(['Breast', 'Bottle', 'Formula', 'Solids'] as FeedMode[]).map(m => (
            <div key={m} onClick={() => setFeedMode(m)} className={cn('flex-1 cursor-pointer rounded-[11px] px-2.5 py-2 text-center text-xs font-bold', m === feedMode ? 'bg-card text-terracotta' : 'bg-transparent text-ink-soft')}>{m}</div>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex justify-center py-2.5">
        <EntryModeToggle mode={entryMode} onChange={m => { if (!running) setEntryMode(m); }} />
      </div>

      {entryMode === 'live' ? (
        <>
          <div className="flex flex-col items-center py-2">
            <CircularTimer color={T.terracotta} soft={T.terracottaSoft} elapsed={displaySec}
              sub={running ? `${activeSide === 'left' ? 'Left' : 'Right'} side` : 'Tap Start'} running={running} />
          </div>
          {feedMode === 'Breast' && (
            <div className="px-4">
              <div className="grid grid-cols-2 gap-2.5">
                {(['left', 'right'] as const).map(side => {
                  const isActive = side === activeSide && running;
                  return (
                    <div key={side} onClick={() => running && setActiveSide(side)} className={cn('rounded-[18px] p-3.5', running ? 'cursor-pointer' : 'cursor-default', isActive ? 'border-0 bg-terracotta text-card shadow-[0_6px_18px_rgba(200,105,74,0.28)]' : 'border border-rule bg-card text-ink shadow-card')}>
                      <div className="flex items-center justify-between">
                        <div className={cn('text-[11.5px] font-bold tracking-[0.6px] uppercase', isActive ? 'opacity-85' : 'opacity-50')}>
                          {side.charAt(0).toUpperCase() + side.slice(1)}
                        </div>
                        <div className={cn('flex h-[22px] w-[22px] items-center justify-center rounded-full', isActive ? 'bg-card/22 text-card' : 'bg-terracotta-soft text-terracotta')}>
                          <div className="h-3 w-3">{isActive ? I.pause : I.play}</div>
                        </div>
                      </div>
                      <div className="mt-1.5 font-serif text-[30px] font-medium tracking-[-0.5px] tabular-nums">
                        {fmtSide(side === 'left' ? leftSec : rightSec)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {needsAmount && (
            <div className="px-4 pt-3">
              <Card pad={14}>
                <div className="mb-2 text-[11px] font-bold tracking-[0.5px] text-ink-mute uppercase">Amount ({prefs.milkUnit})</div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-baseline gap-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amountStr}
                      onChange={e => setAmountStr(e.target.value)}
                      placeholder="0"
                      className="w-20 border-none bg-transparent p-0 text-center font-serif text-4xl font-medium text-ink tabular-nums outline-none placeholder:text-ink-mute"
                    />
                    <span className="text-sm italic text-ink-mute">{prefs.milkUnit}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {amountSteps.map(d => (
                      <button key={d} onClick={() => adjustAmount(d)} className="cursor-pointer rounded-[10px] border border-rule bg-card px-2.5 py-2 font-mono text-xs font-semibold text-ink">{d > 0 ? `+${d}` : d}</button>
                    ))}
                  </div>
                </div>
                {prefs.milkUnit === 'oz' && amountMlVal > 0 && <div className="mt-1 text-center text-[11px] text-ink-mute">{formatMilk(amountMlVal, 'ml')}</div>}
              </Card>
            </div>
          )}
        </>
      ) : (
        /* Manual mode */
        <div className="flex flex-col gap-3 px-4">
          <Card pad={16}>
            <div className="flex flex-col gap-3.5">
            <DateTimeField label="Started at" value={manualStart} onChange={setManualStart} />
            {!needsAmount && <DateTimeField label="Ended at" value={manualEnd} onChange={setManualEnd} />}
            </div>
          </Card>

          {feedMode === 'Breast' && (
            <Card pad={14}>
              <div className="mb-2.5 text-[11px] font-bold tracking-[0.5px] text-ink-mute uppercase">Side</div>
              <div className="flex gap-2">
                {(['left', 'right', 'both'] as Side[]).map(s => (
                  <button key={s} onClick={() => setManualSide(s)} className={cn('flex-1 cursor-pointer rounded-xl border-[1.5px] py-2.5 text-[13px] font-semibold capitalize', manualSide === s ? 'border-terracotta bg-terracotta-soft text-terracotta' : 'border-rule bg-card text-ink-soft')}>{s}</button>
                ))}
              </div>
            </Card>
          )}

          {needsAmount && (
            <Card pad={14}>
              <div className="mb-2 text-[11px] font-bold tracking-[0.5px] text-ink-mute uppercase">Amount ({prefs.milkUnit})</div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-baseline gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountStr}
                    onChange={e => setAmountStr(e.target.value)}
                    placeholder="0"
                    className="w-20 border-none bg-transparent p-0 text-center font-serif text-4xl font-medium text-ink tabular-nums outline-none placeholder:text-ink-mute"
                  />
                  <span className="text-sm italic text-ink-mute">{prefs.milkUnit}</span>
                </div>
                <div className="flex gap-1.5">
                  {amountSteps.map(d => (
                    <button key={d} onClick={() => adjustAmount(d)} className="cursor-pointer rounded-[10px] border border-rule bg-card px-2.5 py-2 font-mono text-xs font-semibold text-ink">{d > 0 ? `+${d}` : d}</button>
                  ))}
                </div>
              </div>
              {prefs.milkUnit === 'oz' && amountMlVal > 0 && <div className="mt-1 text-center text-[11px] text-ink-mute">{formatMilk(amountMlVal, 'ml')}</div>}
            </Card>
          )}
        </div>
      )}

      {/* Notes */}
      <div className="px-4 pt-3">
        <Card pad={14}>
          <div className="mb-1.5 text-[11px] font-bold tracking-[0.6px] text-ink-mute uppercase">Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations…"
            className="min-h-[52px] w-full resize-none border-0 bg-transparent text-[13px] leading-[1.45] text-ink-soft outline-none" />
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2.5 px-4 pt-3.5">
        {entryMode === 'live' && !running ? (
          <button onClick={() => { setStartTime(new Date()); setRunning(true); }} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-terracotta px-5 py-3.5 text-[15px] font-bold tracking-[0.2px] text-card">
            <div className="h-3.5 w-3.5">{I.play}</div>Start feeding
          </button>
        ) : entryMode === 'live' ? (
          <>
            {feedMode === 'Breast' && (
              <button onClick={() => setActiveSide(s => s === 'left' ? 'right' : 'left')} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-rule bg-card px-5 py-3.5 text-sm font-bold tracking-[0.2px] text-ink">Switch side</button>
            )}
            <button onClick={save} disabled={saving} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-terracotta px-5 py-3.5 text-sm font-bold tracking-[0.2px] text-card">
              <div className="h-3.5 w-3.5">{I.stop}</div>{saving ? 'Saving…' : 'End feed'}
            </button>
          </>
        ) : (
          <button onClick={save} disabled={saving || !manualStart} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-terracotta px-5 py-3.5 text-[15px] font-bold tracking-[0.2px] text-card">
            {saving ? 'Saving…' : editId ? 'Update feed' : 'Save feed'}
          </button>
        )}
      </div>
    </div>
  );
}
