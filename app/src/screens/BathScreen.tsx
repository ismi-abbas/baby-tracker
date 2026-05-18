import React, { useState } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, Card, iconBtnStyle, primaryBtnStyle, softBtnStyle, useNav } from '../components/ui';
import { I } from '../components/Icons';
import { api } from '../api/client';

export function BathScreen() {
  const { back } = useNav();
  const [bathType, setBathType] = useState('Tub bath');
  const [waterTemp, setWaterTemp] = useState(37);
  const [duration, setDuration] = useState(8);
  const [soapUsed, setSoapUsed] = useState(true);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await (api.baths.create({
      type: bathType.toLowerCase().replace(' ', '_'),
      waterTempC: waterTemp,
      durationMinutes: duration,
      soapUsed,
      bathedAt: new Date().toISOString(),
      loggedBy: 'You',
    }) as Promise<unknown>).catch(() => {});
    setSaving(false);
    back();
  }

  const settings: [string, string | number, React.ReactNode][] = [
    ['Type', bathType, I.bath],
    ['Water temp', `${waterTemp} °C`, I.sun],
    ['Duration', `${duration} min`, I.timeline],
    ['Soap used', soapUsed ? 'Yes · gentle' : 'No', I.heart],
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
          <div style={{ position: 'relative', height: 160 }}>
            <svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="none">
              <path d="M0 120 Q60 105 120 120 T240 120 T360 120 L360 160 L0 160 Z" fill={T.sky} opacity="0.5"/>
              <path d="M0 130 Q60 115 120 130 T240 130 T360 130 L360 160 L0 160 Z" fill={T.sky} opacity="0.7"/>
              {[[40,90,12],[80,100,8],[120,80,14],[210,95,10],[270,85,16],[310,100,9]].map(([x,y,r], i) => (
                <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.65}/>
              ))}
              <g transform="translate(170,82)">
                <ellipse cx="0" cy="14" rx="22" ry="11" fill={T.honey}/>
                <circle cx="14" cy="2" r="11" fill={T.honey}/>
                <path d="M22 2 L32 6 L22 8 Z" fill={T.terracotta}/>
                <circle cx="16" cy="0" r="1.5" fill={T.ink}/>
              </g>
            </svg>
          </div>
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 22, color: T.ink }}>Splash o'clock</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>Log today's bath for Saif</div>
          </div>
        </Card>
      </div>

      {/* Settings */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={0}>
          {settings.map(([k, v, ic], i) => (
            <div key={k} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
              borderTop: i ? `1px solid ${T.rule}` : 'none',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: T.skySoft, color: T.sky, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 18, height: 18 }}>{ic}</div>
              </div>
              <div style={{ flex: 1, fontSize: 13.5, color: T.ink, fontWeight: 500 }}>{k}</div>
              <div style={{ fontSize: 13, color: T.inkSoft, fontWeight: 600 }}>{v}</div>
              <div style={{ width: 12, height: 12, color: T.inkMute }}>{I.chev}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Quick adjustments */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>Temp</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[35, 36, 37, 38].map(t => (
              <button key={t} onClick={() => setWaterTemp(t)} style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${waterTemp === t ? T.sky : T.rule}`,
                background: waterTemp === t ? T.skySoft : T.card, color: waterTemp === t ? T.sky : T.inkSoft,
                fontFamily: fonts.mono, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>{t}°</button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6 }}>Duration</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[5, 8, 10, 15].map(d => (
              <button key={d} onClick={() => setDuration(d)} style={{
                flex: 1, padding: '8px 0', borderRadius: 10, border: `1px solid ${duration === d ? T.sky : T.rule}`,
                background: duration === d ? T.skySoft : T.card, color: duration === d ? T.sky : T.inkSoft,
                fontFamily: fonts.mono, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>{d}m</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 16px 0', display: 'flex', gap: 10 }}>
        <button onClick={() => setSoapUsed(s => !s)} style={{ ...softBtnStyle, flex: 1 }}>
          {soapUsed ? '🧼 Soap: Yes' : '🚫 No soap'}
        </button>
        <button onClick={save} disabled={saving} style={{ ...primaryBtnStyle, flex: 1.4, background: T.sky }}>
          {saving ? 'Saving…' : 'Save bath'}
        </button>
      </div>
    </div>
  );
}
