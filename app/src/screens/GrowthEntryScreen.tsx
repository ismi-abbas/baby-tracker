import React, { useState } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, Card, Chip, iconBtnStyle, primaryBtnStyle, softBtnStyle, useNav, DateTimeField } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';

type Units = 'metric' | 'imperial';

function toLocalDate(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function GrowthEntryScreen() {
  const { back } = useNav();
  const { baby, babyApi: api } = useBaby();
  const [units, setUnits] = useState<Units>('metric');
  const [weightG, setWeightG] = useState(0);
  const [lengthCm, setLengthCm] = useState(0);
  const [headCm, setHeadCm] = useState(0);
  const [measuredOn, setMeasuredOn] = useState(() => toLocalDate(new Date()));
  const [visitType, setVisitType] = useState<'home' | 'doctor'>('home');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const measuredAt = new Date(measuredOn + 'T12:00:00').toISOString();
    await (api.growth.create({
      weightG: weightG || null, lengthCm: lengthCm || null, headCm: headCm || null,
      visitType, notes: notes || null, loggedBy: 'You', measuredAt,
    }) as Promise<unknown>).catch(() => {});
    setSaving(false);
    back();
  }

  function adjust(field: 'weight' | 'length' | 'head', delta: number) {
    if (field === 'weight') setWeightG(v => Math.max(0, v + delta));
    if (field === 'length') setLengthCm(v => Math.max(0, Math.round((v + delta) * 10) / 10));
    if (field === 'head') setHeadCm(v => Math.max(0, Math.round((v + delta) * 10) / 10));
  }

  const babyName = baby?.name?.split(' ')[0] ?? '…';

  const metrics = [
    { key: 'weight' as const, label: 'Weight', val: units === 'metric' ? (weightG ? (weightG / 1000).toFixed(2) : '—') : (weightG ? (weightG / 453.6).toFixed(1) : '—'), unit: units === 'metric' ? 'kg' : 'lb', color: T.rose, soft: T.roseSoft, bigStep: 100, smallStep: 100 },
    { key: 'length' as const, label: 'Length', val: units === 'metric' ? (lengthCm ? lengthCm.toFixed(1) : '—') : (lengthCm ? (lengthCm / 2.54).toFixed(1) : '—'), unit: units === 'metric' ? 'cm' : 'in', color: T.sage, soft: T.sageSoft, bigStep: 1, smallStep: 0.5 },
    { key: 'head' as const, label: 'Head', val: units === 'metric' ? (headCm ? headCm.toFixed(1) : '—') : (headCm ? (headCm / 2.54).toFixed(1) : '—'), unit: units === 'metric' ? 'cm' : 'in', color: T.terracotta, soft: T.terracottaSoft, bigStep: 1, smallStep: 0.5 },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackBtn />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>New Measurement</div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.measure}</div></button>
      </div>

      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ fontFamily: fonts.serif, fontSize: 26, color: T.ink, letterSpacing: -0.4 }}>
          How's <span style={{ fontStyle: 'italic', color: T.rose }}>{babyName}</span> growing?
        </div>
      </div>

      {/* Date + units row */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <div style={{ flex: 1 }}>
          <DateTimeField label="Measured on" value={measuredOn} onChange={setMeasuredOn} type="date" max={toLocalDate(new Date())} />
        </div>
        <div style={{ display: 'inline-flex', padding: 3, borderRadius: 9, background: 'rgba(0,0,0,0.05)', flexShrink: 0 }}>
          {(['metric', 'imperial'] as Units[]).map(u => (
            <div key={u} onClick={() => setUnits(u)} style={{
              padding: '8px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              background: units === u ? T.card : 'transparent', color: units === u ? T.ink : T.inkMute, fontFamily: fonts.mono,
            }}>{u === 'metric' ? 'kg/cm' : 'lb/in'}</div>
          ))}
        </div>
      </div>

      {/* Visit type */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>Visit type</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['home', 'doctor'] as const).map(v => (
            <button key={v} onClick={() => setVisitType(v)} style={{
              flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer',
              border: `1.5px solid ${visitType === v ? T.rose : T.rule}`,
              background: visitType === v ? T.roseSoft : T.card,
              color: visitType === v ? T.rose : T.inkSoft,
              fontFamily: fonts.sans, fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
            }}>{v === 'doctor' ? '🏥 Doctor visit' : '🏠 At home'}</button>
          ))}
        </div>
      </div>

      {/* Measurements */}
      <div style={{ padding: '12px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {metrics.map(r => (
          <Card key={r.key} pad={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 14, background: r.soft, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 20, height: 20 }}>{I.measure}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{r.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
                  <span style={{ fontFamily: fonts.serif, fontSize: 28, fontWeight: 500, color: T.ink, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{r.val}</span>
                  <span style={{ fontSize: 12, color: T.inkMute, fontStyle: 'italic' }}>{r.unit}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
              {[[-r.bigStep, `−${r.bigStep}${r.key === 'weight' ? 'g' : ''}`], [-r.smallStep, `−${r.smallStep}`], [r.smallStep, `+${r.smallStep}`], [r.bigStep, `+${r.bigStep}${r.key === 'weight' ? 'g' : ''}`]].map(([delta, label]) => (
                <button key={String(delta)} onClick={() => adjust(r.key, Number(delta))} style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${Number(delta) > 0 ? r.color : T.rule}`,
                  background: Number(delta) > 0 ? r.soft : T.parchment,
                  color: Number(delta) > 0 ? r.color : T.inkSoft,
                  fontFamily: fonts.mono, fontSize: 11, fontWeight: 600,
                }}>{String(label)}</button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Notes */}
      <div style={{ padding: '12px 16px 0' }}>
        <Card pad={14}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Visit notes or milestones…"
            style={{ width: '100%', minHeight: 50, background: 'transparent', border: 'none', outline: 'none', fontFamily: fonts.sans, fontSize: 13, color: T.inkSoft, resize: 'none', lineHeight: 1.45 }} />
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving || (!weightG && !lengthCm && !headCm)} style={{ ...primaryBtnStyle, flex: 1, background: T.rose }}>
          {saving ? 'Saving…' : 'Save measurement'}
        </button>
      </div>
    </div>
  );
}
