import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { BarcodeFormat, DecodeHintType } from '@zxing/library'

// Barcode scanning runs entirely on the phone with ZXing (open source, no Google ML Kit).

const hints = new Map<DecodeHintType, unknown>([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
  [DecodeHintType.TRY_HARDER, true],
])

export default function Scanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [manual, setManual] = useState('')

  useEffect(() => {
    let controls: IScannerControls | undefined
    let stopped = false
    const reader = new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 150 })
    reader
      .decodeFromConstraints({ video: { facingMode: 'environment', width: { ideal: 1280 } } }, video.current!, (result) => {
        if (result && !stopped) {
          stopped = true
          navigator.vibrate?.(80)
          controls?.stop()
          onDetected(result.getText())
        }
      })
      .then((c) => {
        controls = c
        if (stopped) c.stop()
      })
      .catch((e: unknown) => {
        const name = e instanceof DOMException ? e.name : ''
        setError(
          name === 'NotAllowedError'
            ? 'Camera permission was refused. Allow camera access for BIS Tracker in Android settings, or type the barcode below.'
            : "Couldn't start the camera. Type the barcode below instead.",
        )
      })
    return () => {
      stopped = true
      controls?.stop()
    }
  }, [onDetected])

  return (
    <div className="scanner" role="dialog" aria-label="Scan barcode">
      <video ref={video} className="scanner-video" muted playsInline />
      <div className="scanner-frame" aria-hidden="true" />
      <div className="scanner-panel stack">
        {error ? <p className="warn">{error}</p> : <p className="muted small">Point the camera at the barcode.</p>}
        <form
          className="row-actions"
          onSubmit={(e) => {
            e.preventDefault()
            if (/^\d{6,14}$/.test(manual)) onDetected(manual)
          }}
        >
          <input className="input grow" inputMode="numeric" placeholder="Or type the barcode" value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))} />
          <button className="btn" type="submit">Look up</button>
        </form>
        <button className="btn btn-block" onClick={onClose}>Cancel</button>
      </div>
    </div>
  )
}
