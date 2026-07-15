import { useState, type FormEvent } from "react";
import { ArrowRight, LogIn, Mail, Shield, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  AnimatedAuthPanel,
  CredentialsFields,
  IdentityBackdrop,
} from "@/pages/auth/AuthLayout";
import { supabase } from "@/services/supabaseConfig";

const googleAuthEnabled =
  (import.meta.env as Record<string, string | undefined>)
    .VITE_ENABLE_GOOGLE_AUTH === "true";

function errorMessage(caught: unknown): string {
  if (caught instanceof Error) return caught.message;
  if (
    caught &&
    typeof caught === "object" &&
    "message" in caught &&
    typeof caught.message === "string"
  )
    return caught.message;
  return "";
}

function authErrorMessage(caught: unknown): string {
  const rawMessage = errorMessage(caught);
  const message = rawMessage.toLowerCase();
  if (!rawMessage) return "Sign-in failed.";
  if (message.includes("invalid login credentials"))
    return "No matching account was found. Check the email and password, create an account, or open the public demo.";
  if (message.includes("email not confirmed"))
    return "This account cannot be used yet. Create a new account or open the public demo.";
  return rawMessage;
}

function LoginIdentity(): JSX.Element {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden border-r border-border p-10 lg:p-16">
      <IdentityBackdrop />
      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
          <Shield aria-hidden="true" className="size-3" />
          Secure venue access
        </span>
      </div>
      <div className="relative z-10">
        <p className="font-display text-[clamp(4rem,12vw,10rem)] font-bold leading-none tracking-tighter text-foreground/[0.04] select-none">
          SIGN IN
        </p>
        <div className="-mt-10">
          <h1 className="font-display text-5xl font-bold leading-none tracking-tight lg:text-6xl">
            Sign In
          </h1>
          <p className="mt-5 max-w-xs text-base text-muted-foreground">
            Use a fan or operations account to access saved and role-protected
            venue tools.
          </p>
        </div>
      </div>
      <div className="relative z-10 rounded border border-border bg-card p-4 text-sm leading-6 text-muted-foreground backdrop-blur-sm">
        Public routing, travel, and the connected seven-workflow demonstration
        remain available without sign-in.
      </div>
    </div>
  );
}

function useLoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const finishSignIn = () => void navigate("/account", { replace: true });
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      finishSignIn();
    } catch (caught) {
      toast.error(authErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };
  return {
    email,
    finishSignIn,
    password,
    setEmail,
    setPassword,
    submit,
    submitting,
  };
}

function GoogleSignIn({
  disabled,
  onSuccess,
}: {
  disabled: boolean;
  onSuccess: () => void;
}): JSX.Element | null {
  if (!googleAuthEnabled) return null;
  const signIn = () =>
    void supabase.auth
      .signInWithOAuth({ provider: "google" })
      .then(({ error }) => {
        if (error) throw error;
        onSuccess();
      })
      .catch((caught: unknown) =>
        toast.error(errorMessage(caught) || "Google sign-in failed."),
      );
  return (
    <Button
      className="mb-6 min-h-12 w-full rounded-none font-semibold"
      disabled={disabled}
      onClick={signIn}
      type="button"
      variant="outline"
    >
      <LogIn aria-hidden="true" className="size-4" />
      Continue with Google
    </Button>
  );
}

function LoginForm(): JSX.Element {
  const navigate = useNavigate();
  const form = useLoginForm();
  return (
    <AnimatedAuthPanel
      className="flex items-center justify-center p-10 lg:p-16"
      delay={0.15}
      direction={1}
    >
      <div className="w-full max-w-sm">
        <GoogleSignIn
          disabled={form.submitting}
          onSuccess={form.finishSignIn}
        />
        <form
          className="grid gap-6"
          onSubmit={(event) => void form.submit(event)}
        >
          <CredentialsFields
            email={form.email}
            emailId="email"
            password={form.password}
            passwordId="password"
            passwordMode="current"
            setEmail={form.setEmail}
            setPassword={form.setPassword}
          />
          <button
            className="brand-gradient-surface inline-flex min-h-12 w-full items-center justify-center gap-2 font-extrabold shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            disabled={form.submitting}
            type="submit"
          >
            <Mail aria-hidden="true" className="size-4" />
            {form.submitting ? "Signing in..." : "Continue with email"}
          </button>
        </form>
        <div className="mt-4 grid gap-3">
          <Button
            className="min-h-12 w-full rounded-none"
            disabled={form.submitting}
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
        <p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          New to StadiumPulse?{" "}
          <Link
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            to="/signup"
          >
            Create an account{" "}
            <ArrowRight aria-hidden="true" className="size-3" />
          </Link>
        </p>
      </div>
    </AnimatedAuthPanel>
  );
}

/** Account sign-in with an immediate public-demo alternative. */
export default function LoginPage(): JSX.Element {
  const { loading, user } = useAuth();
  if (!loading && user) return <Navigate replace to="/account" />;
  return (
    <AppShell shader="vivid">
      <div className="-mx-5 -mt-10 grid min-h-[92vh] lg:-mx-10 lg:grid-cols-2">
        <LoginIdentity />
        <LoginForm />
      </div>
    </AppShell>
  );
}
