import React, { createContext, useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { T, fonts } from '../tokens';
import { I } from './Icons';
import type { Screen } from '../types';

// ─── Nav Context ─────────────────────────────────────────────────

interface NavContextValue {
  nav: (screen: Screen) => void;
  back: () => void;
  screen: Screen;
  openSheet: () => void;
}

export const NavCtx = createContext<NavContextValue>({
  nav: () => {},
  back: () => {},
  screen: 'home',
  openSheet: () => {},
});

export function useNav() {
  return useContext(NavCtx);
}

// ─── Primitives ──────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  pad?: number;
  tone?: keyof typeof T | string;
  radius?: number;
  onClick?: () => void;
}

export function Card({ children, style = {}, pad = 16, tone = 'card', radius = 22, onClick }: CardProps) {
  const bg = (T as Record<string, string>)[tone] ?? tone;
  return (
    <div onClick={onClick} style={{
      background: bg, borderRadius: radius, padding: pad,
      boxShadow: T.shadow, ...style,
      cursor: onClick ? 'pointer' : undefined,
    }}>
      {children}
    </div>
  );
}

interface ChipProps {
  children: React.ReactNode;
  color?: string;
  soft?: string;
  style?: React.CSSProperties;
}

export function Chip({ children, color = T.terracotta, soft, style = {} }: ChipProps) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 9999,
      background: soft ?? 'rgba(0,0,0,0.04)',
      color, fontSize: 12, fontWeight: 600,
      fontFamily: fonts.sans, letterSpacing: 0.2, ...style,
    }}>{children}</span>
  );
}

interface BigTapProps {
  label: string;
  color: string;
  soft: string;
  icon: React.ReactNode;
  size?: number | 'auto';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function BigTap({ label, color, soft, icon, size = 96, onClick, style = {} }: BigTapProps) {
  const sizeStyle = size === 'auto' ? {} : { width: size, height: size };
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 6,
      ...sizeStyle, borderRadius: 28,
      background: soft, color, border: 'none',
      cursor: 'pointer', fontFamily: fonts.sans,
      boxShadow: '0 2px 0 rgba(58,40,20,0.04) inset, 0 1px 2px rgba(58,40,20,0.04)',
      ...style,
    }}>
      <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
    </button>
  );
}

interface PillBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  primary?: boolean;
  soft?: string;
  color?: string;
  style?: React.CSSProperties;
}

export function PillBtn({ children, primary, soft, color = T.ink, style = {}, ...rest }: PillBtnProps) {
  return (
    <button style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: 8, padding: '12px 20px', borderRadius: 9999, border: 'none',
      background: primary ? T.terracotta : (soft ?? 'transparent'),
      color: primary ? '#FFFCF5' : color,
      fontFamily: fonts.sans, fontSize: 15, fontWeight: 600,
      cursor: 'pointer', letterSpacing: 0.1, ...style,
    }} {...rest}>{children}</button>
  );
}

export function SyncBadge({ partner = 'Lina' }: { partner?: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 10px 4px 6px', borderRadius: 9999,
      background: 'rgba(126,149,117,0.14)', color: T.sage,
      fontFamily: fonts.sans, fontSize: 11.5, fontWeight: 600,
    }}>
      <span style={{
        width: 14, height: 14, borderRadius: 7, background: T.sage,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: T.card, fontSize: 8, fontWeight: 700,
      }}>L</span>
      Synced · {partner}
    </div>
  );
}

export function BackBtn({ dark }: { dark?: boolean }) {
  const { back } = useNav();
  return (
    <button onClick={back} style={{
      width: 38, height: 38, borderRadius: 12,
      background: dark ? 'rgba(255,252,245,0.08)' : 'rgba(0,0,0,0.04)',
      border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ width: 18, height: 18, color: dark ? '#EDE7D6' : T.ink, transform: 'rotate(180deg)' }}>{I.chev}</div>
    </button>
  );
}

export function Screen({ children, bg = T.cream, color }: { children: React.ReactNode; bg?: string; color?: string }) {
  return (
    <div style={{
      width: '100%', minHeight: '100%', background: bg, color,
      fontFamily: fonts.sans, position: 'relative',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(16px, env(safe-area-inset-top))',
      boxSizing: 'border-box',
    }}>{children}</div>
  );
}

export function TabBar({ active }: { active?: Screen }) {
  const { nav, screen, openSheet } = useNav();
  const cur = active ?? screen;
  const items: [Screen | 'log', string, React.ReactNode][] = [
    ['home', 'Home', I.home],
    ['timeline', 'Timeline', I.timeline],
    ['log', '', null],
    ['growth-chart', 'Growth', I.growth],
    ['profile', 'Saif', I.baby],
  ];
  return (
    <div style={{
      position: 'sticky', bottom: 0, left: 0, right: 0,
      marginTop: 'auto', flexShrink: 0,
      paddingBottom: 'max(20px, env(safe-area-inset-bottom))', paddingTop: 10,
      background: `linear-gradient(180deg, rgba(244,236,221,0) 0%, rgba(244,236,221,0.95) 40%, ${T.cream} 100%)`,
      zIndex: 30,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        alignItems: 'end', padding: '0 8px',
      }}>
        {items.map(([id, label, icon]) => {
          if (id === 'log') {
            return (
              <div key="log" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: -28 }}>
                <button onClick={openSheet} style={{
                  width: 60, height: 60, borderRadius: 30, background: T.terracotta,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 8px 22px rgba(200,105,74,0.45), 0 0 0 6px ${T.cream}`,
                  border: 'none', cursor: 'pointer',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="#FFFCF5" strokeWidth="2.4" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            );
          }
          const isActive = id === cur;
          return (
            <button key={id} onClick={() => nav(id as Screen)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              padding: '6px 4px', background: 'transparent', border: 'none', cursor: 'pointer',
            }}>
              <div style={{ width: 24, height: 24, color: isActive ? T.terracotta : T.inkMute }}>{icon}</div>
              <div style={{ fontFamily: fonts.sans, fontSize: 10.5, fontWeight: 600, color: isActive ? T.terracotta : T.inkMute, letterSpacing: 0.2 }}>{label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Shared button styles ────────────────────────────────────────

export const iconBtnStyle: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 12,
  background: 'rgba(0,0,0,0.04)', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

export const primaryBtnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: 8, padding: '14px 20px', borderRadius: 16, border: 'none',
  background: T.terracotta, color: T.card,
  fontFamily: fonts.sans, fontSize: 14, fontWeight: 700,
  cursor: 'pointer', letterSpacing: 0.2,
};

export const softBtnStyle: React.CSSProperties = {
  ...primaryBtnStyle,
  background: T.card, color: T.ink, border: `1px solid ${T.rule}`,
};

// ─── CircularTimer ───────────────────────────────────────────────

interface CircularTimerProps {
  color: string;
  soft: string;
  elapsed: number;  // seconds
  sub?: string;
  running?: boolean;
  size?: number;
}

export function CircularTimer({ color, soft, elapsed, sub = '', running = true, size = 232 }: CircularTimerProps) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const stroke = 10;
  const r = size / 2 - stroke / 2 - 4;
  const cx = size / 2;
  const progress = Math.min(1, elapsed / 1800); // max 30min for full ring
  const c = 2 * Math.PI * r;
  return (
    <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={soft} strokeWidth={stroke} />
        <circle cx={cx} cy={cx} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${c * progress} ${c}`}
          transform={`rotate(-90 ${cx} ${cx})`} />
      </svg>
      <div style={{ position: 'relative', textAlign: 'center' }}>
        <div style={{ fontFamily: fonts.serif, fontSize: 60, color: T.ink, fontWeight: 500, letterSpacing: -1.5, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {mm}<span style={{ color: T.inkMute, fontStyle: 'italic' }}>:</span>{ss}
        </div>
        <div style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 6 }}>{sub}</div>
        {running && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 8,
            padding: '3px 8px', borderRadius: 999, background: 'rgba(0,0,0,0.04)',
            fontSize: 10.5, color: T.inkSoft, fontWeight: 600,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: color }} />
            recording
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick Log Sheet ─────────────────────────────────────────────

export function QuickLogSheet({ onClose }: { onClose: () => void }) {
  const { nav } = useNav();
  const items: { id: Screen; label: string; color: string; soft: string; icon: React.ReactNode }[] = [
    { id: 'feeding', label: 'Feed', color: T.terracotta, soft: T.terracottaSoft, icon: I.feed },
    { id: 'pumping', label: 'Pump', color: T.honey, soft: T.honeySoft, icon: I.pump },
    { id: 'sleep', label: 'Sleep', color: T.sage, soft: T.sageSoft, icon: I.sleep },
    { id: 'diaper', label: 'Diaper', color: T.earth, soft: T.earthSoft, icon: I.diaper },
    { id: 'bath', label: 'Bath', color: T.sky, soft: T.skySoft, icon: I.bath },
    { id: 'growth-entry', label: 'Growth', color: T.rose, soft: T.roseSoft, icon: I.measure },
  ];
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, fontFamily: fonts.sans, animation: 'nb-fade 180ms ease' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(42,33,26,0.45)', backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: T.parchment, borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: '14px 18px max(36px, env(safe-area-inset-bottom))',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        animation: 'nb-slide 220ms cubic-bezier(.2,.7,.3,1)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 4, background: T.rule, margin: '0 auto 14px' }} />
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 26, color: T.ink, letterSpacing: -0.4, whiteSpace: 'nowrap', lineHeight: 1.15 }}>
            Log <span style={{ fontStyle: 'italic', color: T.terracotta }}>something</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.inkMute, fontWeight: 600 }}>
            {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
        <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 18 }}>Tap any. Long-press for backdate.</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {items.map((it) => (
            <BigTap key={it.id} label={it.label} color={it.color} soft={it.soft}
              icon={<div style={{ width: 28, height: 28 }}>{it.icon}</div>}
              size="auto"
              onClick={() => { onClose(); setTimeout(() => nav(it.id), 50); }}
              style={{ width: '100%', height: 102 }} />
          ))}
        </div>
        <button onClick={onClose} style={{
          marginTop: 14, width: '100%', padding: 14, borderRadius: 18,
          background: 'transparent', border: `1.5px dashed ${T.rule}`,
          color: T.inkSoft, fontFamily: fonts.sans, fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
        }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Usefulness: format helpers ──────────────────────────────────

export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function fmtTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// ─── useTimer hook ────────────────────────────────────────────────

export function useTimer(running: boolean, startedAt?: Date): number {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0
  );
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return elapsed;
}
