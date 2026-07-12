import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, UserPlus, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

import { AppShell } from "@/components/layout";
import { supabase } from "@/services/supabaseConfig";

/** Email signup page - mirrored split-screen from LoginPage. */
export default function SignupPage(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        throw error;
      }
      if (data.session) {
        toast.success("Account created.");
        void navigate("/");
        return;
      }
      toast.success("Check your email to confirm your StadiumPulse account.");
      void navigate("/login");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Account creation failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell shader="vivid">
      <div className="-mx-5 -mt-10 grid min-h-[92vh] lg:-mx-10 lg:grid-cols-2">
        {/* -- Left side: form -- */}
        <motion.div
          className="flex items-center justify-center border-r border-border p-10 lg:p-16"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-full max-w-sm">
            <Link
              className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
              to="/login"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              Back to sign in
            </Link>

            <form
              className="grid gap-8"
              onSubmit={(event) => void handleSignup(event)}
            >
              <div>
                <h1 className="font-display text-3xl font-bold text-foreground">
                  Sign Up
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Save preferences and unlock full venue tools.
                </p>
              </div>

              <div className="grid gap-6">
                <div className="grid gap-1">
                  <label
                    className="text-xs uppercase tracking-widest text-muted-foreground"
                    htmlFor="signup-email"
                  >
                    Email
                  </label>
                  <input
                    autoComplete="email"
                    className="input-brutalist"
                    id="signup-email"
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
                    htmlFor="signup-password"
                  >
                    Password
                  </label>
                  <input
                    autoComplete="new-password"
                    className="input-brutalist"
                    id="signup-password"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Min 8 characters"
                    required
                    type="password"
                    value={password}
                  />
                </div>
              </div>

              <button
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-primary font-semibold text-primary-foreground shadow-[0_0_30px_rgba(0,255,136,0.2)] transition hover:shadow-[0_0_50px_rgba(0,255,136,0.4)] disabled:opacity-50"
                disabled={submitting}
                type="submit"
              >
                <UserPlus aria-hidden="true" className="size-4" />
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
              <Mail aria-hidden="true" className="size-4 shrink-0" />
              <span>Email confirmation may be required.</span>
            </div>
          </div>
        </motion.div>

        {/* -- Right side: identity panel -- */}
        <div className="relative flex flex-col justify-between overflow-hidden p-10 lg:p-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
            <div className="absolute -left-32 bottom-1/4 h-64 w-64 rounded-full bg-primary/8 blur-[100px]" />
          </div>

          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 border border-accent/25 bg-accent/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
              Fan profile
            </span>
          </motion.div>

          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <p className="font-display text-[clamp(4rem,12vw,10rem)] font-bold leading-none tracking-tighter text-foreground/[0.04] select-none">
              JOIN US
            </p>
            <div className="-mt-10">
              <h2 className="font-display text-5xl font-bold leading-none tracking-tight text-foreground lg:text-6xl">
                The stadium
                <br />
                <span className="text-gradient">awaits.</span>
              </h2>
              <p className="mt-5 max-w-xs text-base text-muted-foreground">
                Create a fan account to save accessibility preferences and
                continue conversations across visits.
              </p>
            </div>
          </motion.div>

          <motion.div
            className="relative z-10 grid gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {[
              "Multilingual concierge history",
              "Saved accessibility preferences",
              "Crowd-aware route bookmarks",
            ].map((benefit) => (
              <div
                className="flex items-center gap-3 text-sm text-muted-foreground"
                key={benefit}
              >
                <span className="h-px w-5 bg-primary" />
                {benefit}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
