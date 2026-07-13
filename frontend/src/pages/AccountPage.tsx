import { useState } from "react";
import {
  ArrowRight,
  BotMessageSquare,
  LogOut,
  Map,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";

/** Signed-in landing page with identity, role, useful destinations, and sign-out. */
export default function AccountPage(): JSX.Element {
  const { profile, role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const displayName =
    profile?.displayName ||
    (typeof user?.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "StadiumPulse member");
  const email = profile?.email || user?.email || "Email unavailable";
  const hasOperationsAccess = role === "staff" || role === "volunteer";

  const handleSignOut = async (): Promise<void> => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success("Signed out successfully.");
      void navigate("/", { replace: true });
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Sign-out failed. Please try again.",
      );
      setSigningOut(false);
    }
  };

  return (
    <AppShell shader="subtle">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Signed in
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Welcome, {displayName}.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
            Your account keeps your StadiumPulse identity available across fan
            tools and shows the access level verified by the backend.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              to="/wayfinding"
            >
              <Map aria-hidden="true" className="size-6 text-primary" />
              <h2 className="mt-5 font-display text-xl font-bold">
                Plan a route
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Choose accessibility preferences and find a calmer path.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
                Open wayfinding
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
            <Link
              className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-accent/50"
              to="/concierge"
            >
              <BotMessageSquare
                aria-hidden="true"
                className="size-6 text-accent"
              />
              <h2 className="mt-5 font-display text-xl font-bold">
                Ask the concierge
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Continue with multilingual venue guidance tied to your account.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-accent">
                Ask for help
                <ArrowRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
            {hasOperationsAccess && (
              <Link
                className="group rounded-2xl border border-secondary/35 bg-secondary/8 p-5 sm:col-span-2"
                to="/ops"
              >
                <ShieldCheck
                  aria-hidden="true"
                  className="size-6 text-secondary"
                />
                <h2 className="mt-5 font-display text-xl font-bold">
                  Operations workspace
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Your {role} role can access protected venue decision-support
                  tools.
                </p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-secondary">
                  Open operations
                  <ArrowRight aria-hidden="true" className="size-4" />
                </span>
              </Link>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 sm:p-6">
          <span className="grid size-12 place-content-center rounded-full bg-primary/10 text-primary">
            <UserRound aria-hidden="true" className="size-6" />
          </span>
          <h2 className="mt-5 font-display text-xl font-bold">
            Account details
          </h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-1 break-all font-semibold text-foreground">
                {email}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Access level</dt>
              <dd className="mt-1 font-semibold capitalize text-foreground">
                {role}
              </dd>
            </div>
          </dl>
          <button
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 px-4 font-bold text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground disabled:cursor-wait disabled:opacity-60"
            disabled={signingOut}
            onClick={() => void handleSignOut()}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4" />
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </aside>
      </div>
    </AppShell>
  );
}
