import { Component, type ReactNode } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Last-resort accessible recovery surface for lazy route render failures. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main
          className="mx-auto grid min-h-screen max-w-3xl place-content-center px-6 py-12"
          id="main-content"
        >
          <BrandLogo tagline />
          <h1 className="mt-8 font-display text-3xl font-bold">
            StadiumPulse needs a reset
          </h1>
          <p className="mt-3 text-error-text" role="alert">
            This route could not be rendered.
          </p>
          <button
            className="brand-gradient-surface mt-6 min-h-11 rounded-lg px-5 font-extrabold"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload StadiumPulse
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
