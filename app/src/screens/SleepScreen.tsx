import React, { useState, useEffect } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, useTimer, iconBtnStyle, useNav } from '../components/ui';
import { I } from '../components/Icons';
import { api } from '../api/client';

export function SleepScreen() {
  const { back } = useNav();
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const elapsed = useTimer(running, startTime ?? undefined);

  async function startSleep() {
    const t = new Date();
    setStartTime(t);
    setRunning(true);
    const res = await (api.sleeps.create({
      location: 'crib',
      startedAt: t.toISOString(),
      loggedBy: 'You',
    }) as Promise<{ id: string }>).catch(() => null);
    if (res) setSessionId(res.id);
  }

  async function wakeUp() {
    setSaving(true);
    setRunning(false);
    const endedAt = new Date().toISOString();
    if (sessionId) {
      await (api.sleeps.update(sessionId, {
        endedAt,
        durationSeconds: elapsed,
        notes: notes || null,
      }) as Promise<unknown>).catch(() => {});
    }
    setSaving(false);
    back();
  }

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);

  const bars = Array.from({ length: 32 }).map((_, i) => {
    const height = Math.max(4, 6 + Math.sin(i * 0.7) * 14 + Math.cos(i * 1.3) * 8 + 14);
    return { height, active: running && i < Math.min(32, elapsed / 60 * 2) };
  });

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#2A3327', fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box', color: '#EDE7D6', position: 'relative' }}>
      {/* Stars */}
      {[[40,90],[300,80],[60,250],[280,290],[120,540],[330,520]].map(([x,y], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y, width: 3, height: 3, borderRadius: 2, background: 'rgba(237,231,214,0.5)' }} />
      ))}
      <div style={{ position: 'absolute', top: 110, left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, borderRadius: 140, background: 'radial-gradient(circle, rgba(126,149,117,0.18), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <BackBtn dark />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#EDE7D6', letterSpacing: 0.4, textTransform: 'uppercase' }}>Sleeping</div>
        <button style={{ ...iconBtnStyle, background: 'rgba(255,252,245,0.08)' }}><div style={{ width: 18, height: 18, color: T.honey }}>{I.moon}</div></button>
      </div>

      <div style={{ padding: '60px 16px 0', textAlign: 'center', position: 'relative' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(237,231,214,0.55)', letterSpacing: 0.6, textTransform: 'uppercase' }}>
          {running ? 'Asleep for' : 'Start sleep timer'}
        </div>
        <div style={{ fontFamily: fonts.serif, fontSize: 96, lineHeight: 1, marginTop: 8, color: '#EDE7D6', fontWeight: 400, letterSpacing: -3, fontVariantNumeric: 'tabular-nums' }}>
          {h}<span style={{ color: T.sage, fontStyle: 'italic' }}>:</span>{String(m).padStart(2, '0')}
        </div>
        {startTime && (
          <div style={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 18, color: T.sage, marginTop: 6 }}>
            hours · since {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        )}
        {running && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16,
            padding: '5px 12px', borderRadius: 999, background: 'rgba(126,149,117,0.18)',
            fontSize: 11.5, color: T.sage, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: T.sage }} />
            Sleeping · crib
          </div>
        )}
      </div>

      {/* Waveform */}
      <div style={{ padding: '36px 24px 0', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
          {bars.map((b, i) => (
            <div key={i} style={{ flex: 1, height: b.height, borderRadius: 2, background: b.active ? 'rgba(126,149,117,0.55)' : 'rgba(237,231,214,0.18)' }} />
          ))}
        </div>
        {startTime && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.mono, fontSize: 10, color: 'rgba(237,231,214,0.45)', marginTop: 6 }}>
            <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            <span>now</span>
          </div>
        )}
      </div>

      {/* Notes */}
      {running && (
        <div style={{ padding: '20px 24px 0', position: 'relative' }}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="Notes (optional)..."
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 14, minHeight: 56,
              background: 'rgba(255,252,245,0.08)', border: 'none', outline: 'none',
              color: '#EDE7D6', fontFamily: fonts.sans, fontSize: 13, resize: 'none',
              boxSizing: 'border-box',
            }} />
        </div>
      )}

      <div style={{ padding: '36px 16px 0', display: 'flex', gap: 10, position: 'relative' }}>
        {!running ? (
          <button onClick={startSleep} style={{
            flex: 1, padding: '16px 20px', borderRadius: 16, border: 'none',
            background: T.sage, color: '#1F2A1D',
            fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <div style={{ width: 14, height: 14 }}>{I.sleep}</div>
            Start sleep
          </button>
        ) : (
          <>
            <button style={{ ...{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 16, border: 'none', fontFamily: fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.2 }, flex: 1, background: 'rgba(255,252,245,0.10)', color: '#EDE7D6' }}>Add note</button>
            <button onClick={wakeUp} disabled={saving} style={{
              flex: 1, padding: '14px 20px', borderRadius: 16, border: 'none',
              background: T.sage, color: '#1F2A1D',
              fontFamily: fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <div style={{ width: 14, height: 14 }}>{I.stop}</div>
              {saving ? 'Saving…' : 'Wake up'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
