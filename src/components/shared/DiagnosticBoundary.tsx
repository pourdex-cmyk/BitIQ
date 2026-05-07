"use client";

import { Component, type ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class DiagnosticBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-bold text-red-400 mb-2">
            {this.props.label} Error (debug)
          </h2>
          <pre className="text-xs text-slate-300 bg-slate-900 p-4 rounded-lg overflow-auto whitespace-pre-wrap max-w-2xl">
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack ?? ""}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
