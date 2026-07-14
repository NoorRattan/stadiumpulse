import { useMemo, useState, type FormEvent } from "react";
import { Navigation } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";

import { AppShell } from "@/components/layout";
import { FadeInView } from "@/components/motion/FadeInView";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RouteLine, StepList } from "@/components/wayfinding";
import SeatViewPreview from "@/components/visuals/SeatViewPreview";
import { useWayfinding } from "@/hooks/useWayfinding";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useZoneOptions } from "@/hooks/useZoneOptions";
import type { AccessibilityNeed } from "@/types/domain";

const accessibilityNeeds: readonly {
  value: AccessibilityNeed;
  label: string;
}[] = [
  { value: "wheelchair", label: "Step-free route" },
  { value: "visual", label: "Visual assistance" },
  { value: "hearing", label: "Hearing assistance" },
  { value: "cognitive", label: "Simple directions" },
];

/** Fan wayfinding page - brutalist form with zone selectors and accessible route steps. */
export default function WayfindingPage(): JSX.Element {
  const reducedMotion = useReducedMotionSafe();
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
    <AppShell shader="subtle">
      <div className="grid gap-10">
        {/* Header */}
        <div className="border-b border-border pb-8">
          <span className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            Crowd-aware routing
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-none tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find Your Way.
          </h1>
          <p className="mt-4 max-w-lg text-sm text-muted-foreground">
            Choose where you are and where you need to go. StadiumPulse keeps
            the full route available as steps, not only as a visual line.
          </p>
        </div>

        {error && (
          <p className="border border-error-text/30 bg-error-text/[0.04] p-4 text-sm text-error-text">
            Zone options could not be loaded. Check the connection and try
            again.
          </p>
        )}

        <FadeInView>
          <form
            className="grid gap-8 border border-border p-6 md:p-8"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
              Route planner
            </h2>

            {/* From / To */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="grid gap-1">
                <span
                  className="text-xs uppercase tracking-widest text-muted-foreground"
                  id="from-zone-label"
                >
                  From zone
                </span>
                <Select value={fromZoneId} onValueChange={setFromZoneId}>
                  <SelectTrigger
                    aria-labelledby="from-zone-label"
                    className="min-h-12 w-full rounded-none border-0 border-b border-input bg-transparent focus:border-primary"
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
              <div className="grid gap-1">
                <span
                  className="text-xs uppercase tracking-widest text-muted-foreground"
                  id="to-zone-label"
                >
                  To zone
                </span>
                <Select value={toZoneId} onValueChange={setToZoneId}>
                  <SelectTrigger
                    aria-labelledby="to-zone-label"
                    className="min-h-12 w-full rounded-none border-0 border-b border-input bg-transparent focus:border-primary"
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

            {/* Accessibility needs */}
            <fieldset className="grid gap-3">
              <legend className="text-xs uppercase tracking-widest text-muted-foreground">
                Accessibility needs
              </legend>
              <div className="grid gap-2 md:grid-cols-2">
                {accessibilityNeeds.map((need) => (
                  <label
                    className="flex min-h-11 cursor-pointer items-center gap-3 border border-border px-4 text-sm font-medium text-foreground transition hover:border-primary/25"
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

            <button
              className="inline-flex min-h-12 w-fit items-center gap-2 bg-primary px-7 font-semibold text-primary-foreground transition disabled:bg-muted disabled:text-muted-foreground"
              disabled={routeLoading || loading}
              type="submit"
            >
              <Navigation aria-hidden="true" className="size-4" />
              Generate route
              {routeLoading && (
                <span className="ml-1 text-xs opacity-70">Loading...</span>
              )}
            </button>
          </form>
        </FadeInView>

        {fallback && (
          <motion.p
            className="border-l-2 border-secondary pl-4 text-sm text-secondary"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Showing the standard route - live directions are temporarily
            unavailable
          </motion.p>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
          <RouteLine generatedBy={route?.generatedBy} route={firstRoute} />
          <StepList route={firstRoute} />
        </div>

        {firstRoute && destination?.type === "seating-block" && (
          <SeatViewPreview sectionName={destination.name} />
        )}
      </div>
    </AppShell>
  );
}
