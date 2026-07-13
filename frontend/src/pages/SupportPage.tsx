import { Code2, Mail, Scale, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { AppShell, PageHero } from "@/components/layout";

export type SupportSection = "about" | "contact" | "privacy" | "terms";

const copy: Record<
  SupportSection,
  { badge: string; title: string; description: string }
> = {
  about: {
    badge: "About the project",
    title: "One Match Day. One Shared Picture.",
    description:
      "StadiumPulse is a connected FIFA World Cup 2026 demonstration for accessible fan journeys and human-reviewed venue operations.",
  },
  contact: {
    badge: "Project support",
    title: "Contact StadiumPulse",
    description:
      "Use the AI concierge for venue questions and GitHub Issues for asynchronous project support. Neither channel replaces emergency services.",
  },
  privacy: {
    badge: "Demo privacy notice",
    title: "Privacy in Plain Language",
    description:
      "Understand which account and preference data the demonstration uses, why it is needed, and which data the public scenario does not collect.",
  },
  terms: {
    badge: "Demonstration terms",
    title: "Terms of Use",
    description:
      "StadiumPulse is decision support and a synthetic demonstration—not a ticket issuer, emergency system, or autonomous venue-control platform.",
  },
};

/** Accessible support and policy pages with direct, non-legalistic product boundaries. */
export default function SupportPage({
  section,
}: {
  section: SupportSection;
}): JSX.Element {
  const current = copy[section];

  return (
    <AppShell shader="subtle">
      <div className="grid gap-10">
        <PageHero
          badge={
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">
              <ShieldCheck aria-hidden="true" className="size-4" />
              {current.badge}
            </span>
          }
          description={current.description}
          title={current.title}
        />

        {section === "about" && (
          <div className="grid gap-5 lg:grid-cols-3">
            {[
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
            ].map(([Icon, title, detail]) => {
              const CardIcon = Icon as typeof Users;
              return (
                <article
                  className="rounded-2xl border border-border bg-card p-6"
                  key={title as string}
                >
                  <CardIcon
                    aria-hidden="true"
                    className="size-6 text-primary"
                  />
                  <h2 className="mt-5 font-display text-xl font-bold">
                    {title as string}
                  </h2>
                  <p className="mt-3 leading-7 text-muted-foreground">
                    {detail as string}
                  </p>
                </article>
              );
            })}
          </div>
        )}

        {section === "contact" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-2xl border border-primary/35 bg-primary/8 p-6">
              <Mail aria-hidden="true" className="size-6 text-primary" />
              <h2 className="mt-5 font-display text-2xl font-bold">
                Venue questions
              </h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                The automated concierge is available at any time in ten
                supported languages for gates, seats, routes, amenities, and
                match-day travel.
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
                asynchronous with no guaranteed hours, response time, or
                service-level agreement.
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
              For an urgent venue or safety issue, contact on-site staff or
              local emergency services. The concierge and GitHub are not
              emergency channels.
            </p>
          </div>
        )}

        {section === "privacy" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <PolicyCard title="Data used for signed-in accounts">
              Supabase Authentication provides the account identifier and email.
              The backend profile stores display name, role, and preferred
              language. Accessibility settings are stored only when a signed-in
              user chooses them.
            </PolicyCard>
            <PolicyCard title="Public demo data">
              Public crowd, event, sustainability, alert, ticket-pass, venue,
              and match values are synthetic or curated demonstration data. They
              are not physical sensor readings or official ticket records.
            </PolicyCard>
            <PolicyCard title="AI requests">
              Concierge messages and signed-in AI-enhanced requests may be sent
              to the configured Groq model. Do not enter passwords, payment
              details, medical records, or emergency information.
            </PolicyCard>
            <PolicyCard title="Your choices">
              You can use the public experience without an account, adjust
              accessibility preferences, and sign out from the Account page.
              Project data questions can be raised through GitHub Issues.
            </PolicyCard>
          </div>
        )}

        {section === "terms" && (
          <div className="grid gap-4">
            <PolicyCard title="Demonstration only">
              StadiumPulse is provided as a free technical demonstration. It
              does not sell tickets, take payments, guarantee venue entry, or
              replace official tournament and venue information.
            </PolicyCard>
            <PolicyCard title="Safety and operational decisions">
              Do not rely on StadiumPulse for emergencies. Fans must follow
              on-site staff and official safety instructions. Staff
              recommendations require authorized human approval; the system
              never executes venue actions autonomously.
            </PolicyCard>
            <PolicyCard title="Accounts and acceptable use">
              Keep account credentials private. Do not abuse the AI,
              authentication, rate-limited APIs, or role controls, and do not
              attempt to access another user's or venue team's data.
            </PolicyCard>
            <PolicyCard title="Tickets and external services">
              Ticket links lead to FIFA's official website. FIFA, Supabase,
              Groq, Render, Cloudflare, and linked services operate under their
              own terms and policies.
            </PolicyCard>
          </div>
        )}
      </div>
    </AppShell>
  );
}

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
