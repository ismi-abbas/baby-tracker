import React, { useState, useEffect, useRef } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, CircularTimer, useTimer, iconBtnStyle, primaryBtnStyle, softBtnStyle, Card } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useNav } from '../components/ui';

type FeedMode = 'Breast' | 'Bottle' | 'Formula' | 'Solids';
type Side = 'left' | 'right';

export function FeedingScreen() {
  const { babyApi: api } = useBaby();
  const { back } = useNav();
  const [mode, setMode] = useState<FeedMode>('Breast');
  const [activeSide, setActiveSide] = useState<Side>('left');
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [leftSec, setLeftSec] = useState(0);
  const [rightSec, setRightSec] = useState(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      if (activeSide === 'left') setLeftSec(s => s + 1);
      else setRightSec(s => s + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, activeSide]);

  function startFeed() {
    if (!startTime) setStartTime(new Date());
    setRunning(true);
  }

  function switchSide() {
    setActiveSide(s => s === 'left' ? 'right' : 'left');
  }

  async function endFeed() {
    setSaving(true);
    setRunning(false);
    const totalSec = leftSec + rightSec;
    await (api.feedings.create({
      type: 'breast',
      side: activeSide,
      durationSeconds: totalSec,
      notes: notes || null,
      loggedBy: 'You',
      startedAt: (startTime ?? new Date()).toISOString(),
      endedAt: new Date().toISOString(),
    }) as Promise<unknown>).catch(() => {});
    setSaving(false);
    back();
  }

  const displaySec = activeSide === 'left' ? leftSec : rightSec;

  function fmtSide(sec: number) {
    return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackBtn />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>Feeding</div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.doc}</div></button>
      </div>

      {/* Mode tabs */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', padding: 4, borderRadius: 14, background: 'rgba(0,0,0,0.04)', gap: 2 }}>
          {(['Breast', 'Bottle', 'Formula', 'Solids'] as FeedMode[]).map((m) => (
            <div key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px 10px', borderRadius: 11, textAlign: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: m === mode ? T.card : 'transparent',
              color: m === mode ? T.terracotta : T.inkSoft,
              boxShadow: m === mode ? '0 1px 2px rgba(0,0,0,0.04)' : 'none',
            }}>{m}</div>
          ))}
        </div>
      </div>

      {/* Timer */}
      <div style={{ padding: '18px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularTimer color={T.terracotta} soft={T.terracottaSoft} elapsed={displaySec}
          sub={running ? `${activeSide === 'left' ? 'Left' : 'Right'} side` : 'Tap Start'}
          running={running} />
      </div>

      {/* L / R toggle */}
      {mode === 'Breast' && (
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {(['left', 'right'] as Side[]).map((side) => {
              const isActive = side === activeSide && running;
              return (
                <div key={side} onClick={() => running && setActiveSide(side)} style={{
                  padding: 14, borderRadius: 18, cursor: running ? 'pointer' : 'default',
                  background: isActive ? T.terracotta : T.card,
                  color: isActive ? T.card : T.ink,
                  boxShadow: isActive ? '0 6px 18px rgba(200,105,74,0.28)' : T.shadow,
                  border: isActive ? 'none' : `1px solid ${T.rule}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', opacity: isActive ? 0.85 : 0.5 }}>{side.charAt(0).toUpperCase() + side.slice(1)}</div>
                    <div style={{ width: 22, height: 22, borderRadius: 11, background: isActive ? 'rgba(255,252,245,0.22)' : T.terracottaSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? T.card : T.terracotta }}>
                      <div style={{ width: 12, height: 12 }}>{isActive ? I.pause : I.play}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: fonts.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.5, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                    {fmtSide(side === 'left' ? leftSec : rightSec)}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.65, marginTop: 1 }}>
                    {isActive ? 'currently feeding' : side === activeSide ? 'tap to switch' : 'tap to switch'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Any observations..."
            style={{
              width: '100%', minHeight: 60, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: fonts.sans, fontSize: 13, color: T.inkSoft, resize: 'none', lineHeight: 1.45,
            }} />
        </Card>
      </div>

      {/* Actions */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10, alignItems: 'center' }}>
        {!running ? (
          <button onClick={startFeed} style={{ ...primaryBtnStyle, flex: 1, fontSize: 15 }}>
            <div style={{ width: 14, height: 14 }}>{I.play}</div>
            Start feeding
          </button>
        ) : (
          <>
            {mode === 'Breast' && (
              <button onClick={switchSide} style={{ ...softBtnStyle, flex: 1 }}>Switch side</button>
            )}
            <button onClick={endFeed} disabled={saving} style={{ ...primaryBtnStyle, flex: 1 }}>
              <div style={{ width: 14, height: 14 }}>{I.stop}</div>
              {saving ? 'Saving…' : 'End feed'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
