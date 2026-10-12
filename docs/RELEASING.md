# Releasing a new version

1. Pick the new version, e.g. `0.2.0`.
2. Update it in **two** places:
   - `package.json` → `"version": "0.2.0"`
   - `android/app/build.gradle` → `versionName "0.2.0"` and
     `versionCode 200` (major×10000 + minor×100 + patch; it must always go up)
3. Add `fastlane/metadata/android/en-US/changelogs/200.txt` (what changed, a few lines).
4. Commit, then tag and push:

```bash
git tag v0.2.0
```

```bash
git push origin main --tags
```

5. The **Release** workflow builds and signs the APK and attaches it to a GitHub
   Release (about 5–8 minutes). Obtainium picks it up from there.

IzzyOnDroid and (once accepted) F-Droid pick up new tags automatically. For
Google Play, also run the **Google Play bundle** workflow and upload the `.aab`.

If the tag and versions don't match, the workflow stops with a clear error.
Delete the tag (`git tag -d v0.2.0`), fix the versions and tag again.
