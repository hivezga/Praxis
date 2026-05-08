"use client";

import * as Sentry from "@sentry/nextjs";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  fallback: ReactNode | ((error: Error, retry: () => void) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    Sentry.captureException(error, { extra: { componentStack: info.componentStack } });
    if (process.env.NODE_ENV !== "production") {
      console.error("ErrorBoundary caught:", error, info);
    }
  }

  retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (error) {
      const { fallback } = this.props;
      return typeof fallback === "function" ? fallback(error, this.retry) : fallback;
    }
    return this.props.children;
  }
}

export function PanelErrorFallback({
  label,
  retry,
}: {
  label: string;
  retry: () => void;
}) {
  return (
    <div className="rounded-lg border border-danger/30 bg-danger/20 p-5">
      <p className="font-serif text-sm italic text-danger">
        The {label} panel hit an unexpected error.
      </p>
      <button type="button" className="btn mt-3 text-xs" onClick={retry}>
        Reload panel
      </button>
    </div>
  );
}
