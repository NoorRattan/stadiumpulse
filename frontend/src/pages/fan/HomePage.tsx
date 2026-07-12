import { useContext, useRef } from "react";
import {
  ArrowRight,
  BotMessageSquare,
  CalendarDays,
  Globe2,
  Map,
  MessageSquare,
  Radio,
  ShieldCheck,
  Train,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

import { ConciergeChat } from "@/components/concierge";
import { AppShell, GlassCard } from "@/components/layout";
import { AnimatedCounter } from "@/components/motion/AnimatedCounter";
import { FadeInView } from "@/components/motion/FadeInView";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageContext } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useMatches } from "@/hooks/useMatches";
import { apiRequest } from "@/services/apiClient";
import type { ChatRequest, ChatResponse } from "@/types/api";

const quickActions = [
  {
    label: "Ask the Concierge",
    description:
      "Multilingual GenAI answers about gates, seats, and amenities.",
    href: "/concierge",
    icon: MessageSquare,
    step: "01",
    accent: "#00ff88",
  },
  {
    label: "Find My Way",
    description: "Crowd-aware routing with accessibility preferences.",
    href: "/wayfinding",
    icon: Map,
    step: "02",
    accent: "#00d4ff",
  },
  {
    label: "Travel Options",
    description: "Sustainable transit and lower-congestion arrivals.",
    href: "/travel",
    icon: Train,
    step: "03",
    accent: "#ff6b35",
  },
] as const;

const capabilities = [
  {
    icon: BotMessageSquare,
    title: "Multilingual Concierge",
    description:
      "GenAI voice and text assistance in multiple languages for fans, volunteers, and staff.",
    metric: 12,
    metricLabel: "languages supported",
    accentColor: "primary" as const,
    delay: 0,
  },
  {
    icon: Users,
    title: "Crowd Digital Twin",
    description:
      "Selectable 3D operations twin with live density bands and 15-minute forecasts.",
    metric: 94,
    metricLabel: "zone coverage %",
    accentColor: "accent" as const,
    delay: 0.05,
  },
  {
    icon: ShieldCheck,
    title: "Ops Intelligence",
    description:
      "Ranked command digest, incident drafts, and volunteer briefings - all human-approved.",
    metric: 15,
    metricLabel: "min decision window",
    accentColor: "primary" as const,
    delay: 0.1,
  },
  {
    icon: Globe2,
    title: "Sustainable Arrivals",
    description:
      "Transit load estimates and lower-congestion travel suggestions for every match.",
    metric: 3,
    metricLabel: "transport modes",
    accentColor: "secondary" as const,
    delay: 0.15,
  },
] as const;

function formatMatchDate(value: string): string {
  if (!value) {
    return "Schedule time to be confirmed";
  }
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Fan landing page with cinematic hero, live metrics, and match-day tools. */
export default function HomePage(): JSX.Element {
  const { matches, loading } = useMatches();
  const { user } = useAuth();
  const language = useContext(LanguageContext)?.language ?? "en";
  const sessionId = useRef<string>();
  const nextMatch = matches[0];

  return (
    <AppShell shader="vivid">
      <div className="grid gap-0">
        {/* ===========================================
            HERO - Full viewport, bottom-aligned text
        ============================================ */}
        <section
          aria-label="Stadium Pulse hero"
          className="relative -mx-5 -mt-10 flex min-h-[92vh] flex-col justify-end overflow-hidden px-5 pb-16 pt-32 lg:-mx-10 lg:px-10"
        >
          {/* Live badge */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <span className="live-pulse inline-flex items-center gap-2 border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              FIFA World Cup 2026
            </span>
          </motion.div>

          {/* Giant headline */}
          <div className="max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="font-display text-[clamp(3rem,10vw,9rem)] font-bold leading-none tracking-tighter text-foreground">
                Your match day, <br />
                <span className="text-gradient">without the guesswork.</span>
              </h1>
            </motion.div>
          </div>

          <motion.p
            className="mt-8 max-w-xl text-base leading-7 text-muted-foreground md:text-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          >
            GenAI-powered venue intelligence for fans, organizers, volunteers,
            and staff. Navigate crowds, get multilingual help, and make
            real-time operational decisions.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          >
            <Link
              className="inline-flex min-h-12 items-center gap-2 bg-primary px-7 font-semibold text-primary-foreground shadow-[0_0_40px_rgba(0,255,136,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_60px_rgba(0,255,136,0.5)]"
              to="/wayfinding"
            >
              Plan my route <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center gap-2 border border-white/15 bg-white/[0.04] px-7 font-semibold text-foreground backdrop-blur-xl transition-all hover:border-white/30 hover:bg-white/[0.08]"
              to="/demo"
            >
              <Zap aria-hidden="true" className="size-4 text-accent" />
              Explore live demo
            </Link>
          </motion.div>

          <motion.div
            className="mt-8 flex flex-wrap gap-x-8 gap-y-2 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <span className="inline-flex items-center gap-2">
              <ShieldCheck
                aria-hidden="true"
                className="size-3.5 text-primary"
              />
              Accessible by design
            </span>
            <span className="inline-flex items-center gap-2">
              <Radio aria-hidden="true" className="size-3.5 text-accent" />
              Live operational signals
            </span>
          </motion.div>

          {/* Bottom fade-out */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent"
          />
        </section>

        {/* ===========================================
            STATS RAIL
        ============================================ */}
        <FadeInView>
          <section
            aria-label="Live venue metrics"
            className="border-y border-white/[0.06] py-12"
          >
            <div className="grid grid-cols-3 divide-x divide-white/[0.06]">
              {[
                { label: "Monitored zones", value: 28, suffix: "" },
                { label: "Languages supported", value: 12, suffix: "+" },
                { label: "Decision window", value: 15, suffix: " min" },
              ].map((metric) => (
                <div
                  className="flex flex-col items-center justify-center px-4 py-6 text-center"
                  key={metric.label}
                >
                  <p className="font-display text-4xl font-bold text-foreground sm:text-5xl lg:text-6xl">
                    <AnimatedCounter
                      suffix={metric.suffix}
                      value={metric.value}
                    />
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </FadeInView>

        {/* ===========================================
            CAPABILITIES BENTO GRID
        ============================================ */}
        <FadeInView delay={0.05}>
          <section
            aria-labelledby="capabilities-heading"
            className="grid gap-10 py-20"
          >
            <div className="flex items-end justify-between gap-8">
              <div className="max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  - Capabilities
                </p>
                <h2
                  className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl"
                  id="capabilities-heading"
                >
                  Intelligent.
                  <br />
                  <span className="text-muted-foreground">
                    Venue operations.
                  </span>
                </h2>
              </div>
              <p className="hidden max-w-xs text-sm leading-6 text-muted-foreground lg:block">
                One crowd signal powers fan routing, a selectable 3D operations
                twin, predictive staff decisions, and incident automation.
              </p>
            </div>
            <div className="grid gap-px border border-white/[0.06] bg-white/[0.06] md:grid-cols-2">
              {capabilities.map((cap, index) => {
                const Icon = cap.icon;
                return (
                  <GlassCard
                    accentColor={cap.accentColor}
                    className="rounded-none border-0"
                    delay={cap.delay}
                    hover
                    key={cap.title}
                    magnetic
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-mono text-xs text-muted-foreground/50">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Icon
                        aria-hidden="true"
                        className="size-5 text-primary transition group-hover:scale-110"
                      />
                    </div>
                    <h3 className="mt-5 font-display text-xl font-bold text-foreground">
                      {cap.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {cap.description}
                    </p>
                    <p className="mt-5 font-mono text-3xl font-bold text-foreground">
                      <AnimatedCounter
                        suffix={
                          cap.metricLabel.includes("%")
                            ? "%"
                            : cap.metricLabel.includes("min")
                              ? ""
                              : "+"
                        }
                        value={cap.metric}
                      />
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {cap.metricLabel}
                    </p>
                  </GlassCard>
                );
              })}
            </div>
          </section>
        </FadeInView>

        {/* ===========================================
            PROCESS - ARRIVE. NAVIGATE. EXPERIENCE.
        ============================================ */}
        <FadeInView delay={0.1}>
          <section
            aria-labelledby="quick-actions-heading"
            className="grid gap-10 py-20"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                - Process
              </p>
              <h2
                className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground md:text-5xl"
                id="quick-actions-heading"
              >
                Arrive.
                <br />
                Navigate.
                <br />
                <span className="text-muted-foreground">Experience.</span>
              </h2>
            </div>

            <div className="grid gap-0 border-t border-white/[0.06]">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.href}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                  >
                    <Link
                      className="group flex items-center justify-between gap-6 border-b border-white/[0.06] py-8 transition-colors hover:bg-white/[0.01]"
                      to={action.href}
                    >
                      <div className="flex items-center gap-6">
                        <span className="hidden font-mono text-xs text-muted-foreground/40 sm:block">
                          {action.step}
                        </span>
                        <span
                          className="grid size-12 shrink-0 place-content-center border"
                          style={{
                            borderColor: action.accent + "40",
                            color: action.accent,
                          }}
                        >
                          <Icon aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                          <p className="font-display text-xl font-bold text-foreground">
                            {action.label}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-2 group-hover:text-foreground"
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </FadeInView>

        {/* ===========================================
            MATCH + CONCIERGE SPLIT
        ============================================ */}
        <FadeInView delay={0.15}>
          <section
            aria-labelledby="match-heading"
            className="grid gap-px border border-white/[0.06] bg-white/[0.06] py-0 lg:grid-cols-2"
          >
            <Card className="rounded-none border-0 bg-black p-8">
              <CardHeader className="p-0">
                <CardTitle
                  className="flex items-center gap-2.5 font-display text-sm uppercase tracking-widest text-muted-foreground"
                  id="match-heading"
                >
                  <CalendarDays aria-hidden="true" className="size-4" />
                  Today's Match
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-6 p-0">
                {loading && (
                  <p className="text-sm text-accent" role="status">
                    Loading match schedule...
                  </p>
                )}
                {!loading && nextMatch && (
                  <div className="grid gap-4">
                    <p className="font-display text-3xl font-bold text-foreground md:text-4xl">
                      {nextMatch.homeTeam}
                      <br />
                      <span className="text-muted-foreground">vs.</span>
                      <br />
                      {nextMatch.awayTeam}
                    </p>
                    <div className="mt-4 border-t border-white/[0.06] pt-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">
                        Kickoff
                      </p>
                      <p className="mt-1 font-mono text-sm text-foreground">
                        {formatMatchDate(nextMatch.kickoffAt)}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                        Transit load estimate
                      </p>
                      <p className="mt-1 font-mono text-sm text-secondary">
                        {nextMatch.transitLoadEstimate}
                      </p>
                    </div>
                  </div>
                )}
                {!loading && !nextMatch && (
                  <p className="text-sm text-muted-foreground">
                    No live match scheduled. Check back on match day.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-none border-0 bg-black p-8">
              <CardHeader className="p-0">
                <CardTitle className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                  Concierge Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-6 p-0">
                {user ? (
                  <ConciergeChat
                    initialMessages={[
                      {
                        id: "home-welcome",
                        role: "assistant",
                        text: "Need a fast answer? Open the concierge for full chat history.",
                      },
                    ]}
                    onSendMessage={async (message) => {
                      const response = await apiRequest<
                        ChatResponse,
                        ChatRequest
                      >("/api/concierge/chat", {
                        method: "POST",
                        body: {
                          sessionId: sessionId.current,
                          message,
                          language,
                        },
                      });
                      sessionId.current = response.sessionId;
                      return response.reply;
                    }}
                  />
                ) : (
                  <div className="grid gap-5">
                    <p className="text-sm leading-6 text-muted-foreground">
                      Sign in to start a private concierge conversation and keep
                      your accessibility preferences in sync.
                    </p>
                    <Link
                      className="inline-flex min-h-11 items-center gap-2 border border-primary/40 bg-primary/5 px-5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                      to="/login"
                    >
                      Sign in to ask{" "}
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        </FadeInView>

        {/* ===========================================
            BOTTOM CTA STRIP
        ============================================ */}
        <FadeInView delay={0.2}>
          <section className="flex flex-col items-center gap-8 py-28 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Ready to experience it?
            </p>
            <h2 className="font-display text-5xl font-bold tracking-tight text-foreground md:text-7xl">
              Enter the arena.
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                className="inline-flex min-h-12 items-center gap-2 bg-primary px-8 font-semibold text-primary-foreground shadow-[0_0_40px_rgba(0,255,136,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_0_60px_rgba(0,255,136,0.4)]"
                to="/demo"
              >
                Explore live demo <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center gap-2 border border-white/15 bg-white/[0.04] px-8 font-semibold text-foreground transition hover:bg-white/[0.08]"
                to="/wayfinding"
              >
                Plan my route
              </Link>
            </div>
          </section>
        </FadeInView>
      </div>
    </AppShell>
  );
}
