import React, { useEffect, useState } from 'react';
import { T, fonts } from '../tokens';
import { Card, Chip, PillBtn, TabBar, iconBtnStyle } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import type { Caregiver, DoctorVisit, GrowthEntry } from '../types';

function ageDisplay(birthDate: string) {
  const diff = Date.now() - new Date(birthDate).getTime();
  const weeks = Math.floor(diff / (7 * 24 * 3600 * 1000));
  const days = Math.floor((diff % (7 * 24 * 3600 * 1000)) / (24 * 3600 * 1000));
  if (weeks >= 12) {
    const months = Math.floor(weeks / 4.33);
    return `${months} month${months !== 1 ? 's' : ''}`;
  }
  return `${weeks} weeks ${days} days`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export function ProfileScreen() {
  const { baby, babyApi } = useBaby();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [latestGrowth, setLatestGrowth] = useState<GrowthEntry | null>(null);

  useEffect(() => {
    if (!baby) return;
    (babyApi.caregivers.list() as Promise<Caregiver[]>).then(setCaregivers).catch(() => {});
    (babyApi.visits.list() as Promise<DoctorVisit[]>).then(setVisits).catch(() => {});
    (babyApi.growth.list() as Promise<GrowthEntry[]>).then(e => setLatestGrowth(e[0] ?? null)).catch(() => {});
  }, [baby, babyApi]);

  const latestVisit = visits[0];
  const weightKg = latestGrowth ? ((latestGrowth.weightG ?? 0) / 1000).toFixed(1) : '—';
  const lengthCm = latestGrowth?.lengthCm?.toFixed(0) ?? '—';
  const babyName = baby?.name ?? '…';
  const initial = babyName[0]?.toUpperCase() ?? '?';
  const caregiverColors: Record<string, string> = {};
  const colorPool = [T.terracotta, T.rose, T.sage, T.sky, T.honey];
  caregivers.forEach((c, i) => {
    caregiverColors[c.id] = colorPool[i % colorPool.length];
  });

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
            }}>{initial}</div>
            <div style={{ fontFamily: fonts.serif, fontSize: 26, color: T.ink, letterSpacing: -0.3, marginTop: 8 }}>{babyName}</div>
            {baby?.birthDate && (
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 1 }}>
                Born {formatDate(baby.birthDate)} · {ageDisplay(baby.birthDate)}{baby.gender ? ` · ${baby.gender}` : ''}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
              {weightKg !== '—' && <Chip color={T.terracotta} soft={T.terracottaSoft}>{weightKg} kg</Chip>}
              {lengthCm !== '—' && <Chip color={T.sage} soft={T.sageSoft}>{lengthCm} cm</Chip>}
              {baby?.bloodType && <Chip color={T.rose} soft={T.roseSoft}>{baby.bloodType} blood</Chip>}
              {baby?.doctorName && <Chip color={T.sky} soft={T.skySoft}>{baby.doctorName}</Chip>}
            </div>
          </div>
        </Card>
      </div>

      {/* Caregivers */}
      {caregivers.length > 0 && (
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 6px 8px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase' }}>Caregivers</div>
            <div style={{ fontSize: 11.5, color: T.terracotta, fontWeight: 700, cursor: 'pointer' }}>+ Add</div>
          </div>
          <Card pad={0}>
            {caregivers.map((p, i) => {
              const col = caregiverColors[p.id] ?? T.sage;
              const init = p.initials ?? p.name[0]?.toUpperCase() ?? '?';
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
      )}

      {/* Doctor visits */}
      {latestVisit && (
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 6px 8px' }}>Doctor visits</div>
          <Card pad={14}>
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
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#7C5A21' }}>Next appointment</div>
                  <div style={{ fontSize: 11, color: '#7C5A21', opacity: 0.85, marginTop: 1 }}>
                    {new Date(latestVisit.nextAppointment).toLocaleDateString([], { month: 'long', day: 'numeric' })} · {latestVisit.doctorName}
                  </div>
                </div>
                <PillBtn color='#7C5A21' soft='rgba(255,252,245,0.5)' style={{ padding: '6px 12px', fontSize: 12 }}>Remind</PillBtn>
              </div>
            )}
          </Card>
        </div>
      )}

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
