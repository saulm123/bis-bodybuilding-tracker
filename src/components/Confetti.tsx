// A short burst of coloured pieces, pure CSS. Skipped if you've asked for reduced motion.
const COLOURS = ['#ef9f27', '#6aa6ff', '#5dca8a', '#c68cff', '#f2f2f2']

export default function Confetti({ pieces = 60 }: { pieces?: number }) {
  return (
    <div className="confetti" aria-hidden="true">
      {Array.from({ length: pieces }, (_, i) => (
        <span
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: COLOURS[i % COLOURS.length],
            animationDelay: `${(i % 12) * 0.05}s`,
            animationDuration: `${1.6 + ((i * 13) % 10) / 10}s`,
            transform: `rotate(${(i * 47) % 360}deg)`,
          }}
        />
      ))}
    </div>
  )
}
