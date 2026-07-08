import { Component } from "react";

/**
 * Global error boundary so a render error in any page never leaves the user
 * staring at a blank white screen. We show a friendly fallback with a
 * "Try again" (reset) and "Go home" option instead.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep a console trace for debugging; never surface raw errors to users.
    console.error("App error boundary caught:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center rounded-2xl border border-white/10 bg-[#121212] p-8">
          <h1 className="text-2xl font-extrabold mb-2">Something went wrong</h1>
          <p className="text-gray-400 text-sm mb-6">
            This page hit a small hiccup. You can try again or head back home —
            your place is safe.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-5 py-2 rounded-xl bg-white text-black font-semibold hover:bg-white/90"
            >
              Try again
            </button>
            <a
              href="/home"
              className="px-5 py-2 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/15"
            >
              Go home
            </a>
          </div>
        </div>
      </div>
    );
  }
}
