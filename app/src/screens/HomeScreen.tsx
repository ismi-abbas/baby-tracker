import React, { useEffect, useState } from 'react';
import { T } from '../tokens';
import { Card, Chip, TabBar, fmtDuration, fmtTimeAgo } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { formatMilk, useUnitPrefs } from '../units';
import type { TodayStats, Feeding, DiaperChange, Sleep } from '../types';

function useRecentActivities(babyApi: ReturnType<typeof import('../api/client').createBabyApi>, milkUnit: 'ml' | 'oz') {
  const [feeds, setFeeds] = useState<Feeding[]>([]);
  const [diapers, setDiapers] = useState<DiaperChange[]>([]);
  const [sleeps, setSleeps] = useState<Sleep[]>([]);

  useEffect(() => {
    (babyApi.feedings.list(3) as Promise<Feeding[]>).then(setFeeds).catch(() => {});
    (babyApi.diapers.list(3) as Promise<DiaperChange[]>).then(setDiapers).catch(() => {});
    (babyApi.sleeps.list(3) as Promise<Sleep[]>).then(setSleeps).catch(() => {});
  }, [babyApi]);

  type Activity = { icon: React.ReactNode; color: string; soft: string; colorClass: string; softClass: string; title: string; sub: string; by: string; time: string };
  const activities: Activity[] = [
    ...feeds.slice(0, 2).map(f => ({
      icon: I.feed, color: T.terracotta, soft: T.terracottaSoft, colorClass: 'text-terracotta', softClass: 'bg-terracotta-soft',
      title: f.type === 'breast' ? `Breastfed · ${f.side ? f.side.charAt(0).toUpperCase() + f.side.slice(1) : 'Both'} side` : `Bottle feed`,
      sub: f.durationSeconds ? fmtDuration(f.durationSeconds) : f.amountMl ? formatMilk(f.amountMl, milkUnit) : '',
      by: f.loggedBy ?? 'You', time: f.startedAt,
    })),
    ...diapers.slice(0, 1).map(d => ({
      icon: I.diaper, color: T.earth, soft: T.earthSoft, colorClass: 'text-earth', softClass: 'bg-earth-soft',
      title: d.type === 'dirty' ? 'Dirty diaper' : d.type === 'wet' ? 'Wet diaper' : 'Mixed diaper',
      sub: d.consistency ?? '', by: d.loggedBy ?? 'You', time: d.changedAt,
    })),
    ...sleeps.slice(0, 1).map(s => ({
      icon: I.sleep, color: T.sage, soft: T.sageSoft, colorClass: 'text-sage', softClass: 'bg-sage-soft',
      title: s.endedAt ? 'Nap ended' : 'Sleeping',
      sub: s.durationSeconds ? fmtDuration(s.durationSeconds) : 'ongoing',
      by: s.loggedBy ?? 'You', time: s.startedAt,
    })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 3);

  return activities;
}

function ageWeeks(birthDate: string) {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (7 * 24 * 3600 * 1000));
}

export function HomeScreen() {
  const { baby, babyApi } = useBaby();
  const { prefs } = useUnitPrefs();
  const [stats, setStats] = useState<TodayStats | null>(null);
  const activities = useRecentActivities(babyApi, prefs.milkUnit);

  useEffect(() => {
    if (!baby) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    (babyApi.stats.today(start.toISOString()) as Promise<TodayStats>).then(setStats).catch(() => {});
  }, [baby, babyApi]);

  const today = new Date();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dateStr = `${days[today.getDay()]} · ${months[today.getMonth()]} ${today.getDate()}`;
  const greeting = today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening';

  const babyName = baby?.name ?? '…';
  const firstName = babyName.split(' ')[0];
  const initial = firstName[0]?.toUpperCase() ?? '?';
  const weeks = baby?.birthDate ? ageWeeks(baby.birthDate) : null;

  const feedCount = stats?.feedCount ?? 0;
  const sleepSec = stats?.totalSleepSeconds ?? 0;
  const pumpedMl = stats?.totalPumpedMl ?? 0;
  const diaperCount = stats?.diaperCount ?? 0;

  return (
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-[22px] pt-2">
        <div>
          <div className="text-[12.5px] font-semibold uppercase tracking-[0.5px] text-ink-mute">{dateStr}</div>
          <div className="mt-0.5 font-serif text-[30px] leading-[1.05] tracking-[-0.5px] text-ink">
            Good {greeting},<br/><span className="italic text-terracotta">{firstName}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-card bg-terracotta-soft font-serif text-lg font-semibold text-terracotta">{initial}</div>
        </div>
      </div>

      {/* Baby card */}
      <div className="px-4 pt-5">
        <div className="overflow-hidden rounded-[22px] bg-card shadow-card">
          <div className="flex items-center gap-3.5 px-[18px] py-3.5">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[linear-gradient(135deg,#f1d8c7,#f5e2be)] text-[22px]">👶</div>
            <div className="flex-1">
              <div className="text-[15px] font-bold text-ink">{babyName}</div>
              <div className="mt-px text-[12.5px] text-ink-soft">
                {weeks !== null ? `${weeks} weeks` : '—'} · {stats?.activeSleep ? '😴 sleeping' : '👀 awake'}
              </div>
            </div>
            <Chip color={stats?.activeSleep ? T.sage : T.terracotta} soft={stats?.activeSleep ? T.sageSoft : T.terracottaSoft}>
              {stats?.activeSleep ? '● Asleep' : '● Awake'}
            </Chip>
          </div>
        </div>
      </div>

      {/* Today stats */}
      <div className="px-4 pt-3.5">
        <Card pad={18}>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[13px] font-bold tracking-[0.2px] text-ink">TODAY SO FAR</div>
            <div className="text-[11px] text-ink-mute">since midnight</div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              ['Feeds',   String(feedCount),                              T.terracotta, '/ 8 goal'],
              ['Diapers', String(diaperCount),                           T.earth,      `${stats?.wetDiapers ?? 0} wet`],
              ['Sleep',   sleepSec > 0 ? fmtDuration(sleepSec).replace(' ', '') : '—', T.sage,   `${stats?.sleepCount ?? 0} naps`],
              ['Pumped',  pumpedMl > 0 ? formatMilk(pumpedMl, prefs.milkUnit).split(' ')[0] : '—', T.honey, prefs.milkUnit],
            ].map(([label, val, col, sub]) => (
              <div key={label} className="flex min-w-0 flex-col gap-0.5">
                <div className="whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.4px] text-ink-mute">{label}</div>
                <div className={`whitespace-nowrap font-serif text-[22px] font-semibold leading-[1.05] tabular-nums ${col === T.terracotta ? 'text-terracotta' : col === T.earth ? 'text-earth' : col === T.sage ? 'text-sage' : 'text-honey'}`}>{val}</div>
                <div className="mt-0.5 truncate whitespace-nowrap text-[10.5px] text-ink-mute">{sub}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Last activity */}
      {activities.length > 0 && (
        <div className="px-4 pt-3.5">
          <div className="px-1.5 pb-2 text-[12.5px] font-bold uppercase tracking-[0.6px] text-ink-soft">Last activity</div>
          <Card pad={0}>
            {activities.map((row, i) => (
              <div key={i} className={`flex items-center gap-3 px-3.5 py-3 ${i ? 'border-t border-rule' : ''}`}>
                <div className={`flex h-9 w-9 items-center justify-center rounded-[11px] ${row.softClass} ${row.colorClass}`}>
                  <div className="h-5 w-5">{row.icon}</div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink">{row.title}</div>
                  <div className="mt-px text-[11.5px] text-ink-mute">{row.sub && `${row.sub} · `}{fmtTimeAgo(row.time)}</div>
                </div>
                <div className="rounded-full bg-black/3 px-2 py-0.5 text-[10.5px] font-semibold text-ink-mute">
                  by {row.by}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Next feed reminder */}
      {stats?.lastFeed && (
        <div className="px-4 pt-3.5">
          <div className="flex items-center gap-3 rounded-[18px] bg-honey-soft px-3.5 py-3">
            <div className="h-5 w-5 shrink-0 text-honey">{I.bell}</div>
            <div className="flex-1 text-[12.5px] leading-[1.35] text-[#7C5A21]">
              Last feed was {fmtTimeAgo(stats.lastFeed.startedAt)} — watch for hunger cues soon
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}
