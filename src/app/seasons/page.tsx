'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function SeasonsPage() {
  const [seasons, setSeasons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSeasons().then(setSeasons).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">All Seasons</h1>
      {loading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {Array(20).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-4">
          {seasons.map((s: any) => (
            <Link
              key={s.year}
              href={`/seasons/${s.year}`}
              className="card hover:border-f1red transition-colors text-center"
            >
              <div className="text-2xl font-bold">{s.year}</div>
              {s.total_rounds > 0 && (
                <div className="text-f1muted text-xs mt-1">{s.total_rounds} rounds</div>
              )}
              {s.champion_driver && (
                <div className="text-f1red text-xs mt-1 font-semibold truncate">{s.champion_driver}</div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
