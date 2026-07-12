import { Link } from "react-router-dom";

import { AppShell } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

/** Role-aware not-found page with one clear route back. */
export default function NotFoundPage(): JSX.Element {
  const { user, role } = useAuth();
  const destination =
    user && (role === "staff" || role === "volunteer") ? "/ops" : "/";

  return (
    <AppShell>
      <div className="mx-auto grid max-w-xl gap-4 rounded-lg border border-border bg-card/90 p-6 shadow-[8px_8px_0_rgb(0_0_0/0.16)] dark:shadow-[8px_8px_0_rgb(247_243_232/0.08)]">
        <p className="w-fit rounded-md border border-border bg-background px-3 py-1 text-xs font-black uppercase text-primary">
          404 route
        </p>
        <h1 className="font-display text-5xl font-black uppercase leading-none text-foreground">
          Page Not Found
        </h1>
        <p className="text-muted-foreground">
          The page may have moved or the route may not exist.
        </p>
        <Button asChild className="min-h-11 justify-self-start">
          <Link to={destination}>Return home</Link>
        </Button>
      </div>
    </AppShell>
  );
}
