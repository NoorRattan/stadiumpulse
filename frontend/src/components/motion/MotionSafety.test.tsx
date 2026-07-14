import { render, screen } from "@testing-library/react";

import { ThemeProvider } from "@/contexts/ThemeContext";

import { GlassCard } from "../layout/GlassCard";
import { PageHero } from "../layout/PageHero";
import { ParticleCanvas } from "../visuals/ParticleCanvas";
import { AnimatedCounter } from "./AnimatedCounter";
import { FadeInView } from "./FadeInView";
import { MagneticCard } from "./MagneticCard";
import { ScrambleText } from "./ScrambleText";

vi.mock("@/hooks/useReducedMotionSafe", () => ({
  useReducedMotionSafe: () => true,
}));

describe("reduced-motion safety", () => {
  it("renders motion components in their immediate static state", () => {
    render(
      <ThemeProvider>
        <PageHero title="Static venue overview" />
        <GlassCard>Static card</GlassCard>
        <FadeInView data-testid="reveal">Revealed content</FadeInView>
        <MagneticCard className="magnetic-test">Magnetic content</MagneticCard>
        <AnimatedCounter suffix="%" value={72} />
        <ScrambleText text="READY" />
        <ParticleCanvas />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Static venue overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Static card")).toBeInTheDocument();
    expect(screen.getByTestId("reveal")).toHaveAttribute(
      "data-visible",
      "true",
    );
    expect(document.querySelector(".magnetic-test")).toHaveStyle({
      transition: "none",
    });
    expect(screen.getByText("72%")).toBeInTheDocument();
    expect(screen.getByLabelText("READY")).toHaveTextContent("READY");
    expect(document.querySelector("canvas")).toBeNull();
  });
});
