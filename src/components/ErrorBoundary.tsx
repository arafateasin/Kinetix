import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Top-level error boundary.
 * React 18 unmounts the entire tree on an uncaught render error — this
 * catches it and renders a diagnostic panel instead of a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary] Caught render error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#030712",
            color: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "16px",
            padding: "32px",
            fontFamily: "monospace",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444" }}>
            Render Error
          </div>
          <div
            style={{
              background: "#111827",
              border: "1px solid #374151",
              borderRadius: "8px",
              padding: "20px",
              maxWidth: "800px",
              width: "100%",
              fontSize: "13px",
              color: "#fca5a5",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {this.state.error?.message}
            {"\n\n"}
            {this.state.error?.stack}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "8px 20px",
              background: "#1d4ed8",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
