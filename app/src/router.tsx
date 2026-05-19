import React, { useState, useEffect } from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useRouterState,
} from '@tanstack/react-router';
import { useSession } from './auth/client';
import { NavCtx } from './components/ui';
import { QuickLogSheet } from './components/ui';
import { LoginScreen } from './screens/LoginScreen';
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
import { T } from './tokens';

function RootLayout() {
  const { data: session, isPending } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { location } = useRouterState();

  // Close sheet on navigation
  useEffect(() => { setSheetOpen(false); }, [location.pathname]);

  if (isPending) {
    return (
      <div className="nb-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.cream }}>
        <div style={{ fontSize: 32 }}>👶</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="nb-shell">
        <div className="nb-scroll">
          <LoginScreen />
        </div>
      </div>
    );
  }

  const animClass = 'nb-screen-in';

  return (
    <NavCtx.Provider value={{ openSheet: () => setSheetOpen(true) }}>
      <div className="nb-shell">
        <div className="nb-scroll" key={location.pathname}>
          <div className={animClass} style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', flex: 1 }}>
            <Outlet />
          </div>
        </div>
        {sheetOpen && <QuickLogSheet onClose={() => setSheetOpen(false)} />}
      </div>
    </NavCtx.Provider>
  );
}

const rootRoute = createRootRoute({ component: RootLayout });

const homeRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/',                  component: HomeScreen });
const timelineRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/timeline',           component: TimelineScreen });
const growthRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/growth',             component: GrowthChartScreen });
const profileRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/profile',            component: ProfileScreen });
const insightsRoute    = createRoute({ getParentRoute: () => rootRoute, path: '/insights',           component: InsightsScreen });
const feedingRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/log/feeding',        component: FeedingScreen });
const sleepRoute       = createRoute({ getParentRoute: () => rootRoute, path: '/log/sleep',          component: SleepScreen });
const pumpingRoute     = createRoute({ getParentRoute: () => rootRoute, path: '/log/pumping',        component: PumpingScreen });
const diaperRoute      = createRoute({ getParentRoute: () => rootRoute, path: '/log/diaper',         component: DiaperScreen });
const bathRoute        = createRoute({ getParentRoute: () => rootRoute, path: '/log/bath',           component: BathScreen });
const growthEntryRoute = createRoute({ getParentRoute: () => rootRoute, path: '/log/growth-entry',   component: GrowthEntryScreen });

const routeTree = rootRoute.addChildren([
  homeRoute, timelineRoute, growthRoute, profileRoute, insightsRoute,
  feedingRoute, sleepRoute, pumpingRoute, diaperRoute, bathRoute, growthEntryRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
