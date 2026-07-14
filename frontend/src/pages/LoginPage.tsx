import { useState, type FormEvent } from "react";
import { ArrowRight, LogIn, Mail, Shield, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "motion/react";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabaseConfig";

const googleAuthEnabled =
  (import.meta.env as Record<string, string | undefined>)
    .VITE_ENABLE_GOOGLE_AUTH === "true";

function errorMessage(caught: unknown): string {
  if (caught instanceof Error) {
    return caught.message;
  }
  if (
    caught &&
    typeof caught === "object" &&
    "message" in caught &&
    typeof caught.message === "string"
  ) {
    return caught.message;
  }
  return "";
}

/** Sign-in page - split-screen brutalist layout with atmospheric glass form. */
export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { loading, user } = useAuth();
  const reducedMotion = useReducedMotionSafe();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finishSignIn = () => {
    void navigate("/account", { replace: true });
  };

  const authErrorMessage = (caught: unknown): string => {
    const rawMessage = errorMessage(caught);
    if (!rawMessage) {
      return "Sign-in failed.";
    }
    const message = rawMessage.toLowerCase();
    if (message.includes("invalid login credentials")) {
      return "No matching account was found. Check the email and password, create an account, or open the public demo.";
    }
    if (message.includes("email not confirmed")) {
      return "This account cannot be used yet. Create a new account or open the public demo.";
    }
    return rawMessage;
  };

  const handleEmailSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        throw error;
      }
      finishSignIn();
    } catch (caught) {
      toast.error(authErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitting;

  if (!loading && user) {
    return <Navigate replace to="/account" />;
  }

  return (
    <AppShell shader="vivid">
      <div className="-mx-5 -mt-10 grid min-h-[92vh] lg:-mx-10 lg:grid-cols-2">
        {/* -- Left side: identity panel -- */}
        <div className="relative flex flex-col justify-between overflow-hidden border-r border-border p-10 lg:p-16">
          {/* Decorative glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-primary/10 blur-[120px]" />
            <div className="absolute -right-32 bottom-1/4 h-64 w-64 rounded-full bg-accent/8 blur-[100px]" />
          </div>

          <motion.div
            className="relative z-10"
            initial={reducedMotion ? false : { opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
              <Shield aria-hidden="true" className="size-3" />
              Secure venue access
            </span>
          </motion.div>

          <motion.div
            className="relative z-10"
            initial={reducedMotion ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            {/* Massive rotated text - decorative */}
            <p className="font-display text-[clamp(4rem,12vw,10rem)] font-bold leading-none tracking-tighter text-foreground/[0.04] select-none">
              SIGN IN
            </p>
            <div className="-mt-10">
              <h1 className="font-display text-5xl font-bold leading-none tracking-tight text-foreground lg:text-6xl">
                Sign In
              </h1>
              <p className="mt-5 max-w-xs text-base text-muted-foreground">
                Sign in with your fan or operations account to access live venue
                tools.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="relative z-10 rounded border border-border bg-card p-4 text-sm leading-6 text-muted-foreground backdrop-blur-sm"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Public route planning and travel tools stay available without
            sign-in. Accounts unlock saved preferences, concierge history, and
            protected operations workflows.
          </motion.div>
        </div>

        {/* -- Right side: form -- */}
        <motion.div
          className="flex items-center justify-center p-10 lg:p-16"
          initial={reducedMotion ? false : { opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        >
          <div className="w-full max-w-sm">
            {googleAuthEnabled && (
              <Button
                className="mb-6 min-h-12 w-full rounded-none font-semibold"
                disabled={disabled}
                onClick={() =>
                  void supabase.auth
                    .signInWithOAuth({ provider: "google" })
                    .then(({ error }) => {
                      if (error) throw error;
                      finishSignIn();
                    })
                    .catch((caught: unknown) =>
                      toast.error(
                        caught instanceof Error
                          ? caught.message
                          : "Google sign-in failed.",
                      ),
                    )
                }
                type="button"
                variant="outline"
              >
                <LogIn aria-hidden="true" className="size-4" />
                Continue with Google
              </Button>
            )}

            <form
              className="grid gap-6"
              onSubmit={(event) => void handleEmailSignIn(event)}
            >
              <div className="grid gap-6">
                <div className="grid gap-1">
                  <label
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    autoComplete="email"
                    className="input-brutalist"
                    id="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div className="grid gap-1">
                  <label
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    autoComplete="current-password"
                    className="input-brutalist"
                    id="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              <button
                className="brand-gradient-surface inline-flex min-h-12 w-full items-center justify-center gap-2 font-extrabold shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                disabled={disabled}
                type="submit"
              >
                <Mail aria-hidden="true" className="size-4" />
                {submitting ? "Signing in..." : "Continue with email"}
              </button>
            </form>

            <div className="mt-4 grid gap-3">
              <Button
                className="min-h-12 w-full rounded-none"
                disabled={disabled}
                onClick={() => void navigate("/demo")}
                type="button"
                variant="outline"
              >
                <UserRound aria-hidden="true" className="size-4" />
                Continue as guest
              </Button>
              <Button
                asChild
                className="min-h-12 w-full rounded-none"
                variant="ghost"
              >
                <Link to="/demo">Open public demo</Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-2 border-t border-border pt-6">
              <p className="text-center text-sm text-muted-foreground">
                New to StadiumPulse?{" "}
                <Link
                  className="inline-flex items-center gap-1 font-semibold text-primary underline-offset-4 hover:underline"
                  to="/signup"
                >
                  Create an account{" "}
                  <ArrowRight aria-hidden="true" className="size-3" />
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
