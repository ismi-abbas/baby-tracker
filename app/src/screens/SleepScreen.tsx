import React, { useState, useEffect } from 'react';
import { T, fonts } from '../tokens';
import { BackBtn, useTimer, iconBtnStyle, useNav, EntryModeToggle, DateTimeField } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { useEditRecord } from '../hooks/useEditRecord';
import type { Sleep } from '../types';

function toLocalDT(d: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function SleepScreen() {
  const { back } = useNav();
  const { babyApi: api } = useBaby();
  const { editId, record: editRecord } = useEditRecord<Sleep>(id => api.sleeps.get(id) as Promise<Sleep>);
  const [entryMode, setEntryMode] = useState<'live' | 'manual'>('live');
  const [running, setRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const elapsed = useTimer(running, startTime ?? undefined);
  const [manualStart, setManualStart] = useState(() => { const d = new Date(); d.setHours(d.getHours() - 1); return toLocalDT(d); });
  const [manualEnd, setManualEnd] = useState(() => toLocalDT(new Date()));
  const [location, setLocation] = useState('crib');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (entryMode === 'manual' && running) setRunning(false); }, [entryMode]);

  useEffect(() => {
    if (!editRecord) return;
    setEntryMode('manual');
    setManualStart(toLocalDT(new Date(editRecord.startedAt)));
    setManualEnd(editRecord.endedAt ? toLocalDT(new Date(editRecord.endedAt)) : toLocalDT(new Date(editRecord.startedAt)));
    if (editRecord.location) setLocation(editRecord.location);
    if (editRecord.notes) setNotes(editRecord.notes);
  }, [editRecord]);

  async function startSleep() {
    const t = new Date(); setStartTime(t); setRunning(true);
    const res = await (api.sleeps.create({ location, startedAt: t.toISOString(), loggedBy: 'You' }) as Promise<{ id: string }>).catch(() => null);
    if (res) setSessionId(res.id);
  }

  async function wakeUp() {
    setSaving(true); setRunning(false);
    if (sessionId) await (api.sleeps.update(sessionId, { endedAt: new Date().toISOString(), durationSeconds: elapsed, notes: notes || null }) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  async function saveManual() {
    setSaving(true);
    const start = new Date(manualStart); const end = new Date(manualEnd);
    const durSec = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
    const payload = { location, notes: notes || null, loggedBy: 'You', startedAt: start.toISOString(), endedAt: end.toISOString(), durationSeconds: durSec };
    if (editId) await (api.sleeps.update(editId, payload) as Promise<unknown>).catch(() => {});
    else await (api.sleeps.create(payload) as Promise<unknown>).catch(() => {});
    setSaving(false); back();
  }

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const bars = Array.from({ length: 32 }).map((_, i) => ({
    height: Math.max(4, 6 + Math.sin(i * 0.7) * 14 + Math.cos(i * 1.3) * 8 + 14),
    active: running && i < Math.min(32, elapsed / 60 * 2),
  }));
  const manualDurMin = manualStart && manualEnd
    ? Math.max(0, Math.round((new Date(manualEnd).getTime() - new Date(manualStart).getTime()) / 60000))
    : 0;
  const locations = ['crib', 'bassinet', 'pram', 'arms', 'car'];

  return (
    <div style={{ width: '100%', minHeight: '100%', background: '#2A3327', fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box', color: '#EDE7D6', position: 'relative' }}>
      {[[40,90],[300,80],[60,250],[280,290],[120,540],[330,520]].map(([x,y], i) => (
        <div key={i} style={{ position: 'absolute', left: x, top: y, width: 3, height: 3, borderRadius: 2, background: 'rgba(237,231,214,0.5)' }} />
      ))}
      <div style={{ position: 'absolute', top: 110, left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, borderRadius: 140, background: 'radial-gradient(circle, rgba(126,149,117,0.18), transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ padding: '6px 20px 0', display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <BackBtn dark />
        <div style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#EDE7D6', letterSpacing: 0.4, textTransform: 'uppercase' }}>{editId ? 'Edit Sleep' : 'Sleep'}</div>
        <button style={{ ...iconBtnStyle, background: 'rgba(255,252,245,0.08)' }}><div style={{ width: 18, height: 18, color: T.honey }}>{I.moon}</div></button>
      </div>

      <div style={{ padding: '10px 0', display: 'flex', justifyContent: 'center', position: 'relative' }}>
        <div style={{ padding: 3, borderRadius: 10, background: 'rgba(255,252,245,0.1)', display: 'inline-flex' }}>
          {(['live', 'manual'] as const).map(mode => (
            <button key={mode} onClick={() => { if (!running) setEntryMode(mode); }} style={{
              padding: '7px 18px', borderRadius: 8, border: 'none', cursor: running ? 'not-allowed' : 'pointer',
              background: entryMode === mode ? 'rgba(255,252,245,0.18)' : 'transparent',
              color: entryMode === mode ? T.sage : 'rgba(237,231,214,0.5)',
              fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700, transition: 'all 0.12s',
            }}>
              {mode === 'live' ? '⏱ Live' : '✎ Manual'}
            </button>
          ))}
        </div>
      </div>

      {entryMode === 'live' ? (
        <>
          <div style={{ padding: '30px 16px 0', textAlign: 'center', position: 'relative' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(237,231,214,0.55)', letterSpacing: 0.6, textTransform: 'uppercase' }}>{running ? 'Asleep for' : 'Start sleep timer'}</div>
            <div style={{ fontFamily: fonts.serif, fontSize: 96, lineHeight: 1, marginTop: 8, color: '#EDE7D6', fontWeight: 400, letterSpacing: -3, fontVariantNumeric: 'tabular-nums' }}>
              {h}<span style={{ color: T.sage, fontStyle: 'italic' }}>:</span>{String(m).padStart(2, '0')}
            </div>
            {startTime && (<div style={{ fontFamily: fonts.serif, fontStyle: 'italic', fontSize: 18, color: T.sage, marginTop: 6 }}>hours · since {startTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>)}
            {running && (<div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '5px 12px', borderRadius: 999, background: 'rgba(126,149,117,0.18)', fontSize: 11.5, color: T.sage, fontWeight: 600 }}><span style={{ width: 6, height: 6, borderRadius: 3, background: T.sage }} />{location}</div>)}
          </div>
          <div style={{ padding: '24px 24px 0', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 50 }}>
              {bars.map((b, i) => (<div key={i} style={{ flex: 1, height: b.height, borderRadius: 2, background: b.active ? 'rgba(126,149,117,0.55)' : 'rgba(237,231,214,0.18)' }} />))}
            </div>
            {startTime && (<div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: fonts.mono, fontSize: 10, color: 'rgba(237,231,214,0.45)', marginTop: 6 }}><span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><span>now</span></div>)}
          </div>
        </>
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
          <div style={{ padding: '14px 16px', borderRadius: 18, background: 'rgba(255,252,245,0.08)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <DateTimeField label="Fell asleep at" value={manualStart} onChange={setManualStart} />
            <DateTimeField label="Woke up at" value={manualEnd} onChange={setManualEnd} />
          </div>
          {manualDurMin > 0 && (<div style={{ textAlign: 'center', fontFamily: fonts.serif, fontSize: 18, color: T.sage, fontStyle: 'italic' }}>{manualDurMin >= 60 ? `${Math.floor(manualDurMin / 60)}h ${manualDurMin % 60}m` : `${manualDurMin} min`}</div>)}
        </div>
      )}

      <div style={{ padding: '16px 16px 0', position: 'relative' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(237,231,214,0.55)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>Location</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {locations.map(loc => (<button key={loc} onClick={() => setLocation(loc)} style={{ padding: '7px 14px', borderRadius: 999, cursor: 'pointer', border: 'none', background: location === loc ? T.sage : 'rgba(255,252,245,0.08)', color: location === loc ? '#1F2A1D' : 'rgba(237,231,214,0.7)', fontFamily: fonts.sans, fontSize: 12, fontWeight: 600, textTransform: 'capitalize', transition: 'all 0.12s' }}>{loc}</button>))}
        </div>
      </div>

      {(running || entryMode === 'manual') && (
        <div style={{ padding: '12px 16px 0', position: 'relative' }}>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)…"
            style={{ width: '100%', padding: '12px 14px', borderRadius: 14, minHeight: 52, background: 'rgba(255,252,245,0.08)', border: 'none', outline: 'none', color: '#EDE7D6', fontFamily: fonts.sans, fontSize: 13, resize: 'none', boxSizing: 'border-box' }} />
        </div>
      )}

      <div style={{ padding: '20px 16px 0', display: 'flex', gap: 10, position: 'relative' }}>
        {entryMode === 'live' && !running ? (
          <button onClick={startSleep} style={{ flex: 1, padding: '16px', borderRadius: 16, border: 'none', background: T.sage, color: '#1F2A1D', fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 14, height: 14 }}>{I.sleep}</div>Start sleep
          </button>
        ) : entryMode === 'live' ? (
          <button onClick={wakeUp} disabled={saving} style={{ flex: 1, padding: '14px', borderRadius: 16, border: 'none', background: T.sage, color: '#1F2A1D', fontFamily: fonts.sans, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <div style={{ width: 14, height: 14 }}>{I.stop}</div>{saving ? 'Saving…' : 'Wake up'}
          </button>
        ) : (
          <button onClick={saveManual} disabled={saving || !manualStart || !manualEnd} style={{ flex: 1, padding: '15px', borderRadius: 16, border: 'none', background: T.sage, color: '#1F2A1D', fontFamily: fonts.sans, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            {saving ? 'Saving…' : editId ? 'Update sleep' : 'Save sleep'}
          </button>
        )}
      </div>
    </div>
  );
}
