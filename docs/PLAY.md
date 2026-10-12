# Google Play (optional)

The Play version is a separate build flavour, **`play`**, with the app ID
`com.bis.bodybuildingtracker.play`. The cycle log is removed **at build time**
(the code isn't in the app at all), because Play doesn't allow steroid-related
content. Everything else is the same.

Because it has its own app ID, the Play version and the GitHub/F-Droid version
can be installed side by side without clashing. Data doesn't move between them
automatically; use Settings → Backup.

Things to know before you start:
- A Play developer account costs **US$25 once** and needs ID verification.
- **New personal accounts** must run a **closed test with at least 12 testers
  for 14 days** before Google lets you publish to everyone. Internal testing
  (just you) has no such rule. Check Play Console for the current rules.
- Play policies change. Re-read each form's wording rather than copying answers
  blindly.

## 1. Make the upload key

Play uses two keys. **Google** holds the real app signing key ("Play App
Signing"). **You** hold an *upload key* that proves uploads come from you. If you
ever lose the upload key, Google can reset it. Don't reuse your GitHub/F-Droid key.

```bash
/opt/homebrew/opt/openjdk@21/bin/keytool -genkeypair -v -keystore ~/bis-keys/bis-play-upload.jks -alias play -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=saulm123"
```

Back it up next to the other key (password manager + USB). Then give it to
GitHub. Type the password when asked:

```bash
base64 -i ~/bis-keys/bis-play-upload.jks | gh secret set PLAY_KEYSTORE_BASE64
```

```bash
gh secret set PLAY_KEYSTORE_PASSWORD
```

```bash
gh secret set PLAY_KEY_ALIAS
```

(type `play`)

## 2. Build the .aab

GitHub → **Actions** → **Google Play bundle** → **Run workflow**. After about 5
minutes, open the run and download **bis-tracker-play-aab** (a zip with the
`.aab` inside). Unzip it.

## 3. Play Console walkthrough

1. **play.google.com/console** → sign up → pay → verify your identity.
2. **Create app**: name *BIS Bodybuilding Tracker*, default language English
   (UK), **App**, **Free**. Accept the declarations.
3. **Testing → Internal testing → Create new release**.
   - Choose **Use Google-generated key** (Play App Signing) when asked.
   - Upload the `.aab`. Release name e.g. `0.3.0`. Save → Review → Start rollout.
   - **Testers** tab: create an email list with your own Google account, copy
     the opt-in link, open it on a phone signed in to Play, and install.
     (On GrapheneOS that means sandboxed Google Play; you may prefer to test on
     another phone.)
4. Work through **Dashboard → Set up your app**:

### Store listing
- **App name**: BIS Bodybuilding Tracker
- **Short description**: `Offline macro, training and health tracker. No accounts, no trackers.`
- **Full description**: paste `fastlane/metadata/android/en-US/full_description.txt`
  (it doesn't mention the cycle log). Replace the `<b>`/`<ul>` tags with plain lines.
- **App icon**: `fastlane/metadata/android/en-US/images/icon.png` (512×512)
- **Feature graphic**: `assets/store/feature-graphic.png` (1024×500)
- **Phone screenshots**: at least 2. Take them in the **Play build**, so no
  cycle screens appear.
- **Category**: Health & Fitness. **Contact email**: required (it's shown publicly).

### Privacy policy
`https://saulm123.github.io/bis-bodybuilding-tracker/privacy.html`

### App access
"All functionality is available without special access."

### Ads
"No, my app does not contain ads."

### Content rating
Start the questionnaire: category **"All other app types"**. Answer **No** to
violence, sexual content, gambling, drugs, user interaction/sharing, location
sharing and purchases. The expected result is PEGI 3 / Everyone.

### Target audience
**18 and over** only. That avoids the extra Families policy requirements.

### Health apps declaration
Tick what the app does: **fitness/activity tracking**, **nutrition and weight
management**, and **personal health records/logging** (blood pressure, blood
test results). Confirm it is **not** a medical device and doesn't diagnose or
treat anything.

### Data safety
The app stores everything on the device and has no backend. The one thing
that leaves the phone is a barcode or search words sent to Open Food Facts when
*you* look up a food. Suggested answers:

| Question | Answer |
| --- | --- |
| Does your app collect or share any of the required user data types? | **Yes**, for food search only (below). If you're sure barcode lookups don't count, **No** is defensible, but **Yes** with the details below is the cautious choice. |
| Data type | **App activity → Other user-generated content / In-app search history** (search words, barcodes) |
| Collected? | Yes. **Processed ephemerally**: tick yes |
| Shared? | No. It's sent at your request to fetch results, which counts as a user-initiated transfer |
| Required or optional? | **Optional** (search is something you choose to use) |
| Purpose | App functionality |
| Encrypted in transit? | **Yes** (HTTPS) |
| Can users request deletion? | Nothing is stored by you; say **No** with the explanation that no data is retained |

Everything else (health, location, identifiers, contacts…) is **not collected**,
because it never leaves the phone.

### Government apps, financial features, news
No / not applicable.

5. When the dashboard is all green and your internal test works, either keep
   it internal (just you) or run the **closed test** (12+ testers, 14 days)
   before applying for production.

## Releasing an update on Play

Bump the version as usual (docs/RELEASING.md), run **Google Play bundle**
again, and upload the new `.aab` to the same testing track.
