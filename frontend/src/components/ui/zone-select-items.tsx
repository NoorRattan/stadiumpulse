import { SelectItem } from "@/components/ui/select";

interface ZoneOption {
  zoneId: string;
  name: string;
}

/** Shared option renderer for controls backed by the public zone list. */
export function ZoneSelectItems({
  zones,
}: {
  zones: readonly ZoneOption[];
}): JSX.Element {
  return (
    <>
      {zones.map((zone) => (
        <SelectItem key={zone.zoneId} value={zone.zoneId}>
          {zone.name}
        </SelectItem>
      ))}
    </>
  );
}
