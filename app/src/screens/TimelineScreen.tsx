import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { T } from '../tokens';
import { Card, Chip, TabBar, fmtTime, fmtDuration } from '../components/ui';
import { ScrollArea } from '../components/scroll-area';
import {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineTime,
  TimelineDot,
  TimelineContent,
} from '../components/timeline';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { formatMilk, type MilkUnit, useUnitPrefs } from '../units';
import type { TimelineEvent } from '../types';
import { cn } from '../lib/utils';

const CATEGORY_ROUTE: Record<string, string> = {
  feeding: '/log/feeding',
  sleep:   '/log/sleep',
  pumping: '/log/pumping',
  diaper:  '/log/diaper',
  bath:    '/log/bath',
};

const CAT_CONFIG = {
  feeding: { icon: I.feed, color: T.terracotta, soft: T.terracottaSoft, colorClass: 'text-terracotta', bgClass: 'bg-terracotta', softClass: 'bg-terracotta-soft', label: (e: TimelineEvent, milkUnit: MilkUnit) => {
    const f = e as unknown as { type: string; side?: string; amountMl?: number };
    if (f.type === 'breast') return `Breastfed · ${f.side ? f.side.charAt(0).toUpperCase() + f.side.slice(1) : 'Both'}`;
    if (f.type === 'bottle') return `Bottle · ${formatMilk(f.amountMl, milkUnit)}`;
    return `${f.type} feed`;
  }, sub: (e: TimelineEvent, milkUnit: MilkUnit) => {
    const f = e as unknown as { durationSeconds?: number; amountMl?: number };
    if (f.durationSeconds) return fmtDuration(f.durationSeconds);
    if (f.amountMl) return formatMilk(f.amountMl, milkUnit);
    return '';
  }},
  sleep: { icon: I.sleep, color: T.sage, soft: T.sageSoft, colorClass: 'text-sage', bgClass: 'bg-sage', softClass: 'bg-sage-soft', label: () => 'Sleep', sub: (e: TimelineEvent) => {
    const s = e as unknown as { endedAt?: string; durationSeconds?: number };
    if (!s.endedAt) return 'still going';
    if (s.durationSeconds) return fmtDuration(s.durationSeconds);
    return '';
  }},
  pumping: { icon: I.pump, color: T.honey, soft: T.honeySoft, colorClass: 'text-honey', bgClass: 'bg-honey', softClass: 'bg-honey-soft', label: () => 'Pumping', sub: (e: TimelineEvent, milkUnit: MilkUnit) => {
    const p = e as unknown as { totalMl?: number; storageType?: string };
    return `${formatMilk(p.totalMl, milkUnit)}${p.storageType ? ` · ${p.storageType}` : ''}`;
  }},
  diaper: { icon: I.diaper, color: T.earth, soft: T.earthSoft, colorClass: 'text-earth', bgClass: 'bg-earth', softClass: 'bg-earth-soft', label: (e: TimelineEvent) => {
    const d = e as unknown as { type: string };
    return d.type === 'wet' ? 'Wet diaper' : d.type === 'dirty' ? 'Dirty diaper' : 'Mixed diaper';
  }, sub: (e: TimelineEvent) => {
    const d = e as unknown as { consistency?: string };
    return d.consistency ?? '—';
  }},
  bath: { icon: I.bath, color: T.sky, soft: T.skySoft, colorClass: 'text-sky', bgClass: 'bg-sky', softClass: 'bg-sky-soft', label: () => 'Bath', sub: (e: TimelineEvent) => {
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
    <div className="box-border flex h-full w-full flex-col overflow-hidden bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="flex items-start justify-between px-[22px] pt-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.5px] text-ink-mute">TIMELINE</div>
          <div className="mt-0.5 font-serif text-[30px] leading-[1.05] tracking-[-0.5px] text-ink">
            {selectedDate.toDateString() === new Date().toDateString() ? (
              <>Today<span className="italic text-terracotta">.</span></>
            ) : selectedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <button className="flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-black/4"><div className="h-[18px] w-[18px] text-ink">{I.timeline}</div></button>
      </div>

      {/* Date scroller */}
      <div className="flex gap-1.5 px-4 pt-3">
        {last5Days.map((d, i) => {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const active = d.toDateString() === selectedDate.toDateString();
          return (
            <div key={i} onClick={() => { setSelectedDate(d); setExpandedId(null); }} className={cn('flex-1 cursor-pointer rounded-[13px] py-2 text-center', active ? 'bg-terracotta text-card' : 'border border-rule bg-card text-ink')}>
              <div className={cn('text-[10px] font-semibold uppercase tracking-[0.4px]', active ? 'opacity-80' : 'opacity-50')}>{days[d.getDay()]}</div>
              <div className="mt-px font-serif text-lg font-semibold">{d.getDate()}</div>
            </div>
          );
        })}
      </div>

      {/* Filter pills */}
      <div className="flex gap-1.5 overflow-x-auto px-4 pt-3 pb-1">
        {filterPills.map(([id, label, color, soft]) => (
          <div key={id} onClick={() => setFilter(id)} className={cn('shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold', soft === T.terracottaSoft ? 'bg-terracotta-soft text-terracotta' : soft === T.earthSoft ? 'bg-earth-soft text-earth' : soft === T.sageSoft ? 'bg-sage-soft text-sage' : soft === T.honeySoft ? 'bg-honey-soft text-honey' : 'bg-parchment text-ink', filter === id && (color === T.terracotta ? 'border-[1.5px] border-terracotta' : color === T.earth ? 'border-[1.5px] border-earth' : color === T.sage ? 'border-[1.5px] border-sage' : color === T.honey ? 'border-[1.5px] border-honey' : 'border-[1.5px] border-ink'))}>
            {label} {id !== 'all' ? `· ${events.filter(e => e.category === id).length}` : `· ${events.length}`}
          </div>
        ))}
      </div>

      {/* Timeline rail */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-6 text-center text-sm text-ink-mute">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="px-[22px] py-9 text-center">
            <div className="mb-2.5 text-[32px]">🌙</div>
            <div className="font-serif text-xl text-ink">Nothing logged yet</div>
            <div className="mt-1 text-[13px] text-ink-mute">Tap + to log an activity</div>
          </div>
        ) : (
          <Timeline className="px-4 pt-3 pb-4">
            {filtered.map((e) => {
              const cfg = CAT_CONFIG[e.category as keyof typeof CAT_CONFIG];
              if (!cfg) return null;
              const isLive = !(e as { endedAt?: string }).endedAt && (e.category === 'sleep' || e.category === 'feeding');
              const isExpanded = expandedId === e.id;
              const canEdit = !!CATEGORY_ROUTE[e.category];
              return (
                <TimelineItem key={e.id}>
                  <TimelineConnector />
                  <TimelineTime>{fmtTime(e.eventTime)}</TimelineTime>
                  <TimelineDot>
                    <div className={cn('h-3.5 w-3.5 rounded-full border-[3px] border-cream', cfg.bgClass, isLive && (cfg.softClass === 'bg-terracotta-soft' ? 'shadow-[0_0_0_3px_#f1d8c7]' : cfg.softClass === 'bg-sage-soft' ? 'shadow-[0_0_0_3px_#dde5d5]' : ''))} />
                  </TimelineDot>
                  <TimelineContent>
                    <Card pad={12} onClick={canEdit ? () => setExpandedId(isExpanded ? null : e.id) : undefined}>
                      <div className="flex items-center gap-2.5">
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]', cfg.softClass, cfg.colorClass)}>
                          <div className="h-[18px] w-[18px]">{cfg.icon}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate whitespace-nowrap text-[13px] font-bold text-ink">{cfg.label(e, prefs.milkUnit)}</div>
                          <div className="mt-px text-[11px] text-ink-mute">{cfg.sub(e, prefs.milkUnit)} · {(e as { loggedBy?: string }).loggedBy ?? 'You'}</div>
                        </div>
                        {isLive && <Chip color={T.terracotta} soft={T.terracottaSoft}>● live</Chip>}
                        {canEdit && (
                          <div className={cn('h-3.5 w-3.5 shrink-0 text-ink-mute transition-transform duration-150', isExpanded && 'rotate-180')}>{I.chev}</div>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-2.5 flex gap-2 border-t border-rule pt-2.5">
                          <button onClick={(ev) => { ev.stopPropagation(); handleEdit(e); }} className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-terracotta bg-terracotta-soft py-2 font-sans text-[12.5px] font-bold text-terracotta">
                            <div className="h-3.5 w-3.5"><EditIcon /></div>
                            Edit
                          </button>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); handleDelete(e); }}
                            disabled={deletingId === e.id}
                            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[10px] border-[1.5px] border-[#E53E3E] bg-[#FEF2F2] py-2 font-sans text-[12.5px] font-bold text-[#E53E3E]">
                            <div className="h-3.5 w-3.5"><DeleteIcon /></div>
                            {deletingId === e.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      )}
                    </Card>
                  </TimelineContent>
                </TimelineItem>
              );
            })}
          </Timeline>
        )}
      </ScrollArea>

      <TabBar />
    </div>
  );
}
