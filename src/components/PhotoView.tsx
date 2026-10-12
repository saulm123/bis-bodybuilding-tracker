import { useState } from 'react'
import type { Photo } from '../db/schema'
import { usePhotoUrl } from '../checkin/store'

/** A progress photo, blurred until tapped if "blur photos" is on. */
export default function PhotoView({ photo, blur, alt, className = '', interactive = true }: { photo?: Photo; blur: boolean; alt: string; className?: string; interactive?: boolean }) {
  const url = usePhotoUrl(photo)
  const [shown, setShown] = useState(false)
  if (!photo || !url) return <div className={`photo photo-empty ${className}`}>No photo</div>
  const hidden = blur && !shown
  if (!interactive) {
    // Inside a link: no tap-to-reveal, just the (possibly blurred) thumbnail.
    return (
      <div className={`photo ${className}`}>
        <img src={url} alt={alt} className={blur ? 'blurred' : ''} />
      </div>
    )
  }
  return (
    <button type="button" className={`photo ${className}`} onClick={() => setShown(!shown)} aria-label={hidden ? `Show ${alt}` : alt}>
      <img src={url} alt={alt} className={hidden ? 'blurred' : ''} />
      {hidden && <span className="photo-hint">Tap to show</span>}
    </button>
  )
}
