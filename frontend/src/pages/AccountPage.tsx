import { useState, type FormEvent } from "react";
import {
  Accessibility,
  ArrowRight,
  BotMessageSquare,
  Languages,
  Leaf,
  LogOut,
  Map,
  ShieldCheck,
  TicketCheck,
  UserRound,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { useAuth } from "@/hooks/useAuth";
import { useAccountExperience } from "@/hooks/useExperience";
import { apiRequest } from "@/services/apiClient";
import type { AccessibilitySettingsResponse } from "@/types/api";

/** Signed-in landing page with identity, role, useful destinations, and sign-out. */
export default function AccountPage(): JSX.Element {
  const { profile, role, signOut, user } = useAuth();
  const {
    data: accountData,
    error: accountError,
    loading: accountLoading,
    refresh: refreshAccount,
  } = useAccountExperience();
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

          <section aria-labelledby="passes-heading" className="mt-8">
            <div className="flex items-center gap-3">
              <TicketCheck aria-hidden="true" className="size-6 text-primary" />
              <h2
                className="font-display text-2xl font-bold"
                id="passes-heading"
              >
                Tickets & demo passes
              </h2>
            </div>
            {accountLoading && (
              <p className="mt-4 text-sm text-muted-foreground" role="status">
                Loading account passes…
              </p>
            )}
            {accountError && (
              <p
                className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
                role="alert"
              >
                {accountError}
              </p>
            )}
            {accountData?.tickets.map((ticket) => (
              <article
                className="mt-4 rounded-2xl border border-primary/35 bg-primary/8 p-5"
                key={ticket.ticketId}
              >
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  {ticket.status}
                </p>
                <h3 className="mt-2 font-display text-xl font-bold">
                  {ticket.matchLabel}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {ticket.venueName} · {ticket.gate} · {ticket.seat}
                </p>
                <p className="mt-4 border-t border-border pt-4 text-sm font-semibold text-foreground">
                  {ticket.disclaimer}
                </p>
              </article>
            ))}
          </section>

          {accountData && (
            <section aria-labelledby="preferences-heading" className="mt-8">
              <h2
                className="font-display text-2xl font-bold"
                id="preferences-heading"
              >
                Match-day preferences
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <PreferenceCard
                  icon={Languages}
                  label="Language"
                  value={accountData.preferences.language.toUpperCase()}
                />
                <PreferenceCard
                  icon={Accessibility}
                  label="Accessibility"
                  value={accountData.preferences.accessibilityNeeds.join(", ")}
                />
                <PreferenceCard
                  icon={Leaf}
                  label="Sustainability goal"
                  value={accountData.preferences.sustainabilityGoal}
                />
              </div>
              <AccessibilityPreferencesForm
                accessibilityNeeds={accountData.preferences.accessibilityNeeds}
                language={accountData.preferences.language}
                onSaved={refreshAccount}
              />
            </section>
          )}
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

function AccessibilityPreferencesForm({
  accessibilityNeeds,
  language,
  onSaved,
}: {
  accessibilityNeeds: string[];
  language: string;
  onSaved: () => Promise<void>;
}): JSX.Element {
  const [highContrast, setHighContrast] = useState(
    accessibilityNeeds.includes("high contrast"),
  );
  const [reducedMotion, setReducedMotion] = useState(
    accessibilityNeeds.includes("reduced motion"),
  );
  const [screenReaderMode, setScreenReaderMode] = useState(
    accessibilityNeeds.includes("screen reader mode"),
  );
  const [preferredLanguage, setPreferredLanguage] = useState(language);
  const [saving, setSaving] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    try {
      await apiRequest<
        AccessibilitySettingsResponse,
        AccessibilitySettingsResponse
      >("/api/accessibility/settings", {
        method: "PUT",
        body: {
          highContrast,
          reducedMotion,
          screenReaderMode,
          preferredLanguage,
        },
      });
      await onSaved();
      toast.success("Match-day preferences saved.");
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Preferences could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="mt-5 rounded-2xl border border-border bg-card p-5"
      onSubmit={(event) => void save(event)}
    >
      <h3 className="font-display text-lg font-bold">
        Manage accessibility preferences
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Preferred language
          <select
            className="min-h-11 rounded-lg border border-border bg-background px-3 text-foreground"
            onChange={(event) => setPreferredLanguage(event.target.value)}
            value={preferredLanguage}
          >
            {["en", "es", "pt", "fr", "ar", "de", "ja", "ko", "zh", "hi"].map(
              (option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ),
            )}
          </select>
        </label>
        <fieldset className="grid gap-2">
          <legend className="text-sm font-semibold">
            Display and assistance
          </legend>
          <PreferenceCheckbox
            checked={highContrast}
            label="High contrast"
            onChange={setHighContrast}
          />
          <PreferenceCheckbox
            checked={reducedMotion}
            label="Reduce motion"
            onChange={setReducedMotion}
          />
          <PreferenceCheckbox
            checked={screenReaderMode}
            label="Screen reader mode"
            onChange={setScreenReaderMode}
          />
        </fieldset>
      </div>
      <button
        className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-60"
        disabled={saving}
        type="submit"
      >
        {saving ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}

function PreferenceCheckbox({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}): JSX.Element {
  return (
    <label className="flex min-h-9 items-center gap-2 text-sm">
      <input
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}

function PreferenceCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Languages;
  label: string;
  value: string;
}): JSX.Element {
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <Icon aria-hidden="true" className="size-5 text-accent" />
      <h3 className="mt-3 text-sm font-bold">{label}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </article>
  );
}
