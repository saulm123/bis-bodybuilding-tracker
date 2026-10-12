// QR code that opens the download page. Run with `npm run qr`.
import QRCode from 'qrcode'
import { writeFileSync, mkdirSync } from 'node:fs'

const url = 'https://saulm123.github.io/bis-bodybuilding-tracker/download.html'
const opts = { margin: 2, color: { dark: '#111111', light: '#ffffff' }, errorCorrectionLevel: 'M' }
mkdirSync('assets/store', { recursive: true })
writeFileSync('public/qr-download.svg', await QRCode.toString(url, { ...opts, type: 'svg' }))
await QRCode.toFile('assets/store/qr-download.png', url, { ...opts, width: 1024 })
console.log('QR code for', url)
