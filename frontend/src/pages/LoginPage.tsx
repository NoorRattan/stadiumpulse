import { useState, type FormEvent } from "react";
import { LogIn, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabaseConfig";

/** Sign-in page with Google, email, and primary anonymous fan access. */
export default function LoginPage(): JSX.Element {
  const { signInGuest } = useAuth();
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
      <div className="mx-auto grid max-w-xl gap-6">
        <section className="grid gap-2">
          <h1 className="font-display text-4xl font-bold text-foreground">
            Sign In
          </h1>
          <p className="text-muted-foreground">
            Use staff credentials for ops tools, or continue anonymously for the
            fan PWA.
          </p>
        </section>

        <div className="grid gap-4 rounded-lg border border-border bg-card p-4">
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

          <Button
            className="min-h-12 w-full"
            disabled={submitting}
            onClick={() =>
              void signInGuest()
                .then(finishSignIn)
                .catch((caught: unknown) =>
                  toast.error(
                    caught instanceof Error
                      ? caught.message
                      : "Anonymous sign-in failed.",
                  ),
                )
            }
            type="button"
          >
            Continue without an account
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
