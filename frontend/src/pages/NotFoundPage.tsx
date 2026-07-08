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
      <div className="mx-auto grid max-w-xl gap-4">
        <h1 className="font-display text-4xl font-bold text-foreground">
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
