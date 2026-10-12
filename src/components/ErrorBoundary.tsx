import { Component, type ReactNode } from 'react'
import { exportAll, backupFileName } from '../db/backup'
import { saveTextFile } from '../lib/files'

interface State {
  error?: Error
  saved?: string
}

/** If a screen crashes, show a way out (and a way to save your data) instead of a blank screen. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = {}

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="screen stack">
        <h1>Something went wrong</h1>
        <p className="muted">Your data is still on the phone. Try going back to the start. If it keeps happening, save a backup and report the problem.</p>
        <pre className="error-text">{this.state.error.message}</pre>
        <button className="btn btn-primary btn-block" onClick={() => { location.hash = '#/today'; location.reload() }}>Back to start</button>
        <button
          className="btn btn-block"
          onClick={async () => {
            const where = await saveTextFile(backupFileName(), JSON.stringify(await exportAll(), null, 1))
            this.setState({ saved: where })
          }}
        >
          Save a backup now
        </button>
        {this.state.saved && <p className="ok">Saved to {this.state.saved}.</p>}
      </main>
    )
  }
}
