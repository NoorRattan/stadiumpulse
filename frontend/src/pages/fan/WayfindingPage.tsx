import { lazy, Suspense, useMemo, useState, type FormEvent } from "react";
import { Navigation } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RouteLine, StepList } from "@/components/wayfinding";
import { useWayfinding } from "@/hooks/useWayfinding";
import { useZoneOptions } from "@/hooks/useZoneOptions";
import type { AccessibilityNeed } from "@/types/domain";

const SeatViewPreview = lazy(
  () => import("@/components/visuals/SeatViewPreview"),
);

const accessibilityNeeds: readonly {
  value: AccessibilityNeed;
  label: string;
}[] = [
  { value: "wheelchair", label: "Step-free route" },
  { value: "visual", label: "Visual assistance" },
  { value: "hearing", label: "Hearing assistance" },
  { value: "cognitive", label: "Simple directions" },
];

/** Fan wayfinding page with zone selectors and accessible route steps. */
export default function WayfindingPage(): JSX.Element {
  const { zones, loading, error } = useZoneOptions();
  const { route, loading: routeLoading, getRoute } = useWayfinding();
  const [fromZoneId, setFromZoneId] = useState("");
  const [toZoneId, setToZoneId] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<AccessibilityNeed[]>([]);

  const firstRoute = route?.routeOptions[0] ?? null;
  const destination = zones.find((zone) => zone.zoneId === toZoneId);
  const fallback = route?.generatedBy === "fallback";
  const zoneItems = useMemo(
    () =>
      zones.map((zone) => (
        <SelectItem key={zone.zoneId} value={zone.zoneId}>
          {zone.name}
        </SelectItem>
      )),
    [zones],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fromZoneId || !toZoneId) {
      toast.error("Choose both a start and destination zone.");
      return;
    }
    try {
      await getRoute({
        fromZoneId,
        toZoneId,
        accessibilityNeeds: selectedNeeds.length > 0 ? selectedNeeds : ["none"],
      });
    } catch (caught) {
      toast.error(
        caught instanceof Error
          ? caught.message
          : "Route fetch failed. Please try again.",
      );
    }
  };

  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="grid gap-3">
          <p className="w-fit rounded-md border border-border bg-card px-3 py-1 text-xs font-black uppercase text-primary">
            Crowd-aware routing
          </p>
          <h1 className="font-display text-5xl font-black uppercase leading-none text-foreground">
            Find Your Way
          </h1>
          <p className="max-w-3xl text-muted-foreground">
            Choose where you are and where you need to go. StadiumPulse keeps
            the full route available as steps, not only as a visual line.
          </p>
        </section>

        {error && (
          <p className="rounded-lg border border-error-text bg-card p-4 text-sm text-error-text">
            Zone options could not be loaded. Check the connection and try
            again.
          </p>
        )}

        <form
          className="grid gap-4 rounded-lg border border-border bg-card/92 p-5 shadow-[8px_8px_0_rgb(0_0_0/0.16)] dark:shadow-[8px_8px_0_rgb(247_243_232/0.08)]"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label id="from-zone-label">From zone</Label>
              <Select value={fromZoneId} onValueChange={setFromZoneId}>
                <SelectTrigger
                  aria-labelledby="from-zone-label"
                  className="min-h-11 w-full"
                >
                  <SelectValue
                    placeholder={
                      loading ? "Loading zones..." : "Choose a start zone"
                    }
                  />
                </SelectTrigger>
                <SelectContent>{zoneItems}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label id="to-zone-label">To zone</Label>
              <Select value={toZoneId} onValueChange={setToZoneId}>
                <SelectTrigger
                  aria-labelledby="to-zone-label"
                  className="min-h-11 w-full"
                >
                  <SelectValue
                    placeholder={
                      loading ? "Loading zones..." : "Choose a destination"
                    }
                  />
                </SelectTrigger>
                <SelectContent>{zoneItems}</SelectContent>
              </Select>
            </div>
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-foreground">
              Accessibility needs
            </legend>
            <div className="grid gap-3 md:grid-cols-2">
              {accessibilityNeeds.map((need) => (
                <label
                  className="flex min-h-11 items-center gap-3 rounded-md border border-border bg-background/70 p-3 text-sm font-semibold text-foreground"
                  key={need.value}
                >
                  <Checkbox
                    checked={selectedNeeds.includes(need.value)}
                    onCheckedChange={(checked) =>
                      setSelectedNeeds((current) =>
                        checked
                          ? [...current, need.value]
                          : current.filter((value) => value !== need.value),
                      )
                    }
                  />
                  {need.label}
                </label>
              ))}
            </div>
          </fieldset>

          <Button
            className="min-h-11 justify-self-start"
            disabled={routeLoading || loading}
            type="submit"
          >
            <Navigation aria-hidden="true" className="size-4" />
            Generate route
          </Button>
        </form>

        {routeLoading && (
          <p className="text-sm text-accent" role="status">
            Finding the least-congested route...
          </p>
        )}
        {fallback && (
          <p className="rounded-lg border border-secondary bg-card p-4 text-sm text-secondary">
            Showing the standard route - live directions are temporarily
            unavailable
          </p>
        )}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
          <RouteLine generatedBy={route?.generatedBy} route={firstRoute} />
          <StepList route={firstRoute} />
        </div>
        {firstRoute && destination?.type === "seating-block" && (
          <Suspense
            fallback={
              <div className="h-72 animate-pulse rounded-3xl bg-muted" />
            }
          >
            <SeatViewPreview sectionName={destination.name} />
          </Suspense>
        )}
      </div>
    </AppShell>
  );
}
