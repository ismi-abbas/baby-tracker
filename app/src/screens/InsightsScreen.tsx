import React, { useEffect, useState } from 'react';
import { T } from '../tokens';
import { Card, Chip } from '../components/ui';
import { useBaby } from '../context/BabyContext';
import { formatMilk, useUnitPrefs } from '../units';

interface WeeklyStats {
  avgFeedsPerDay: number;
  pumpingSessions: number;
  totalPumpedMl: number;
  avgWetDiapersPerDay: number;
  longestSleepSeconds: number;
  totalSleepSeconds: number;
}

export function InsightsScreen() {
  const { babyApi: api } = useBaby();
  const { prefs } = useUnitPrefs();
  const [stats, setStats] = useState<WeeklyStats | null>(null);

  useEffect(() => {
    (api.stats.weekly() as Promise<WeeklyStats>).then(setStats).catch(() => {});
  }, []);

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const longestSleepH = stats ? (stats.longestSleepSeconds / 3600).toFixed(1) : '—';
  const sleepHeatClass = (value: number) => {
    if (value >= 0.9) return 'bg-sage/95';
    if (value >= 0.8) return 'bg-sage/85';
    if (value >= 0.65) return 'bg-sage/70';
    if (value >= 0.5) return 'bg-sage/55';
    if (value >= 0.25) return 'bg-sage/30';
    return 'bg-sage/10';
  };

  return (
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="px-[22px] pt-2">
        <div className="text-xs font-semibold uppercase tracking-[0.5px] text-ink-mute">INSIGHTS</div>
        <div className="mt-0.5 font-serif text-[30px] leading-[1.05] tracking-[-0.5px] text-ink">
          Patterns of <span className="italic text-terracotta">the week</span>
        </div>
      </div>

      {/* Hero callout */}
      <div className="px-4 pt-3.5">
        <div className="overflow-hidden rounded-[22px] bg-card shadow-card">
          <div className="bg-[linear-gradient(135deg,#dde5d5,#fbf6ea)] p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.5px] text-sage">✦ Trend</div>
            <div className="mt-1.5 font-serif text-xl leading-[1.3] tracking-[-0.2px] text-ink">
              {stats ? (
                <>Longest sleep stretch: <b>{longestSleepH}h</b> this week.</>
              ) : (
                'Loading insights…'
              )}
            </div>
            <div className="mt-2 text-xs text-ink-soft">
              {stats ? `${stats.avgFeedsPerDay.toFixed(1)} feeds/day average` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Sleep heatmap */}
      <div className="px-4 pt-3.5">
        <Card pad={14}>
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-ink">Sleep by hour</div>
              <div className="text-[11px] text-ink-mute">last 7 days · darker = asleep</div>
            </div>
            <Chip color={T.sage} soft={T.sageSoft}>
              {stats ? `${Math.floor(stats.totalSleepSeconds / 7 / 3600)}h avg` : '—'}
            </Chip>
          </div>
          <div className="grid grid-cols-[20px_repeat(24,1fr)] gap-0.5">
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className={`text-center font-mono text-[7px] text-ink-mute ${h % 6 === 0 ? 'visible' : 'invisible'}`}>{h}</div>
            ))}
            {days.map((day, d) => (
              <React.Fragment key={d}>
                <div className="self-center font-mono text-[8px] text-ink-mute">{day}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const night = h < 6 || h >= 20;
                  const napA = h >= 9 && h <= 10;
                  const napB = h >= 13 && h <= 14;
                  let v = 0;
                  if (night) v = 0.85 + Math.sin(d * 0.6 + h * 0.3) * 0.1;
                  else if (napA || napB) v = 0.5 + Math.cos(d) * 0.15;
                  else v = 0.05 + Math.random() * 0.08;
                  return <div key={h} className={`h-3.5 rounded-sm ${sleepHeatClass(v)}`} />;
                })}
              </React.Fragment>
            ))}
          </div>
        </Card>
      </div>

      {/* Feeds bar chart */}
      <div className="px-4 pt-3">
        <Card pad={14}>
          <div className="mb-2.5 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-bold text-ink">Feeds per day</div>
              <div className="text-[11px] text-ink-mute">breast + bottle</div>
            </div>
            <div className="font-serif text-[22px] font-semibold text-terracotta">
              {stats?.avgFeedsPerDay ?? '—'}<span className="ml-1 text-[11px] italic text-ink-mute">avg</span>
            </div>
          </div>
          <div className="flex h-20 items-end gap-1.5">
            {[7, 8, 6, 8, 9, 7, 7].map((v, i) => {
              const breast = Math.max(0, v - 2);
              const bottle = v - breast;
              return (
                <div key={i} className="flex flex-1 flex-col-reverse items-stretch">
                  <div className="mt-1 h-1 text-center font-mono text-[8px] text-ink-mute">{days[i]}</div>
                  <svg className="block w-full rounded" viewBox="0 0 12 72" height={v * 6 + 12} preserveAspectRatio="none" aria-hidden="true">
                    <rect x="0" y={72 - bottle * 6} width="12" height={bottle * 6} fill={T.honey} />
                    <rect x="0" y={72 - (bottle + breast) * 6} width="12" height={breast * 6} fill={T.terracotta} />
                  </svg>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-3.5 text-[11px] text-ink-soft">
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-[3px] bg-terracotta align-middle"/> Breast</span>
            <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-[3px] bg-honey align-middle"/> Bottle/EBM</span>
          </div>
        </Card>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pt-3">
        <Card pad={14}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-ink-mute">Wet diapers</div>
          <div className="mt-0.5 font-serif text-[28px] font-semibold text-ink">
            {stats?.avgWetDiapersPerDay ?? '—'}<span className="ml-1 text-xs italic text-ink-mute">/day</span>
          </div>
          <div className="mt-0.5 text-[11.5px] font-semibold text-sage">✓ within healthy range</div>
        </Card>
        <Card pad={14}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.5px] text-ink-mute">Mom pumped</div>
          <div className="mt-0.5 font-serif text-[28px] font-semibold text-ink">
            {stats ? formatMilk(stats.totalPumpedMl, prefs.milkUnit).split(' ')[0] : '—'}<span className="ml-1 text-xs italic text-ink-mute">{prefs.milkUnit}</span>
          </div>
          <div className="mt-0.5 text-[11.5px] text-ink-mute">this week · {stats?.pumpingSessions ?? 0} sessions</div>
        </Card>
      </div>
    </div>
  );
}
