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

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RouteFrame>
        <HomePage />
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
