import { fireEvent, render, screen, within } from "@testing-library/react";

import type { CrowdZoneSummary } from "@/types/domain";

import { CrowdVenueMap } from "./CrowdVenueMap";

const zone: CrowdZoneSummary = {
  zoneId: "gate-4",
  name: "Gate 4",
  currentDensityPct: 58,
  band: "moderate",
  alert: "Use the east approach.",
  lastUpdated: "2026-07-14T12:00:00Z",
};

describe("CrowdVenueMap", () => {
  it("shows a text band and keeps zone selection keyboard-native", () => {
    const onSelectZone = vi.fn();
    render(<CrowdVenueMap zones={[zone]} onSelectZone={onSelectZone} />);

    const zoneButton = screen.getByRole("button", {
      name: "Gate 4, 58 percent density, Moderate",
    });

    expect(within(zoneButton).getByText("Moderate density")).toBeVisible();
    fireEvent.click(zoneButton);
    expect(onSelectZone).toHaveBeenCalledWith(zone);
  });
});
