import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

// Prevents full blank-page crashes: renders a readable fallback instead.
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("App crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-space-950 px-4 text-center">
          <div className="max-w-sm w-full card p-8">
            <h2 className="text-xl font-bold text-white mb-2">Bir şeyler ters gitti</h2>
            <p className="text-gray-400 text-sm mb-6">
              Beklenmeyen bir hata oluştu. Sayfayı yenilemeyi dene.
            </p>
            <pre className="text-xs text-left text-red-300 bg-black/30 rounded-xl p-3 mb-6 overflow-x-auto max-h-32">
              {this.state.error.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full"
            >
              Yenile
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
