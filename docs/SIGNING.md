# Signing keys: create, back up, hand to GitHub

## Why this matters

Every Android app is signed with a private key. Android will only install an
update if it's signed with **the same key** as the version already on the phone.

- Lose the key → you can never update the app again. Everyone (including you)
  has to uninstall and reinstall, which **wipes the app's data**.
- Leak the key → someone else could publish a fake "update".

So: make it once, back it up properly, never commit it to git.

## 1. Create the key (one time)

Open a terminal in the project folder and load the project's Java:

```bash
source scripts/dev-env.sh
```

Make a private folder outside the project for the key:

```bash
mkdir -p ~/bis-keys && chmod 700 ~/bis-keys
```

Create the key. `-dname` keeps personal details (like your town) out of the
certificate, which anyone can read from the APK. It asks for a password (pick a long one and save it in your
password manager straight away), twice. Typing works if pasting into the terminal doesn't.

```bash
keytool -genkeypair -v -keystore ~/bis-keys/bis-release.jks -alias bis -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=yourname"
```

`-validity 10000` = about 27 years. Modern keystores use one password for both
the file and the key, so you only have one password to remember.

Print the key's fingerprint. This is public, not secret. It goes in the README and
later in the F-Droid metadata so people can check the APK really came from you:

```bash
keytool -list -v -keystore ~/bis-keys/bis-release.jks -alias bis | grep SHA256
```

## 2. Back it up (do this before your first release)

You need **three copies in two places**:

1. **Password manager** (KeePassXC, Bitwarden, Proton Pass…): make an entry
   "BIS Tracker signing key". Attach `bis-release.jks` as a file and store the
   password and alias (`bis`) in it.
2. **Encrypted USB stick** kept away from the house (work van, family member):
   copy `bis-release.jks` onto it. On a Mac, format the stick as
   "APFS (Encrypted)" in Disk Utility.
3. **Paper** with the password and alias, kept with the USB stick.

Test the backup once: copy the `.jks` back off the USB stick and run the
fingerprint command above against it. Same fingerprint = good backup.

## 3. Give the key to GitHub (so it can sign releases)

GitHub "secrets" are encrypted. Workflows can use them, but nobody can read
them back, not even you. Run these from the project folder after `gh auth login`.

The key file itself, converted to text:

```bash
base64 -i ~/bis-keys/bis-release.jks | gh secret set KEYSTORE_BASE64
```

The next two commands each prompt you to paste a value (it won't show on
screen and won't go into your shell history):

```bash
gh secret set KEYSTORE_PASSWORD
```

```bash
gh secret set KEY_ALIAS
```

(type `bis`)

Check they're there (names only, values stay hidden):

```bash
gh secret list
```

## Optional: build a signed APK on your own Mac

Only if you install the Android SDK later. Create `android/keystore.properties`
(already in `.gitignore`):

```properties
storeFile=/Users/YOU/bis-keys/bis-release.jks
storePassword=...
keyAlias=bis
keyPassword=...
```

## Google Play upload key (Phase 9, later)

Play uses a **separate** "upload key". Google keeps the real app signing key,
and if you lose the upload key Google can reset it. We'll make that one when we
get to the Play build. Don't reuse this key for it.
