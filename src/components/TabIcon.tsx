// Simple stroke icons for the tab bar (drawn here so nothing loads from the internet).
const paths: Record<string, string> = {
  today: 'M12 3v2M12 19v2M3 12h2M19 12h2M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  train: 'M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12',
  food: 'M7 3v8a2 2 0 0 0 2 2v8M11 3v8M7 7h4M17 3c-2 2-2 6 0 8v10',
  health: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  more: 'M4 7h16M4 12h16M4 17h16',
}

export default function TabIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
