import { useEffect, useRef, useState } from 'react'

/**
 * A silent looping demo clip. The file is read into memory first and played from
 * there, because the Android app's built-in file server doesn't handle the
 * partial (range) requests video players make. If autoplay is still refused,
 * a play button appears instead of a frozen picture.
 */
export default function DemoVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const video = useRef<HTMLVideoElement>(null)
  const [url, setUrl] = useState<string>()
  const [needsTap, setNeedsTap] = useState(false)

  useEffect(() => {
    let objectUrl: string | undefined
    let cancelled = false
    fetch(src)
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(new Blob([blob], { type: 'video/mp4' }))
        setUrl(objectUrl)
      })
      .catch(() => !cancelled && setUrl(src)) // fall back to loading it directly
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  const play = () => {
    const v = video.current
    if (!v) return
    v.muted = true
    v.play().then(() => setNeedsTap(false), () => setNeedsTap(true))
  }

  return (
    <>
      <video
        ref={video}
        src={url}
        poster={poster}
        aria-label={label}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={play}
        onClick={play}
      />
      {needsTap && (
        <button type="button" className="play-overlay" onClick={play} aria-label={`Play ${label}`}>
          ▶
        </button>
      )}
    </>
  )
}
