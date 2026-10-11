// Generates every icon the app needs from one design (concept C: "BIS" over a barbell).
// Run with `npm run icons`. Outputs PWA icons, Android launcher icons and the
// store/fastlane icon. The text is converted to vector outlines so no font is
// needed at runtime.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import opentype from 'opentype.js'
import { Resvg } from '@resvg/resvg-js'

const BG = '#111111'
const BAR = '#B4B2A9'
const PLATE = '#EF9F27'
const TEXT = '#FFFFFF'

// "BIS" outlined from Archivo Black (SIL Open Font Licence), centred on x=54.
const fontFile = 'node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff'
const buf = readFileSync(fontFile)
const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength))
const raw = font.getPath('BIS', 0, 52, 24)
const box = raw.getBoundingBox()
const textPath = font.getPath('BIS', 54 - (box.x1 + box.x2) / 2, 52, 24).toPathData(2)

// Foreground on the 108x108 adaptive-icon canvas, kept inside the 66dp safe circle.
const foreground = (mono = false) => {
  const c = (colour) => (mono ? '#FFFFFF' : colour)
  return `
  <path d="${textPath}" fill="${c(TEXT)}"/>
  <rect x="28" y="61" width="52" height="4" fill="${c(BAR)}"/>
  <rect x="28" y="56" width="5" height="14" rx="1" fill="${c(PLATE)}"/>
  <rect x="75" y="56" width="5" height="14" rx="1" fill="${c(PLATE)}"/>
  <rect x="24" y="59" width="4" height="8" rx="1" fill="${c(PLATE)}"/>
  <rect x="80" y="59" width="4" height="8" rx="1" fill="${c(PLATE)}"/>`
}

const svg = (viewBox, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${body}</svg>`

// Rounded-square icon showing the central 72dp, like a launcher would.
const rounded = svg('18 18 72 72', `<rect x="18" y="18" width="72" height="72" rx="16" fill="${BG}"/>${foreground()}`)
const round = svg('18 18 72 72', `<circle cx="54" cy="54" r="36" fill="${BG}"/>${foreground()}`)
const fullBleed = svg('0 0 108 108', `<rect width="108" height="108" fill="${BG}"/>${foreground()}`)
const fgOnly = svg('0 0 108 108', foreground())
const monoOnly = svg('0 0 108 108', foreground(true))

const png = (svgText, size, out) => {
  mkdirSync(dirname(out), { recursive: true })
  const data = new Resvg(svgText, { fitTo: { mode: 'width', value: size } }).render().asPng()
  writeFileSync(out, data)
}

// Web / PWA
writeFileSync('public/favicon.svg', rounded)
writeFileSync('assets/icon/icon.svg', rounded)
png(rounded, 192, 'public/icons/icon-192.png')
png(rounded, 512, 'public/icons/icon-512.png')
png(fullBleed, 512, 'public/icons/maskable-512.png')
png(rounded, 180, 'public/icons/apple-touch-icon.png')

// Store listing icon (F-Droid / IzzyOnDroid read this; Play uses the same 512px file)
png(rounded, 512, 'fastlane/metadata/android/en-US/images/icon.png')

// Android launcher icons
const res = 'android/app/src/main/res'
if (existsSync(res)) {
  const densities = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
  for (const [d, k] of Object.entries(densities)) {
    png(rounded, 48 * k, `${res}/mipmap-${d}/ic_launcher.png`)
    png(round, 48 * k, `${res}/mipmap-${d}/ic_launcher_round.png`)
    png(fgOnly, 108 * k, `${res}/mipmap-${d}/ic_launcher_foreground.png`)
    png(monoOnly, 108 * k, `${res}/mipmap-${d}/ic_launcher_monochrome.png`)
  }
  const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
</adaptive-icon>
`
  mkdirSync(`${res}/mipmap-anydpi-v26`, { recursive: true })
  writeFileSync(`${res}/mipmap-anydpi-v26/ic_launcher.xml`, adaptive)
  writeFileSync(`${res}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptive)
  writeFileSync(
    `${res}/values/ic_launcher_background.xml`,
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`,
  )

  // Splash screens: logo centred on the dark background, at each existing size.
  for (const dir of readdirSync(res).filter((d) => d.startsWith('drawable'))) {
    const file = join(res, dir, 'splash.png')
    if (!existsSync(file)) continue
    const head = readFileSync(file)
    const w = head.readUInt32BE(16)
    const h = head.readUInt32BE(20)
    const logo = Math.min(w, h) * 0.45
    const splash = svg(
      `0 0 ${w} ${h}`,
      `<rect width="${w}" height="${h}" fill="${BG}"/>` +
        `<svg x="${(w - logo) / 2}" y="${(h - logo) / 2}" width="${logo}" height="${logo}" viewBox="18 18 72 72">${foreground()}</svg>`,
    )
    png(splash, w, file)
  }
}

console.log('Icons generated.')
