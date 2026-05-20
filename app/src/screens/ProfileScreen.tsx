import React, { useEffect, useState } from 'react';
import { T } from '../tokens';
import { Card, Chip, TabBar } from '../components/ui';
import { I } from '../components/Icons';
import { useBaby } from '../context/BabyContext';
import { formatLength, formatWeight, useUnitPrefs } from '../units';
import type { BabyMember, Caregiver, DoctorVisit, GrowthEntry } from '../types';
import { cn } from '../lib/utils';
import { signOut } from '../auth/client';

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
  const colorPool = ['bg-terracotta', 'bg-rose', 'bg-sage', 'bg-sky', 'bg-honey'];
  caregivers.forEach((c, i) => {
    caregiverColors[c.id] = colorPool[i % colorPool.length];
  });

  return (
    <div className="box-border flex min-h-full w-full flex-col bg-cream pt-[max(20px,env(safe-area-inset-top))] font-sans">
      <div className="px-[22px] pt-2">
        <div className="text-xs font-semibold uppercase tracking-[0.5px] text-ink-mute">PROFILE</div>
      </div>

      {/* Hero card */}
      <div className="px-4 pt-3">
        <div className="overflow-hidden rounded-[22px] bg-card shadow-card">
          <div className="relative h-24 bg-[linear-gradient(135deg,#f1d8c7,#f5e2be)]">
            <svg viewBox="0 0 400 96" preserveAspectRatio="none" width="100%" height="100%" className="absolute inset-0 opacity-40">
              {Array.from({ length: 12 }).map((_, i) => (
                <circle key={i} cx={20 + i * 35} cy={20 + (i % 3) * 25} r={2 + (i % 4)} fill={T.terracotta} opacity={0.3 + (i % 5) * 0.1} />
              ))}
            </svg>
          </div>
          <div className="-mt-[34px] px-[18px] pb-[18px]">
            <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-card bg-card font-serif text-[30px] font-semibold text-terracotta shadow-card">{initial}</div>
            <div className="mt-2 font-serif text-[26px] tracking-[-0.3px] text-ink">{babyName}</div>
            {baby?.birthDate && (
              <div className="mt-px text-[12.5px] text-ink-soft">
                Born {formatDate(baby.birthDate)} · {ageDisplay(baby.birthDate)}{baby.gender ? ` · ${baby.gender}` : ''}
              </div>
            )}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {weight !== '—' && <Chip color={T.terracotta} soft={T.terracottaSoft}>{weight}</Chip>}
              {length !== '—' && <Chip color={T.sage} soft={T.sageSoft}>{length}</Chip>}
              {baby?.bloodType && <Chip color={T.rose} soft={T.roseSoft}>{baby.bloodType} blood</Chip>}
              {baby?.doctorName && <Chip color={T.sky} soft={T.skySoft}>{baby.doctorName}</Chip>}
            </div>
          </div>
        </div>
      </div>

      {/* Caregivers */}
      {caregivers.length > 0 && (
        <div className="px-4 pt-3.5">
          <div className="px-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-ink-mute">Caregivers</div>
          <Card pad={0}>
            {caregivers.map((p, i) => {
              const col = caregiverColors[p.id] ?? 'bg-sage';
              const init = p.initials ?? p.name[0]?.toUpperCase() ?? '?';
              return (
                <div key={p.id} className={cn('flex items-center gap-3 px-3.5 py-3', i && 'border-t border-rule')}>
                  <div className={cn('flex h-9 w-9 items-center justify-center rounded-full font-serif font-bold text-card', col)}>{init}</div>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-bold text-ink">{p.name}</div>
                    <div className="text-[11.5px] text-ink-mute">{p.role} · {p.permission === 'admin' ? 'Admin' : 'View only'}</div>
                  </div>
                  <Chip color={T.sage} soft={T.sageSoft}>● active</Chip>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {/* Sharing */}
      <div className="px-4 pt-3.5">
        <div className="px-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-ink-mute">Sharing</div>
        <Card pad={14}>
          <div className="font-serif text-lg tracking-[-0.2px] text-ink">Co-parent logging</div>
          <div className="mt-[3px] text-xs leading-[1.4] text-ink-soft">Invite a signed-in parent by email. They will see {babyName} and can add logs.</div>
          <div className="mt-3 flex gap-2">
            <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="parent@email.com" className="min-w-0 flex-1 rounded-xl border-[1.5px] border-rule bg-card px-3 py-2.5 font-sans text-[13px] text-ink outline-none" />
            <button onClick={inviteParent} disabled={!inviteEmail.trim()} className={cn('rounded-xl border-0 px-3.5 py-2.5 font-sans text-[12.5px] font-bold', inviteEmail.trim() ? 'cursor-pointer bg-terracotta text-card' : 'cursor-not-allowed bg-terracotta-soft text-terracotta')}>Invite</button>
          </div>
          {inviteStatus && <div className={cn('mt-2 text-[11.5px] font-semibold', inviteStatus.startsWith('No') ? 'text-[#C0392B]' : 'text-sage')}>{inviteStatus}</div>}
          {members.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center gap-2.5 rounded-xl bg-parchment px-2.5 py-[9px]">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-terracotta-soft font-serif font-bold text-terracotta">{member.name[0]?.toUpperCase() ?? '?'}</div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate whitespace-nowrap text-[12.5px] font-bold text-ink">{member.name}</div>
                    <div className="truncate whitespace-nowrap text-[10.5px] text-ink-mute">{member.email}</div>
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
        <div className="px-4 pt-3.5">
          <div className="px-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-ink-mute">Doctor visits</div>
          <Card pad={14}>
            <div className="flex items-center gap-3">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-sky-soft text-sky">
                <div className="h-5 w-5">{I.doc}</div>
              </div>
              <div className="flex-1">
                <div className="text-[13.5px] font-bold text-ink">{latestVisit.visitType} · {latestVisit.doctorName}</div>
                <div className="text-[11.5px] text-ink-mute">
                  {new Date(latestVisit.visitedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} · {latestVisit.hospital}
                </div>
              </div>
              <div className="h-3.5 w-3.5 text-ink-mute">{I.chev}</div>
            </div>
            {latestVisit.notes && (
              <div className="mt-3 rounded-xl bg-parchment px-3 py-2.5 text-xs leading-[1.45] text-ink-soft">
                <i>"{latestVisit.notes}"</i>
              </div>
            )}
            {latestVisit.nextAppointment && (
              <div className="mt-3 rounded-xl bg-honey-soft px-3 py-2.5">
                <div className="text-xs font-bold text-[#7C5A21]">Next appointment</div>
                <div className="mt-px text-[11px] text-[#7C5A21] opacity-85">
                  {new Date(latestVisit.nextAppointment).toLocaleDateString([], { month: 'long', day: 'numeric' })} · {latestVisit.doctorName}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Preferences */}
      <div className="px-4 pt-3.5">
        <div className="px-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-ink-mute">Preferences</div>
        <Card pad={0}>
          {[
            { k: 'Milk', v: prefs.milkUnit, ic: I.feed, onClick: () => setPrefs(p => ({ ...p, milkUnit: p.milkUnit === 'ml' ? 'oz' : 'ml' })) },
            { k: 'Weight', v: prefs.weightUnit, ic: I.measure, onClick: () => setPrefs(p => ({ ...p, weightUnit: p.weightUnit === 'kg' ? 'lb' : 'kg' })) },
            { k: 'Length', v: prefs.lengthUnit, ic: I.measure, onClick: () => setPrefs(p => ({ ...p, lengthUnit: p.lengthUnit === 'cm' ? 'in' : 'cm' })) },
          ].map((r, i) => (
            <div key={r.k} onClick={r.onClick} className={cn('flex cursor-pointer items-center gap-3 px-3.5 py-3', i && 'border-t border-rule')}>
              <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-parchment text-ink-soft">
                <div className="h-4 w-4">{r.ic}</div>
              </div>
              <div className="flex-1 text-[13.5px] font-semibold text-ink">{r.k}</div>
              <div className="font-mono text-xs uppercase text-ink-soft">{r.v}</div>
              <div className="h-3 w-3 text-ink-mute">{I.chev}</div>
            </div>
          ))}
        </Card>
      </div>

      {/* Account */}
      <div className="px-4 pt-3.5 pb-6">
        <div className="px-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.6px] text-ink-mute">Account</div>
        <button
          onClick={() => signOut()}
          className="flex w-full cursor-pointer items-center gap-3 rounded-[22px] border-0 bg-card px-3.5 py-3 shadow-card"
        >
          <div className="flex h-[30px] w-[30px] items-center justify-center rounded-lg bg-[#FEF2F2] text-[#E53E3E]">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 text-left text-[13.5px] font-semibold text-[#E53E3E]">Log out</div>
        </button>
      </div>

      <TabBar />
    </div>
  );
}
