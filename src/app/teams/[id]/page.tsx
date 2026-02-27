'use client'
import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TEAM_COLORS: Record<string, string> = {
  ferrari: '#DC0000', mclaren: '#FF8000', mercedes: '#00D2BE', red_bull: '#3671C6',
  alpine: '#0093CC', aston_martin: '#358C75', williams: '#005AFF', haas: '#B6BABD',
  rb: '#6692FF', sauber: '#52E252',
}

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="card text-center">
      <div className="text-2xl font-bold text-f1red">{value ?? '—'}</div>
      <div className="text-f1muted text-xs mt-1">{label}</div>
    </div>
  )
}

export default function TeamPage() {
  const params = useParams()
  const constructorId = params.id as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)
  const [expandedYears, setExpandedYears] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.getTeam(constructorId).then(setData).finally(() => setLoading(false))
  }, [constructorId])

  const drivers: any[] = data?.drivers ?? []

  const lineupByYear = useMemo(() => {
    const map: Record<number, any[]> = {}
    for (const d of drivers) {
      const years: number[] = Array.isArray(d.seasons) ? d.seasons : [d.season_year].filter(Boolean)
      for (const y of years) {
        if (!map[y]) map[y] = []
        if (!map[y].find((x: any) => x.driver_id === d.driver_id)) map[y].push(d)
      }
    }
    return Object.entries(map)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([year, ds]) => ({ year: parseInt(year), drivers: ds }))
  }, [drivers])

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-48 rounded-xl" />
      <div className="grid grid-cols-4 gap-4">{Array(4).fill(0).map((_,i) => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>
      <div className="skeleton h-64 rounded-xl" />
    </div>
  )

  const team    = data?.team
  const history: any[] = data?.championship_history ?? []
  const stats   = data?.stats ?? {}
  const color   = TEAM_COLORS[constructorId] ?? '#E10600'
  const logoUrl = team?.logo_url

  const chartData = history.map((h: any) => ({
    year:     h.season_year,
    position: parseInt(h.position ?? 0),
    points:   parseFloat(h.points ?? 0),
  }))

  return (
    <div className="space-y-6">
      <Link href="/teams" className="text-f1muted hover:text-white text-sm">← Écuries</Link>

      {/* Header */}
      <div className="card overflow-hidden p-0">
        <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
        <div className="p-6">
          <div className="flex gap-6 items-start">
            <div className="w-24 h-24 rounded-xl bg-f1border/30 overflow-hidden flex items-center justify-center flex-shrink-0">
              {logoUrl && !imgError ? (
                <img src={logoUrl} alt={team?.name ?? ''} className="w-full h-full object-contain p-2 bg-white"
                  onError={() => setImgError(true)} />
              ) : (
                <span className="text-3xl font-bold" style={{ color }}>
                  {constructorId.slice(0, 3).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{team?.name ?? constructorId}</h1>
              <div className="text-f1muted mt-1">{team?.nationality}</div>
              {history.length > 0 && (
                <div className="text-f1muted text-sm mt-1">
                  {history[0].season_year} – {history[history.length - 1].season_year}
                </div>
              )}
              {team?.wiki_url && (
                <a href={team.wiki_url} target="_blank" rel="noopener noreferrer"
                  className="text-f1muted text-xs hover:text-white mt-3 inline-block">
                  Wikipédia →
                </a>
              )}
            </div>
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

      {/* Graphique position au championnat constructeurs */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="font-bold mb-1">Position au championnat constructeurs</h2>
          <p className="text-f1muted text-xs mb-4">
            {history.length} saison{history.length > 1 ? 's' : ''} — {chartData[0]?.year} à {chartData[chartData.length - 1]?.year}
          </p>
          {/* Scrollable horizontalement sur mobile */}
          <div className="overflow-x-auto -mx-1">
            <div style={{ minWidth: Math.max(chartData.length * 12, 400) }}>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#38384E" />
                  <XAxis dataKey="year" stroke="#888899" tick={{ fontSize: 11 }}
                    tickFormatter={(v) => chartData.length > 15 ? (v % 5 === 0 ? v : '') : v} />
                  <YAxis
                    stroke="#888899"
                    tick={{ fontSize: 11 }}
                    reversed
                    allowDecimals={false}
                    tickFormatter={(v) => `P${v}`}
                    domain={[1, 'dataMax']}
                  />
                  <Tooltip
                    contentStyle={{ background: '#242438', border: '1px solid #38384E', borderRadius: '8px', fontSize: 12 }}
                    formatter={(val: any, _: any, props: any) => [`P${val} — ${props.payload.points} pts`, 'Classement']}
                    labelFormatter={(l) => `Saison ${l}`}
                  />
                  <Line type="monotone" dataKey="position" stroke={color} strokeWidth={2}
                    dot={(p: any) => <circle key={p.key} cx={p.cx} cy={p.cy} r={3} fill={color} />}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {chartData.length > 20 && (
            <p className="text-f1muted text-xs mt-2 text-center md:hidden">← Glisser pour voir tout l'historique →</p>
          )}
        </div>
      )}

      {/* Historique saisons + line-up */}
      {history.length > 0 && (
        <div className="card overflow-x-auto">
          <h2 className="font-bold mb-4">Palmarès par saison</h2>
          <table className="w-full text-sm min-w-[500px] table-fixed">
            <thead>
              <tr className="border-b border-f1border text-f1muted text-left">
                <th className="pb-2 w-16">Saison</th>
                <th className="pb-2 w-16 text-center">Pos.</th>
                <th className="pb-2 w-24 text-right">Points</th>
                <th className="pb-2 w-20 text-right pr-6">Victoires</th>
                <th className="pb-2 w-36">Pilote 1</th>
                <th className="pb-2 w-36">Pilote 2</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((h: any) => {
                const lineup = lineupByYear.find(l => l.year === h.season_year)?.drivers ?? []
                const isExpanded = expandedYears.has(h.season_year)
                const shown = isExpanded ? lineup : lineup.slice(0, 2)
                return (
                  <>
                    <tr key={h.season_year} className="border-b border-f1border/40 hover:bg-f1mid/50">
                      <td className="py-2 w-16">
                        <Link href={`/seasons/${h.season_year}`} className="hover:text-f1red font-semibold">
                          {h.season_year}
                        </Link>
                      </td>
                      <td className="py-2 w-16 text-center">
                        {parseInt(h.position) === 0 ? (
                          <span className="font-bold text-gray-500 text-xs">DSQ</span>
                        ) : (
                          <span className={`font-bold ${parseInt(h.position) === 1 ? 'text-yellow-400' : parseInt(h.position) <= 3 ? 'text-orange-400' : 'text-white'}`}>
                            P{h.position}
                          </span>
                        )}
                      </td>
                      <td className="py-2 w-24 text-right font-bold tabular-nums">{h.points}</td>
                      <td className="py-2 w-20 text-right tabular-nums pr-6">{h.wins ?? 0}</td>
                      <td className="py-2 w-36">
                        {shown[0] && (
                          <Link href={`/drivers/${shown[0].driver_id}`}
                            className="text-f1muted hover:text-f1red transition-colors whitespace-nowrap">
                            {shown[0].first_name} <span className="font-semibold text-white">{shown[0].last_name}</span>
                          </Link>
                        )}
                      </td>
                      <td className="py-2 w-36">
                        {shown[1] && (
                          <Link href={`/drivers/${shown[1].driver_id}`}
                            className="text-f1muted hover:text-f1red transition-colors whitespace-nowrap">
                            {shown[1].first_name} <span className="font-semibold text-white">{shown[1].last_name}</span>
                          </Link>
                        )}
                      </td>
                      <td className="py-2 w-8 text-center">
                        {lineup.length > 2 && !isExpanded && (
                          <button
                            onClick={() => setExpandedYears(prev => new Set(prev).add(h.season_year))}
                            className="text-xs text-f1muted bg-f1border/60 hover:bg-f1border hover:text-white px-1.5 py-0.5 rounded transition-colors">
                            +{lineup.length - 2}
                          </button>
                        )}
                        {isExpanded && (
                          <button
                            onClick={() => setExpandedYears(prev => { const s = new Set(prev); s.delete(h.season_year); return s })}
                            className="text-xs text-f1muted hover:text-white transition-colors">
                            ↑
                          </button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && lineup.slice(2).map((d: any) => (
                      <tr key={`${h.season_year}-${d.driver_id}`} className="border-b border-f1border/20 bg-f1mid/20">
                        <td colSpan={4} />
                        <td className="py-1.5 w-48" colSpan={2}>
                          <Link href={`/drivers/${d.driver_id}`}
                            className="text-f1muted hover:text-f1red transition-colors whitespace-nowrap text-xs">
                            {d.first_name} <span className="font-semibold text-white">{d.last_name}</span>
                          </Link>
                        </td>
                        <td />
                      </tr>
                    ))}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
