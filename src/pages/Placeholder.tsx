export default function Placeholder({ title, phase }: { title: string; phase: string }) {
  return (
    <section>
      <h1>{title}</h1>
      <p className="muted">Coming in {phase}.</p>
    </section>
  )
}
