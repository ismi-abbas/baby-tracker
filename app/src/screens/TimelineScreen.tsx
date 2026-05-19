import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { T, fonts } from '../tokens';
import { Card, Chip, TabBar, iconBtnStyle, fmtTime } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { formatMilk, type MilkUnit, useUnitPrefs } from '../units';
import type { TimelineEvent } from '../types';

const CATEGORY_ROUTE: Record<string, string> = {
  feeding: '/log/feeding',
  sleep:   '/log/sleep',
  pumping: '/log/pumping',
  diaper:  '/log/diaper',
  bath:    '/log/bath',
};

const CAT_CONFIG = {
  feeding: { icon: I.feed, color: T.terracotta, soft: T.terracottaSoft, label: (e: TimelineEvent, milkUnit: MilkUnit) => {
    const f = e as unknown as { type: string; side?: string; amountMl?: number };
    if (f.type === 'breast') return `Breastfed · ${f.side ? f.side.charAt(0).toUpperCase() + f.side.slice(1) : 'Both'}`;
    if (f.type === 'bottle') return `Bottle · ${formatMilk(f.amountMl, milkUnit)}`;
    return `${f.type} feed`;
  }, sub: (e: TimelineEvent, milkUnit: MilkUnit) => {
    const f = e as unknown as { durationSeconds?: number; amountMl?: number };
    if (f.durationSeconds) return `${Math.floor(f.durationSeconds / 60)} min`;
    if (f.amountMl) return formatMilk(f.amountMl, milkUnit);
    return '';
  }},
  sleep: { icon: I.sleep, color: T.sage, soft: T.sageSoft, label: () => 'Sleep', sub: (e: TimelineEvent) => {
    const s = e as unknown as { endedAt?: string; durationSeconds?: number };
    if (!s.endedAt) return 'still going';
    if (s.durationSeconds) return `${Math.floor(s.durationSeconds / 60)} min`;
    return '';
  }},
  pumping: { icon: I.pump, color: T.honey, soft: T.honeySoft, label: () => 'Pumping', sub: (e: TimelineEvent, milkUnit: MilkUnit) => {
    const p = e as unknown as { totalMl?: number; storageType?: string };
    return `${formatMilk(p.totalMl, milkUnit)}${p.storageType ? ` · ${p.storageType}` : ''}`;
  }},
  diaper: { icon: I.diaper, color: T.earth, soft: T.earthSoft, label: (e: TimelineEvent) => {
    const d = e as unknown as { type: string };
    return d.type === 'wet' ? 'Wet diaper' : d.type === 'dirty' ? 'Dirty diaper' : 'Mixed diaper';
  }, sub: (e: TimelineEvent) => {
    const d = e as unknown as { consistency?: string };
    return d.consistency ?? '—';
  }},
  bath: { icon: I.bath, color: T.sky, soft: T.skySoft, label: () => 'Bath', sub: (e: TimelineEvent) => {
    const b = e as { durationMinutes?: number; waterTempC?: number };
    return `${b.durationMinutes ?? 0} min${b.waterTempC ? ` · ${b.waterTempC} °C` : ''}`;
  }},
} as const;

// Edit icon (pencil)
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export function TimelineScreen() {
  const { babyApi: api } = useBaby();
  const { prefs } = useUnitPrefs();
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filter, setFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const last5Days = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (4 - i)); return d;
  });

  function loadEvents() {
    setLoading(true);
    const from = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0).toISOString();
    const to   = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999).toISOString();
    (api.timeline.get(from, to) as Promise<TimelineEvent[]>)
      .then(setEvents).catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadEvents(); }, [selectedDate, api]);

  const filtered = filter === 'all' ? events : events.filter(e => e.category === filter);

  async function handleDelete(e: TimelineEvent) {
    setDeletingId(e.id);
    try {
      switch (e.category) {
        case 'feeding': await api.feedings.remove(e.id); break;
        case 'sleep':   await api.sleeps.remove(e.id); break;
        case 'pumping': await api.pumping.remove(e.id); break;
        case 'diaper':  await api.diapers.remove(e.id); break;
        case 'bath':    await api.baths.remove(e.id); break;
      }
      setEvents(prev => prev.filter(ev => ev.id !== e.id));
    } catch { /* ignore */ }
    setDeletingId(null);
    setExpandedId(null);
  }

  function handleEdit(e: TimelineEvent) {
    const to = CATEGORY_ROUTE[e.category];
    if (!to) return;
    navigate({ to: to as never, search: { id: e.id } as never });
  }

  const filterPills = [
    ['all', 'All', T.ink, T.parchment],
    ['feeding', 'Feeds', T.terracotta, T.terracottaSoft],
    ['diaper', 'Diapers', T.earth, T.earthSoft],
    ['sleep', 'Sleep', T.sage, T.sageSoft],
    ['pumping', 'Pump', T.honey, T.honeySoft],
  ] as const;

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '8px 22px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: T.inkMute, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>TIMELINE</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 30, color: T.ink, lineHeight: 1.05, letterSpacing: -0.5, marginTop: 2 }}>
            {selectedDate.toDateString() === new Date().toDateString() ? (
              <>Today<span style={{ fontStyle: 'italic', color: T.terracotta }}>.</span></>
            ) : selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <button style={iconBtnStyle}><div style={{ width: 18, height: 18, color: T.ink }}>{I.timeline}</div></button>
      </div>

      {/* Date scroller */}
      <div style={{ padding: '12px 16px 0', display: 'flex', gap: 6 }}>
        {last5Days.map((d, i) => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const active = d.toDateString() === selectedDate.toDateString();
          return (
            <div key={i} onClick={() => { setSelectedDate(d); setExpandedId(null); }} style={{
              flex: 1, padding: '8px 0', borderRadius: 13, textAlign: 'center', cursor: 'pointer',
              background: active ? T.terracotta : T.card, color: active ? T.card : T.ink,
              border: active ? 'none' : `1px solid ${T.rule}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, opacity: active ? 0.8 : 0.5, textTransform: 'uppercase', letterSpacing: 0.4 }}>{days[d.getDay()]}</div>
              <div style={{ fontFamily: fonts.serif, fontSize: 18, fontWeight: 600, marginTop: 1 }}>{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Filter pills */}
      <div style={{ padding: '12px 16px 4px', display: 'flex', gap: 6, overflowX: 'auto' }}>
        {filterPills.map(([id, label, color, soft]) => (
          <div key={id} onClick={() => setFilter(id)} style={{
            padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            background: soft, color, border: filter === id ? `1.5px solid ${color}` : 'none',
          }}>
            {label} {id !== 'all' ? `· ${events.filter(e => e.category === id).length}` : `· ${events.length}`}
          </div>
        ))}
      </div>

      {/* Timeline rail */}
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: T.inkMute, fontSize: 14 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '36px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🌙</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 20, color: T.ink }}>Nothing logged yet</div>
          <div style={{ fontSize: 13, color: T.inkMute, marginTop: 4 }}>Tap + to log an activity</div>
        </div>
      ) : (
        <div style={{ padding: '12px 16px 0', position: 'relative', flex: 1 }}>
          <div style={{ position: 'absolute', left: 36, top: 14, bottom: 0, width: 2, background: T.rule }} />
          {filtered.map((e) => {
            const cfg = CAT_CONFIG[e.category as keyof typeof CAT_CONFIG];
            if (!cfg) return null;
            const isLive = !(e as { endedAt?: string }).endedAt && (e.category === 'sleep' || e.category === 'feeding');
            const isExpanded = expandedId === e.id;
            const canEdit = !!CATEGORY_ROUTE[e.category];
            return (
              <div key={e.id} style={{ display: 'flex', gap: 12, marginBottom: 10, position: 'relative' }}>
                <div style={{ width: 40, textAlign: 'right', paddingTop: 12, flexShrink: 0 }}>
                  <div style={{ fontFamily: fonts.mono, fontSize: 11, fontWeight: 600, color: T.inkSoft }}>{fmtTime(e.eventTime)}</div>
                </div>
                <div style={{ position: 'relative', zIndex: 2, paddingTop: 10, flexShrink: 0 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 7, background: cfg.color, border: `3px solid ${T.cream}`, boxShadow: isLive ? `0 0 0 3px ${cfg.soft}` : 'none' }} />
                </div>
                <div style={{ flex: 1, paddingBottom: 4 }}>
                  <Card pad={12} style={{ overflow: 'hidden' }} onClick={canEdit ? () => setExpandedId(isExpanded ? null : e.id) : undefined}>
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: cfg.soft, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ width: 18, height: 18 }}>{cfg.icon}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cfg.label(e, prefs.milkUnit)}</div>
                        <div style={{ fontSize: 11, color: T.inkMute, marginTop: 1 }}>{cfg.sub(e, prefs.milkUnit)} · {(e as { loggedBy?: string }).loggedBy ?? 'You'}</div>
                      </div>
                      {isLive && <Chip color={T.terracotta} soft={T.terracottaSoft}>● live</Chip>}
                      {canEdit && (
                        <div style={{ width: 14, height: 14, color: T.inkMute, flexShrink: 0, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>{I.chev}</div>
                      )}
                    </div>

                    {/* Action row — shown when expanded */}
                    {isExpanded && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.rule}` }}>
                        <button onClick={(ev) => { ev.stopPropagation(); handleEdit(e); }} style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '8px 0', borderRadius: 10, border: `1.5px solid ${T.terracotta}`,
                          background: T.terracottaSoft, color: T.terracotta,
                          fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        }}>
                          <div style={{ width: 14, height: 14 }}><EditIcon /></div>
                          Edit
                        </button>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); handleDelete(e); }}
                          disabled={deletingId === e.id}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                            padding: '8px 0', borderRadius: 10, border: `1.5px solid #E53E3E`,
                            background: '#FEF2F2', color: '#E53E3E',
                            fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                          }}>
                          <div style={{ width: 14, height: 14 }}><DeleteIcon /></div>
                          {deletingId === e.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TabBar />
    </div>
  );
}
