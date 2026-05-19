import React, { useState, useEffect } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, Card, iconBtnStyle, primaryBtnStyle, useNav, DateTimeField } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import type { Bath } from '../types';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function BathScreen() {
  const { back } = useNav();
  const { babyApi: api } = useBaby();
  const { editId, record: editRecord } = useEditRecord<Bath>(id => api.baths.get(id) as Promise<Bath>);
  const [bathType, setBathType] = useState('Tub bath');
  const [waterTemp, setWaterTemp] = useState(37);
  const [duration, setDuration] = useState(8);
  const [soapUsed, setSoapUsed] = useState(true);
  const [bathedAt, setBathedAt] = useState(() => toLocalDT(new Date()));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editRecord) return;
    if (editRecord.type) setBathType(editRecord.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()));
    if (editRecord.waterTempC) setWaterTemp(editRecord.waterTempC);
    if (editRecord.durationMinutes) setDuration(editRecord.durationMinutes);
    setSoapUsed(editRecord.soapUsed ?? true);
    setBathedAt(toLocalDT(new Date(editRecord.bathedAt)));
  }, [editRecord]);

  async function save() {
    setSaving(true);
    const payload = { type: bathType.toLowerCase().replace(' ', '_'), waterTempC: waterTemp, durationMinutes: duration, soapUsed, bathedAt: new Date(bathedAt).toISOString(), loggedBy: 'You' };
    if (editId) await (api.baths.update(editId, payload) as Promise<unknown>).catch(() => {});
    else await (api.baths.create(payload) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  const settings = [
    { k: 'Type', ic: I.bath, opts: ['Tub bath', 'Sponge bath', 'Shower'], val: bathType, set: setBathType },
    { k: 'Water temp', ic: I.sun, opts: ['35', '36', '37', '38'], val: String(waterTemp), set: (v: string) => setWaterTemp(Number(v)) },
    { k: 'Duration', ic: I.timeline, opts: ['5', '8', '10', '15', '20'], val: String(duration), set: (v: string) => setDuration(Number(v)) },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackBtn />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>{editId ? 'Edit Bath' : 'Bath Time'}</div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.doc}</div></button>
      </div>
      {!editId && (
        <div style={{ padding: '18px 16px 0' }}>
          <Card pad={0} style={{ overflow: 'hidden', background: T.skySoft }}>
            <div style={{ position: 'relative', height: 110 }}>
              <svg width="100%" height="100%" viewBox="0 0 360 110" preserveAspectRatio="none">
                <path d="M0 75 Q60 60 120 75 T240 75 T360 75 L360 110 L0 110 Z" fill={T.sky} opacity="0.5"/>
                <path d="M0 85 Q60 70 120 85 T240 85 T360 85 L360 110 L0 110 Z" fill={T.sky} opacity="0.7"/>
                {[[40,55,12],[80,62,8],[120,50,14],[210,58,10],[270,50,16],[310,62,9]].map(([x,y,r],i) => (<circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.65}/>))}
                <g transform="translate(170,42)"><ellipse cx="0" cy="14" rx="22" ry="11" fill={T.honey}/><circle cx="14" cy="2" r="11" fill={T.honey}/><path d="M22 2 L32 6 L22 8 Z" fill={T.terracotta}/><circle cx="16" cy="0" r="1.5" fill={T.ink}/></g>
              </svg>
            </div>
            <div style={{ padding: '8px 18px 12px' }}><div style={{ fontFamily: fonts.serif, fontSize: 18, color: T.ink }}>Splash o'clock</div></div>
          </Card>
        </div>
      )}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}><DateTimeField label="When" value={bathedAt} onChange={setBathedAt} max={toLocalDT(new Date())} /></Card>
      </div>
      {settings.map(({ k, ic, opts, val, set }) => (
        <div key={k} style={{ padding: '10px 16px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>{k}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {opts.map(opt => (<button key={opt} onClick={() => set(opt)} style={{ padding: '8px 14px', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${val === opt ? T.sky : T.rule}`, background: val === opt ? T.skySoft : T.card, color: val === opt ? T.sky : T.inkSoft, fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 600, transition: 'all 0.12s' }}>{k === 'Water temp' ? `${opt} °C` : k === 'Duration' ? `${opt} min` : opt}</button>))}
          </div>
        </div>
      ))}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>Soap</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[true, false].map(v => (<button key={String(v)} onClick={() => setSoapUsed(v)} style={{ flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer', border: `1.5px solid ${soapUsed === v ? T.sky : T.rule}`, background: soapUsed === v ? T.skySoft : T.card, color: soapUsed === v ? T.sky : T.inkSoft, fontFamily: fonts.sans, fontSize: 13, fontWeight: 600 }}>{v ? '🧼 Yes' : '🚿 No soap'}</button>))}
        </div>
      </div>
      <div style={{ padding: '18px 16px 0', display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{ ...primaryBtnStyle, flex: 1, background: T.sky }}>{saving ? 'Saving…' : editId ? 'Update bath' : 'Save bath'}</button>
      </div>
    </div>
  );
}
