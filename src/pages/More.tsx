import { APP_VERSION, FLAVOR } from '../flavor'

export default function More() {
  return (
    <section>
      <img src="favicon.svg" alt="" width={72} height={72} className="logo" />
      <h1>BIS Bodybuilding Tracker</h1>
      <p className="muted">
        Version {APP_VERSION} ({FLAVOR})
      </p>
      <p className="muted">All your data stays on this device. Nothing is sent anywhere except food lookups to Open Food Facts.</p>
    </section>
  )
}
