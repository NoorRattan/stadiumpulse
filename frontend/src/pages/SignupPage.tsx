import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import {
  AnimatedAuthPanel,
  CredentialsFields,
  IdentityBackdrop,
} from "@/pages/auth/AuthLayout";
import { createPasswordAccount } from "@/services/authService";
import { supabase } from "@/services/supabaseConfig";

function useSignupForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await createPasswordAccount(email, password);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Account created.");
      void navigate("/");
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Account creation failed.",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return { email, password, setEmail, setPassword, submit, submitting };
}

function SignupForm(): JSX.Element {
  const form = useSignupForm();
  return (
    <AnimatedAuthPanel
      className="flex items-center justify-center border-r border-border p-10 lg:p-16"
      direction={-1}
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
          onSubmit={(event) => void form.submit(event)}
        >
          <div>
            <h1 className="font-display text-3xl font-bold">Sign Up</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Save preferences and unlock full venue tools.
            </p>
          </div>
          <CredentialsFields
            email={form.email}
            emailId="signup-email"
            password={form.password}
            passwordId="signup-password"
            passwordMode="new"
            setEmail={form.setEmail}
            setPassword={form.setPassword}
          />
          <button
            className="brand-gradient-surface inline-flex min-h-12 w-full items-center justify-center gap-2 font-extrabold shadow-[var(--shadow-glow)] transition hover:-translate-y-0.5 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
            disabled={form.submitting}
            type="submit"
          >
            <UserPlus aria-hidden="true" className="size-4" />
            {form.submitting ? "Creating account..." : "Create account"}
          </button>
        </form>
        <div className="mt-6 flex items-center gap-2 border-t border-border pt-6 text-sm text-muted-foreground">
          <Mail aria-hidden="true" className="size-4 shrink-0" />
          <span>Your account opens immediately after signup.</span>
        </div>
      </div>
    </AnimatedAuthPanel>
  );
}

function SignupIdentity(): JSX.Element {
  const benefits = [
    "Multilingual concierge history",
    "Saved accessibility preferences",
    "Crowd-aware route bookmarks",
  ];
  return (
    <div className="relative flex flex-col justify-between overflow-hidden p-10 lg:p-16">
      <IdentityBackdrop accent />
      <div className="relative z-10">
        <span className="inline-flex items-center gap-2 border border-accent/25 bg-accent/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
          Fan profile
        </span>
      </div>
      <div className="relative z-10">
        <p className="font-display text-[clamp(4rem,12vw,10rem)] font-bold leading-none tracking-tighter text-foreground/[0.04] select-none">
          JOIN US
        </p>
        <div className="-mt-10">
          <h2 className="font-display text-5xl font-bold leading-none tracking-tight lg:text-6xl">
            The stadium
            <br />
            <span className="text-gradient">awaits.</span>
          </h2>
          <p className="mt-5 max-w-xs text-base text-muted-foreground">
            Create a fan account to save accessibility preferences and continue
            conversations across visits.
          </p>
        </div>
      </div>
      <div className="relative z-10 grid gap-3">
        {benefits.map((benefit) => (
          <div
            className="flex items-center gap-3 text-sm text-muted-foreground"
            key={benefit}
          >
            <span className="h-px w-5 bg-primary" />
            {benefit}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Email signup with immediate sign-in after account creation. */
export default function SignupPage(): JSX.Element {
  return (
    <AppShell shader="vivid">
      <div className="-mx-5 -mt-10 grid min-h-[92vh] lg:-mx-10 lg:grid-cols-2">
        <SignupForm />
        <SignupIdentity />
      </div>
    </AppShell>
  );
}
