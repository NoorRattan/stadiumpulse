import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { AppShell, PageHero } from "@/components/layout";
import { useRolePortal } from "@/hooks/useExperience";
import type { PortalKind, RolePortalResponse } from "@/types/api";

interface PortalCopy {
  title: string;
  badge: string;
  description: string;
  icon: typeof Users;
}

type PortalCardData = RolePortalResponse["cards"][number];

const portalCopy: Record<PortalKind, PortalCopy> = {
  volunteer: {
    title: "Volunteer Portal",
    badge: "Schedules, tasks, and training",
    description:
      "See your synthetic shift, priority tasks, training status, and AI-generated guidance in one role-scoped workspace.",
    icon: Users,
  },
  operations: {
    title: "Organizer Operations",
    badge: "Connected operating picture",
    description:
      "Coordinate crowd, transport, incidents, and staff actions through one human-reviewed venue picture.",
    icon: Activity,
  },
  "venue-staff": {
    title: "Venue Staff Console",
    badge: "Security, medical, cleaning, and crowd teams",
    description:
      "Turn shared synthetic signals into clear team queues, handovers, and explainable priorities.",
    icon: ClipboardCheck,
  },
  "command-center": {
    title: "Admin Command Center",
    badge: "Approval-gated decision support",
    description:
      "Review predictive risks, recommendation reasoning, confidence, and the audit trail before any human action.",
    icon: Radio,
  },
};

function PortalHeader({ copy }: { copy: PortalCopy }): JSX.Element {
  const Icon = copy.icon;
  return (
    <PageHero
      badge={
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
          <Icon aria-hidden="true" className="size-4" /> {copy.badge}
        </span>
      }
      description={copy.description}
      meta={
        <span>
          Role-protected - Synthetic operational data - Human approval required
        </span>
      }
      title={copy.title}
    />
  );
}

function PortalError({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}): JSX.Element {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-destructive/40 bg-destructive/10 p-5"
      role="alert"
    >
      <p>{error}</p>
      <button
        className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 font-bold"
        onClick={onRetry}
        type="button"
      >
        <RefreshCw aria-hidden="true" className="size-4" /> Retry
      </button>
    </div>
  );
}

function PortalCard({ card }: { card: PortalCardData }): JSX.Element {
  return (
    <article className="pulse-panel rounded-2xl p-5 transition-transform hover:-translate-y-1">
      {card.priority === "urgent" ? (
        <AlertTriangle aria-hidden="true" className="size-6 text-destructive" />
      ) : (
        <ShieldCheck aria-hidden="true" className="size-6 text-primary" />
      )}
      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {card.priority} priority - {card.status}
      </p>
      <h3 className="mt-2 font-display text-xl font-bold">{card.title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {card.detail}
      </p>
    </article>
  );
}

function WorkspaceSummary({ data }: { data: RolePortalResponse }): JSX.Element {
  return (
    <section aria-labelledby="portal-headline">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            Current workspace
          </p>
          <h2
            className="mt-2 font-display text-3xl font-bold"
            id="portal-headline"
          >
            {data.headline}
          </h2>
        </div>
        <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {data.role} access
        </span>
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {data.cards.map((card) => (
          <PortalCard card={card} key={card.cardId} />
        ))}
      </div>
    </section>
  );
}

function AdvancedCapabilities({
  capabilities,
}: {
  capabilities: string[];
}): JSX.Element {
  return (
    <section
      aria-labelledby="advanced-capabilities"
      className="pulse-beam rounded-2xl p-6"
    >
      <div className="flex items-center gap-3">
        <Sparkles aria-hidden="true" className="size-6 text-accent" />
        <h2
          className="font-display text-2xl font-bold"
          id="advanced-capabilities"
        >
          Advanced decision support
        </h2>
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {capabilities.map((capability) => (
          <li
            className="rounded-xl border border-border bg-background/60 p-4 text-sm font-semibold"
            key={capability}
          >
            {capability}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm text-muted-foreground">
        These capabilities explain synthetic inputs and recommend actions. They
        do not ingest real cameras or sensors in this demo and never execute
        actions automatically.
      </p>
    </section>
  );
}

function PortalWorkspace({ data }: { data: RolePortalResponse }): JSX.Element {
  return (
    <>
      <WorkspaceSummary data={data} />
      <AdvancedCapabilities capabilities={data.advancedCapabilities} />
    </>
  );
}

/** Role-scoped portal surface; backend role checks remain the security boundary. */
export default function RolePortalPage({
  kind,
}: {
  kind: PortalKind;
}): JSX.Element {
  const { data, error, loading, refresh } = useRolePortal(kind);
  const copy = portalCopy[kind];

  return (
    <AppShell shader="subtle">
      <div className="grid gap-10">
        <PortalHeader copy={copy} />
        {loading && (
          <p className="pulse-panel rounded-xl p-5" role="status">
            Loading role-scoped workspace...
          </p>
        )}
        {error && <PortalError error={error} onRetry={() => void refresh()} />}
        {data && <PortalWorkspace data={data} />}
      </div>
    </AppShell>
  );
}
