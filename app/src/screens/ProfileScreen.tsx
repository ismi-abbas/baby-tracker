import React, { useEffect, useState } from 'react';
import { T, fonts } from '../tokens';
import { Card, Chip, PillBtn, TabBar, iconBtnStyle } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { formatLength, formatWeight, useUnitPrefs } from '../units';
import type { BabyMember, Caregiver, DoctorVisit, GrowthEntry } from '../types';

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
  const { prefs, setPrefs } = useUnitPrefs();
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [members, setMembers] = useState<BabyMember[]>([]);
  const [visits, setVisits] = useState<DoctorVisit[]>([]);
  const [latestGrowth, setLatestGrowth] = useState<GrowthEntry | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');

  useEffect(() => {
    if (!baby) return;
    (babyApi.caregivers.list() as Promise<Caregiver[]>).then(setCaregivers).catch(() => {});
    (babyApi.members.list() as Promise<BabyMember[]>).then(setMembers).catch(() => {});
    (babyApi.visits.list() as Promise<DoctorVisit[]>).then(setVisits).catch(() => {});
    (babyApi.growth.list() as Promise<GrowthEntry[]>).then(e => setLatestGrowth(e[0] ?? null)).catch(() => {});
  }, [baby, babyApi]);

  async function inviteParent() {
    const email = inviteEmail.trim();
    if (!email) return;
    setInviteStatus('Inviting...');
    try {
      await babyApi.members.invite(email);
      const next = await babyApi.members.list() as BabyMember[];
      setMembers(next);
      setInviteEmail('');
      setInviteStatus('Parent added. They can log once they sign in.');
    } catch {
      setInviteStatus('No account found for that email yet.');
    }
  }

  const latestVisit = visits[0];
  const weight = latestGrowth ? formatWeight(latestGrowth.weightG, prefs.weightUnit) : '—';
  const length = latestGrowth ? formatLength(latestGrowth.lengthCm, prefs.lengthUnit) : '—';
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
              {weight !== '—' && <Chip color={T.terracotta} soft={T.terracottaSoft}>{weight}</Chip>}
              {length !== '—' && <Chip color={T.sage} soft={T.sageSoft}>{length}</Chip>}
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

      {/* Sharing */}
      <div style={{ padding: '14px 16px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, letterSpacing: 0.6, textTransform: 'uppercase', padding: '0 6px 8px' }}>Sharing</div>
        <Card pad={14}>
          <div style={{ fontFamily: fonts.serif, fontSize: 18, color: T.ink, letterSpacing: -0.2 }}>Co-parent logging</div>
          <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 3, lineHeight: 1.4 }}>Invite a signed-in parent by email. They will see {babyName} and can add logs.</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="parent@email.com" style={{ flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 12, border: `1.5px solid ${T.rule}`, background: T.card, color: T.ink, fontFamily: fonts.sans, fontSize: 13, outline: 'none' }} />
            <button onClick={inviteParent} disabled={!inviteEmail.trim()} style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: inviteEmail.trim() ? T.terracotta : T.terracottaSoft, color: inviteEmail.trim() ? T.card : T.terracotta, fontFamily: fonts.sans, fontSize: 12.5, fontWeight: 700, cursor: inviteEmail.trim() ? 'pointer' : 'not-allowed' }}>Invite</button>
          </div>
          {inviteStatus && <div style={{ fontSize: 11.5, color: inviteStatus.startsWith('No') ? '#C0392B' : T.sage, marginTop: 8, fontWeight: 600 }}>{inviteStatus}</div>}
          {members.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {members.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, background: T.parchment }}>
                  <div style={{ width: 28, height: 28, borderRadius: 14, background: T.terracottaSoft, color: T.terracotta, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.serif, fontWeight: 700 }}>{member.name[0]?.toUpperCase() ?? '?'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.name}</div>
                    <div style={{ fontSize: 10.5, color: T.inkMute, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{member.email}</div>
                  </div>
                  <Chip color={member.role === 'owner' ? T.terracotta : T.sage} soft={member.role === 'owner' ? T.terracottaSoft : T.sageSoft}>{member.role}</Chip>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

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
            { k: 'Milk', v: prefs.milkUnit, ic: I.feed, onClick: () => setPrefs(p => ({ ...p, milkUnit: p.milkUnit === 'ml' ? 'oz' : 'ml' })) },
            { k: 'Weight', v: prefs.weightUnit, ic: I.measure, onClick: () => setPrefs(p => ({ ...p, weightUnit: p.weightUnit === 'kg' ? 'lb' : 'kg' })) },
            { k: 'Length', v: prefs.lengthUnit, ic: I.measure, onClick: () => setPrefs(p => ({ ...p, lengthUnit: p.lengthUnit === 'cm' ? 'in' : 'cm' })) },
            { k: 'Reminders', v: 'Feed · Pump · Vaccine', ic: I.bell },
            { k: 'Night mode', v: 'Auto · 8 PM – 6 AM', ic: I.moon },
            { k: 'Export data', v: 'CSV / PDF', ic: I.doc },
          ].map((r, i) => (
            <div key={r.k} onClick={r.onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderTop: i ? `1px solid ${T.rule}` : 'none', cursor: r.onClick ? 'pointer' : 'default' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: T.parchment, color: T.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 16, height: 16 }}>{r.ic}</div>
              </div>
              <div style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: T.ink }}>{r.k}</div>
              <div style={{ fontSize: 12, color: T.inkSoft, textTransform: r.onClick ? 'uppercase' : 'none', fontFamily: r.onClick ? fonts.mono : fonts.sans }}>{r.v}</div>
              <div style={{ width: 12, height: 12, color: T.inkMute }}>{I.chev}</div>
            </div>
          ))}
        </Card>
      </div>

      <TabBar />
    </div>
  );
}
