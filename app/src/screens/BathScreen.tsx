import React, { useState, useEffect } from 'react';
import { T } from '../tokens';
import { BackBtn, Card, useNav, DateTimeField } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import type { Bath } from '../types';
import { cn } from '../lib/utils';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function BathScreen() {
  const { back } = useNav();
  const { babyApi: api } = useBaby();
  const { editId, record: editRecord } = useEditRecord<Bath>(id => api.baths.get(id) as Promise<Bath>);
  const [bathType, setBathType] = useState('Tub bath');
  const [waterTempStr, setWaterTempStr] = useState('37');
  const [durationStr, setDurationStr] = useState('8');
  const [soapUsed, setSoapUsed] = useState(true);
  const [bathedAt, setBathedAt] = useState(() => toLocalDT(new Date()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editRecord) return;
    if (editRecord.type) setBathType(editRecord.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    if (editRecord.waterTempC) setWaterTempStr(String(editRecord.waterTempC));
    if (editRecord.durationMinutes) setDurationStr(String(editRecord.durationMinutes));
    setSoapUsed(editRecord.soapUsed ?? true);
    setBathedAt(toLocalDT(new Date(editRecord.bathedAt)));
  }, [editRecord]);

  async function save() {
    setSaving(true);
    const payload = { type: bathType.toLowerCase().replace(' ', '_'), waterTempC: parseFloat(waterTempStr) || null, durationMinutes: parseInt(durationStr) || null, soapUsed, bathedAt: new Date(bathedAt).toISOString(), loggedBy: 'You' };
    if (editId) await (api.baths.update(editId, payload) as Promise<unknown>).catch(() => {});
    else await (api.baths.create(payload) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  const typeOpts = ['Tub bath', 'Sponge bath', 'Shower'];

  return (
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="flex items-center gap-2.5 px-5 pt-1.5">
        <BackBtn />
        <div className="flex-1 text-center text-[13px] font-bold tracking-[0.4px] text-ink uppercase">{editId ? 'Edit Bath' : 'Bath Time'}</div>
        <button className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-black/4"><div className="h-[18px] w-[18px] text-ink">{I.doc}</div></button>
      </div>
      {!editId && (
        <div className="px-4 pt-[18px]">
          <div className="overflow-hidden rounded-[22px] bg-sky-soft shadow-card">
            <div className="relative h-[110px]">
              <svg width="100%" height="100%" viewBox="0 0 360 110" preserveAspectRatio="none">
                <path d="M0 75 Q60 60 120 75 T240 75 T360 75 L360 110 L0 110 Z" fill={T.sky} opacity="0.5"/>
                <path d="M0 85 Q60 70 120 85 T240 85 T360 85 L360 110 L0 110 Z" fill={T.sky} opacity="0.7"/>
                {[[40,55,12],[80,62,8],[120,50,14],[210,58,10],[270,50,16],[310,62,9]].map(([x,y,r],i) => (<circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.65}/>))}
                <g transform="translate(170,42)"><ellipse cx="0" cy="14" rx="22" ry="11" fill={T.honey}/><circle cx="14" cy="2" r="11" fill={T.honey}/><path d="M22 2 L32 6 L22 8 Z" fill={T.terracotta}/><circle cx="16" cy="0" r="1.5" fill={T.ink}/></g>
              </svg>
            </div>
            <div className="px-[18px] pt-2 pb-3"><div className="font-serif text-lg text-ink">Splash o'clock</div></div>
          </div>
        </div>
      )}
      <div className="px-4 pt-3.5">
        <Card pad={14}><DateTimeField label="When" value={bathedAt} onChange={setBathedAt} max={toLocalDT(new Date())} /></Card>
      </div>
      {/* Bath type */}
      <div className="px-4 pt-2.5">
        <div className="mb-2 pl-1 text-[11px] font-bold tracking-[0.5px] text-ink-mute uppercase">Type</div>
        <div className="flex flex-wrap gap-1.5">
          {typeOpts.map(opt => (
            <button key={opt} onClick={() => setBathType(opt)} className={cn('cursor-pointer rounded-xl border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-150', bathType === opt ? 'border-sky bg-sky-soft text-sky' : 'border-rule bg-card text-ink-soft')}>{opt}</button>
          ))}
        </div>
      </div>

      {/* Water temp */}
      <div className="px-4 pt-2.5">
        <div className="mb-2 pl-1 text-[11px] font-bold tracking-[0.5px] text-ink-mute uppercase">Water temp</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-baseline gap-1 rounded-xl border-[1.5px] border-rule bg-card px-3.5 py-2">
            <input
              type="text"
              inputMode="decimal"
              value={waterTempStr}
              onChange={e => setWaterTempStr(e.target.value)}
              placeholder="—"
              className="w-8 border-none bg-transparent p-0 text-center font-mono text-sm font-semibold text-ink outline-none placeholder:text-ink-mute"
            />
            <span className="text-xs text-ink-mute">°C</span>
          </div>
          {['35', '36', '37', '38'].map(opt => (
            <button key={opt} onClick={() => setWaterTempStr(opt)} className={cn('cursor-pointer rounded-xl border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-150', waterTempStr === opt ? 'border-sky bg-sky-soft text-sky' : 'border-rule bg-card text-ink-soft')}>{opt}°C</button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="px-4 pt-2.5">
        <div className="mb-2 pl-1 text-[11px] font-bold tracking-[0.5px] text-ink-mute uppercase">Duration</div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-baseline gap-1 rounded-xl border-[1.5px] border-rule bg-card px-3.5 py-2">
            <input
              type="text"
              inputMode="numeric"
              value={durationStr}
              onChange={e => setDurationStr(e.target.value)}
              placeholder="—"
              className="w-8 border-none bg-transparent p-0 text-center font-mono text-sm font-semibold text-ink outline-none placeholder:text-ink-mute"
            />
            <span className="text-xs text-ink-mute">min</span>
          </div>
          {['5', '8', '10', '15', '20'].map(opt => (
            <button key={opt} onClick={() => setDurationStr(opt)} className={cn('cursor-pointer rounded-xl border-[1.5px] px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-150', durationStr === opt ? 'border-sky bg-sky-soft text-sky' : 'border-rule bg-card text-ink-soft')}>{opt} min</button>
          ))}
        </div>
      </div>
      <div className="px-4 pt-2.5">
        <div className="mb-2 pl-1 text-[11px] font-bold tracking-[0.5px] text-ink-mute uppercase">Soap</div>
        <div className="flex gap-2">
          {[true, false].map(v => (<button key={String(v)} onClick={() => setSoapUsed(v)} className={cn('flex-1 cursor-pointer rounded-xl border-[1.5px] py-2.5 text-[13px] font-semibold', soapUsed === v ? 'border-sky bg-sky-soft text-sky' : 'border-rule bg-card text-ink-soft')}>{v ? '🧼 Yes' : '🚿 No soap'}</button>))}
        </div>
      </div>
      <div className="flex gap-2.5 px-4 pt-[18px]">
        <button onClick={save} disabled={saving} className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-sky px-5 py-3.5 text-sm font-bold tracking-[0.2px] text-card">{saving ? 'Saving…' : editId ? 'Update bath' : 'Save bath'}</button>
      </div>
    </div>
  );
}
