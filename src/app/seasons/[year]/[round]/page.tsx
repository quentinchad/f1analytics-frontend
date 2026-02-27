'use client'
import { useEffect, useState, useRef } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const SESSION_LABELS: Record<string, string> = {
  FP1: 'Practice 1', FP2: 'Practice 2', FP3: 'Practice 3',
  Q: 'Qualifying', SQ: 'Sprint Qualifying', SS: 'Sprint Shootout',
  R: 'Race', S: 'Sprint',
}

const COMPOUND_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  SOFT:         { bg: 'bg-red-500/20',    text: 'text-red-400',    bar: '#ef4444' },
  MEDIUM:       { bg: 'bg-yellow-400/20', text: 'text-yellow-300', bar: '#facc15' },
  HARD:         { bg: 'bg-gray-300/20',   text: 'text-gray-200',   bar: '#d1d5db' },
  INTERMEDIATE: { bg: 'bg-green-500/20',  text: 'text-green-400',  bar: '#22c55e' },
  WET:          { bg: 'bg-blue-500/20',   text: 'text-blue-400',   bar: '#3b82f6' },
}

function CompoundBadge({ compound }: { compound: string }) {
  const c = COMPOUND_COLORS[compound] ?? { bg: 'bg-f1border', text: 'text-f1muted' }
  return <span className={`badge ${c.bg} ${c.text}`}>{compound}</span>
}

// Graphique Gantt des stratégies pneus
function TyreStrategyChart({ strategy, totalLaps, raceResults }: { strategy: any[]; totalLaps: number; raceResults: any[] }) {
  // Map position finale depuis les résultats de course
  // On indexe par driver_id ET par driver_code pour couvrir les deux cas
  const positionById:   Record<string, number> = {}
  const positionByCode: Record<string, number> = {}
  for (const r of raceResults) {
    const pos = parseInt(r.position) || 999
    if (r.driver_id)   positionById[r.driver_id]     = pos
    if (r.driver_code) positionByCode[r.driver_code] = pos
  }
  const getPosition = (driverId: string, driverCode: string) =>
    positionById[driverId] ?? positionByCode[driverCode] ?? 999

  // Grouper par pilote, dans l'ordre de leur position finale
  const driversMap: Record<string, { driver_code: string; position: number; stints: any[] }> = {}
  for (const s of strategy) {
    if (!driversMap[s.driver_id]) {
      driversMap[s.driver_id] = {
        driver_code: s.driver_code ?? s.driver_id,
        position: getPosition(s.driver_id, s.driver_code ?? ''),
        stints: [],
      }
    }
    driversMap[s.driver_id].stints.push(s)
  }

  const drivers = Object.values(driversMap)
    .sort((a, b) => a.position - b.position)
    .map(d => ({
      ...d,
      stints: d.stints.sort((a: any, b: any) => (a.lap_start ?? a.stint_number) - (b.lap_start ?? b.stint_number)),
    }))

  const laps = totalLaps > 0 ? totalLaps : Math.max(
    ...strategy.map(s => (s.lap_start ?? 0) + (s.laps_on_tyre ?? 0)),
    1
  )

  if (drivers.length === 0) {
    return <p className="text-f1muted text-sm">Strategy data not available for this session.</p>
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Légende */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(COMPOUND_COLORS).map(([name, c]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.bar }} />
            <span className="text-xs text-f1muted">{name}</span>
          </div>
        ))}
      </div>

      <div className="min-w-[500px]">
        {/* Header tour */}
        <div className="flex items-center mb-1 ml-14 md:ml-20">
          <div className="flex-1 relative h-4">
            {/* Ticks tous les 10 tours */}
            {Array.from({ length: Math.floor(laps / 10) + 1 }, (_, i) => i * 10).filter(t => t <= laps).map(t => (
              <span
                key={t}
                className="absolute text-xs text-f1muted/50 -translate-x-1/2"
                style={{ left: `${(t / laps) * 100}%` }}
              >
                {t === 0 ? '' : t}
              </span>
            ))}
          </div>
        </div>

        {/* Lignes pilotes */}
        <div className="space-y-1">
          {drivers.map((driver) => {
            // Calculer les stints avec lap_start/lap_end
            let cursor = 1
            const stints = driver.stints.map((s: any) => {
              const start = s.lap_start ?? cursor
              const lapCount = s.laps_on_tyre ?? 0
              const end = s.lap_end ?? (start + lapCount - 1)
              cursor = end + 1
              return { ...s, _start: start, _end: Math.min(end, laps) }
            })

            return (
              <div key={driver.driver_code} className="flex items-center gap-2">
                {/* Code pilote */}
                <span className="w-12 md:w-18 text-xs font-mono text-f1muted text-right flex-shrink-0 pr-2">
                  {driver.driver_code}
                </span>
                {/* Barre */}
                <div className="flex-1 relative h-6 bg-f1border/30 rounded overflow-hidden">
                  {stints.map((s: any, i: number) => {
                    const color = COMPOUND_COLORS[s.compound]?.bar ?? '#6b7280'
                    const leftPct  = ((s._start - 1) / laps) * 100
                    const widthPct = ((s._end - s._start + 1) / laps) * 100
                    return (
                      <div
                        key={i}
                        className="absolute top-0 h-full flex items-center justify-center group"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          backgroundColor: color,
                          opacity: 0.85,
                        }}
                        title={`${s.compound} — laps ${s._start}–${s._end} (${s._end - s._start + 1} laps)`}
                      >
                        {/* Label compound si assez large */}
                        {widthPct > 12 && (
                          <span className="text-[10px] font-bold text-black/70 truncate px-1 hidden sm:block">
                            {s.compound?.[0]}
                          </span>
                        )}
                      </div>
                    )
                  })}
                  {/* Ligne de fond tour-par-tour */}
                  {Array.from({ length: Math.floor(laps / 10) }, (_, i) => (i + 1) * 10).filter(t => t < laps).map(t => (
                    <div
                      key={t}
                      className="absolute top-0 h-full w-px bg-black/20"
                      style={{ left: `${(t / laps) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Axe X bas */}
        <div className="flex items-center mt-1 ml-14 md:ml-20">
          <div className="flex-1 relative h-4">
            <div className="absolute inset-x-0 top-0 border-t border-f1border/40" />
            <span className="absolute left-0 text-xs text-f1muted/50">1</span>
            <span className="absolute right-0 text-xs text-f1muted/50 translate-x-1/2">{laps}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RacePage() {
  const params = useParams()
  const year = Number(params.year)
  const round = Number(params.round)

  const [raceData, setRaceData]       = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [sessionData, setSessionData] = useState<any>(null)
  const [strategyData, setStrategyData] = useState<any>(null)
  const [resultsError, setResultsError] = useState<string | null>(null)
  const [summary, setSummary]         = useState<any>(null)
  const [tab, setTab]                 = useState<'results' | 'strategy' | 'summary'>('results')
  const [loading, setLoading]         = useState(true)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [totalRounds, setTotalRounds]  = useState<number>(0)

  useEffect(() => {
    Promise.all([
      api.getRace(year, round),
      api.getRaces(year),
    ]).then(([data, races]) => {
      setRaceData(data)
      setTotalRounds(Array.isArray(races) ? races.length : 0)

      // Ne pas tenter de charger les résultats pour les courses futures ou du jour
      const raceDate = data?.race?.date ? new Date(data.race.date) : null
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const isPast = raceDate && raceDate < today

      if (isPast) {
        const ordered = (data?.sessions ?? []).filter((s: any) => !['FP1','FP2','FP3'].includes(s.type))
        const raceSession = ordered.find((s: any) => s.type === 'R') ?? ordered[ordered.length - 1]
        if (raceSession) loadSession(raceSession)
      }
    }).finally(() => setLoading(false))
  }, [year, round])

  const loadSession = async (session: any) => {
    setSelectedSession(session)
    setSessionData(null)
    setStrategyData(null)
    setResultsError(null)
    setSummary(null)
    setTab('results')
    setSessionLoading(true)
    try {
      const [resultsSettled, strategySettled] = await Promise.allSettled([
        api.getSessionResults(session.id),
        session.type === 'R' || session.type === 'S'
          ? api.getSessionStrategy(session.id)
          : Promise.resolve(null),
      ])

      if (resultsSettled.status === 'fulfilled') {
        setSessionData(resultsSettled.value)
      } else {
        console.error('Failed to load results:', resultsSettled.reason)
        setResultsError('Impossible de charger les résultats. Réessaie.')
      }

      if (strategySettled.status === 'fulfilled') {
        setStrategyData(strategySettled.value)
      } else {
        console.error('Failed to load strategy:', strategySettled.reason)
      }
    } finally {
      setSessionLoading(false)
    }
  }

  const loadSummary = async () => {
    if (!selectedSession) return
    setSummary(null)
    const s = await api.getSummary(selectedSession.id)
    setSummary(s)
  }

  const race = raceData?.race
  const sessions = raceData?.sessions ?? []

  // Statut du GP selon la date
  const getRaceStatus = () => {
    if (!race?.date) return 'unknown'
    const raceDate = new Date(race.date)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const raceDateOnly = new Date(raceDate.getFullYear(), raceDate.getMonth(), raceDate.getDate())
    const diffDays = Math.ceil((raceDateOnly.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 0) return 'future'       // course pas encore eu lieu
    if (diffDays === 0) return 'today'      // jour J — résultats peut-être pas dispo
    if (diffDays >= -1) return 'recent'     // lendemain — résultats parfois pas encore officiels
    return 'past'                           // course passée, résultats disponibles
  }
  const raceStatus = getRaceStatus()
  const shouldLoadResults = raceStatus === 'past'

  // Tri des résultats par position (gère string et int, DNF/DSQ en fin)
  const results = [...(sessionData?.results ?? [])].sort((a, b) => {
    const pa = parseInt(a.position) || 999
    const pb = parseInt(b.position) || 999
    return pa - pb
  })

  // Nombre total de tours depuis les résultats (pilote qui a fait le + de tours)
  const totalLaps = Math.max(...results.map((r: any) => parseInt(r.laps_completed) || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/seasons/${year}`} className="text-f1muted hover:text-white text-sm">← {year} Season</Link>
        {!loading && (
          <div className="flex items-center gap-1">
            {round > 1 ? (
              <Link href={`/seasons/${year}/${round - 1}`}
                className="btn-ghost text-xs px-3 py-1">
                ← Round {round - 1}
              </Link>
            ) : (
              <span className="btn-ghost text-xs px-3 py-1 opacity-30 cursor-default">←</span>
            )}
            <span className="text-f1muted text-xs px-1">{round} / {totalRounds || '?'}</span>
            {totalRounds === 0 || round < totalRounds ? (
              <Link href={`/seasons/${year}/${round + 1}`}
                className="btn-ghost text-xs px-3 py-1">
                Round {round + 1} →
              </Link>
            ) : (
              <span className="btn-ghost text-xs px-3 py-1 opacity-30 cursor-default">→</span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="skeleton h-32 rounded-xl" />
      ) : (
        <div className="card">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-f1muted text-sm">Round {round} · {race?.country}</div>
              <h1 className="text-3xl font-bold mt-1">{race?.name}</h1>
              {race?.date && <div className="text-f1muted text-sm mt-1">{race.date}</div>}
            </div>
            {race?.circuit_key && (
              <Link href={`/circuits/${race.circuit_key}`} className="btn-ghost text-xs">
                Circuit Info →
              </Link>
            )}
          </div>

          {/* Sessions — on masque les FP, ordre logique du weekend */}
          {raceStatus === 'past' && (
            <div className="flex flex-wrap gap-2 mt-6">
              {sessions
                .filter((s: any) => !['FP1','FP2','FP3'].includes(s.type))
                .sort((a: any, b: any) => {
                  const order: Record<string, number> = { SQ: 1, SS: 1, S: 2, Q: 3, R: 4 }
                  return (order[a.type] ?? 9) - (order[b.type] ?? 9)
                })
                .map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => loadSession(s)}
                  className={`btn ${selectedSession?.id === s.id ? 'btn-primary' : 'btn-ghost'} text-xs`}
                >
                  {SESSION_LABELS[s.type] || s.type}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bannière course future */}
      {!loading && raceStatus === 'future' && race?.date && (
        <div className="card text-center py-10 space-y-3">
          <div className="text-4xl">🏁</div>
          <h2 className="text-xl font-bold">Course à venir</h2>
          <p className="text-f1muted text-sm">
            Le {new Date(race.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {(() => {
            const diff = Math.ceil((new Date(race.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            return <p className="text-f1red font-bold text-lg">Dans {diff} jour{diff > 1 ? 's' : ''}</p>
          })()}
        </div>
      )}

      {/* Bannière course aujourd'hui */}
      {!loading && raceStatus === 'today' && (
        <div className="card border border-f1red/40 text-center py-10 space-y-3">
          <div className="text-4xl">🔴</div>
          <h2 className="text-xl font-bold">C'est aujourd'hui !</h2>
          <p className="text-f1muted text-sm">La course est en cours ou se déroule aujourd'hui.</p>
          <p className="text-f1muted text-xs">Les résultats seront disponibles une fois la course terminée et les données officielles publiées.</p>
          <button
            onClick={() => {
              const ordered = sessions.filter((s: any) => !['FP1','FP2','FP3'].includes(s.type))
              const raceSession = ordered.find((s: any) => s.type === 'R') ?? ordered[ordered.length - 1]
              if (raceSession) loadSession(raceSession)
            }}
            className="btn-ghost text-xs mx-auto"
          >
            Essayer de charger les résultats
          </button>
        </div>
      )}

      {/* Bannière résultats pas encore officiels (lendemain) */}
      {!loading && raceStatus === 'recent' && !selectedSession && (
        <div className="card border border-yellow-500/30 text-center py-10 space-y-3">
          <div className="text-4xl">⏳</div>
          <h2 className="text-xl font-bold">Résultats en cours de publication</h2>
          <p className="text-f1muted text-sm">La course vient de se terminer, les données officielles sont peut-être pas encore disponibles.</p>
          <button
            onClick={() => {
              const ordered = sessions.filter((s: any) => !['FP1','FP2','FP3'].includes(s.type))
              const raceSession = ordered.find((s: any) => s.type === 'R') ?? ordered[ordered.length - 1]
              if (raceSession) loadSession(raceSession)
            }}
            className="btn-primary text-xs mx-auto"
          >
            Charger les résultats
          </button>
        </div>
      )}

      {selectedSession && (
        <div className="space-y-4">
          <div className="flex gap-2 items-center flex-wrap">
            <button onClick={() => setTab('results')} className={`btn ${tab === 'results' ? 'btn-primary' : 'btn-ghost'}`}>Results</button>
            {(selectedSession.type === 'R' || selectedSession.type === 'S') && (
              <button onClick={() => setTab('strategy')} className={`btn ${tab === 'strategy' ? 'btn-primary' : 'btn-ghost'}`}>Tyre Strategy</button>
            )}
            <button onClick={() => { setTab('summary'); loadSummary() }} className={`btn ${tab === 'summary' ? 'btn-primary' : 'btn-ghost'}`}>AI Summary</button>
          </div>

          {sessionLoading ? (
            <div className="space-y-2">{Array(10).fill(0).map((_, i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
          ) : (
            <>
              {tab === 'results' && (
                <div className="card overflow-x-auto">
                  {resultsError ? (
                    <div className="flex items-center gap-3 py-6">
                      <span className="text-f1red text-lg">⚠</span>
                      <div>
                        <p className="text-sm font-semibold">{resultsError}</p>
                        <button
                          onClick={() => loadSession(selectedSession)}
                          className="text-xs text-f1muted hover:text-white mt-1 underline"
                        >
                          Réessayer
                        </button>
                      </div>
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-f1border text-f1muted">
                          <th className="pb-3 text-left w-8">Pos</th>
                          <th className="pb-3 text-left">Driver</th>
                          <th className="pb-3 text-left hidden sm:table-cell">Team</th>
                          {selectedSession.type === 'Q' && <>
                            <th className="pb-3 text-right">Q1</th>
                            <th className="pb-3 text-right hidden md:table-cell">Q2</th>
                            <th className="pb-3 text-right hidden md:table-cell">Q3</th>
                          </>}
                          {(selectedSession.type === 'R' || selectedSession.type === 'S') && <>
                            <th className="pb-3 text-right hidden sm:table-cell">Gap</th>
                            <th className="pb-3 text-right">Pts</th>
                          </>}
                          <th className="pb-3 text-right hidden md:table-cell">Best Lap</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r: any) => (
                          <tr key={r.driver_id ?? r.driver_code} className="border-b border-f1border/40 hover:bg-f1mid/50">
                            <td className="py-3 text-f1muted font-mono text-xs">{r.position ?? '—'}</td>
                            <td className="py-3">
                              <Link href={`/drivers/${r.driver_id}`} className="font-semibold hover:text-f1red">
                                {r.first_name ? `${r.first_name} ${r.last_name}` : (r.driver_code ?? r.driver_id ?? '—')}
                              </Link>
                              {!!r.fastest_lap && <span className="ml-2 badge bg-purple-500/20 text-purple-400">FL</span>}
                            </td>
                            <td className="py-3 text-f1muted hidden sm:table-cell">
                              {r.constructor_id ? (
                                <Link href={`/teams/${r.constructor_id}`} className="hover:text-f1red transition-colors">
                                  {r.constructor_name}
                                </Link>
                              ) : r.constructor_name}
                            </td>
                            {selectedSession.type === 'Q' && <>
                              <td className="py-3 text-right font-mono text-xs">{r.q1_time ?? '-'}</td>
                              <td className="py-3 text-right font-mono text-xs hidden md:table-cell">{r.q2_time ?? '-'}</td>
                              <td className="py-3 text-right font-mono text-xs hidden md:table-cell">{r.q3_time ?? '-'}</td>
                            </>}
                            {(selectedSession.type === 'R' || selectedSession.type === 'S') && <>
                              <td className="py-3 text-right text-f1muted text-xs hidden sm:table-cell">{r.gap_to_leader ?? '-'}</td>
                              <td className="py-3 text-right font-bold">{r.points ?? 0}</td>
                            </>}
                            <td className="py-3 text-right font-mono text-xs hidden md:table-cell">{r.best_lap_time ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {tab === 'strategy' && (
                <div className="card">
                  <h3 className="font-bold mb-1">Tyre Strategy</h3>
                  {totalLaps > 0 && (
                    <p className="text-f1muted text-xs mb-4">{totalLaps} laps</p>
                  )}
                  <TyreStrategyChart
                    strategy={strategyData?.strategy ?? []}
                    totalLaps={totalLaps}
                    raceResults={results}
                  />
                </div>
              )}

              {tab === 'summary' && (
                <div className="card">
                  <h3 className="font-bold mb-4">Session Summary</h3>
                  {!summary ? (
                    <div className="skeleton h-32 rounded-lg" />
                  ) : (
                    <div className="space-y-3">
                      {summary.winner && (
                        <div className="bg-f1red/10 border border-f1red/30 rounded-lg p-4">
                          <div className="text-xs text-f1muted mb-1">Winner</div>
                          <div className="text-xl font-bold">{summary.winner}</div>
                          <div className="text-f1muted text-sm">{summary.winner_team}</div>
                        </div>
                      )}
                      {summary.podium && (
                        <div className="flex gap-3">
                          {summary.podium.map((p: any) => (
                            <div key={p.pos} className="card flex-1 text-center">
                              <div className="text-2xl font-bold text-f1red">P{p.pos}</div>
                              <div className="font-semibold text-sm mt-1">{p.driver}</div>
                              <div className="text-f1muted text-xs">{p.team}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {summary.narrative && (
                        <p className="text-f1muted text-sm leading-relaxed">{summary.narrative}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
