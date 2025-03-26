'use client';

import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error("Uncaught error:", error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="p-4 bg-red-50 border border-red-300 rounded-md">
                    <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
                    <details className="mt-2 text-sm text-red-700">
                        <summary className="cursor-pointer">View error details</summary>
                        <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto text-xs">
                            {this.state.error?.toString() || 'Unknown error'}
                        </pre>
                    </details>
                    <button
                        type="button"
                        className="mt-3 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 