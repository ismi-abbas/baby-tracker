import React, { useState, useEffect } from 'react';
import {
  createRootRoute, createRoute, createRouter,
  Outlet, useRouterState, useNavigate,
} from '@tanstack/react-router';
import { useSession } from './auth/client';
import { NavCtx } from './components/ui';
import { QuickLogSheet } from './components/ui';
import { BabyProvider, useBaby } from './context/BabyContext';
import { LoginScreen } from './screens/LoginScreen';
import { SetupScreen } from './screens/SetupScreen';
import { HomeScreen } from './screens/HomeScreen';
import { TimelineScreen } from './screens/TimelineScreen';
import { GrowthChartScreen } from './screens/GrowthChartScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { FeedingScreen } from './screens/FeedingScreen';
import { SleepScreen } from './screens/SleepScreen';
import { PumpingScreen } from './screens/PumpingScreen';
import { DiaperScreen } from './screens/DiaperScreen';
import { BathScreen } from './screens/BathScreen';
import { GrowthEntryScreen } from './screens/GrowthEntryScreen';

// ─── Inner layout — rendered inside BabyProvider ─────────────────

function AppLayout() {
  const { baby, loading: babyLoading } = useBaby();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { location } = useRouterState();
  const navigate = useNavigate();

  useEffect(() => { setSheetOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!babyLoading && !baby && location.pathname !== '/setup') {
      navigate({ to: '/setup', replace: true });
    }
    if (!babyLoading && baby && location.pathname === '/setup') {
      navigate({ to: '/', replace: true });
    }
  }, [babyLoading, baby, location.pathname, navigate]);

  if (babyLoading) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-cream flex items-center justify-center">
        <div className="text-[32px]">👶</div>
      </div>
    );
  }

  return (
    <NavCtx.Provider value={{ openSheet: () => setSheetOpen(true) }}>
      <div className="relative h-full w-full overflow-hidden bg-cream">
        <div className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" key={location.pathname}>
          <div className="flex min-h-full flex-1 flex-col animate-nb-screen-in">
            <Outlet />
          </div>
        </div>
        {sheetOpen && <QuickLogSheet onClose={() => setSheetOpen(false)} />}
      </div>
    </NavCtx.Provider>
  );
}

// ─── Root layout — handles auth ────────────────────────────────────

function RootLayout() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-cream flex items-center justify-center">
        <div className="text-[32px]">👶</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-cream">
        <div className="absolute inset-0 flex flex-col overflow-y-auto overflow-x-hidden [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <LoginScreen />
        </div>
      </div>
    );
  }

  return (
    <BabyProvider>
      <AppLayout />
    </BabyProvider>
  );
}

// ─── Routes ────────────────────────────────────────────────────────

const rootRoute        = createRootRoute({ component: RootLayout });
const homeRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/',                 component: HomeScreen });
const setupRoute       = createRoute({ getParentRoute: () => rootRoute, path: '/setup',            component: SetupScreen });
const timelineRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/timeline',          component: TimelineScreen });
const growthRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/growth',            component: GrowthChartScreen });
const profileRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/profile',           component: ProfileScreen });
const insightsRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/insights',          component: InsightsScreen });
const feedingRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/log/feeding',       component: FeedingScreen });
const sleepRoute       = createRoute({ getParentRoute: () => rootRoute, path: '/log/sleep',         component: SleepScreen });
const pumpingRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/log/pumping',       component: PumpingScreen });
const diaperRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/log/diaper',        component: DiaperScreen });
const bathRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/log/bath',          component: BathScreen });
const growthEntryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/log/growth-entry',  component: GrowthEntryScreen });

const routeTree = rootRoute.addChildren([
  homeRoute, setupRoute, timelineRoute, growthRoute, profileRoute, insightsRoute,
  feedingRoute, sleepRoute, pumpingRoute, diaperRoute, bathRoute, growthEntryRoute,
]);

export const router = createRouter({ routeTree, defaultPreload: 'intent' });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
