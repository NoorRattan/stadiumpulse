import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MemoryRouter } from "react-router-dom";

import { AuthContext, type AuthContextValue } from "@/contexts/AuthContext";
import type { PublicExperienceResponse } from "@/types/api";

import PublicExperiencePage, {
  type PublicExperienceSection,
} from "./PublicExperiencePage";

const experience: PublicExperienceResponse = {
  generatedAt: "2026-07-14T12:00:00Z",
  dataStatus: "curated-and-simulated",
  tournament: {
    name: "FIFA World Cup 2026",
    startsOn: "2026-06-11",
    endsOn: "2026-07-19",
    hostCountries: ["Canada", "Mexico", "United States"],
    summary: "Connected demo.",
  },
  matchTicker: [],
  matches: [
    {
      matchId: "demo-1",
      homeTeam: "United States",
      awayTeam: "Canada",
      kickoffAt: "2026-07-15T18:00:00Z",
      venueId: "venue-1",
      venueName: "StadiumPulse Central",
      status: "upcoming",
      score: null,
      ticketStatus: "Official FIFA availability only",
    },
  ],
  venues: [
    {
      venueId: "venue-1",
      name: "StadiumPulse Central",
      city: "Demo City",
      country: "United States",
      address: "100 Match Day Way",
      mapLabel: "Transit district",
      capacity: 68000,
      gates: ["Gate 2"],
      seatingHighlights: ["Lower bowl"],
      accessibilityFeatures: ["Step-free Gate A"],
    },
  ],
  amenities: [
    {
      amenityId: "food-1",
      name: "Local Kitchen",
      category: "food",
      zone: "North Concourse",
      openingNote: "Open during the match.",
      accessibilityNote: "Low counter.",
    },
  ],
  fanEvents: [
    {
      eventId: "event-1",
      title: "Fan Zone",
      location: "East Plaza",
      startsAt: "2026-07-15T13:00:00Z",
      description: "Synthetic programme.",
      ticketRequired: false,
    },
  ],
  sustainability: [
    {
      metricId: "transit",
      label: "Shared transport",
      value: "64%",
      trend: "Improving",
      explanation: "Synthetic estimate.",
    },
  ],
  alerts: [
    {
      alertId: "alert-1",
      severity: "advisory",
      title: "Use North Concourse",
      message: "Follow staff signs.",
      zone: "South Concourse",
      issuedAt: "2026-07-14T18:55:00Z",
    },
  ],
  faq: [
    {
      question: "Does StadiumPulse sell tickets?",
      answer: "No. Use official FIFA ticketing.",
      category: "tickets",
    },
  ],
  officialTicketUrl: "https://www.fifa.com/tickets",
};

vi.mock("@/hooks/useExperience", () => ({
  usePublicExperience: () => ({
    data: experience,
    loading: false,
    error: null,
    refresh: vi.fn(),
  }),
}));

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

const authValue: AuthContextValue = {
  user: null,
  profile: null,
  role: "fan",
  loading: false,
  signInGuest: vi.fn(),
  signOut: vi.fn(),
  refreshRole: vi.fn(),
};

function renderPage(section: PublicExperienceSection) {
  return render(
    <MemoryRouter>
      <AuthContext.Provider value={authValue}>
        <PublicExperiencePage section={section} />
      </AuthContext.Provider>
    </MemoryRouter>,
  );
}

describe("PublicExperiencePage", () => {
  it.each([
    ["matches", "Matches & Tickets"],
    ["venues", "Venues, Gates & Seating"],
    ["accessibility", "Plan Around Your Needs"],
    ["amenities", "Food, Retail & Amenities"],
    ["events", "Fan Zones & Events"],
    ["sustainability", "A Lower-Impact Match Day"],
    ["alerts", "Alerts That Explain What to Do"],
    ["help", "Questions, Answered Clearly"],
  ] as const)("renders the %s page with one h1", (section, heading) => {
    const { unmount } = renderPage(section);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      heading,
    );
    unmount();
  });

  it("has no axe violations on the schedule and ticket handoff", async () => {
    const { container } = renderPage("matches");
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
