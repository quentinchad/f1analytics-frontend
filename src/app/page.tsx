import Link from 'next/link'

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto text-center py-20">
      <div className="inline-block bg-f1red px-4 py-1 rounded-full text-xs font-bold tracking-widest mb-6 text-white">
        FORMULA 1 ANALYTICS
      </div>
      <h1 className="text-5xl font-bold mb-4 tracking-tight">
        Race Data.<br />
        <span className="text-f1red">Analysed.</span>
      </h1>
      <p className="text-f1muted text-lg mb-10 max-w-xl mx-auto">
        Explore every season, race, session, and driver stat powered by FastF1.
        Deep telemetry, tyre strategy, and championship insights at your fingertips.
      </p>
      <div className="flex flex-wrap gap-4 justify-center">
        <Link href="/dashboard" className="btn-primary text-base px-6 py-3">
          Open Dashboard
        </Link>
        <Link href="/seasons" className="btn-ghost text-base px-6 py-3">
          Browse Seasons
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
        {[
          { label: 'Seasons', value: '70+', href: '/seasons' },
          { label: 'Circuits', value: '77+', href: '/circuits' },
          { label: 'Drivers', value: '800+', href: '/drivers' },
          { label: 'Data Points', value: '∞', href: '/dashboard' },
        ].map(s => (
          <Link key={s.label} href={s.href} className="card hover:border-f1red transition-colors">
            <div className="text-3xl font-bold text-f1red">{s.value}</div>
            <div className="text-f1muted text-sm mt-1">{s.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
