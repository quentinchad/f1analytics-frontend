'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function SeasonPage() {
  const params = useParams()
  const year = Number(params.year)
  const [data, setData] = useState<any>(null)
  const [champ, setChamp] = useState<any>(null)
  const [tab, setTab] = useState<'races' | 'drivers' | 'constructors'>('races')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getSeason(year), api.getChampionship(year)])
      .then(([s, c]) => { setData(s); setChamp(c) })
      .finally(() => setLoading(false))
  }, [year])

  const races = data?.races ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/seasons" className="text-f1muted hover:text-white text-sm">← Seasons</Link>
        <h1 className="text-3xl font-bold">{year} Formula 1 Season</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['races', 'drivers', 'constructors'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'} capitalize`}
          >
            {t === 'races' ? `${races.length} Races` : t === 'drivers' ? 'Driver Standings' : 'Constructor Standings'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array(10).fill(0).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
      ) : (
        <>
          {tab === 'races' && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {races.map((r: any) => (
                <Link
                  key={r.round}
                  href={`/seasons/${year}/${r.round}`}
                  className="card hover:border-f1red transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-f1muted text-xs">Round {r.round}</div>
                      <div className="font-bold mt-1">{r.name}</div>
                      <div className="text-f1muted text-sm mt-1">{r.country}</div>
                    </div>
                    {r.date && <div className="text-xs text-f1muted">{r.date}</div>}
                  </div>
                  {r.winner_driver_id && (
                    <div className="mt-3 text-xs text-f1muted">
                      Winner: <span className="text-white">{r.winner_driver_id}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {tab === 'drivers' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-f1border text-f1muted">
                    <th className="pb-3 text-left w-8">Pos</th>
                    <th className="pb-3 text-left">Driver</th>
                    <th className="pb-3 text-left">Team</th>
                    <th className="pb-3 text-right">Wins</th>
                    <th className="pb-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {(champ?.drivers ?? []).map((d: any, i: number) => (
                    <tr key={d.driver_id} className={`border-b border-f1border/40 ${i === 0 ? 'bg-f1red/5' : ''}`}>
                      <td className="py-3 text-f1muted">{d.position}</td>
                      <td className="py-3">
                        <Link href={`/drivers/${d.driver_id}`} className="hover:text-f1red font-semibold">
                          {d.first_name} {d.last_name}
                        </Link>
                      </td>
                      <td className="py-3 text-f1muted">
                        <Link href={`/teams/${d.constructor_id}`} className="hover:text-f1red transition-colors">
                          {d.constructor_name}
                        </Link>
                      </td>
                      <td className="py-3 text-right">{d.wins}</td>
                      <td className="py-3 text-right font-bold">{d.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'constructors' && (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-f1border text-f1muted">
                    <th className="pb-3 text-left w-8">Pos</th>
                    <th className="pb-3 text-left">Team</th>
                    <th className="pb-3 text-right">Wins</th>
                    <th className="pb-3 text-right">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {(champ?.constructors ?? []).map((c: any) => (
                    <tr key={c.constructor_id} className="border-b border-f1border/40">
                      <td className="py-3 text-f1muted">{c.position}</td>
                      <td className="py-3 font-semibold">
                        <Link href={`/teams/${c.constructor_id}`} className="hover:text-f1red transition-colors">
                          {c.constructor_name}
                        </Link>
                      </td>
                      <td className="py-3 text-right">{c.wins}</td>
                      <td className="py-3 text-right font-bold">{c.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
