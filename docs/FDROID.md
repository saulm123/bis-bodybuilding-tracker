# Getting onto IzzyOnDroid and F-Droid

Both are app stores for open-source Android apps. **IzzyOnDroid** is quick (days)
and uses the APK from our GitHub Releases. **F-Droid** (the main repo) builds the
app itself from our source code, so it's slower (weeks) and stricter.

Because our builds are **reproducible**, F-Droid can check that its own build
matches our APK byte for byte and then ship *our* signed APK. That means GitHub,
Obtainium, IzzyOnDroid and F-Droid all carry the same signature, and you can
switch between them without uninstalling. The **Reproducible build check**
workflow in GitHub Actions tests this on every push.

## Before you submit (both stores)

1. **Screenshots.** Take 4–6 on your phone (Power + Volume down): Today, a
   workout, the food log, the weight chart, Health. Save them as
   `fastlane/metadata/android/en-US/images/phoneScreenshots/1.png`, `2.png`, …
   Commit and push.
2. **A tagged release exists** on GitHub with the APK attached (`v0.3.0` or later).
3. **The Reproducible build check workflow is green** (Actions tab).

The listing text comes from `fastlane/metadata/android/en-US/` (title, short
and full description, changelogs, icon). Both stores read it automatically.

## IzzyOnDroid (do this first)

1. Make a free account at **gitlab.com**.
2. Go to **gitlab.com/IzzyOnDroid/repo/-/issues** and click **New issue**.
3. Choose the **"New App"** template (or "Inclusion request") and fill it in:
   - App: BIS Bodybuilding Tracker
   - Source: `https://github.com/saulm123/bis-bodybuilding-tracker`
   - Package: `com.bis.bodybuildingtracker`
   - Licence: MIT
   - Note that releases are signed APKs on GitHub Releases, metadata is in
     `fastlane/`, there are no trackers or proprietary libraries, and builds
     are reproducible.
4. Izzy checks the APK (size, libraries, permissions) and replies in the issue.
   Answer any questions there. Once added, new GitHub releases are picked up
   automatically.

## F-Droid (main repository)

You'll send a "merge request" (GitLab's word for a pull request) adding one
file, our build recipe, to F-Droid's `fdroiddata` repository. The recipe is
ready in [`fdroid/com.bis.bodybuildingtracker.yml`](../fdroid/com.bis.bodybuildingtracker.yml).

1. On GitLab, open **gitlab.com/fdroid/fdroiddata** and click **Fork**.
2. Clone your fork and make a branch:
   ```bash
   git clone https://gitlab.com/YOUR-GITLAB-NAME/fdroiddata.git
   ```
   ```bash
   cd fdroiddata && git checkout -b com.bis.bodybuildingtracker
   ```
3. Copy the recipe in and set `versionName`, `versionCode`, `commit`,
   `CurrentVersion` and `CurrentVersionCode` to the latest release:
   ```bash
   cp ~/Projects/bis-bodybuilding-tracker/fdroid/com.bis.bodybuildingtracker.yml metadata/
   ```
4. Optional but helpful: test it with F-Droid's tools in Docker
   (`fdroid lint com.bis.bodybuildingtracker`, then
   `fdroid build -v -l com.bis.bodybuildingtracker`). The CI on your merge
   request runs these anyway, so you can skip this and read the CI results.
5. Commit and push:
   ```bash
   git add metadata/com.bis.bodybuildingtracker.yml && git commit -m "New app: BIS Bodybuilding Tracker"
   ```
   ```bash
   git push -u origin com.bis.bodybuildingtracker
   ```
6. GitLab prints a link to **create a merge request**. Open it, pick the
   "App inclusion" template, tick the checklist, and submit.
7. A volunteer reviews it. Expect questions (sometimes over a few weeks). The
   pipeline on the merge request shows whether their build worked and matched
   our APK.

Once merged, F-Droid checks for new tags automatically (`UpdateCheckMode: Tags`),
so future releases appear without another merge request, a day or two after
you tag.

### If the reproducible check ever fails

The F-Droid pipeline (or our own workflow) lists which files inside the APK
differ. Common causes: a different Node version (keep `.nvmrc` pinned), or a
dependency that writes timestamps. Open an issue and paste the list.
