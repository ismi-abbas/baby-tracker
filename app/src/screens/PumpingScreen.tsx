import React, { useState } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, CircularTimer, useTimer, iconBtnStyle, useNav, Chip, EntryModeToggle, DateTimeField, Card } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';

type Storage = 'fridge' | 'freezer' | 'feed_now';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function PumpingScreen() {
  const { back } = useNav();
  const { babyApi: api } = useBaby();
  const [entryMode, setEntryMode] = useState<'live' | 'manual'>('live');
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [leftMl, setLeftMl] = useState(0);
  const [rightMl, setRightMl] = useState(0);
  const [storage, setStorage] = useState<Storage>('fridge');
  const [manualStart, setManualStart] = useState(() => toLocalDT(new Date()));
  const [manualEnd, setManualEnd] = useState(() => toLocalDT(new Date()));
  const [saving, setSaving] = useState(false);
  const elapsed = useTimer(running, startTime ?? undefined);

  function startSession() { setStartTime(new Date()); setRunning(true); }

  async function endSession() {
    setSaving(true); setRunning(false);
    await (api.pumping.create({ leftMl, rightMl, totalMl: leftMl + rightMl, durationSeconds: elapsed, storageType: storage, startedAt: (startTime ?? new Date()).toISOString(), endedAt: new Date().toISOString(), loggedBy: 'You' }) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  async function saveManual() {
    setSaving(true);
    const start = new Date(manualStart); const end = new Date(manualEnd);
    const durSec = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
    await (api.pumping.create({ leftMl, rightMl, totalMl: leftMl + rightMl, durationSeconds: durSec, storageType: storage, startedAt: start.toISOString(), endedAt: end.toISOString(), loggedBy: 'You' }) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  function adjust(side: 'left' | 'right', d: number) {
    if (side === 'left') setLeftMl(v => Math.max(0, v + d));
    else setRightMl(v => Math.max(0, v + d));
  }

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackBtn />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>Pumping · Mom</div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.doc}</div></button>
      </div>

      <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center' }}>
        <EntryModeToggle mode={entryMode} onChange={m => { if (!running) setEntryMode(m); }} />
      </div>

      {entryMode === 'live' && (
        <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
          <CircularTimer color={T.honey} soft={T.honeySoft} elapsed={elapsed} sub="Double pump" running={running} />
        </div>
      )}

      {entryMode === 'manual' && (
        <div style={{ padding: '0 16px 12px' }}>
          <Card pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DateTimeField label="Session started" value={manualStart} onChange={setManualStart} />
            <DateTimeField label="Session ended" value={manualEnd} onChange={setManualEnd} />
          </Card>
        </div>
      )}

      <div style={{ padding: '0 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(['left', 'right'] as const).map(side => {
            const vol = side === 'left' ? leftMl : rightMl;
            return (
              <div key={side} style={{ padding: 14, borderRadius: 18, background: T.card, border: `1px solid ${T.rule}` }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.inkMute, marginBottom: 4 }}>
                  {side.charAt(0).toUpperCase() + side.slice(1)}
                </div>
                <div style={{ fontFamily: fonts.serif, fontSize: 28, fontWeight: 500, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {vol}<span style={{ fontSize: 13, color: T.inkMute, marginLeft: 3, fontStyle: 'italic' }}>ml</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: T.honeySoft, marginTop: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, (vol / 120) * 100)}%`, height: '100%', background: T.honey, transition: 'width 0.2s' }} />
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                  {[-10, -5, +5, +10].map(d => (
                    <button key={d} onClick={() => adjust(side, d)} style={{ flex: 1, padding: '5px 0', borderRadius: 9, border: `1px solid ${T.rule}`, background: T.parchment, color: T.ink, fontFamily: fonts.mono, fontWeight: 600, fontSize: 10.5, cursor: 'pointer' }}>
                      {d > 0 ? `+${d}` : d}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 12, padding: '12px 16px', borderRadius: 16, background: T.honeySoft, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#7C5A21' }}>Total</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 22, color: '#7C5A21', fontWeight: 600 }}>{leftMl + rightMl} ml</div>
        </div>

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
        {entryMode === 'live' && !running ? (
          <button onClick={startSession} style={{ flex: 1, padding: '14px', borderRadius: 16, border: 'none', background: T.honey, color: '#3B2A0E', fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 14, height: 14 }}>{I.play}</div>Start pumping
          </button>
        ) : entryMode === 'live' ? (
          <>
            <button onClick={() => setRunning(r => !r)} style={{ flex: 1, padding: '14px', borderRadius: 16, border: `1px solid ${T.rule}`, background: T.card, color: T.ink, fontFamily: fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {running ? 'Pause' : 'Resume'}
            </button>
            <button onClick={endSession} disabled={saving} style={{ flex: 1.4, padding: '14px', borderRadius: 16, border: 'none', background: T.honey, color: '#3B2A0E', fontFamily: fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Saving…' : 'End session'}
            </button>
          </>
        ) : (
          <button onClick={saveManual} disabled={saving || !manualStart} style={{ flex: 1, padding: '15px', borderRadius: 16, border: 'none', background: T.honey, color: '#3B2A0E', fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save session'}
          </button>
        )}
      </div>
    </div>
  );
}
