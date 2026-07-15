import { type Dispatch, type ReactNode, type SetStateAction } from "react";
import { motion } from "motion/react";

import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";

export function AnimatedAuthPanel({
  children,
  className,
  direction,
  delay = 0,
}: {
  children: ReactNode;
  className: string;
  direction: -1 | 1;
  delay?: number;
}): JSX.Element {
  const reducedMotion = useReducedMotionSafe();
  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className={className}
      initial={reducedMotion ? false : { opacity: 0, x: 20 * direction }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

export function IdentityBackdrop({
  accent = false,
}: {
  accent?: boolean;
}): JSX.Element {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div
        className={`absolute -left-32 top-1/3 h-80 w-80 rounded-full ${accent ? "bg-accent/10" : "bg-primary/10"} blur-[120px]`}
      />
      <div
        className={`absolute -right-32 bottom-1/4 h-64 w-64 rounded-full ${accent ? "bg-primary/8" : "bg-accent/8"} blur-[100px]`}
      />
    </div>
  );
}

export function CredentialsFields({
  email,
  emailId,
  password,
  passwordId,
  passwordMode,
  setEmail,
  setPassword,
}: {
  email: string;
  emailId: string;
  password: string;
  passwordId: string;
  passwordMode: "current" | "new";
  setEmail: Dispatch<SetStateAction<string>>;
  setPassword: Dispatch<SetStateAction<string>>;
}): JSX.Element {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <label
          className="text-xs uppercase tracking-widest text-muted-foreground"
          htmlFor={emailId}
        >
          Email
        </label>
        <input
          autoComplete="email"
          className="input-brutalist"
          id={emailId}
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
          htmlFor={passwordId}
        >
          Password
        </label>
        <input
          autoComplete={
            passwordMode === "new" ? "new-password" : "current-password"
          }
          className="input-brutalist"
          id={passwordId}
          minLength={passwordMode === "new" ? 8 : undefined}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={passwordMode === "new" ? "Min 8 characters" : "••••••••"}
          required
          type="password"
          value={password}
        />
      </div>
    </div>
  );
}
