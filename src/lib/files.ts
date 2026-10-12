import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

const FOLDER = 'BIS-Tracker'

/**
 * Saves a text file where the user can find it.
 * Android app: Documents/BIS-Tracker/<name> (visible in the Files app).
 * Browser/PWA: a normal download.
 * Returns a short description of where it went.
 */
export async function saveTextFile(name: string, text: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({
      path: `${FOLDER}/${name}`,
      data: text,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    })
    return `Documents/${FOLDER}/${name}`
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: name })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return `your Downloads folder (${name})`
}

/** Opens the Android share sheet with the file (e.g. to send it to another device). Native only. */
export async function shareTextFile(name: string, text: string): Promise<void> {
  const { uri } = await Filesystem.writeFile({
    path: name,
    data: text,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  await Share.share({ title: name, files: [uri] })
}

export const canShareFiles = () => Capacitor.isNativePlatform()

/** Lets the user pick a file and returns its text, or null if they cancelled. */
export function pickTextFile(accept = 'application/json,.json'): Promise<string | null> {
  return new Promise((resolve) => {
    const input = Object.assign(document.createElement('input'), { type: 'file', accept })
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return resolve(null)
      file.text().then(resolve, () => resolve(null))
    }
    input.oncancel = () => resolve(null)
    input.click()
  })
}

/** Saves an image (data: URL) to Documents/BIS-Tracker, or downloads it in the browser. */
export async function saveImage(name: string, dataUrl: string): Promise<string> {
  if (Capacitor.isNativePlatform()) {
    await Filesystem.writeFile({ path: `${FOLDER}/${name}`, data: dataUrl.split(',')[1], directory: Directory.Documents, recursive: true })
    return `Documents/${FOLDER}/${name}`
  }
  const a = Object.assign(document.createElement('a'), { href: dataUrl, download: name })
  a.click()
  return `your Downloads folder (${name})`
}

/** Opens the share sheet with an image (Android app only). */
export async function shareImage(name: string, dataUrl: string): Promise<void> {
  const { uri } = await Filesystem.writeFile({ path: name, data: dataUrl.split(',')[1], directory: Directory.Cache })
  await Share.share({ title: name, files: [uri] })
}
