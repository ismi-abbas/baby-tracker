import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useState,
  useEffect,
} from "react";
import { Temporal } from "@js-temporal/polyfill";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useBaby } from "../context/BabyContext";
import { T } from "../tokens";
import { I } from "./Icons";
import { Calendar } from "./calendar";
import { cn } from "../lib/utils";
import type { Screen } from "../types";

// ─── Route map ───────────────────────────────────────────────────

const TABS = new Set<Screen>(["home", "timeline", "growth-chart", "profile"]);

export const SCREEN_PATHS: Record<Screen, string> = {
  home: "/",
  timeline: "/timeline",
  "growth-chart": "/growth",
  profile: "/profile",
  insights: "/insights",
  feeding: "/log/feeding",
  bottle: "/log/feeding",
  sleep: "/log/sleep",
  pumping: "/log/pumping",
  diaper: "/log/diaper",
  bath: "/log/bath",
  "growth-entry": "/log/growth-entry",
};

const PATH_TO_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_PATHS).map(([k, v]) => [v, k as Screen]),
) as Record<string, Screen>;

// ─── Nav Context (carries only openSheet — nav/back/screen come from router) ──

export const NavCtx = createContext<{ openSheet: () => void }>({
  openSheet: () => {},
});

export function useNav() {
  const navigate = useNavigate();
  const { location } = useRouterState();
  const { openSheet } = useContext(NavCtx);

  const screen = PATH_TO_SCREEN[location.pathname] ?? "home";

  const nav = useCallback(
    (target: Screen) => {
      navigate({
        to: SCREEN_PATHS[target] as never,
        replace: TABS.has(target),
      });
    },
    [navigate],
  );

  const back = useCallback(() => {
    window.history.back();
  }, []);

  return { nav, back, screen, openSheet };
}

// ─── Primitives ──────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  pad?: number;
  tone?: keyof typeof T | string;
  radius?: number;
  onClick?: () => void;
}

const bgClassByColor: Record<string, string> = {
  [T.cream]: "bg-cream",
  [T.parchment]: "bg-parchment",
  [T.card]: "bg-card",
  [T.terracotta]: "bg-terracotta",
  [T.terracottaSoft]: "bg-terracotta-soft",
  [T.sage]: "bg-sage",
  [T.sageSoft]: "bg-sage-soft",
  [T.honey]: "bg-honey",
  [T.honeySoft]: "bg-honey-soft",
  [T.sky]: "bg-sky",
  [T.skySoft]: "bg-sky-soft",
  [T.rose]: "bg-rose",
  [T.roseSoft]: "bg-rose-soft",
  [T.earth]: "bg-earth",
  [T.earthSoft]: "bg-earth-soft",
  "rgba(0,0,0,0.04)": "bg-black/4",
  "rgba(255,252,245,0.5)": "bg-card/50",
  transparent: "bg-transparent",
};

const textClassByColor: Record<string, string> = {
  [T.card]: "text-card",
  [T.ink]: "text-ink",
  [T.inkSoft]: "text-ink-soft",
  [T.inkMute]: "text-ink-mute",
  [T.terracotta]: "text-terracotta",
  [T.sage]: "text-sage",
  [T.honey]: "text-honey",
  [T.sky]: "text-sky",
  [T.rose]: "text-rose",
  [T.earth]: "text-earth",
  "#7C5A21": "text-[#7C5A21]",
};

const toneClassByName: Partial<Record<keyof typeof T, string>> = {
  cream: "bg-cream",
  parchment: "bg-parchment",
  card: "bg-card",
  terracotta: "bg-terracotta",
  terracottaSoft: "bg-terracotta-soft",
  sage: "bg-sage",
  sageSoft: "bg-sage-soft",
  honey: "bg-honey",
  honeySoft: "bg-honey-soft",
  sky: "bg-sky",
  skySoft: "bg-sky-soft",
  rose: "bg-rose",
  roseSoft: "bg-rose-soft",
  earth: "bg-earth",
  earthSoft: "bg-earth-soft",
};

const padClassByValue: Record<number, string> = {
  0: "p-0",
  12: "p-3",
  14: "p-3.5",
  16: "p-4",
  18: "p-[18px]",
};

const radiusClassByValue: Record<number, string> = {
  12: "rounded-xl",
  16: "rounded-2xl",
  18: "rounded-[18px]",
  22: "rounded-[22px]",
  28: "rounded-[28px]",
};

function toneClass(tone: keyof typeof T | string) {
  return toneClassByName[tone as keyof typeof T] ?? bgClassByColor[tone] ?? "";
}

export function Card({
  children,
  className,
  pad = 16,
  tone = "card",
  radius = 22,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "shadow-card",
        toneClass(tone),
        radiusClassByValue[radius],
        padClassByValue[pad],
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface ChipProps {
  children: React.ReactNode;
  color?: string;
  soft?: string;
  className?: string;
}

export function Chip({
  children,
  color = T.terracotta,
  soft,
  className,
}: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-sans text-xs font-semibold tracking-[0.2px]",
        bgClassByColor[soft ?? "rgba(0,0,0,0.04)"],
        textClassByColor[color],
        className,
      )}
    >
      {children}
    </span>
  );
}

interface BigTapProps {
  label: string;
  color: string;
  soft: string;
  icon: React.ReactNode;
  size?: number | "auto";
  onClick?: () => void;
  className?: string;
}

export function BigTap({
  label,
  color,
  soft,
  icon,
  size = 96,
  onClick,
  className,
}: BigTapProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[28px] border-0 font-sans shadow-[inset_0_2px_0_rgba(58,40,20,0.04),0_1px_2px_rgba(58,40,20,0.04)]",
        size === 96 && "h-24 w-24",
        bgClassByColor[soft],
        textClassByColor[color],
        className,
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center">{icon}</div>
      <div className="text-[13px] font-semibold">{label}</div>
    </button>
  );
}

interface PillBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  primary?: boolean;
  soft?: string;
  color?: string;
}

export function PillBtn({
  children,
  primary,
  soft,
  color = T.ink,
  className,
  ...rest
}: PillBtnProps) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-0 px-5 py-3 font-sans text-[15px] font-semibold tracking-[0.1px]",
        bgClassByColor[primary ? T.terracotta : (soft ?? "transparent")],
        textClassByColor[primary ? "#FFFCF5" : color],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SyncBadge({ partner = "Lina" }: { partner?: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-sage/14 py-1 pr-2.5 pl-1.5 font-sans text-[11.5px] font-semibold text-sage">
      <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-sage text-[8px] font-bold text-card">
        L
      </span>
      Synced · {partner}
    </div>
  );
}

export function BackBtn({ dark }: { dark?: boolean }) {
  const { back } = useNav();
  return (
    <button
      onClick={back}
      className={cn(
        "flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-xl border-0",
        dark ? "bg-card/8" : "bg-black/4",
      )}
    >
      <div
        className={cn(
          "h-[18px] w-[18px] rotate-180",
          dark ? "text-[#EDE7D6]" : "text-ink",
        )}
      >
        {I.chev}
      </div>
    </button>
  );
}

export function Screen({
  children,
  bg = T.cream,
  color,
}: {
  children: React.ReactNode;
  bg?: string;
  color?: string;
}) {
  return (
    <div
      className={cn(
        "relative box-border flex min-h-full w-full flex-col pt-[max(16px,env(safe-area-inset-top))] font-sans",
        bgClassByColor[bg],
        color && textClassByColor[color],
      )}
    >
      {children}
    </div>
  );
}

export function TabBar({ active }: { active?: Screen }) {
  const { nav, screen, openSheet } = useNav();
  const { baby } = useBaby();
  const cur = active ?? screen;
  const babyLabel = baby?.name?.split(" ")[0] ?? "Baby";
  const items: [Screen | "log", string, React.ReactNode][] = [
    ["home", "Home", I.home],
    ["timeline", "Timeline", I.timeline],
    ["log", "", null],
    ["growth-chart", "Growth", I.growth],
    ["profile", babyLabel, I.baby],
  ];
  return (
    <div className="sticky right-0 bottom-0 left-0 z-30 mt-auto shrink-0 bg-[linear-gradient(180deg,rgba(244,236,221,0)_0%,rgba(244,236,221,0.95)_40%,#f4ecdd_100%)] pt-2.5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <div className="grid animate-nb-slide grid-cols-5 items-end px-2">
        {items.map(([id, label, icon]) => {
          if (id === "log") {
            return (
              <div
                key="log"
                className="mt-[-28px] flex items-center justify-center"
              >
                <button
                  onClick={openSheet}
                  className="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded-full border-0 bg-terracotta shadow-[0_8px_22px_rgba(200,105,74,0.45),0_0_0_6px_#f4ecdd]"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 5v14M5 12h14"
                      stroke="#FFFCF5"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            );
          }
          const isActive = id === cur;
          return (
            <button
              key={id}
              onClick={() => nav(id as Screen)}
              className="flex cursor-pointer flex-col items-center gap-[3px] border-0 bg-transparent px-1 py-1.5"
            >
              <div
                className={cn(
                  "h-6 w-6",
                  isActive ? "text-terracotta" : "text-ink-mute",
                )}
              >
                {icon}
              </div>
              <div
                className={cn(
                  "font-sans text-[10.5px] font-semibold tracking-[0.2px]",
                  isActive ? "text-terracotta" : "text-ink-mute",
                )}
              >
                {label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Entry mode toggle (Live / Manual) ──────────────────────────

export function EntryModeToggle({
  mode,
  onChange,
}: {
  mode: "live" | "manual";
  onChange: (m: "live" | "manual") => void;
}) {
  return (
    <div className="inline-flex rounded-[10px] bg-black/5 p-[3px]">
      {(["live", "manual"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "cursor-pointer rounded-lg border-0 px-[18px] py-[7px] font-sans text-[12.5px] font-bold transition-all duration-150",
            mode === m
              ? "bg-card text-terracotta shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
              : "bg-transparent text-ink-mute",
          )}
        >
          {m === "live" ? "⏱ Live" : "✎ Manual"}
        </button>
      ))}
    </div>
  );
}

// ─── DateTime field ───────────────────────────────────────────────

const inputCls =
  "box-border w-full rounded-xl border-[1.5px] border-rule bg-card px-3.5 py-3 text-sm text-ink outline-none [color-scheme:light]";

export function DateTimeField({
  label,
  value,
  onChange,
  type = "datetime-local",
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "datetime-local" | "date" | "time";
  max?: string;
}) {
  return (
    <div>
      {label && (
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.5px] text-ink-mute">
          {label}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={max}
        className={inputCls}
      />
    </div>
  );
}

// ─── Shared button styles ────────────────────────────────────────

export const iconBtnClassName =
  "flex h-[38px] w-[38px] cursor-pointer items-center justify-center rounded-xl border-0 bg-black/4";

export const primaryBtnClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-0 bg-terracotta px-5 py-3.5 font-sans text-sm font-bold tracking-[0.2px] text-card";

export const softBtnClassName =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-rule bg-card px-5 py-3.5 font-sans text-sm font-bold tracking-[0.2px] text-ink";

// ─── CircularTimer ───────────────────────────────────────────────

interface CircularTimerProps {
  color: string;
  soft: string;
  elapsed: number; // seconds
  sub?: string;
  running?: boolean;
  size?: number;
}

export function CircularTimer({
  color,
  soft,
  elapsed,
  sub = "",
  running = true,
  size = 232,
}: CircularTimerProps) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const stroke = 10;
  const r = size / 2 - stroke / 2 - 4;
  const cx = size / 2;
  const progress = Math.min(1, elapsed / 1800); // max 30min for full ring
  const c = 2 * Math.PI * r;
  return (
    <div
      className={cn(
        "relative flex items-center justify-center",
        size === 232 && "h-[232px] w-[232px]",
      )}
    >
      <svg width={size} height={size} className="absolute inset-0">
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={soft}
          strokeWidth={stroke}
        />
        <circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
          transform={`rotate(-90 ${cx} ${cx})`}
        />
      </svg>
      <div className="relative text-center">
        <div className="font-serif text-[60px] leading-none font-medium tracking-[-1.5px] text-ink tabular-nums">
          {mm}
          <span className="italic text-ink-mute">:</span>
          {ss}
        </div>
        <div className="mt-1.5 text-[11.5px] font-semibold tracking-[0.6px] text-ink-mute uppercase">
          {sub}
        </div>
        {running && (
          <div className="mt-2 inline-flex items-center gap-[5px] rounded-full bg-black/4 px-2 py-[3px] text-[10.5px] font-semibold text-ink-soft">
            <span
              className={cn("h-1.5 w-1.5 rounded-full", bgClassByColor[color])}
            />
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
  const items: {
    id: Screen;
    label: string;
    color: string;
    soft: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "feeding",
      label: "Feed",
      color: T.terracotta,
      soft: T.terracottaSoft,
      icon: I.feed,
    },
    {
      id: "pumping",
      label: "Pump",
      color: T.honey,
      soft: T.honeySoft,
      icon: I.pump,
    },
    {
      id: "sleep",
      label: "Sleep",
      color: T.sage,
      soft: T.sageSoft,
      icon: I.sleep,
    },
    {
      id: "diaper",
      label: "Diaper",
      color: T.earth,
      soft: T.earthSoft,
      icon: I.diaper,
    },
    { id: "bath", label: "Bath", color: T.sky, soft: T.skySoft, icon: I.bath },
    {
      id: "growth-entry",
      label: "Growth",
      color: T.rose,
      soft: T.roseSoft,
      icon: I.measure,
    },
  ];
  return (
    <div className="fixed inset-0 z-[100] font-sans animate-nb-fade">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 backdrop-blur"
      />
      <div className="absolute right-0 bottom-0 left-0 animate-nb-slide rounded-t-[32px] bg-parchment px-[18px] pt-3.5 pb-[max(36px,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.18)]">
        <div className="mx-auto mb-3.5 h-1 w-10 rounded bg-rule" />
        <div className="mb-1 flex items-baseline justify-between">
          <div className="font-serif text-[26px] leading-[1.15] tracking-[-0.4px] whitespace-nowrap text-ink">
            Log <span className="italic text-terracotta">something</span>
          </div>
          <div className="text-[11.5px] font-semibold text-ink-mute">
            {new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
        </div>
        <div className="mb-[18px] text-[13px] text-ink-soft">
          Tap any. Long-press for backdate.
        </div>
        <div className="grid grid-cols-3 gap-3">
          {items.map((it) => (
            <BigTap
              key={it.id}
              label={it.label}
              color={it.color}
              soft={it.soft}
              icon={<div className="h-7 w-7">{it.icon}</div>}
              size="auto"
              onClick={() => {
                onClose();
                setTimeout(() => nav(it.id), 50);
              }}
              className="h-[102px] w-full"
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-3.5 w-full cursor-pointer rounded-[18px] border-[1.5px] border-dashed border-rule bg-transparent p-3.5 font-sans text-[13px] font-semibold text-ink-soft"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Usefulness: format helpers ──────────────────────────────────

export function fmtDuration(seconds: number): string {
  const d = Temporal.Duration.from({ seconds: Math.round(seconds) }).round({
    largestUnit: "hours",
    smallestUnit: "minutes",
  });
  if (d.hours > 0) return `${d.hours}h ${d.minutes}m`;
  return `${d.minutes}m`;
}

export function fmtTimeAgo(iso: string): string {
  const secs = Math.round(
    Temporal.Now.instant().since(Temporal.Instant.from(iso)).total("seconds"),
  );
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

export function fmtTime(iso: string): string {
  const secs = Math.round(
    Temporal.Now.instant().since(Temporal.Instant.from(iso)).total("seconds"),
  );
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── useTimer hook ────────────────────────────────────────────────

export function useTimer(running: boolean, startedAt?: Date): number {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0,
  );
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  return elapsed;
}
