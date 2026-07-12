import { useState, type FormEvent } from "react";
import { LogIn, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppShell, AtmosphericPanel } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/services/supabaseConfig";

const googleAuthEnabled =
  (import.meta.env as Record<string, string | undefined>)
    .VITE_ENABLE_GOOGLE_AUTH === "true";

/** Sign-in page with email auth and optional Google OAuth. */
export default function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finishSignIn = () => {
    void navigate("/");
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
      toast.error(
        caught instanceof Error ? caught.message : "Email sign-in failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
        <section className="grid gap-4">
          <p className="w-fit rounded-md border border-border bg-card px-3 py-1 text-xs font-black uppercase text-primary">
            Secure venue access
          </p>
          <h1 className="font-display text-5xl font-black uppercase leading-none text-foreground">
            Sign In
          </h1>
          <p className="max-w-md text-lg leading-8 text-muted-foreground">
            Sign in with your fan or operations account to use live venue tools.
          </p>
          <div className="hidden rounded-lg border border-border bg-card/85 p-5 text-sm leading-6 text-muted-foreground shadow-[8px_8px_0_rgb(0_0_0/0.16)] lg:block dark:shadow-[8px_8px_0_rgb(247_243_232/0.08)]">
            Public route planning and travel tools stay available without
            sign-in. Accounts unlock saved preferences, concierge history, and
            protected operations workflows.
          </div>
        </section>

        <AtmosphericPanel contentClassName="grid gap-4 p-5 md:p-7">
          {googleAuthEnabled && (
            <Button
              className="min-h-12 w-full"
              disabled={submitting}
              onClick={() =>
                void supabase.auth
                  .signInWithOAuth({ provider: "google" })
                  .then(({ error }) => {
                    if (error) {
                      throw error;
                    }
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
            className="grid gap-3"
            onSubmit={(event) => void handleEmailSignIn(event)}
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="current-password"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </div>
            <Button
              className="min-h-12 w-full"
              disabled={submitting}
              type="submit"
            >
              <Mail aria-hidden="true" className="size-4" />
              Continue with email
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Guest access is currently unavailable. Use a verified account so
            your accessibility settings and conversations can be saved safely.
          </p>
          <p className="text-center text-sm text-muted-foreground">
            New to StadiumPulse?{" "}
            <Link className="font-semibold text-primary" to="/signup">
              Create an account
            </Link>
          </p>
        </AtmosphericPanel>
      </div>
    </AppShell>
  );
}
