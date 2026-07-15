import { useState, type FormEvent } from "react";
import { Navigation } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";

import { AppShell } from "@/components/layout";
import { FadeInView } from "@/components/motion/FadeInView";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ZoneSelectItems } from "@/components/ui/zone-select-items";
import SeatViewPreview from "@/components/visuals/SeatViewPreview";
import { RouteLine, StepList } from "@/components/wayfinding";
import { useReducedMotionSafe } from "@/hooks/useReducedMotionSafe";
import { useWayfinding } from "@/hooks/useWayfinding";
import { useZoneOptions } from "@/hooks/useZoneOptions";
import type { AccessibilityNeed, ZoneSummary } from "@/types/domain";

const accessibilityNeeds: ReadonlyArray<{
  value: AccessibilityNeed;
  label: string;
}> = [
  { value: "wheelchair", label: "Step-free route" },
  { value: "visual", label: "Visual assistance" },
  { value: "hearing", label: "Hearing assistance" },
  { value: "cognitive", label: "Simple directions" },
];

function usePlannerState() {
  const wayfinding = useWayfinding();
  const [fromZoneId, setFromZoneId] = useState("");
  const [toZoneId, setToZoneId] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<AccessibilityNeed[]>([]);
  const toggleNeed = (need: AccessibilityNeed, checked: boolean) =>
    setSelectedNeeds((current) =>
      checked ? [...current, need] : current.filter((value) => value !== need),
    );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!fromZoneId || !toZoneId) {
      toast.error("Choose both a start and destination zone.");
      return;
    }
    try {
      await wayfinding.getRoute({
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
  return {
    fromZoneId,
    route: wayfinding.route,
    routeLoading: wayfinding.loading,
    selectedNeeds,
    setFromZoneId,
    setToZoneId,
    submit,
    toZoneId,
    toggleNeed,
  };
}

function PageHeader(): JSX.Element {
  return (
    <div className="border-b border-border pb-8">
      <span className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
        Crowd-aware routing
      </span>
      <h1 className="mt-5 font-display text-4xl font-bold leading-none tracking-tight sm:text-5xl lg:text-6xl">
        Find Your Way.
      </h1>
      <p className="mt-4 max-w-lg text-sm text-muted-foreground">
        Choose where you are and where you need to go. StadiumPulse keeps the
        full route available as steps, not only as a visual line.
      </p>
    </div>
  );
}

function ZoneSelect({
  id,
  loading,
  onChange,
  placeholder,
  value,
  zones,
}: {
  id: string;
  loading: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  zones: ZoneSummary[];
}): JSX.Element {
  return (
    <div className="grid gap-1">
      <span
        className="text-xs uppercase tracking-widest text-muted-foreground"
        id={`${id}-label`}
      >
        {id === "from-zone" ? "From zone" : "To zone"}
      </span>
      <Select onValueChange={onChange} value={value}>
        <SelectTrigger
          aria-labelledby={`${id}-label`}
          className="min-h-12 w-full rounded-none border-0 border-b border-input bg-transparent focus:border-primary"
        >
          <SelectValue
            placeholder={loading ? "Loading zones..." : placeholder}
          />
        </SelectTrigger>
        <SelectContent>
          <ZoneSelectItems zones={zones} />
        </SelectContent>
      </Select>
    </div>
  );
}

function AccessibilityNeeds({
  selected,
  toggle,
}: {
  selected: AccessibilityNeed[];
  toggle: (need: AccessibilityNeed, checked: boolean) => void;
}): JSX.Element {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-xs uppercase tracking-widest text-muted-foreground">
        Accessibility needs
      </legend>
      <div className="grid gap-2 md:grid-cols-2">
        {accessibilityNeeds.map((need) => (
          <label
            className="flex min-h-11 cursor-pointer items-center gap-3 border border-border px-4 text-sm font-medium transition hover:border-primary/25"
            key={need.value}
          >
            <Checkbox
              checked={selected.includes(need.value)}
              onCheckedChange={(checked) =>
                toggle(need.value, checked === true)
              }
            />
            {need.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function RoutePlanner({
  loading,
  planner,
  zones,
}: {
  loading: boolean;
  planner: ReturnType<typeof usePlannerState>;
  zones: ZoneSummary[];
}): JSX.Element {
  return (
    <FadeInView>
      <form
        className="grid gap-8 border border-border p-6 md:p-8"
        onSubmit={(event) => void planner.submit(event)}
      >
        <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          Route planner
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          <ZoneSelect
            id="from-zone"
            loading={loading}
            onChange={planner.setFromZoneId}
            placeholder="Choose a start zone"
            value={planner.fromZoneId}
            zones={zones}
          />
          <ZoneSelect
            id="to-zone"
            loading={loading}
            onChange={planner.setToZoneId}
            placeholder="Choose a destination"
            value={planner.toZoneId}
            zones={zones}
          />
        </div>
        <AccessibilityNeeds
          selected={planner.selectedNeeds}
          toggle={planner.toggleNeed}
        />
        <button
          className="inline-flex min-h-12 w-fit items-center gap-2 bg-primary px-7 font-semibold text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
          disabled={planner.routeLoading || loading}
          type="submit"
        >
          <Navigation aria-hidden="true" className="size-4" />
          Generate route
          {planner.routeLoading && (
            <span className="ml-1 text-xs opacity-70">Loading...</span>
          )}
        </button>
      </form>
    </FadeInView>
  );
}

function RouteResults({
  planner,
  zones,
}: {
  planner: ReturnType<typeof usePlannerState>;
  zones: ZoneSummary[];
}): JSX.Element {
  const reducedMotion = useReducedMotionSafe();
  const firstRoute = planner.route?.routeOptions[0] ?? null;
  const destination = zones.find((zone) => zone.zoneId === planner.toZoneId);
  return (
    <>
      {planner.route?.generatedBy === "fallback" && (
        <motion.p
          animate={{ opacity: 1 }}
          className="border-l-2 border-secondary pl-4 text-sm text-secondary"
          initial={reducedMotion ? false : { opacity: 0 }}
        >
          Showing the tested standard route because live AI wording is
          temporarily unavailable.
        </motion.p>
      )}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)]">
        <RouteLine
          generatedBy={planner.route?.generatedBy}
          route={firstRoute}
        />
        <StepList route={firstRoute} />
      </div>
      {firstRoute && destination?.type === "seating-block" && (
        <SeatViewPreview sectionName={destination.name} />
      )}
    </>
  );
}

/** Fan wayfinding with accessible selectors, deterministic routes, and AI fallback. */
export default function WayfindingPage(): JSX.Element {
  const zoneState = useZoneOptions();
  const planner = usePlannerState();
  return (
    <AppShell shader="subtle">
      <div className="grid gap-10">
        <PageHeader />
        {zoneState.error && (
          <p className="border border-error-text/30 bg-error-text/[0.04] p-4 text-sm text-error-text">
            Zone options could not be loaded. Check the connection and try
            again.
          </p>
        )}
        <RoutePlanner
          loading={zoneState.loading}
          planner={planner}
          zones={zoneState.zones}
        />
        <RouteResults planner={planner} zones={zoneState.zones} />
      </div>
    </AppShell>
  );
}
