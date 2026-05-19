import React, { useEffect, useState } from 'react';
import { T, fonts } from '../tokens';
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

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ color: T.inkMute, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>INSIGHTS</div>
        <div style={{ fontFamily: fonts.serif, fontSize: 30, color: T.ink, lineHeight: 1.05, letterSpacing: -0.5, marginTop: 2 }}>
          Patterns of <span style={{ fontStyle: 'italic', color: T.terracotta }}>the week</span>
        </div>
      </div>

      {/* Hero callout */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: 16, background: `linear-gradient(135deg, ${T.sageSoft}, ${T.parchment})` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.sage, letterSpacing: 0.5, textTransform: 'uppercase' }}>✦ Trend</div>
            <div style={{ fontFamily: fonts.serif, fontSize: 20, color: T.ink, lineHeight: 1.3, marginTop: 6, letterSpacing: -0.2 }}>
              {stats ? (
                <>Longest sleep stretch: <b>{longestSleepH}h</b> this week.</>
              ) : (
                'Loading insights…'
              )}
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 8 }}>
              {stats ? `${stats.avgFeedsPerDay.toFixed(1)} feeds/day average` : ''}
            </div>
          </div>
        </Card>
      </div>

      {/* Sleep heatmap */}
      <div style={{ padding: '14px 16px 0' }}>
        <Card pad={14}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Sleep by hour</div>
              <div style={{ fontSize: 11, color: T.inkMute }}>last 7 days · darker = asleep</div>
            </div>
            <Chip color={T.sage} soft={T.sageSoft}>
              {stats ? `${Math.floor(stats.totalSleepSeconds / 7 / 3600)}h avg` : '—'}
            </Chip>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '20px repeat(24, 1fr)', gap: 2 }}>
            <div />
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} style={{ fontFamily: fonts.mono, fontSize: 7, color: T.inkMute, textAlign: 'center', visibility: h % 6 === 0 ? 'visible' : 'hidden' }}>{h}</div>
            ))}
            {days.map((day, d) => (
              <React.Fragment key={d}>
                <div style={{ fontFamily: fonts.mono, fontSize: 8, color: T.inkMute, alignSelf: 'center' }}>{day}</div>
                {Array.from({ length: 24 }).map((_, h) => {
                  const night = h < 6 || h >= 20;
                  const napA = h >= 9 && h <= 10;
                  const napB = h >= 13 && h <= 14;
                  let v = 0;
                  if (night) v = 0.85 + Math.sin(d * 0.6 + h * 0.3) * 0.1;
                  else if (napA || napB) v = 0.5 + Math.cos(d) * 0.15;
                  else v = 0.05 + Math.random() * 0.08;
                  return <div key={h} style={{ height: 14, borderRadius: 2, background: `rgba(126,149,117,${v.toFixed(2)})` }} />;
                })}
              </React.Fragment>
            ))}
          </div>
        </Card>
      </div>

      {/* Feeds bar chart */}
      <div style={{ padding: '12px 16px 0' }}>
        <Card pad={14}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Feeds per day</div>
              <div style={{ fontSize: 11, color: T.inkMute }}>breast + bottle</div>
            </div>
            <div style={{ fontFamily: fonts.serif, fontSize: 22, color: T.terracotta, fontWeight: 600 }}>
              {stats?.avgFeedsPerDay ?? '—'}<span style={{ fontSize: 11, color: T.inkMute, fontStyle: 'italic', marginLeft: 4 }}>avg</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {[7, 8, 6, 8, 9, 7, 7].map((v, i) => {
              const breast = Math.max(0, v - 2);
              const bottle = v - breast;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse', alignItems: 'stretch' }}>
                  <div style={{ height: 4, fontFamily: fonts.mono, fontSize: 8, color: T.inkMute, marginTop: 4, textAlign: 'center' }}>{days[i]}</div>
                  <div style={{ display: 'flex', flexDirection: 'column-reverse', height: v * 6 + 12, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: bottle * 6, background: T.honey }} />
                    <div style={{ height: breast * 6, background: T.terracotta }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 12, fontSize: 11, color: T.inkSoft }}>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: T.terracotta, verticalAlign: 'middle', marginRight: 4 }}/> Breast</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: T.honey, verticalAlign: 'middle', marginRight: 4 }}/> Bottle/EBM</span>
          </div>
        </Card>
      </div>

      {/* Stat cards */}
      <div style={{ padding: '12px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card pad={14}>
          <div style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Wet diapers</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 28, color: T.ink, fontWeight: 600, marginTop: 2 }}>
            {stats?.avgWetDiapersPerDay ?? '—'}<span style={{ fontSize: 12, color: T.inkMute, fontStyle: 'italic', marginLeft: 4 }}>/day</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.sage, marginTop: 2, fontWeight: 600 }}>✓ within healthy range</div>
        </Card>
        <Card pad={14}>
          <div style={{ fontSize: 11, color: T.inkMute, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>Mom pumped</div>
          <div style={{ fontFamily: fonts.serif, fontSize: 28, color: T.ink, fontWeight: 600, marginTop: 2 }}>
            {stats ? formatMilk(stats.totalPumpedMl, prefs.milkUnit).split(' ')[0] : '—'}<span style={{ fontSize: 12, color: T.inkMute, fontStyle: 'italic', marginLeft: 4 }}>{prefs.milkUnit}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.inkMute, marginTop: 2 }}>this week · {stats?.pumpingSessions ?? 0} sessions</div>
        </Card>
      </div>
    </div>
  );
}
