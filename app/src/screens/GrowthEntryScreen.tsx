import React, { useState, useEffect } from 'react';
import { T } from '../tokens';
import { BackBtn, Card, useNav, DateTimeField } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import { cmToDisplay, gramsToDisplay, useUnitPrefs } from '../units';
import type { GrowthEntry } from '../types';
import { cn } from '../lib/utils';

const G_PER_LB = 453.59237;
const CM_PER_IN = 2.54;

function toLocalDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function GrowthEntryScreen() {
  const { back } = useNav();
  const { baby, babyApi: api } = useBaby();
  const { prefs } = useUnitPrefs();
  const { editId, record: editRecord } = useEditRecord<GrowthEntry>(id => api.growth.get(id) as Promise<GrowthEntry>);
  const [weightStr, setWeightStr] = useState('');
  const [lengthStr, setLengthStr] = useState('');
  const [headStr, setHeadStr] = useState('');
  const [measuredOn, setMeasuredOn] = useState(() => toLocalDate(new Date()));
  const [visitType, setVisitType] = useState<'home' | 'doctor'>('home');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editRecord) return;
    const wG = editRecord.weightG ?? 0;
    const lCm = editRecord.lengthCm ?? 0;
    const hCm = editRecord.headCm ?? 0;
    setWeightStr(wG ? gramsToDisplay(wG, prefs.weightUnit).toFixed(prefs.weightUnit === 'lb' ? 1 : 2) : '');
    setLengthStr(lCm ? cmToDisplay(lCm, prefs.lengthUnit).toFixed(1) : '');
    setHeadStr(hCm ? cmToDisplay(hCm, prefs.lengthUnit).toFixed(1) : '');
    setMeasuredOn(toLocalDate(new Date(editRecord.measuredAt)));
    if (editRecord.visitType) setVisitType(editRecord.visitType as 'home' | 'doctor');
    if (editRecord.notes) setNotes(editRecord.notes);
  }, [editRecord]);

  async function save() {
    setSaving(true);
    const measuredAt = new Date(measuredOn + 'T12:00:00').toISOString();
    const wVal = parseFloat(weightStr);
    const lVal = parseFloat(lengthStr);
    const hVal = parseFloat(headStr);
    const weightG = wVal > 0 ? Math.round(wVal * (prefs.weightUnit === 'lb' ? G_PER_LB : 1000)) : null;
    const lengthCm = lVal > 0 ? Math.round(lVal * (prefs.lengthUnit === 'in' ? CM_PER_IN : 1) * 10) / 10 : null;
    const headCm = hVal > 0 ? Math.round(hVal * (prefs.lengthUnit === 'in' ? CM_PER_IN : 1) * 10) / 10 : null;
    const payload = { weightG, lengthCm, headCm, visitType, notes: notes || null, loggedBy: 'You', measuredAt };
    if (editId) await (api.growth.update(editId, payload) as Promise<unknown>).catch(() => {});
    else await (api.growth.create(payload) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  function adjust(field: 'weight' | 'length' | 'head', delta: number) {
    if (field === 'weight') {
      setWeightStr(s => {
        const next = Math.max(0, (parseFloat(s) || 0) + delta);
        return next ? next.toFixed(prefs.weightUnit === 'lb' ? 1 : 2) : '';
      });
    }
    if (field === 'length') {
      setLengthStr(s => {
        const next = Math.max(0, (parseFloat(s) || 0) + delta);
        return next ? next.toFixed(1) : '';
      });
    }
    if (field === 'head') {
      setHeadStr(s => {
        const next = Math.max(0, (parseFloat(s) || 0) + delta);
        return next ? next.toFixed(1) : '';
      });
    }
  }

  const babyName = baby?.name?.split(' ')[0] ?? '…';
  const weightSteps = prefs.weightUnit === 'lb' ? [-0.5, -0.1, 0.1, 0.5] : [-0.1, -0.05, 0.05, 0.1];
  const lengthSteps = prefs.lengthUnit === 'in' ? [-1, -0.5, 0.5, 1] : [-1, -0.5, 0.5, 1];
  const metrics = [
    { key: 'weight' as const, label: 'Weight', str: weightStr, setStr: setWeightStr, unit: prefs.weightUnit, colorClass: 'text-rose', softClass: 'bg-rose-soft', positiveClass: 'border-rose bg-rose-soft text-rose', steps: weightSteps },
    { key: 'length' as const, label: 'Length', str: lengthStr, setStr: setLengthStr, unit: prefs.lengthUnit, colorClass: 'text-sage', softClass: 'bg-sage-soft', positiveClass: 'border-sage bg-sage-soft text-sage', steps: lengthSteps },
    { key: 'head' as const, label: 'Head', str: headStr, setStr: setHeadStr, unit: prefs.lengthUnit, colorClass: 'text-terracotta', softClass: 'bg-terracotta-soft', positiveClass: 'border-terracotta bg-terracotta-soft text-terracotta', steps: lengthSteps },
  ];

  return (
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="flex items-center gap-2.5 px-5 pt-1.5">
        <BackBtn />
        <div className="flex-1 text-center text-[13px] font-bold tracking-[0.4px] text-ink uppercase">{editId ? 'Edit Measurement' : 'New Measurement'}</div>
        <button className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-black/4"><div className="h-[18px] w-[18px] text-ink">{I.measure}</div></button>
      </div>
      <div className="px-[22px] pt-3.5">
        <div className="font-serif text-[26px] tracking-[-0.4px] text-ink">How's <span className="italic text-rose">{babyName}</span> growing?</div>
      </div>
      <div className="flex items-end gap-2.5 px-4 pt-3.5">
        <div className="flex-1"><DateTimeField label="Measured on" value={measuredOn} onChange={setMeasuredOn} type="date" max={toLocalDate(new Date())} /></div>
        <div className="shrink-0 rounded-[9px] bg-black/5 px-3 py-2 font-mono text-[11.5px] font-bold text-ink-mute">{prefs.weightUnit}/{prefs.lengthUnit}</div>
      </div>
      <div className="px-4 pt-3">
        <div className="mb-2 pl-1 text-[11px] font-bold tracking-[0.5px] text-ink-mute uppercase">Visit type</div>
        <div className="flex gap-2">
          {(['home', 'doctor'] as const).map(v => (<button key={v} onClick={() => setVisitType(v)} className={cn('flex-1 cursor-pointer rounded-xl border-[1.5px] p-2.5 text-[13px] font-semibold capitalize', visitType === v ? 'border-rose bg-rose-soft text-rose' : 'border-rule bg-card text-ink-soft')}>{v === 'doctor' ? '🏥 Doctor visit' : '🏠 At home'}</button>))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-4 pt-3">
        {metrics.map(r => (
          <Card key={r.key} pad={14}>
            <div className="flex items-center gap-3.5">
              <div className={cn('flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[14px]', r.softClass, r.colorClass)}><div className="h-5 w-5">{I.measure}</div></div>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-semibold tracking-[0.5px] text-ink-mute uppercase">{r.label}</div>
                <div className="mt-px flex items-baseline gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={r.str}
                    onChange={e => r.setStr(e.target.value)}
                    placeholder="—"
                    className="min-w-0 flex-1 border-none bg-transparent p-0 font-serif text-[28px] font-medium tracking-[-0.5px] text-ink tabular-nums outline-none placeholder:text-ink-mute"
                  />
                  <span className="shrink-0 text-xs italic text-ink-mute">{r.unit}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-1.5">
              {r.steps.map(delta => (<button key={String(delta)} onClick={() => adjust(r.key, delta)} className={cn('flex-1 cursor-pointer rounded-[10px] border py-2 font-mono text-[11px] font-semibold', delta > 0 ? r.positiveClass : 'border-rule bg-parchment text-ink-soft')}>{delta > 0 ? `+${delta}` : delta}</button>))}
            </div>
          </Card>
        ))}
      </div>
      <div className="px-4 pt-3"><Card pad={14}><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visit notes or milestones…" className="min-h-[50px] w-full resize-none border-0 bg-transparent text-[13px] leading-[1.45] text-ink-soft outline-none" /></Card></div>
      <div className="flex gap-2.5 px-4 pt-3.5 pb-6">
        <button onClick={save} disabled={saving || (!parseFloat(weightStr) && !parseFloat(lengthStr) && !parseFloat(headStr))} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-rose px-5 py-3.5 text-sm font-bold tracking-[0.2px] text-card">{saving ? 'Saving…' : editId ? 'Update measurement' : 'Save measurement'}</button>
      </div>
    </div>
  );
}
