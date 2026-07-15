import { Code2, Mail, Scale, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell, PageHero } from "@/components/layout";

export type SupportSection = "about" | "contact" | "privacy" | "terms";

const copy = {
  about: [
    "About the project",
    "One Match Day. One Shared Picture.",
    "StadiumPulse is a connected FIFA World Cup 2026 demonstration for accessible fan journeys and human-reviewed venue operations.",
  ],
  contact: [
    "Project support",
    "Contact StadiumPulse",
    "Use the AI concierge for venue questions and GitHub Issues for asynchronous project support. Neither channel replaces emergency services.",
  ],
  privacy: [
    "Demo privacy notice",
    "Privacy in Plain Language",
    "Understand which account and preference data the demonstration uses, why it is needed, and which data the public scenario does not collect.",
  ],
  terms: [
    "Demonstration terms",
    "Terms of Use",
    "StadiumPulse is decision support and a synthetic demonstration—not a ticket issuer, emergency system, or autonomous venue-control platform.",
  ],
} satisfies Record<SupportSection, readonly [string, string, string]>;

function PolicyCard({
  children,
  title,
}: {
  children: string;
  title: string;
}): JSX.Element {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <p className="mt-3 leading-7 text-muted-foreground">{children}</p>
    </section>
  );
}

function AboutContent(): JSX.Element {
  const cards = [
    [
      Users,
      "For fans and venue teams",
      "Fans get routes, language help, accessibility information, travel, amenities, events, alerts, and sustainability guidance. Authorized teams get role-scoped operational tools.",
    ],
    [
      ShieldCheck,
      "Deterministic before generative",
      "Rules compute route, crowd, and forecast values. GenAI explains or translates them without changing safety-critical numbers.",
    ],
    [
      Scale,
      "Human control",
      "Every incident, briefing, alert, and command recommendation remains subject to authorized human review.",
    ],
  ] as const;
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {cards.map(([Icon, title, detail]) => (
        <article
          className="rounded-2xl border border-border bg-card p-6"
          key={title}
        >
          <Icon aria-hidden="true" className="size-6 text-primary" />
          <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
          <p className="mt-3 leading-7 text-muted-foreground">{detail}</p>
        </article>
      ))}
    </div>
  );
}

function ContactContent(): JSX.Element {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <article className="rounded-2xl border border-primary/35 bg-primary/8 p-6">
        <Mail aria-hidden="true" className="size-6 text-primary" />
        <h2 className="mt-5 font-display text-2xl font-bold">
          Venue questions
        </h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          The automated concierge is available in ten supported languages for
          gates, seats, routes, amenities, and match-day travel.
        </p>
        <Link
          className="mt-5 inline-flex min-h-11 items-center font-bold text-primary"
          to="/concierge"
        >
          Open the concierge
        </Link>
      </article>
      <article className="rounded-2xl border border-border bg-card p-6">
        <Code2 aria-hidden="true" className="size-6 text-accent" />
        <h2 className="mt-5 font-display text-2xl font-bold">
          Human project support
        </h2>
        <p className="mt-3 leading-7 text-muted-foreground">
          Report a technical problem through GitHub Issues. Support is
          asynchronous with no guaranteed response time.
        </p>
        <a
          className="mt-5 inline-flex min-h-11 items-center font-bold text-accent"
          href="https://github.com/NoorRattan/stadiumpulse/issues"
          rel="noreferrer"
          target="_blank"
        >
          Open GitHub Issues
        </a>
      </article>
      <p className="rounded-xl border border-destructive/30 bg-destructive/8 p-5 text-sm lg:col-span-2">
        For an urgent venue or safety issue, contact on-site staff or local
        emergency services. The concierge and GitHub are not emergency channels.
      </p>
    </div>
  );
}

function PrivacyContent(): JSX.Element {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <PolicyCard title="Data used for signed-in accounts">
        Supabase Authentication provides the account identifier and email. The
        backend stores display name, role, language, and user-selected
        accessibility settings.
      </PolicyCard>
      <PolicyCard title="Public demo data">
        Public crowd, event, sustainability, alert, ticket-pass, venue, and
        match values are synthetic or curated demonstration data, not physical
        sensor readings or official tickets.
      </PolicyCard>
      <PolicyCard title="AI requests">
        Concierge messages and signed-in AI requests may be sent to the
        configured Groq model. Do not enter passwords, payment details, medical
        records, or emergency information.
      </PolicyCard>
      <PolicyCard title="Your choices">
        Use the public experience without an account, adjust local accessibility
        preferences, and sign out from the Account page. Raise project data
        questions through GitHub Issues.
      </PolicyCard>
    </div>
  );
}

function TermsContent(): JSX.Element {
  return (
    <div className="grid gap-4">
      <PolicyCard title="Demonstration only">
        StadiumPulse is a free technical demonstration. It does not sell
        tickets, take payments, guarantee venue entry, or replace official
        tournament information.
      </PolicyCard>
      <PolicyCard title="Safety and operational decisions">
        Do not rely on StadiumPulse for emergencies. Follow on-site staff and
        official instructions. Staff recommendations require authorized human
        approval.
      </PolicyCard>
      <PolicyCard title="Accounts and acceptable use">
        Keep credentials private. Do not abuse the AI, authentication,
        rate-limited APIs, role controls, or another user&apos;s data.
      </PolicyCard>
      <PolicyCard title="Tickets and external services">
        Ticket links lead to FIFA&apos;s official website. FIFA, Supabase, Groq,
        Render, Cloudflare, and linked services use their own terms.
      </PolicyCard>
    </div>
  );
}

function SupportContent({ section }: { section: SupportSection }): JSX.Element {
  if (section === "about") return <AboutContent />;
  if (section === "contact") return <ContactContent />;
  if (section === "privacy") return <PrivacyContent />;
  return <TermsContent />;
}

/** Accessible support and policy pages with direct product boundaries. */
export default function SupportPage({
  section,
}: {
  section: SupportSection;
}): JSX.Element {
  const [badge, title, description] = copy[section];
  const badgeContent = (
    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
      <ShieldCheck aria-hidden="true" className="size-4" />
      {badge}
    </span>
  );
  return (
    <AppShell shader="subtle">
      <div className="grid gap-10">
        <PageHero
          badge={badgeContent}
          description={description}
          title={title}
        />
        <SupportContent section={section} />
      </div>
    </AppShell>
  );
}
