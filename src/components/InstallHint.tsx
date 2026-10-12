import { Capacitor } from '@capacitor/core'

/** In a browser tab (not the installed app), explain how to add it to the home screen. */
export default function InstallHint() {
  const standalone = window.matchMedia('(display-mode: standalone)').matches
  if (Capacitor.isNativePlatform() || standalone) return null
  return (
    <div className="card stack">
      <h2>Install on your phone</h2>
      <p className="muted small">
        In Vanadium or Chrome: open the ⋮ menu and choose <strong>Add to Home screen</strong> (or <strong>Install app</strong>). It then works offline like a normal app.
        For phone notifications and online food search, use the Android app from GitHub Releases or Obtainium.
      </p>
    </div>
  )
}
