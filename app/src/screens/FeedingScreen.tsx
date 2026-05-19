import React, { useState, useEffect, useRef } from 'react';
import { T, fonts } from '../tokens';
import {
  BackBtn, CircularTimer, iconBtnStyle, primaryBtnStyle, softBtnStyle,
  Card, EntryModeToggle, DateTimeField, useNav,
} from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import type { Feeding } from '../types';

type FeedMode = 'Breast' | 'Bottle' | 'Formula' | 'Solids';
type Side = 'left' | 'right' | 'both';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function FeedingScreen() {
  const { babyApi: api } = useBaby();
  const { back } = useNav();
  const { editId, record: editRecord } = useEditRecord<Feeding>(id => api.feedings.get(id) as Promise<Feeding>);
  const [feedMode, setFeedMode] = useState<FeedMode>('Breast');
  const [entryMode, setEntryMode] = useState<'live' | 'manual'>('live');

  // Live state
  const [activeSide, setActiveSide] = useState<'left' | 'right'>('left');
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [leftSec, setLeftSec] = useState(0);
  const [rightSec, setRightSec] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Manual state
  const [manualStart, setManualStart] = useState(() => toLocalDT(new Date()));
  const [manualEnd, setManualEnd] = useState(() => toLocalDT(new Date()));
  const [manualSide, setManualSide] = useState<Side>('left');
  const [manualAmountMl, setManualAmountMl] = useState(90);

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(() => {
      if (activeSide === 'left') setLeftSec(s => s + 1);
      else setRightSec(s => s + 1);
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, activeSide]);

  useEffect(() => {
    if (entryMode === 'manual') {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      const now = new Date();
      setManualStart(toLocalDT(now));
      setManualEnd(toLocalDT(now));
    }
  }, [entryMode]);

  // Pre-fill when editing an existing record
  useEffect(() => {
    if (!editRecord) return;
    const typeCap = (editRecord.type.charAt(0).toUpperCase() + editRecord.type.slice(1)) as FeedMode;
    setFeedMode(['Breast','Bottle','Formula','Solids'].includes(typeCap) ? typeCap : 'Breast');
    setEntryMode('manual');
    setManualStart(toLocalDT(new Date(editRecord.startedAt)));
    setManualEnd(editRecord.endedAt ? toLocalDT(new Date(editRecord.endedAt)) : toLocalDT(new Date(editRecord.startedAt)));
    if (editRecord.side) setManualSide(editRecord.side as Side);
    if (editRecord.amountMl) setManualAmountMl(editRecord.amountMl);
    if (editRecord.notes) setNotes(editRecord.notes);
  }, [editRecord]);

  async function save() {
    setSaving(true);
    let payload: Record<string, unknown>;
    if (entryMode === 'live') {
      payload = {
        type: feedMode.toLowerCase(),
        side: feedMode === 'Breast' ? activeSide : null,
        durationSeconds: leftSec + rightSec,
        amountMl: feedMode === 'Bottle' || feedMode === 'Formula' ? manualAmountMl : null,
        startedAt: (startTime ?? new Date()).toISOString(),
        endedAt: new Date().toISOString(),
      };
    } else {
      const start = new Date(manualStart);
      const end = new Date(manualEnd);
      payload = {
        type: feedMode.toLowerCase(),
        side: feedMode === 'Breast' ? manualSide : null,
        durationSeconds: feedMode !== 'Bottle' && feedMode !== 'Formula'
          ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000))
          : null,
        amountMl: feedMode === 'Bottle' || feedMode === 'Formula' ? manualAmountMl : null,
        startedAt: start.toISOString(),
        endedAt: feedMode !== 'Bottle' && feedMode !== 'Formula' ? end.toISOString() : null,
      };
    }
    const full = { ...payload, notes: notes || null, loggedBy: 'You' };
    if (editId) {
      await (api.feedings.update(editId, full) as Promise<unknown>).catch(() => {});
    } else {
      await (api.feedings.create(full) as Promise<unknown>).catch(() => {});
    }
    setSaving(false);
    back();
  }

  const displaySec = activeSide === 'left' ? leftSec : rightSec;
  const fmtSide = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
  const needsAmount = feedMode === 'Bottle' || feedMode === 'Formula';

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BackBtn />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.4, textTransform: 'uppercase' }}>{editId ? 'Edit Feeding' : 'Feeding'}</div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.doc}</div></button>
      </div>

      {/* Type tabs */}
      <div style={{ padding: '12px 16px 0' }}>
        <div style={{ display: 'flex', padding: 4, borderRadius: 14, background: 'rgba(0,0,0,0.04)', gap: 2 }}>
          {(['Breast', 'Bottle', 'Formula', 'Solids'] as FeedMode[]).map(m => (
            <div key={m} onClick={() => setFeedMode(m)} style={{
              flex: 1, padding: '8px 10px', borderRadius: 11, textAlign: 'center', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: m === feedMode ? T.card : 'transparent',
              color: m === feedMode ? T.terracotta : T.inkSoft,
            }}>{m}</div>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center' }}>
        <EntryModeToggle mode={entryMode} onChange={m => { if (!running) setEntryMode(m); }} />
      </div>

      {entryMode === 'live' ? (
        <>
          <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularTimer color={T.terracotta} soft={T.terracottaSoft} elapsed={displaySec}
              sub={running ? `${activeSide === 'left' ? 'Left' : 'Right'} side` : 'Tap Start'} running={running} />
          </div>
          {feedMode === 'Breast' && (
            <div style={{ padding: '0 16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['left', 'right'] as const).map(side => {
                  const isActive = side === activeSide && running;
                  return (
                    <div key={side} onClick={() => running && setActiveSide(side)} style={{
                      padding: 14, borderRadius: 18, cursor: running ? 'pointer' : 'default',
                      background: isActive ? T.terracotta : T.card, color: isActive ? T.card : T.ink,
                      boxShadow: isActive ? '0 6px 18px rgba(200,105,74,0.28)' : T.shadow,
                      border: isActive ? 'none' : `1px solid ${T.rule}`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', opacity: isActive ? 0.85 : 0.5 }}>
                          {side.charAt(0).toUpperCase() + side.slice(1)}
                        </div>
                        <div style={{ width: 22, height: 22, borderRadius: 11, background: isActive ? 'rgba(255,252,245,0.22)' : T.terracottaSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? T.card : T.terracotta }}>
                          <div style={{ width: 12, height: 12 }}>{isActive ? I.pause : I.play}</div>
                        </div>
                      </div>
                      <div style={{ fontFamily: fonts.serif, fontSize: 30, fontWeight: 500, letterSpacing: -0.5, marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtSide(side === 'left' ? leftSec : rightSec)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {needsAmount && (
            <div style={{ padding: '12px 16px 0' }}>
              <Card pad={14}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Amount (ml)</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ fontFamily: fonts.serif, fontSize: 36, color: T.ink, fontWeight: 500, minWidth: 80, textAlign: 'center' }}>{manualAmountMl}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[-10, -5, +5, +10].map(d => (
                      <button key={d} onClick={() => setManualAmountMl(v => Math.max(0, v + d))} style={{
                        padding: '8px 10px', borderRadius: 10, border: `1px solid ${T.rule}`,
                        background: T.card, color: T.ink, fontFamily: fonts.mono, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}>{d > 0 ? `+${d}` : d}</button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </>
      ) : (
        /* Manual mode */
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Card pad={16} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DateTimeField label="Started at" value={manualStart} onChange={setManualStart} />
            {!needsAmount && <DateTimeField label="Ended at" value={manualEnd} onChange={setManualEnd} />}
          </Card>

          {feedMode === 'Breast' && (
            <Card pad={14}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10 }}>Side</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['left', 'right', 'both'] as Side[]).map(s => (
                  <button key={s} onClick={() => setManualSide(s)} style={{
                    flex: 1, padding: '10px 0', borderRadius: 12, cursor: 'pointer',
                    border: `1.5px solid ${manualSide === s ? T.terracotta : T.rule}`,
                    background: manualSide === s ? T.terracottaSoft : T.card,
                    color: manualSide === s ? T.terracotta : T.inkSoft,
                    fontFamily: fonts.sans, fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
                  }}>{s}</button>
                ))}
              </div>
            </Card>
          )}

          {needsAmount && (
            <Card pad={14}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Amount (ml)</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ fontFamily: fonts.serif, fontSize: 36, color: T.ink, fontWeight: 500, minWidth: 80, textAlign: 'center' }}>{manualAmountMl}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[-10, -5, +5, +10].map(d => (
                    <button key={d} onClick={() => setManualAmountMl(v => Math.max(0, v + d))} style={{
                      padding: '8px 10px', borderRadius: 10, border: `1px solid ${T.rule}`,
                      background: T.card, color: T.ink, fontFamily: fonts.mono, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}>{d > 0 ? `+${d}` : d}</button>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Notes */}
      <div style={{ padding: '12px 16px 0' }}>
        <Card pad={14}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 6 }}>Notes</div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations…"
            style={{ width: '100%', minHeight: 52, background: 'transparent', border: 'none', outline: 'none', fontFamily: fonts.sans, fontSize: 13, color: T.inkSoft, resize: 'none', lineHeight: 1.45 }} />
        </Card>
      </div>

      {/* Actions */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10 }}>
        {entryMode === 'live' && !running ? (
          <button onClick={() => { setStartTime(new Date()); setRunning(true); }} style={{ ...primaryBtnStyle, flex: 1, fontSize: 15 }}>
            <div style={{ width: 14, height: 14 }}>{I.play}</div>Start feeding
          </button>
        ) : entryMode === 'live' ? (
          <>
            {feedMode === 'Breast' && (
              <button onClick={() => setActiveSide(s => s === 'left' ? 'right' : 'left')} style={{ ...softBtnStyle, flex: 1 }}>Switch side</button>
            )}
            <button onClick={save} disabled={saving} style={{ ...primaryBtnStyle, flex: 1 }}>
              <div style={{ width: 14, height: 14 }}>{I.stop}</div>{saving ? 'Saving…' : 'End feed'}
            </button>
          </>
        ) : (
          <button onClick={save} disabled={saving || !manualStart} style={{ ...primaryBtnStyle, flex: 1, fontSize: 15 }}>
            {saving ? 'Saving…' : editId ? 'Update feed' : 'Save feed'}
          </button>
        )}
      </div>
    </div>
  );
}
