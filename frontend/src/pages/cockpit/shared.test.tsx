import { act, render, renderHook, screen } from "@testing-library/react";

import { apiRequest } from "@/services/apiClient";
import type { DemoExperienceResponse } from "@/types/api";

import { DEMO_REFRESH_INTERVAL_MS, DemoFreshness, useDemoData } from "./shared";

vi.mock("@/services/apiClient", () => ({
  apiRequest: vi.fn(),
}));

function demoResponse(generatedAt: string): DemoExperienceResponse {
  return {
    scenarioId: "fifa-2026-matchday",
    title: "Connected match-day scenario",
    tournament: "FIFA World Cup 2026",
    generatedAt,
    dataStatus: "simulated",
    databaseStatus: "connected",
    outputSource: "curated-demo-preview",
    match: {
      matchId: "match-1",
      homeTeam: "United States",
      awayTeam: "Canada",
      kickoffAt: generatedAt,
      transitLoadEstimate: "high",
    },
    zones: [],
    accessibleRoute: {
      steps: [{ instruction: "Enter Gate 2", zoneId: "gate-2" }],
      estimatedMinutes: 8,
      congestionLevel: "low",
    },
    conciergeExamples: [],
    travelSuggestions: [],
    operationsDigest: {
      generatedAt,
      minutesAhead: 15,
      headline: "Connected",
      narrative: "Synthetic snapshot",
      dataStatus: "simulated",
      items: [],
    },
    capabilities: [],
  };
}

describe("useDemoData", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-15T12:00:00Z"));
    vi.mocked(apiRequest).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads immediately and refreshes every 15 seconds", async () => {
    const first = demoResponse("2026-07-15T12:00:00Z");
    const second = demoResponse("2026-07-15T12:00:15Z");
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(first)
      .mockResolvedValueOnce(second);

    const { result, unmount } = renderHook(useDemoData);
    await act(async () => Promise.resolve());

    expect(apiRequest).toHaveBeenCalledOnce();
    expect(result.current).toMatchObject({ data: first, status: "live" });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(DEMO_REFRESH_INTERVAL_MS - 1);
    });
    expect(apiRequest).toHaveBeenCalledOnce();

    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(apiRequest).toHaveBeenCalledTimes(2);
    expect(result.current).toMatchObject({ data: second, status: "live" });

    unmount();
    await vi.advanceTimersByTimeAsync(DEMO_REFRESH_INTERVAL_MS * 2);
    expect(apiRequest).toHaveBeenCalledTimes(2);
  });

  it("keeps the last snapshot visible when a refresh fails", async () => {
    const first = demoResponse("2026-07-15T12:00:00Z");
    vi.mocked(apiRequest)
      .mockResolvedValueOnce(first)
      .mockRejectedValueOnce(new Error("offline"));

    const { result } = renderHook(useDemoData);
    await act(async () => Promise.resolve());
    await act(async () =>
      vi.advanceTimersByTimeAsync(DEMO_REFRESH_INTERVAL_MS),
    );

    expect(result.current).toMatchObject({ data: first, status: "stale" });
  });
});

describe("DemoFreshness", () => {
  it("labels connected and stale snapshots honestly", () => {
    const refreshedAt = new Date("2026-07-15T12:00:00Z").getTime();
    const { rerender } = render(
      <DemoFreshness state={{ data: null, refreshedAt, status: "live" }} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /connected demo snapshot.*refreshes every 15 seconds/i,
    );

    rerender(
      <DemoFreshness state={{ data: null, refreshedAt, status: "stale" }} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      /refresh delayed.*retrying every 15 seconds/i,
    );
  });
});
