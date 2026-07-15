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
import type {
  AccessibilitySettingsResponse,
  AccountExperienceResponse,
} from "@/types/api";

function DestinationCard({
  accent,
  description,
  href,
  icon: Icon,
  label,
  title,
}: {
  accent: "primary" | "accent";
  description: string;
  href: string;
  icon: typeof Map;
  label: string;
  title: string;
}): JSX.Element {
  const tone = accent === "primary" ? "text-primary" : "text-accent";
  return (
    <Link
      className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
      to={href}
    >
      <Icon aria-hidden="true" className={`size-6 ${tone}`} />
      <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <span
        className={`mt-5 inline-flex items-center gap-2 text-sm font-bold ${tone}`}
      >
        {label}
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-1"
        />
      </span>
    </Link>
  );
}

function AccountDestinations({ role }: { role: string }): JSX.Element {
  const operationsAccess = role === "staff" || role === "volunteer";
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      <DestinationCard
        accent="primary"
        description="Choose accessibility preferences and find a calmer path."
        href="/wayfinding"
        icon={Map}
        label="Open wayfinding"
        title="Plan a route"
      />
      <DestinationCard
        accent="accent"
        description="Continue with multilingual venue guidance tied to your account."
        href="/concierge"
        icon={BotMessageSquare}
        label="Ask for help"
        title="Ask the concierge"
      />
      {operationsAccess && (
        <Link
          className="group rounded-2xl border border-secondary/35 bg-secondary/8 p-5 sm:col-span-2"
          to="/ops"
        >
          <ShieldCheck aria-hidden="true" className="size-6 text-secondary" />
          <h2 className="mt-5 font-display text-xl font-bold">
            Operations workspace
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Your {role} role can access protected venue decision-support tools.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-secondary">
            Open operations
            <ArrowRight aria-hidden="true" className="size-4" />
          </span>
        </Link>
      )}
    </div>
  );
}

function PassesSection({
  data,
  error,
  loading,
}: {
  data: AccountExperienceResponse | null;
  error: string | null;
  loading: boolean;
}): JSX.Element {
  return (
    <section aria-labelledby="passes-heading" className="mt-8">
      <div className="flex items-center gap-3">
        <TicketCheck aria-hidden="true" className="size-6 text-primary" />
        <h2 className="font-display text-2xl font-bold" id="passes-heading">
          Tickets & demo passes
        </h2>
      </div>
      {loading && (
        <p className="mt-4 text-sm text-muted-foreground" role="status">
          Loading account passes…
        </p>
      )}
      {error && (
        <p
          className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4"
          role="alert"
        >
          {error}
        </p>
      )}
      {data?.tickets.map((ticket) => (
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
          <p className="mt-4 border-t border-border pt-4 text-sm font-semibold">
            {ticket.disclaimer}
          </p>
        </article>
      ))}
    </section>
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

function usePreferenceForm(
  needs: string[],
  language: string,
  onSaved: () => Promise<void>,
) {
  const [highContrast, setHighContrast] = useState(
    needs.includes("high contrast"),
  );
  const [reducedMotion, setReducedMotion] = useState(
    needs.includes("reduced motion"),
  );
  const [screenReaderMode, setScreenReaderMode] = useState(
    needs.includes("screen reader mode"),
  );
  const [preferredLanguage, setPreferredLanguage] = useState(language);
  const [saving, setSaving] = useState(false);
  const save = async (event: FormEvent<HTMLFormElement>) => {
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
  return {
    highContrast,
    preferredLanguage,
    reducedMotion,
    save,
    saving,
    screenReaderMode,
    setHighContrast,
    setPreferredLanguage,
    setReducedMotion,
    setScreenReaderMode,
  };
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
  const form = usePreferenceForm(accessibilityNeeds, language, onSaved);
  return (
    <form
      className="mt-5 rounded-2xl border border-border bg-card p-5"
      onSubmit={(event) => void form.save(event)}
    >
      <h3 className="font-display text-lg font-bold">
        Manage accessibility preferences
      </h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Preferred language
          <select
            className="min-h-11 rounded-lg border border-border bg-background px-3"
            onChange={(event) => form.setPreferredLanguage(event.target.value)}
            value={form.preferredLanguage}
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
            checked={form.highContrast}
            label="High contrast"
            onChange={form.setHighContrast}
          />
          <PreferenceCheckbox
            checked={form.reducedMotion}
            label="Reduce motion"
            onChange={form.setReducedMotion}
          />
          <PreferenceCheckbox
            checked={form.screenReaderMode}
            label="Screen reader mode"
            onChange={form.setScreenReaderMode}
          />
        </fieldset>
      </div>
      <button
        className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-60"
        disabled={form.saving}
        type="submit"
      >
        {form.saving ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}

function PreferencesSection({
  data,
  onSaved,
}: {
  data: AccountExperienceResponse;
  onSaved: () => Promise<void>;
}): JSX.Element {
  const { accessibilityNeeds, language, sustainabilityGoal } = data.preferences;
  return (
    <section aria-labelledby="preferences-heading" className="mt-8">
      <h2 className="font-display text-2xl font-bold" id="preferences-heading">
        Match-day preferences
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <PreferenceCard
          icon={Languages}
          label="Language"
          value={language.toUpperCase()}
        />
        <PreferenceCard
          icon={Accessibility}
          label="Accessibility"
          value={accessibilityNeeds.join(", ")}
        />
        <PreferenceCard
          icon={Leaf}
          label="Sustainability goal"
          value={sustainabilityGoal}
        />
      </div>
      <AccessibilityPreferencesForm
        accessibilityNeeds={accessibilityNeeds}
        language={language}
        onSaved={onSaved}
      />
    </section>
  );
}

function AccountSidebar({
  email,
  role,
  signOut,
}: {
  email: string;
  role: string;
  signOut: () => Promise<void>;
}): JSX.Element {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = async () => {
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
    <aside className="h-fit rounded-2xl border border-border bg-card p-5 sm:p-6">
      <span className="grid size-12 place-content-center rounded-full bg-primary/10 text-primary">
        <UserRound aria-hidden="true" className="size-6" />
      </span>
      <h2 className="mt-5 font-display text-xl font-bold">Account details</h2>
      <dl className="mt-5 grid gap-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd className="mt-1 break-all font-semibold">{email}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Access level</dt>
          <dd className="mt-1 font-semibold capitalize">{role}</dd>
        </div>
      </dl>
      <button
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 px-4 font-bold text-destructive disabled:opacity-60"
        disabled={signingOut}
        onClick={() => void handleSignOut()}
        type="button"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {signingOut ? "Signing out..." : "Sign out"}
      </button>
    </aside>
  );
}

/** Signed-in landing page with identity, preferences, destinations, and sign-out. */
export default function AccountPage(): JSX.Element {
  const { profile, role, signOut, user } = useAuth();
  const account = useAccountExperience();
  const metadataName =
    typeof user?.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : "StadiumPulse member";
  const displayName = profile?.displayName || metadataName;
  const email = profile?.email || user?.email || "Email unavailable";
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
          <AccountDestinations role={role} />
          <PassesSection
            data={account.data}
            error={account.error}
            loading={account.loading}
          />
          {account.data && (
            <PreferencesSection data={account.data} onSaved={account.refresh} />
          )}
        </section>
        <AccountSidebar email={email} role={role} signOut={signOut} />
      </div>
    </AppShell>
  );
}
