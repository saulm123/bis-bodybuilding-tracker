import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'

const DOWNLOAD_URL = 'https://saulm123.github.io/bis-bodybuilding-tracker/download.html'

/** QR code and share button so friends can get the app (no store needed). */
export default function ShareAppSection() {
  const share = async () => {
    const text = 'Free gym and diet tracker. No account, everything stays on your phone:'
    if (Capacitor.isNativePlatform()) await Share.share({ title: 'BIS Bodybuilding Tracker', text, url: DOWNLOAD_URL }).catch(() => {})
    else if (navigator.share) await navigator.share({ title: 'BIS Bodybuilding Tracker', text, url: DOWNLOAD_URL }).catch(() => {})
    else await navigator.clipboard?.writeText(DOWNLOAD_URL)
  }
  return (
    <div className="card stack">
      <h2>Share the app</h2>
      <p className="muted small">Friends scan this to download it. Android gets the app, iPhone gets the web version.</p>
      <img src="qr-download.svg" alt="QR code linking to the BIS Tracker download page" className="qr" />
      <button className="btn btn-block" onClick={share}>Send the link</button>
    </div>
  )
}
