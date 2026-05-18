import React, { useState } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, Card, Chip, iconBtnStyle, primaryBtnStyle, softBtnStyle, useNav } from '../components/ui';
import { I } from '../components/Icons';
import { api } from '../api/client';

type Units = 'metric' | 'imperial';

export function GrowthEntryScreen() {
  const { back } = useNav();
  const [units, setUnits] = useState<Units>('metric');
  const [weightG, setWeightG] = useState(5400);
  const [lengthCm, setLengthCm] = useState(58);
  const [headCm, setHeadCm] = useState(39.5);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await (api.growth.create({
      weightG,
      lengthCm,
      headCm,
      visitType: 'home',
      notes: notes || null,
      loggedBy: 'You',
      measuredAt: new Date().toISOString(),
    }) as Promise<unknown>).catch(() => {});
    setSaving(false);
    back();
  }

  function adjust(field: 'weight' | 'length' | 'head', delta: number) {
    if (field === 'weight') setWeightG(v => Math.max(0, v + delta));
    if (field === 'length') setLengthCm(v => Math.max(0, Math.round((v + delta) * 10) / 10));
    if (field === 'head') setHeadCm(v => Math.max(0, Math.round((v + delta) * 10) / 10));
  }

  const metrics = [
    { key: 'weight' as const, label: 'Weight', val: units === 'metric' ? `${(weightG / 1000).toFixed(1)}` : `${(weightG / 453.6).toFixed(1)}`, unit: units === 'metric' ? 'kg' : 'lb', color: T.rose, soft: T.roseSoft, pct: '52nd ％', delta: ['-100g', '+100g'], step: 100 },
    { key: 'length' as const, label: 'Length', val: units === 'metric' ? `${lengthCm}` : `${(lengthCm / 2.54).toFixed(1)}`, unit: units === 'metric' ? 'cm' : 'in', color: T.sage, soft: T.sageSoft, pct: '48th ％', delta: ['-0.5', '+0.5'], step: 0.5 },
    { key: 'head' as const, label: 'Head', val: units === 'metric' ? `${headCm}` : `${(headCm / 2.54).toFixed(1)}`, unit: units === 'metric' ? 'cm' : 'in', color: T.terracotta, soft: T.terracottaSoft, pct: '55th ％', delta: ['-0.5', '+0.5'], step: 0.5 },
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
          How's <span style={{ fontStyle: 'italic', color: T.rose }}>Saif</span> growing?
        </div>
        <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>Adjust values with ± buttons below each metric.</div>
      </div>

      {/* Unit toggle */}
      <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ display: 'inline-flex', padding: 3, borderRadius: 9, background: 'rgba(0,0,0,0.05)' }}>
          {[['metric', 'kg · cm'], ['imperial', 'lb · in']].map(([u, label]) => (
            <div key={u} onClick={() => setUnits(u as Units)} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
              background: units === u ? T.card : 'transparent',
              color: units === u ? T.ink : T.inkMute, fontFamily: fonts.mono,
            }}>{label}</div>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div style={{ padding: '10px 16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {metrics.map(r => (
          <Card key={r.key} pad={14}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: r.soft, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 22, height: 22 }}>{I.measure}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{r.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 1 }}>
                  <span style={{ fontFamily: fonts.serif, fontSize: 30, fontWeight: 500, color: T.ink, letterSpacing: -0.5, fontVariantNumeric: 'tabular-nums' }}>{r.val}</span>
                  <span style={{ fontSize: 13, color: T.inkMute, fontStyle: 'italic' }}>{r.unit}</span>
                </div>
              </div>
              <Chip color={r.color} soft={r.soft}>{r.pct}</Chip>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => adjust(r.key, r.key === 'weight' ? -100 : -0.5)} style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${T.rule}`,
                background: T.parchment, color: T.ink, fontFamily: fonts.mono, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>−</button>
              <button onClick={() => adjust(r.key, r.key === 'weight' ? 100 : 0.5)} style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${r.color}`,
                background: r.soft, color: r.color, fontFamily: fonts.mono, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>+</button>
            </div>
          </Card>
        ))}
      </div>

      {/* Notes */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Visit notes or milestones..."
            style={{ width: '100%', minHeight: 50, background: 'transparent', border: 'none', outline: 'none', fontFamily: fonts.sans, fontSize: 13, color: T.inkSoft, resize: 'none', lineHeight: 1.45 }} />
        </Card>
      </div>

      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10 }}>
        <button style={{ ...softBtnStyle, flex: 1 }}>From visit notes</button>
        <button onClick={save} disabled={saving} style={{ ...primaryBtnStyle, flex: 1.4, background: T.rose }}>
          {saving ? 'Saving…' : 'Save measurement'}
        </button>
      </div>
    </div>
  );
}
