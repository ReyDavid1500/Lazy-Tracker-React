import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-full flex flex-col items-center justify-center gap-4 px-6 text-center bg-bg">
          <div className="w-14 h-14 rounded-2xl bg-danger-bg border border-danger/30 flex items-center justify-center text-2xl">
            ⚠️
          </div>
          <div>
            <p className="text-text-primary font-semibold text-base">Something went wrong</p>
            <p className="text-text-muted text-sm mt-1">{this.state.error.message}</p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="px-5 py-2.5 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
