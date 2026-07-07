import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Placeholder error boundary for lazy routes; Session 5 replaces the visual treatment. */
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
        <main className="mx-auto max-w-3xl px-6 py-12" id="main-content">
          <h1 className="font-display text-3xl text-text-primary">
            StadiumPulse
          </h1>
          <p className="mt-3 text-error-text">
            This route could not be rendered.
          </p>
        </main>
      );
    }
    return this.props.children;
  }
}
