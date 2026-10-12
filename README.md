<p align="center"><img src="assets/icon/icon.svg" width="96" alt="BIS Tracker icon"></p>

# BIS Bodybuilding Tracker

An offline macro, training and health tracker for Android, also available as an installable web app.
All data stays on your phone. No accounts, no analytics, no Google services.

## Features

- **Setup for anyone**: sex, age, height, weight, activity and goal (cut / maintain / bulk) → calorie and
  macro targets from the Mifflin-St Jeor formula. kg or lb, cm or ft/in.
- **Training plans**: full body (3 days), home dumbbells (3), strength basics (3), upper/lower (4),
  glutes and legs focus (4), push/pull/legs + upper/lower (5), push/pull/legs ×2 (6). Switch any time;
  history carries over.
- **Nutrition**: daily calorie/protein/net-carb/fat targets per goal (fat fills the remaining calories). Food search and barcode scanning via Open Food Facts (on-device ZXing scanner),
  favourites, saved meals, quick add, copy the previous day.
- **Weight**: daily weigh-ins, 7-day average trend, weekly rate, and a ±200 kcal suggestion every two
  weeks when you're gaining too fast or too slowly (or losing outside 0.5–1%/week on a cut).
- **Training**: editable plans, set logging with big buttons, last session's numbers, an automatic
  "add weight" bump when you hit the top of the rep range on every set, rest timer with notifications,
  deload reminders at 6–8 weeks, exercise history with estimated 1RM, cardio log.
- **Health**: blood pressure and resting HR with weekly averages; blood test tracker (haematocrit, lipids,
  liver, kidney, hormones) with male/female ranges you can edit, and reminders; daily supplement checklist;
  optional cycle log (GitHub/F-Droid build only, off by default).
- **Privacy**: everything stored locally (IndexedDB), JSON backup/restore, dark mode, big tap targets.

## Install

- **Obtainium** (recommended): add `https://github.com/saulm123/bis-bodybuilding-tracker`. Obtainium
  installs the APK from [Releases](../../releases) and keeps it updated.
- **Direct**: download the `.apk` from the latest [release](../../releases).
- **Web app**: open https://saulm123.github.io/bis-bodybuilding-tracker/ in Vanadium/Chrome →
  ⋮ → *Add to Home screen*. (Online food search and notifications need the Android app.)
- IzzyOnDroid and F-Droid: coming (see [docs/FDROID.md](docs/FDROID.md)).

Signing certificate SHA-256 fingerprint (check this in Obtainium / AppVerifier):

```
C9:E4:91:1E:0B:50:65:E8:05:AF:F8:2C:53:97:37:6F:83:A4:6C:2A:33:CB:A3:16:2B:2C:B4:6A:1F:75:6A:9F
```

## Develop

Needs Node (exact version in `.nvmrc`) and, for Android builds, Java 21.

```bash
npm install
npm run dev          # web version at http://localhost:5173
npm test             # unit tests
npm run build:foss   # production web build into dist/ (build:play = no cycle log)
npx cap sync android # copy the build into the Android project
npm run icons        # regenerate icons, splash and store graphics
```

GitHub Actions builds everything, so you don't need Android Studio:

| Workflow | When | What |
| --- | --- | --- |
| CI | every push | tests, web build, debug APK |
| Release | `v*` tag | signed APK on GitHub Releases |
| Reproducible build check | every push | builds twice, checks they match (for F-Droid) |
| Web app | every push | publishes the PWA + privacy policy to GitHub Pages |
| Google Play bundle | manual | signed `.aab` without the cycle log |

Guides: [signing keys](docs/SIGNING.md) · [releasing](docs/RELEASING.md) ·
[F-Droid & IzzyOnDroid](docs/FDROID.md) · [Google Play](docs/PLAY.md)

## Privacy

The only network requests are food lookups to [Open Food Facts](https://world.openfoodfacts.org).
Everything else stays on the device. Read the [privacy policy](https://saulm123.github.io/bis-bodybuilding-tracker/privacy.html).

This app is a logbook, not medical advice.

## Licence

[MIT](LICENSE). The "BIS" lettering in the icon uses Archivo Black (SIL Open Font Licence). Food data
from Open Food Facts is available under the Open Database Licence.
