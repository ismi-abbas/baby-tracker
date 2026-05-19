import React, { useState } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, Card, PillBtn, iconBtnStyle, primaryBtnStyle, softBtnStyle, useNav } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';

type DiaperType = 'wet' | 'dirty' | 'mixed';
type Consistency = 'Soft' | 'Seedy' | 'Watery' | 'Hard' | 'Mucousy';

const COLORS = ['#C5A06A', '#8C5E2A', '#5A4A2A', '#3F5F3A', '#7A4040'];

export function DiaperScreen() {
  const { babyApi: api } = useBaby();
  const { back } = useNav();
  const [type, setType] = useState<DiaperType>('wet');
  const [consistency, setConsistency] = useState<Consistency | null>(null);
  const [color, setColor] = useState(COLORS[1]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const types = [
    { id: 'wet' as DiaperType, label: 'Wet', sub: 'Pee only', icon: '💧', color: T.sky, soft: T.skySoft },
    { id: 'dirty' as DiaperType, label: 'Dirty', sub: 'Poo', icon: '●', color: T.earth, soft: T.earthSoft },
    { id: 'mixed' as DiaperType, label: 'Mixed', sub: 'Both', icon: '◐', color: T.honey, soft: T.honeySoft },
  ];

  async function save() {
    setSaving(true);
    await (api.diapers.create({
      type,
      consistency: consistency ?? null,
      color: type !== 'wet' ? color : null,
      notes: notes || null,
      loggedBy: 'You',
      changedAt: new Date().toISOString(),
    }) as Promise<unknown>).catch(() => {});
    setSaving(false);
    back();
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackBtn />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>Diaper Change</div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.doc}</div></button>
      </div>

      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ fontFamily: fonts.serif, fontSize: 26, color: T.ink, letterSpacing: -0.4 }}>What's in there?</div>
        <div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4 }}>Tap one. Add notes if anything unusual.</div>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {types.map(t => (
            <div key={t.id} onClick={() => setType(t.id)} style={{
              padding: 16, borderRadius: 20, textAlign: 'center', cursor: 'pointer',
              background: type === t.id ? t.color : T.card,
              color: type === t.id ? T.card : T.ink,
              border: type === t.id ? 'none' : `1px solid ${T.rule}`,
              boxShadow: type === t.id ? `0 6px 18px ${t.color}55` : 'none',
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 26, lineHeight: 1, marginBottom: 8, opacity: type === t.id ? 1 : 0.7 }}>{t.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t.label}</div>
              <div style={{ fontSize: 11, marginTop: 2, opacity: type === t.id ? 0.85 : 0.5 }}>{t.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Consistency */}
      {(type === 'dirty' || type === 'mixed') && (
        <div style={{ padding: '20px 16px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 6px 8px' }}>Consistency</div>
          <Card pad={14}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['Soft', 'Seedy', 'Watery', 'Hard', 'Mucousy'] as Consistency[]).map(c => (
                <div key={c} onClick={() => setConsistency(consistency === c ? null : c)} style={{
                  padding: '7px 14px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  background: consistency === c ? T.earth : 'transparent',
                  color: consistency === c ? T.card : T.inkSoft,
                  border: consistency === c ? 'none' : `1px solid ${T.rule}`,
                  transition: 'all 0.15s',
                }}>{c}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600 }}>Color</div>
              {COLORS.map(c => (
                <div key={c} onClick={() => setColor(c)} style={{
                  width: 22, height: 22, borderRadius: 11, background: c, cursor: 'pointer',
                  border: color === c ? `2px solid ${T.ink}` : `2px solid ${T.card}`,
                  boxShadow: `0 0 0 1px ${T.rule}`,
                  transition: 'transform 0.1s',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                }} />
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Time */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase' }}>When</div>
              <div style={{ fontFamily: fonts.serif, fontSize: 22, color: T.ink, marginTop: 2 }}>
                Now · {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </div>
            </div>
            <PillBtn soft={T.terracottaSoft} color={T.terracotta} style={{ fontSize: 12 }}>Backdate</PillBtn>
          </div>
        </Card>
      </div>

      {/* Notes */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)..."
            style={{ width: '100%', minHeight: 50, background: 'transparent', border: 'none', outline: 'none', fontFamily: fonts.sans, fontSize: 13, color: T.inkSoft, resize: 'none', lineHeight: 1.45 }} />
        </Card>
      </div>

      <div style={{ padding: '18px 16px 0', display: 'flex', gap: 10 }}>
        <button style={{ ...softBtnStyle, flex: 1 }}>Add note</button>
        <button onClick={save} disabled={saving} style={{ ...primaryBtnStyle, flex: 1.4, background: T.earth }}>
          {saving ? 'Saving…' : 'Save change'}
        </button>
      </div>
    </div>
  );
}
