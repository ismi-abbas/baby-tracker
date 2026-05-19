import React, { useState } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, CircularTimer, useTimer, iconBtnStyle, useNav, Chip } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';

type Storage = 'fridge' | 'freezer' | 'feed_now';

export function PumpingScreen() {
  const { babyApi: api } = useBaby();
  const { back } = useNav();
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [leftMl, setLeftMl] = useState(0);
  const [rightMl, setRightMl] = useState(0);
  const [storage, setStorage] = useState<Storage>('fridge');
  const [saving, setSaving] = useState(false);
  const elapsed = useTimer(running, startTime ?? undefined);

  function startSession() {
    setStartTime(new Date());
    setRunning(true);
  }

  async function endSession() {
    setSaving(true);
    setRunning(false);
    await (api.pumping.create({
      leftMl,
      rightMl,
      totalMl: leftMl + rightMl,
      durationSeconds: elapsed,
      storageType: storage,
      startedAt: (startTime ?? new Date()).toISOString(),
      endedAt: new Date().toISOString(),
      loggedBy: 'You',
    }) as Promise<unknown>).catch(() => {});
    setSaving(false);
    back();
  }

  function adjust(side: 'left' | 'right', delta: number) {
    if (side === 'left') setLeftMl(v => Math.max(0, v + delta));
    else setRightMl(v => Math.max(0, v + delta));
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackBtn />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>Pumping · Mom</div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.doc}</div></button>
      </div>

      <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center' }}>
        <CircularTimer color={T.honey} soft={T.honeySoft} elapsed={elapsed}
          sub="Double pump · medela" running={running} />
      </div>

      {/* L/R volumes */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(['left', 'right'] as const).map(side => {
            const vol = side === 'left' ? leftMl : rightMl;
            return (
              <div key={side} style={{ padding: 14, borderRadius: 18, background: T.card, border: `1px solid ${T.rule}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.inkMute }}>{side.charAt(0).toUpperCase() + side.slice(1)} breast</div>
                  {running && <div style={{ fontFamily: fonts.mono, fontSize: 10.5, padding: '2px 7px', borderRadius: 999, background: T.honeySoft, color: '#7C5A21', fontWeight: 600 }}>flowing</div>}
                </div>
                <div style={{ fontFamily: fonts.serif, fontSize: 30, fontWeight: 500, marginTop: 4, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {vol}<span style={{ fontSize: 14, color: T.inkMute, marginLeft: 4, fontStyle: 'italic' }}>ml</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.honeySoft, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (vol / 120) * 100)}%`, height: '100%', background: T.honey, transition: 'width 0.2s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.mono, fontSize: 9.5, color: T.inkMute, marginTop: 4 }}>
                  <span>0</span><span>120 ml</span>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {[-10, -5, +5, +10].map(d => (
                    <button key={d} onClick={() => adjust(side, d)} style={{
                      flex: 1, padding: '6px 0', borderRadius: 10, border: `1px solid ${T.rule}`,
                      background: T.parchment, color: T.ink, fontFamily: fonts.mono,
                      fontWeight: 600, fontSize: 11, cursor: 'pointer',
                    }}>{d > 0 ? `+${d}` : d}</button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 16, background: T.honeySoft, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7C5A21' }}>Session total</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 22, color: '#7C5A21', fontWeight: 600 }}>{leftMl + rightMl} ml</div>
        </div>

        {/* Storage */}
        <div style={{ marginTop: 10, padding: '12px 14px', borderRadius: 16, background: T.card, border: `1px solid ${T.rule}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 12, color: T.inkSoft, flex: 1 }}>Store as</div>
          {(['fridge', 'freezer', 'feed_now'] as Storage[]).map(s => (
            <div key={s} onClick={() => setStorage(s)} style={{ cursor: 'pointer' }}>
              <Chip color={s === storage ? T.sky : T.inkMute} soft={s === storage ? T.skySoft : 'rgba(0,0,0,0.04)'}>
                {s === 'fridge' ? '❄ Fridge' : s === 'freezer' ? 'Freezer' : 'Feed now'}
              </Chip>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10 }}>
        {!running ? (
          <button onClick={startSession} style={{
            flex: 1, padding: '14px 20px', borderRadius: 16, border: 'none',
            background: T.honey, color: '#3B2A0E',
            fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{ width: 14, height: 14 }}>{I.play}</div>
            Start pumping
          </button>
        ) : (
          <>
            <button onClick={() => setRunning(r => !r)} style={{
              flex: 1, padding: '14px 20px', borderRadius: 16, border: `1px solid ${T.rule}`,
              background: T.card, color: T.ink,
              fontFamily: fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>
              {running ? 'Pause' : 'Resume'}
            </button>
            <button onClick={endSession} disabled={saving} style={{
              flex: 1.4, padding: '14px 20px', borderRadius: 16, border: 'none',
              background: T.honey, color: '#3B2A0E',
              fontFamily: fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {saving ? 'Saving…' : 'End session'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
