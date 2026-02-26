'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

function Skeleton({ h = 'h-24', w = 'w-full' }: { h?: string; w?: string }) {
  return <div className={`skeleton ${h} ${w} rounded-xl`} />
}

export default function Dashboard() {
  const [championship, setChampionship] = useState<any>(null)
  const [races, setRaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    Promise.all([
      api.getChampionship(currentYear),
      api.getRaces(currentYear),
    ]).then(([champ, r]) => {
      setChampionship(champ)
      setRaces(Array.isArray(r) ? r : [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [currentYear])

  const champYear   = championship?.year ?? currentYear
  const top5Drivers = championship?.drivers?.slice(0, 5) ?? []
  const top5Cons    = championship?.constructors?.slice(0, 5) ?? []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const recentRaces = races
    .filter((r: any) => r.date && new Date(r.date) >= today)
    .slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentYear} Season Dashboard</h1>
          {champYear !== currentYear && (
            <p className="text-f1muted text-sm mt-1">
              Championship standings: {champYear} (no {currentYear} data yet)
            </p>
          )}
        </div>
        <Link href={`/seasons/${currentYear}`} className="btn-ghost">Full Season →</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Driver Standings */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-f1red">●</span> Driver Championship {champYear}
          </h2>
          {loading ? (
            <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} h="h-10" />)}</div>
          ) : top5Drivers.length === 0 ? (
            <p className="text-f1muted text-sm py-4">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-1">
              {top5Drivers.map((d: any, i: number) => (
                <div key={d.driver_id}
                  className={`flex items-center gap-3 py-2 border-b border-f1border last:border-0 ${i === 0 ? 'bg-f1red/5 -mx-5 px-5 rounded' : ''}`}
                >
                  <span className={`w-6 text-sm font-bold ${i === 0 ? 'text-f1red' : 'text-f1muted'}`}>{d.position}</span>
                  <Link href={`/drivers/${d.driver_id}`}
                    className="flex-1 font-semibold hover:text-f1red transition-colors text-sm">
                    {d.first_name} {d.last_name}
                  </Link>
                  <span className="text-f1muted text-xs hidden sm:block">{d.constructor_name}</span>
                  <span className="font-bold text-white text-sm">{d.points} pts</span>
                </div>
              ))}
              <Link href={`/seasons/${champYear}`}
                className="block text-center text-f1muted text-xs mt-3 hover:text-white">
                Voir classement complet →
              </Link>
            </div>
          )}
        </div>

        {/* Constructor Standings */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-f1red">●</span> Constructor Championship {champYear}
          </h2>
          {loading ? (
            <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} h="h-10" />)}</div>
          ) : top5Cons.length === 0 ? (
            <p className="text-f1muted text-sm py-4">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-1">
              {top5Cons.map((c: any, i: number) => (
                <div key={c.constructor_id}
                  className={`flex items-center gap-3 py-2 border-b border-f1border last:border-0 ${i === 0 ? 'bg-f1red/5 -mx-5 px-5 rounded' : ''}`}
                >
                  <span className={`w-6 text-sm font-bold ${i === 0 ? 'text-f1red' : 'text-f1muted'}`}>{c.position}</span>
                  <span className="flex-1 font-semibold text-sm">{c.constructor_name}</span>
                  <span className="font-bold text-white text-sm">{c.points} pts</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Races */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Upcoming Races</h2>
          <Link href={`/seasons/${currentYear}`} className="text-f1muted text-xs hover:text-white">
            Voir tout →
          </Link>
        </div>
        {loading ? (
          <div className="grid md:grid-cols-5 gap-4">
            {Array(5).fill(0).map((_, i) => <Skeleton key={i} h="h-20" />)}
          </div>
        ) : races.length === 0 ? (
          <p className="text-f1muted text-sm">Aucune course trouvée pour {currentYear}</p>
        ) : (
          <div className="grid md:grid-cols-5 gap-4">
            {recentRaces.map((r: any) => (
              <Link key={r.round} href={`/seasons/${currentYear}/${r.round}`}
                className="bg-f1mid border border-f1border rounded-lg p-3 hover:border-f1red transition-colors">
                <div className="text-xs text-f1muted">Round {r.round}</div>
                <div className="font-semibold text-sm mt-1 line-clamp-2">{r.name}</div>
                <div className="text-xs text-f1muted mt-1">{r.country}</div>
                {r.date && <div className="text-xs text-f1border mt-1">{r.date}</div>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
