import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { Capacitor } from '@capacitor/core'
import App from './App'
import '@fontsource/archivo-black/400.css' // bundled locally, no font CDN
import './styles.css'

// The service worker is only needed for the installable web version.
// Inside the Android app the files are already on the device.
if (!Capacitor.isNativePlatform()) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

// Ask the browser not to clear our data when storage runs low.
navigator.storage?.persist?.().catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
