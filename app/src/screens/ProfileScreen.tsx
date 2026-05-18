import React, { useEffect, useState } from 'react';
import { T, fonts } from '../tokens';
import { Card, Chip, PillBtn, TabBar, iconBtnStyle } from '../components/ui';
import { I } from '../components/Icons';
import { api } from '../api/client';
import type { Caregiver, DoctorVisit, GrowthEntry } from '../types';

export function ProfileScreen() {
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [latestGrowth, setLatestGrowth] = useState<GrowthEntry | null>(null);

  useEffect(() => {
    (api.caregivers.list() as Promise<Caregiver[]>).then(setCaregivers).catch(() => {});
    (api.visits.list() as Promise<DoctorVisit[]>).then(setVisits).catch(() => {});
    (api.growth.list() as Promise<GrowthEntry[]>).then(e => setLatestGrowth(e[0] ?? null)).catch(() => {});
  }, []);

  const latestVisit = visits[0];
  const weightKg = latestGrowth ? ((latestGrowth.weightG ?? 0) / 1000).toFixed(1) : '—';
  const lengthCm = latestGrowth?.lengthCm?.toFixed(0) ?? '—';

  const caregiversData = caregivers.length > 0 ? caregivers : [
    { id: '1', babyId: '', name: 'You · Hakim', role: 'Dad', permission: 'admin', initials: 'H', createdAt: '' },
    { id: '2', babyId: '', name: 'Lina', role: 'Mom', permission: 'admin', initials: 'L', createdAt: '' },
  ];

  const caregiverColors: Record<string, string> = { H: T.terracotta, L: T.rose, R: T.sage };

  return (
    <div style={{ width: '100%', minHeight: '100%', background: T.cream, fontFamily: fonts.sans, display: 'flex', flexDirection: 'column', paddingTop: 'max(20px, env(safe-area-inset-top))', boxSizing: 'border-box' }}>
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ color: T.inkMute, fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>PROFILE</div>
      </div>

      {/* Hero card */}
      <div style={{ padding: '12px 16px 0' }}>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div style={{ height: 96, background: `linear-gradient(135deg, ${T.terracottaSoft}, ${T.honeySoft})`, position: 'relative' }}>
            <svg viewBox="0 0 400 96" preserveAspectRatio="none" width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.4 }}>
              {Array.from({ length: 12 }).map((_, i) => (
                <circle key={i} cx={20 + i * 35} cy={20 + (i % 3) * 25} r={2 + (i % 4)} fill={T.terracotta} opacity={0.3 + (i % 5) * 0.1} />
              ))}
            </svg>
          </div>
          <div style={{ padding: '0 18px 18px', marginTop: -34 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 36, background: T.card,
              border: `4px solid ${T.card}`, boxShadow: T.shadow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: fonts.serif, fontSize: 30, color: T.terracotta, fontWeight: 600,
            }}>S</div>
            <div style={{ fontFamily: fonts.serif, fontSize: 26, color: T.ink, letterSpacing: -0.3, marginTop: 8 }}>Saif Hakimi</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 1 }}>Born Feb 23, 2026 · 12 weeks 3 days · Boy</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              <Chip color={T.terracotta} soft={T.terracottaSoft}>{weightKg} kg</Chip>
              <Chip color={T.sage} soft={T.sageSoft}>{lengthCm} cm</Chip>
              <Chip color={T.rose} soft={T.roseSoft}>O+ blood</Chip>
              <Chip color={T.sky} soft={T.skySoft}>Dr. Tan</Chip>
            </div>
          </div>
        </Card>
      </div>

      {/* Caregivers */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 8px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>Caregivers</div>
          <div style={{ fontSize: 11.5, color: T.terracotta, fontWeight: 700, cursor: 'pointer' }}>+ Add</div>
        </div>
        <Card pad={0}>
          {caregiversData.map((p, i) => {
            const init = p.initials ?? p.name.charAt(0);
            const col = caregiverColors[init] ?? T.sage;
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? `1px solid ${T.rule}` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 18, background: col, color: T.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: fonts.serif }}>{init}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{p.name}</div>
                  <div style={{ fontSize: 11.5, color: T.inkMute }}>{p.role} · {p.permission === 'admin' ? 'Admin' : 'View only'}</div>
                </div>
                <Chip color={T.sage} soft={T.sageSoft}>● active</Chip>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Doctor visits */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 6px 8px' }}>Doctor visits</div>
        <Card pad={14}>
          {latestVisit ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: T.skySoft, color: T.sky, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 20, height: 20 }}>{I.doc}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{latestVisit.visitType} · {latestVisit.doctorName}</div>
                  <div style={{ fontSize: 11.5, color: T.inkMute }}>
                    {new Date(latestVisit.visitedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {latestVisit.hospital}
                  </div>
                </div>
                <div style={{ width: 14, height: 14, color: T.inkMute }}>{I.chev}</div>
              </div>
              {latestVisit.notes && (
                <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 12, background: T.parchment, fontSize: 12, color: T.inkSoft, lineHeight: 1.45 }}>
                  <i>"{latestVisit.notes}"</i>
                </div>
              )}
              {latestVisit.nextAppointment && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '10px 12px', borderRadius: 12, background: T.honeySoft }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#7C5A21' }}>Next: 4-month vaccines</div>
                    <div style={{ fontSize: 11, color: '#7C5A21', opacity: 0.85, marginTop: 1 }}>
                      {new Date(latestVisit.nextAppointment).toLocaleDateString([], { month: 'long', day: 'numeric' })} · {latestVisit.doctorName}
                    </div>
                  </div>
                  <PillBtn color={'#7C5A21'} soft={'rgba(255,252,245,0.5)'} style={{ padding: '6px 12px', fontSize: 12 }}>Remind</PillBtn>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: T.inkMute, fontSize: 13, padding: '10px 0' }}>No visits yet</div>
          )}
        </Card>
      </div>

      {/* Preferences */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 6px 8px' }}>Preferences</div>
        <Card pad={0}>
          {[
            { k: 'Units', v: 'Metric (kg, cm, ml)', ic: I.measure },
            { k: 'Reminders', v: 'Feed · Pump · Vaccine', ic: I.bell },
            { k: 'Night mode', v: 'Auto · 8 PM – 6 AM', ic: I.moon },
            { k: 'Export data', v: 'CSV / PDF', ic: I.doc },
          ].map((r, i) => (
            <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? `1px solid ${T.rule}` : 'none' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: T.parchment, color: T.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16 }}>{r.ic}</div>
              </div>
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{r.k}</div>
              <div style={{ fontSize: 12, color: T.inkSoft }}>{r.v}</div>
              <div style={{ width: 12, height: 12, color: T.inkMute }}>{I.chev}</div>
            </div>
          ))}
        </Card>
      </div>

      <TabBar />
    </div>
  );
}
