<p align="center"><img src="assets/icon/icon.svg" width="96" alt="BIS Tracker icon"></p>

# BIS Bodybuilding Tracker

An offline macro, training and health tracker for Android (and an installable web app).
All data stays on your phone. No accounts, no analytics, no Google services.

> Status: early development. v0.1.0 is the app shell; features arrive phase by phase.

## Install

- **Obtainium** (recommended): add this repo's URL. Obtainium installs the APK from
  [Releases](../../releases) and keeps it updated.
- **Direct**: download the `.apk` from the latest [release](../../releases).
- IzzyOnDroid and F-Droid listings are planned.

Signing certificate SHA-256 fingerprint (check this in Obtainium / AppVerifier):

```
C9:E4:91:1E:0B:50:65:E8:05:AF:F8:2C:53:97:37:6F:83:A4:6C:2A:33:CB:A3:16:2B:2C:B4:6A:1F:75:6A:9F
```

## Develop

Needs Node (see `.nvmrc`) and, for Android builds, Java 21.

```bash
npm install
npm run dev          # web version at http://localhost:5173
npm run build:foss   # production web build into dist/
npx cap sync android # copy the build into the Android project
npm run icons        # regenerate all icons from scripts/make-icons.mjs
```

GitHub Actions builds the Android APK, so you don't need Android Studio. See
[docs/SIGNING.md](docs/SIGNING.md) for the release key and
[docs/RELEASING.md](docs/RELEASING.md) for how to publish a version.

## Privacy

The only network requests are food lookups to [Open Food Facts](https://world.openfoodfacts.org).
Everything else stays on the device. Back up your data with Settings → Export.

## Licence

[MIT](LICENSE). The "BIS" lettering in the icon uses Archivo Black (SIL Open Font Licence).
