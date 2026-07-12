import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { AppShell, AtmosphericPanel } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/services/supabaseConfig";

/** Email signup page for fan accounts. */
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
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[.82fr_1.18fr] lg:items-center">
        <section className="grid gap-4">
          <p className="w-fit rounded-md border border-border bg-card px-3 py-1 text-xs font-black uppercase text-primary">
            Fan profile
          </p>
          <h1 className="font-display text-5xl font-black uppercase leading-none text-foreground">
            Sign Up
          </h1>
          <p className="max-w-md text-lg leading-8 text-muted-foreground">
            Create a fan account to save accessibility preferences and continue
            conversations across visits.
          </p>
        </section>

        <AtmosphericPanel contentClassName="grid gap-4 p-5 md:p-7">
          <form
            className="grid gap-3"
            onSubmit={(event) => void handleSignup(event)}
          >
            <div className="grid gap-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                autoComplete="email"
                id="signup-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                autoComplete="new-password"
                id="signup-password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            <Button
              className="min-h-12 w-full"
              disabled={submitting}
              type="submit"
            >
              <UserPlus aria-hidden="true" className="size-4" />
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link className="font-semibold text-primary" to="/login">
              Sign in
            </Link>
          </p>
          <p className="flex items-center justify-center gap-2 text-center text-sm text-muted-foreground">
            <Mail aria-hidden="true" className="size-4" />
            Email confirmation may be required.
          </p>
        </AtmosphericPanel>
      </div>
    </AppShell>
  );
}
