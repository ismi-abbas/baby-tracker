import React, { useState, useCallback, useMemo, useEffect } from "react";
import { NavCtx, QuickLogSheet } from "./components/ui";
import { HomeScreen } from "./screens/HomeScreen";
import { TimelineScreen } from "./screens/TimelineScreen";
import { GrowthChartScreen } from "./screens/GrowthChartScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { FeedingScreen } from "./screens/FeedingScreen";
import { SleepScreen } from "./screens/SleepScreen";
import { PumpingScreen } from "./screens/PumpingScreen";
import { DiaperScreen } from "./screens/DiaperScreen";
import { BathScreen } from "./screens/BathScreen";
import { GrowthEntryScreen } from "./screens/GrowthEntryScreen";
import { InsightsScreen } from "./screens/InsightsScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { useSession } from "./auth/client";
import { T } from "./tokens";
import type { Screen } from "./types";

const SCREENS: Record<Screen, React.ComponentType> = {
  home: HomeScreen,
  timeline: TimelineScreen,
  "growth-chart": GrowthChartScreen,
  profile: ProfileScreen,
  feeding: FeedingScreen,
  bottle: FeedingScreen,
  sleep: SleepScreen,
  pumping: PumpingScreen,
  diaper: DiaperScreen,
  bath: BathScreen,
  "growth-entry": GrowthEntryScreen,
  insights: InsightsScreen,
};

const TABS = new Set<Screen>(["home", "timeline", "growth-chart", "profile"]);

function loadHistory(): Screen[] {
  try {
    const raw = localStorage.getItem("nb.history");
    const arr: unknown = raw ? JSON.parse(raw) : ["home"];
    if (Array.isArray(arr) && arr.every((s) => s in SCREENS))
      return arr as Screen[];
  } catch {}
  return ["home"];
}

function AppShell() {
  const [history, setHistory] = useState<Screen[]>(loadHistory);
  const [direction, setDirection] = useState<"in" | "back">("in");
  const [sheetOpen, setSheetOpen] = useState(false);

  const screen = history[history.length - 1];

  useEffect(() => {
    try {
      localStorage.setItem("nb.history", JSON.stringify(history));
    } catch {}
  }, [history]);

  const nav = useCallback((target: Screen) => {
    if (!(target in SCREENS)) return;
    setDirection("in");
    setHistory((h) => {
      if (h[h.length - 1] === target) return h;
      if (TABS.has(target)) return [target];
      return [...h, target];
    });
  }, []);

  const back = useCallback(() => {
    setDirection("back");
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : ["home"]));
  }, []);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sheetOpen ? closeSheet() : back();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen, back, closeSheet]);

  const ctxVal = useMemo(
    () => ({ nav, back, screen, openSheet }),
    [nav, back, screen, openSheet],
  );

  const ScreenCmp = SCREENS[screen] ?? HomeScreen;

  return (
    <NavCtx.Provider value={ctxVal}>
      <div>
        <div className="nb-scroll" key={`${screen}:${history.length}`}>
          <div
            className={direction === "back" ? "nb-screen-back" : "nb-screen-in"}
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100%",
              flex: 1,
            }}
          >
            <ScreenCmp />
          </div>
        </div>
        {sheetOpen && <QuickLogSheet onClose={closeSheet} />}
      </div>
    </NavCtx.Provider>
  );
}

export function App() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: T.cream,
        }}
      >
        <div style={{ fontSize: 32 }}>👶</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <div className="nb-scroll">
          <LoginScreen />
        </div>
      </div>
    );
  }

  return <AppShell />;
}
