import React, { useState, useEffect } from 'react';
import { T } from '../tokens';
import { BackBtn, Card, useNav, DateTimeField } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import type { DiaperChange } from '../types';
import { cn } from '../lib/utils';

type DiaperType = 'wet' | 'dirty' | 'mixed';
type Consistency = 'Soft' | 'Seedy' | 'Watery' | 'Hard' | 'Mucousy';
const COLORS = [
  { value: '#C5A06A', className: 'bg-[#C5A06A]' },
  { value: '#8C5E2A', className: 'bg-[#8C5E2A]' },
  { value: '#5A4A2A', className: 'bg-[#5A4A2A]' },
  { value: '#3F5F3A', className: 'bg-[#3F5F3A]' },
  { value: '#7A4040', className: 'bg-[#7A4040]' },
];

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function DiaperScreen() {
  const { back } = useNav();
  const { babyApi: api } = useBaby();
  const { editId, record: editRecord } = useEditRecord<DiaperChange>(id => api.diapers.get(id) as Promise<DiaperChange>);
  const [type, setType] = useState<DiaperType>('wet');
  const [consistency, setConsistency] = useState<Consistency | null>(null);
  const [color, setColor] = useState(COLORS[1].value);
  const [notes, setNotes] = useState('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTime, setCustomTime] = useState(() => toLocalDT(new Date()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editRecord) return;
    setType(editRecord.type as DiaperType);
    if (editRecord.consistency) setConsistency(editRecord.consistency as Consistency);
    if (editRecord.color) setColor(editRecord.color);
    if (editRecord.notes) setNotes(editRecord.notes);
    setUseCustomTime(true);
    setCustomTime(toLocalDT(new Date(editRecord.changedAt)));
  }, [editRecord]);

  async function save() {
    setSaving(true);
    const changedAt = useCustomTime ? new Date(customTime).toISOString() : new Date().toISOString();
    const payload = { type, consistency: consistency ?? null, color: type !== 'wet' ? color : null, notes: notes || null, loggedBy: 'You', changedAt };
    if (editId) await (api.diapers.update(editId, payload) as Promise<unknown>).catch(() => {});
    else await (api.diapers.create(payload) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  const types = [
    { id: 'wet' as DiaperType, label: 'Wet', sub: 'Pee only', icon: '💧', activeClass: 'bg-sky text-card shadow-[0_6px_18px_#7BA7B855]' },
    { id: 'dirty' as DiaperType, label: 'Dirty', sub: 'Poo', icon: '●', activeClass: 'bg-earth text-card shadow-[0_6px_18px_#A07A5555]' },
    { id: 'mixed' as DiaperType, label: 'Mixed', sub: 'Both', icon: '◐', activeClass: 'bg-honey text-card shadow-[0_6px_18px_#E0A95C55]' },
  ];

  return (
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="flex items-center gap-2.5 px-5 pt-1.5">
        <BackBtn />
        <div className="flex-1 text-center text-[13px] font-bold tracking-[0.4px] text-ink uppercase">{editId ? 'Edit Diaper' : 'Diaper Change'}</div>
        <button className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-black/4"><div className="h-[18px] w-[18px] text-ink">{I.doc}</div></button>
      </div>
      <div className="px-[22px] pt-[18px]">
        <div className="font-serif text-[26px] tracking-[-0.4px] text-ink">What's in there?</div>
        <div className="mt-1 text-[13px] text-ink-soft">Tap one. Add notes if anything unusual.</div>
      </div>
      <div className="px-4 pt-4">
        <div className="grid grid-cols-3 gap-2.5">
          {types.map(t => {
            const active = type === t.id;
            return (
              <div key={t.id} onClick={() => setType(t.id)} className={cn('cursor-pointer rounded-[20px] p-4 text-center transition-all duration-150', active ? `border-0 ${t.activeClass}` : 'border border-rule bg-card text-ink')}>
                <div className={cn('mb-2 text-[26px] leading-none', active ? 'opacity-100' : 'opacity-70')}>{t.icon}</div>
                <div className="text-sm font-bold">{t.label}</div>
                <div className={cn('mt-0.5 text-[11px]', active ? 'opacity-85' : 'opacity-50')}>{t.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
      {(type === 'dirty' || type === 'mixed') && (
        <div className="px-4 pt-5">
          <div className="px-1.5 pb-2 text-[11px] font-bold tracking-[0.6px] text-ink-mute uppercase">Consistency</div>
          <Card pad={14}>
            <div className="flex flex-wrap gap-2">
              {(['Soft', 'Seedy', 'Watery', 'Hard', 'Mucousy'] as Consistency[]).map(c => (<div key={c} onClick={() => setConsistency(consistency === c ? null : c)} className={cn('cursor-pointer rounded-full px-3.5 py-[7px] text-[12.5px] font-semibold transition-all duration-150', consistency === c ? 'border-0 bg-earth text-card' : 'border border-rule bg-transparent text-ink-soft')}>{c}</div>))}
            </div>
            <div className="mt-3 flex items-center gap-2.5">
              <div className="text-[11.5px] font-semibold text-ink-mute">Color</div>
              {COLORS.map(c => (<div key={c.value} onClick={() => setColor(c.value)} className={cn('h-[22px] w-[22px] cursor-pointer rounded-full shadow-[0_0_0_1px_#e6dbc4] transition-transform duration-100', c.className, color === c.value ? 'scale-[1.2] border-2 border-ink' : 'scale-100 border-2 border-card')} />))}
            </div>
          </Card>
        </div>
      )}
      <div className="px-4 pt-3.5">
        <Card pad={14}>
          <div className={cn('flex items-center justify-between', useCustomTime && 'mb-3.5')}>
            <div>
              <div className="text-[11.5px] font-semibold tracking-[0.4px] text-ink-mute uppercase">When</div>
              {!useCustomTime && (<div className="mt-0.5 font-serif text-xl text-ink">Now · {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>)}
            </div>
            <button onClick={() => { setUseCustomTime(v => !v); if (!useCustomTime) setCustomTime(toLocalDT(new Date())); }} className={cn('cursor-pointer rounded-xl border-[1.5px] px-3.5 py-[7px] text-[12.5px] font-bold', useCustomTime ? 'border-terracotta bg-terracotta-soft text-terracotta' : 'border-rule bg-transparent text-ink-soft')}>{useCustomTime ? '✓ Custom' : '✎ Backdate'}</button>
          </div>
          {useCustomTime && (<DateTimeField label="" value={customTime} onChange={setCustomTime} max={toLocalDT(new Date())} />)}
        </Card>
      </div>
      <div className="px-4 pt-3.5"><Card pad={14}><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)…" className="min-h-[50px] w-full resize-none border-0 bg-transparent text-[13px] leading-[1.45] text-ink-soft outline-none" /></Card></div>
      <div className="flex gap-2.5 px-4 pt-[18px]">
        <button onClick={save} disabled={saving} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-earth px-5 py-3.5 text-sm font-bold tracking-[0.2px] text-card">{saving ? 'Saving…' : editId ? 'Update change' : 'Save change'}</button>
      </div>
    </div>
  );
}
