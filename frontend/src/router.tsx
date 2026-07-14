import { lazy, Suspense, type ReactNode } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";

import { ErrorBoundary } from "./components/layout/ErrorBoundary";
import { useAuth } from "./hooks/useAuth";

const HomePage = lazy(() => import("./pages/fan/HomePage"));
const ConciergePage = lazy(() => import("./pages/fan/ConciergePage"));
const WayfindingPage = lazy(() => import("./pages/fan/WayfindingPage"));
const TravelPage = lazy(() => import("./pages/fan/TravelPage"));
const DashboardPage = lazy(() => import("./pages/ops/DashboardPage"));
const IncidentsPage = lazy(() => import("./pages/ops/IncidentsPage"));
const BriefingsPage = lazy(() => import("./pages/ops/BriefingsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const PublicExperiencePage = lazy(
  () => import("./pages/fan/PublicExperiencePage"),
);
const SupportPage = lazy(() => import("./pages/SupportPage"));
const RolePortalPage = lazy(() => import("./pages/ops/RolePortalPage"));
const CockpitPage = lazy(() => import("./pages/CockpitPage"));

function RouteFrame({ children }: { children: ReactNode }): JSX.Element {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="grid min-h-[50vh] place-content-center px-6 py-10 text-muted-foreground">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

function OpsGuard({ children }: { children: ReactNode }): JSX.Element {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-content-center px-6 py-10 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) {
    return <Navigate replace to="/login" />;
  }
  if (role !== "staff" && role !== "volunteer") {
    return <Navigate replace to="/" />;
  }
  return <>{children}</>;
}

function AccountGuard({ children }: { children: ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-content-center px-6 py-10 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) {
    return <Navigate replace to="/login" />;
  }
  return <>{children}</>;
}

function StaffGuard({ children }: { children: ReactNode }): JSX.Element {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-content-center px-6 py-10 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate replace to="/login" />;
  if (role !== "staff") return <Navigate replace to="/account" />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  {
    path: "/fan",
    element: (
      <RouteFrame>
        <CockpitPage kind="fan" />
      </RouteFrame>
    ),
  },
  {
    path: "/",
    element: (
      <RouteFrame>
        <HomePage />
      </RouteFrame>
    ),
  },
  {
    path: "/matches",
    element: (
      <RouteFrame>
        <PublicExperiencePage section="matches" />
      </RouteFrame>
    ),
  },
  {
    path: "/venues",
    element: (
      <RouteFrame>
        <PublicExperiencePage section="venues" />
      </RouteFrame>
    ),
  },
  {
    path: "/accessibility",
    element: (
      <RouteFrame>
        <PublicExperiencePage section="accessibility" />
      </RouteFrame>
    ),
  },
  {
    path: "/amenities",
    element: (
      <RouteFrame>
        <PublicExperiencePage section="amenities" />
      </RouteFrame>
    ),
  },
  {
    path: "/events",
    element: (
      <RouteFrame>
        <PublicExperiencePage section="events" />
      </RouteFrame>
    ),
  },
  {
    path: "/sustainability",
    element: (
      <RouteFrame>
        <PublicExperiencePage section="sustainability" />
      </RouteFrame>
    ),
  },
  {
    path: "/alerts",
    element: (
      <RouteFrame>
        <PublicExperiencePage section="alerts" />
      </RouteFrame>
    ),
  },
  {
    path: "/help",
    element: (
      <RouteFrame>
        <PublicExperiencePage section="help" />
      </RouteFrame>
    ),
  },
  {
    path: "/about",
    element: (
      <RouteFrame>
        <SupportPage section="about" />
      </RouteFrame>
    ),
  },
  {
    path: "/contact",
    element: (
      <RouteFrame>
        <SupportPage section="contact" />
      </RouteFrame>
    ),
  },
  {
    path: "/privacy",
    element: (
      <RouteFrame>
        <SupportPage section="privacy" />
      </RouteFrame>
    ),
  },
  {
    path: "/terms",
    element: (
      <RouteFrame>
        <SupportPage section="terms" />
      </RouteFrame>
    ),
  },
  {
    path: "/concierge",
    element: (
      <RouteFrame>
        <ConciergePage />
      </RouteFrame>
    ),
  },
  {
    path: "/wayfinding",
    element: (
      <RouteFrame>
        <WayfindingPage />
      </RouteFrame>
    ),
  },
  {
    path: "/travel",
    element: (
      <RouteFrame>
        <TravelPage />
      </RouteFrame>
    ),
  },
  {
    path: "/account",
    element: (
      <AccountGuard>
        <RouteFrame>
          <AccountPage />
        </RouteFrame>
      </AccountGuard>
    ),
  },
  {
    path: "/volunteer",
    element: (
      <RouteFrame>
        <CockpitPage kind="volunteer" />
      </RouteFrame>
    ),
  },
  {
    path: "/staff",
    element: (
      <RouteFrame>
        <CockpitPage kind="staff" />
      </RouteFrame>
    ),
  },
  {
    path: "/organizer",
    element: (
      <RouteFrame>
        <CockpitPage kind="organizer" />
      </RouteFrame>
    ),
  },
  {
    path: "/ops/organizer",
    element: (
      <StaffGuard>
        <RouteFrame>
          <RolePortalPage kind="operations" />
        </RouteFrame>
      </StaffGuard>
    ),
  },
  {
    path: "/ops/venue-staff",
    element: (
      <StaffGuard>
        <RouteFrame>
          <RolePortalPage kind="venue-staff" />
        </RouteFrame>
      </StaffGuard>
    ),
  },
  {
    path: "/ops/command",
    element: (
      <StaffGuard>
        <RouteFrame>
          <RolePortalPage kind="command-center" />
        </RouteFrame>
      </StaffGuard>
    ),
  },
  {
    path: "/ops",
    element: (
      <OpsGuard>
        <RouteFrame>
          <DashboardPage />
        </RouteFrame>
      </OpsGuard>
    ),
  },
  {
    path: "/ops/incidents",
    element: (
      <OpsGuard>
        <RouteFrame>
          <IncidentsPage />
        </RouteFrame>
      </OpsGuard>
    ),
  },
  {
    path: "/ops/briefings",
    element: (
      <OpsGuard>
        <RouteFrame>
          <BriefingsPage />
        </RouteFrame>
      </OpsGuard>
    ),
  },
  {
    path: "/demo",
    element: (
      <RouteFrame>
        <DemoPage />
      </RouteFrame>
    ),
  },
  {
    path: "/login",
    element: (
      <RouteFrame>
        <LoginPage />
      </RouteFrame>
    ),
  },
  {
    path: "/signup",
    element: (
      <RouteFrame>
        <SignupPage />
      </RouteFrame>
    ),
  },
  {
    path: "*",
    element: (
      <RouteFrame>
        <NotFoundPage />
      </RouteFrame>
    ),
  },
]);

/** Mounted React Router provider for the app. */
export function AppRouter(): JSX.Element {
  return <RouterProvider router={router} />;
}
