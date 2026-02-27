'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const TEAM_COLORS: Record<string, string> = {
  ferrari: '#DC0000', mclaren: '#FF8000', mercedes: '#00D2BE', 'red_bull': '#3671C6',
  alpine: '#0093CC', aston_martin: '#358C75', williams: '#005AFF', haas: '#B6BABD',
  rb: '#6692FF', sauber: '#52E252',
}

function useBack(fallback: string) {
  const router = useRouter()
  return () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallback)
    }
  }
}

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-bold text-f1red">{value ?? '—'}</div>
      <div className="text-f1muted text-xs mt-1">{label}</div>
    </div>
  )
}

export default function DriverPage() {
  const params = useParams()
  const driverId = params.id as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const goBack = useBack('/drivers')

  useEffect(() => {
    api.getDriver(driverId).then(setData).finally(() => setLoading(false))
  }, [driverId])

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-48 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">{Array(4).fill(0).map((_,i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  )

  const driver = data?.driver
  const history: any[] = data?.championship_history ?? []
  const stats = data?.stats ?? {}

  // Pour le graphique — toutes les saisons
  const chartData = history.map((h: any) => ({
    year: h.season_year,
    position: parseInt(h.position ?? 0),
    points: parseFloat(h.points ?? 0),
    team: h.constructor_name,
  }))

  // Historique équipes
  const teamHistory = history.reduce((acc: any[], h: any) => {
    const last = acc[acc.length - 1]
    if (!last || last.team !== h.constructor_name) {
      acc.push({ team: h.constructor_name, constructor_id: h.constructor_id, from: h.season_year, to: h.season_year })
    } else { last.to = h.season_year }
    return acc
  }, [])

  const photoUrl = driver?.photo_url || `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_320/content/dam/fom-website/drivers/2025Drivers/${driverId}`

  return (
    <div className="space-y-6">
      <button onClick={goBack} className="text-f1muted hover:text-white text-sm">← Retour</button>

      {/* Header */}
      <div className="card">
        <div className="flex gap-6 items-start">
          {/* Photo */}
          <div className="w-28 h-28 rounded-xl bg-f1border overflow-hidden flex items-center justify-center flex-shrink-0">
            {!imgError ? (
              <img src={photoUrl} alt={driver?.last_name ?? ''} className="w-full h-full object-cover object-top"
                onError={() => setImgError(true)} />
            ) : (
              <span className="text-4xl font-bold text-f1red">{driver?.code?.[0] ?? '?'}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {driver?.number && (
                <span className="text-f1red font-bold text-3xl">#{driver.number}</span>
              )}
              <h1 className="text-3xl font-bold">{driver?.first_name} {driver?.last_name}</h1>
              {driver?.code && <span className="badge bg-f1border text-f1muted text-lg px-3">{driver.code}</span>}
            </div>
            <div className="text-f1muted mt-1">{driver?.nationality}</div>
            {driver?.dob && (
              <div className="text-f1muted text-sm mt-1">
                Né le {new Date(driver.dob).toLocaleDateString('fr-FR', {day:'numeric',month:'long',year:'numeric'})}
              </div>
            )}
            {/* Équipes */}
            <div className="flex flex-wrap gap-2 mt-3">
              {teamHistory.slice().reverse().slice(0, 5).map((t: any, i: number) => (
                <Link key={i} href={`/teams/${t.constructor_id}`} className="badge-soft hover:text-f1red transition-colors">
                  {t.team} {t.from === t.to ? t.from : `${t.from}–${t.to}`}
                </Link>
              ))}
            </div>
            {driver?.wiki_url && (
              <a href={driver.wiki_url} target="_blank" rel="noopener noreferrer"
                className="text-f1muted text-xs hover:text-white mt-2 inline-block">
                Wikipédia →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Saisons" value={stats.total_seasons} />
        <StatCard label="Victoires" value={stats.total_wins} />
        <StatCard label="Meilleur classement" value={stats.best_position ? `P${stats.best_position}` : null} />
        <StatCard label="Championnats" value={stats.championships ?? 0} />
      </div>

      {/* Graphique points par saison */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-1">Position au championnat</h2>
          <p className="text-f1muted text-xs mb-4">{history.length} saison{history.length > 1 ? 's' : ''} — {chartData[0]?.year} à {chartData[chartData.length-1]?.year}</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{left:0,right:10}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#38384E" />
              <XAxis dataKey="year" stroke="#888899" tick={{fontSize:11}}
                tickFormatter={(v) => chartData.length > 15 ? (v % 5 === 0 ? v : '') : v} />
              <YAxis stroke="#888899" tick={{fontSize:11}} reversed domain={[1, 'dataMax']}
                tickFormatter={(v) => `P${v}`} />
              <Tooltip
                contentStyle={{background:'#242438',border:'1px solid #38384E',borderRadius:'8px',fontSize:12}}
                formatter={(val: any, _: any, props: any) => [`P${val} — ${props.payload.points} pts — ${props.payload.team}`, 'Classement']}
                labelFormatter={(l) => `Saison ${l}`}
              />
              <Line type="monotone" dataKey="position" stroke="#E10600" strokeWidth={2}
                dot={(p: any) => (
                  <circle key={p.key} cx={p.cx} cy={p.cy} r={3} fill="#E10600" />
                )}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Historique saisons */}
      {history.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="font-bold mb-4">Palmarès par saison</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-f1border text-f1muted text-left">
                <th className="pb-2">Saison</th>
                <th className="pb-2">Équipe</th>
                <th className="pb-2 text-center">Pos.</th>
                <th className="pb-2 text-right">Points</th>
                <th className="pb-2 text-right">Victoires</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h: any) => (
                <tr key={h.season_year} className="border-b border-f1border/40 hover:bg-f1mid/50">
                  <td className="py-2">
                    <Link href={`/seasons/${h.season_year}`} className="hover:text-f1red font-semibold">
                      {h.season_year}
                    </Link>
                  </td>
                  <td className="py-2 text-f1muted">
                    {h.constructor_id ? (
                      <Link href={`/teams/${h.constructor_id}`} className="hover:text-f1red transition-colors">
                        {h.constructor_name ?? '—'}
                      </Link>
                    ) : (h.constructor_name ?? '—')}
                  </td>
                  <td className="py-2 text-center">
                    {parseInt(h.position) === 0 ? (
                      <span className="font-bold text-gray-500 text-xs">DSQ</span>
                    ) : (
                      <span className={`font-bold ${parseInt(h.position) === 1 ? 'text-yellow-400' : parseInt(h.position) <= 3 ? 'text-orange-400' : 'text-white'}`}>
                        P{h.position}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-right font-bold">{h.points}</td>
                  <td className="py-2 text-right">{h.wins ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
