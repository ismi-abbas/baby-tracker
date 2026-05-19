import React, { useState } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, Card, iconBtnStyle, primaryBtnStyle, softBtnStyle, useNav, DateTimeField } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function BathScreen() {
  const { back } = useNav();
  const { babyApi: api } = useBaby();
  const [bathType, setBathType] = useState('Tub bath');
  const [waterTemp, setWaterTemp] = useState(37);
  const [duration, setDuration] = useState(8);
  const [soapUsed, setSoapUsed] = useState(true);
  const [bathedAt, setBathedAt] = useState(() => toLocalDT(new Date()));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await (api.baths.create({
      type: bathType.toLowerCase().replace(' ', '_'),
      waterTempC: waterTemp, durationMinutes: duration, soapUsed,
      bathedAt: new Date(bathedAt).toISOString(),
      loggedBy: 'You',
    }) as Promise<unknown>).catch(() => {});
    setSaving(false);
    back();
  }

  const settings = [
    { k: 'Type', ic: I.bath, opts: ['Tub bath', 'Sponge bath', 'Shower'], val: bathType, set: setBathType },
    { k: 'Water temp', ic: I.sun, opts: [35, 36, 37, 38].map(String), val: String(waterTemp), set: (v: string) => setWaterTemp(Number(v)) },
    { k: 'Duration', ic: I.timeline, opts: ['5', '8', '10', '15', '20'], val: String(duration), set: (v: string) => setDuration(Number(v)) },
  ];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackBtn />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>Bath Time</div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.doc}</div></button>
      </div>

      {/* Bath illustration */}
      <div style={{ padding: '18px 16px 0' }}>
        <Card pad={0} style={{ overflow: 'hidden', background: T.skySoft }}>
          <div style={{ position: 'relative', height: 130 }}>
            <svg width="100%" height="100%" viewBox="0 0 360 130" preserveAspectRatio="none">
              <path d="M0 90 Q60 75 120 90 T240 90 T360 90 L360 130 L0 130 Z" fill={T.sky} opacity="0.5"/>
              <path d="M0 100 Q60 85 120 100 T240 100 T360 100 L360 130 L0 130 Z" fill={T.sky} opacity="0.7"/>
              {[[40,65,12],[80,72,8],[120,60,14],[210,68,10],[270,60,16],[310,72,9]].map(([x,y,r],i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.65}/>
              ))}
              <g transform="translate(170,55)">
                <ellipse cx="0" cy="14" rx="22" ry="11" fill={T.honey}/>
                <circle cx="14" cy="2" r="11" fill={T.honey}/>
                <path d="M22 2 L32 6 L22 8 Z" fill={T.terracotta}/>
                <circle cx="16" cy="0" r="1.5" fill={T.ink}/>
              </g>
            </svg>
          </div>
          <div style={{ padding: '10px 18px 14px' }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 20, color: T.ink }}>Splash o'clock</div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>Log today's bath</div>
          </div>
        </Card>
      </div>

      {/* When */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}>
          <DateTimeField label="When" value={bathedAt} onChange={setBathedAt} max={toLocalDT(new Date())} />
        </Card>
      </div>

      {/* Settings */}
      {settings.map(({ k, ic, opts, val, set }) => (
        <div key={k} style={{ padding: '10px 16px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>{k}</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {opts.map(opt => (
              <button key={opt} onClick={() => set(opt)} style={{
                padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                border: `1.5px solid ${val === opt ? T.sky : T.rule}`,
                background: val === opt ? T.skySoft : T.card,
                color: val === opt ? T.sky : T.inkSoft,
                fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 600, transition: 'all 0.12s',
              }}>
                {k === 'Water temp' ? `${opt} °C` : k === 'Duration' ? `${opt} min` : opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Soap */}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 }}>Soap</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[true, false].map(v => (
            <button key={String(v)} onClick={() => setSoapUsed(v)} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
              border: `1.5px solid ${soapUsed === v ? T.sky : T.rule}`,
              background: soapUsed === v ? T.skySoft : T.card,
              color: soapUsed === v ? T.sky : T.inkSoft,
              fontFamily: fonts.sans, fontSize: 13, fontWeight: 600,
            }}>{v ? '🧼 Yes' : '🚿 No soap'}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '18px 16px 0', display: 'flex', gap: 10 }}>
        <button onClick={save} disabled={saving} style={{ ...primaryBtnStyle, flex: 1, background: T.sky }}>
          {saving ? 'Saving…' : 'Save bath'}
        </button>
      </div>
    </div>
  );
}
