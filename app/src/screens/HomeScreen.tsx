import React, { useEffect, useState } from 'react';
import { T, fonts } from '../tokens';
import { Card, Chip, SyncBadge, TabBar, fmtDuration, fmtTimeAgo } from '../components/ui';
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

  type Activity = { icon: React.ReactNode; color: string; soft: string; title: string; sub: string; by: string; time: string };
  const activities: Activity[] = [
    ...feeds.slice(0, 2).map(f => ({
      icon: I.feed, color: T.terracotta, soft: T.terracottaSoft,
      title: f.type === 'breast' ? `Breastfed · ${f.side ? f.side.charAt(0).toUpperCase() + f.side.slice(1) : 'Both'} side` : `Bottle feed`,
      sub: f.durationSeconds ? fmtDuration(f.durationSeconds) : f.amountMl ? formatMilk(f.amountMl, milkUnit) : '',
      by: f.loggedBy ?? 'You', time: f.startedAt,
    })),
    ...diapers.slice(0, 1).map(d => ({
      icon: I.diaper, color: T.earth, soft: T.earthSoft,
      title: d.type === 'dirty' ? 'Dirty diaper' : d.type === 'wet' ? 'Wet diaper' : 'Mixed diaper',
      sub: d.consistency ?? '', by: d.loggedBy ?? 'You', time: d.changedAt,
    })),
    ...sleeps.slice(0, 1).map(s => ({
      icon: I.sleep, color: T.sage, soft: T.sageSoft,
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
    <div style={{
      width: '100%', minHeight: '100%', background: T.cream,
      fontFamily: fonts.sans, display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box',
    }}>
      {/* Header */}
      <div style={{ padding: '8px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: T.inkMute, fontSize: 12.5, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{dateStr}</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 30, color: T.ink, lineHeight: 1.05, marginTop: 2, letterSpacing: -0.5 }}>
            Good {greeting},<br/><span style={{ fontStyle: 'italic', color: T.terracotta }}>{firstName}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 22, background: T.terracottaSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: fonts.serif, fontSize: 18, color: T.terracotta, fontWeight: 600,
            border: `2px solid ${T.card}`,
          }}>{initial}</div>
          <SyncBadge />
        </div>
      </div>

      {/* Baby card */}
      <div style={{ padding: '20px 16px 0' }}>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 26,
              background: `linear-gradient(135deg, ${T.terracottaSoft}, ${T.honeySoft})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
            }}>👶</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{babyName}</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 1 }}>
                {weeks !== null ? `${weeks} weeks` : '—'} · {stats?.activeSleep ? '😴 sleeping' : '👀 awake'}
              </div>
            </div>
            <Chip color={stats?.activeSleep ? T.sage : T.terracotta} soft={stats?.activeSleep ? T.sageSoft : T.terracottaSoft}>
              {stats?.activeSleep ? '● Asleep' : '● Awake'}
            </Chip>
          </div>
        </Card>
      </div>

      {/* Today stats */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={18}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, letterSpacing: 0.2 }}>TODAY SO FAR</div>
            <div style={{ fontSize: 11, color: T.inkMute }}>since midnight</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {[
              ['Feeds',   String(feedCount),                              T.terracotta, '/ 8 goal'],
              ['Diapers', String(diaperCount),                           T.earth,      `${stats?.wetDiapers ?? 0} wet`],
              ['Sleep',   sleepSec > 0 ? fmtDuration(sleepSec).replace(' ', '') : '—', T.sage,   `${stats?.sleepCount ?? 0} naps`],
              ['Pumped',  pumpedMl > 0 ? formatMilk(pumpedMl, prefs.milkUnit).split(' ')[0] : '—', T.honey, prefs.milkUnit],
            ].map(([label, val, col, sub]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <div style={{ fontSize: 10.5, color: T.inkMute, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4, whiteSpace: 'nowrap' }}>{label}</div>
                <div style={{ fontFamily: fonts.serif, fontSize: 22, color: col, fontWeight: 600, lineHeight: 1.05, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{val}</div>
                <div style={{ fontSize: 10.5, color: T.inkMute, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Last activity */}
      {activities.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.inkSoft, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 6px 8px' }}>Last activity</div>
          <Card pad={0}>
            {activities.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? `1px solid ${T.rule}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: row.soft, color: row.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20 }}>{row.icon}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.ink }}>{row.title}</div>
                  <div style={{ fontSize: 11.5, color: T.inkMute, marginTop: 1 }}>{row.sub && `${row.sub} · `}{fmtTimeAgo(row.time)}</div>
                </div>
                <div style={{ fontSize: 10.5, color: T.inkMute, padding: '2px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.03)', fontWeight: 600 }}>
                  by {row.by}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Next feed reminder */}
      {stats?.lastFeed && (
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ background: T.honeySoft, borderRadius: 18, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 20, height: 20, color: T.honey, flexShrink: 0 }}>{I.bell}</div>
            <div style={{ flex: 1, fontSize: 12.5, color: '#7C5A21', lineHeight: 1.35 }}>
              Last feed was {fmtTimeAgo(stats.lastFeed.startedAt)} — watch for hunger cues soon
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  );
}
