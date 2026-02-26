'use client'
import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

const CURRENT_TEAM_IDS = new Set([
  'ferrari', 'mclaren', 'mercedes', 'red_bull', 'alpine',
  'aston_martin', 'williams', 'haas', 'rb', 'sauber',
])

const TEAM_COLORS: Record<string, string> = {
  ferrari: '#DC0000', mclaren: '#FF8000', mercedes: '#00D2BE', red_bull: '#3671C6',
  alpine: '#0093CC', aston_martin: '#358C75', williams: '#005AFF', haas: '#B6BABD',
  rb: '#6692FF', sauber: '#52E252',
}

function TeamLogo({ constructorId, logoUrl }: { constructorId: string; logoUrl?: string }) {
  const [error, setError] = useState(false)
  const color = TEAM_COLORS[constructorId] ?? '#E10600'

  if (logoUrl && !error) {
    return (
      <img
        src={logoUrl}
        alt={constructorId}
        className="w-full h-full object-contain p-2 bg-white"
        onError={() => setError(true)}
      />
    )
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <span className="font-bold text-lg" style={{ color }}>
        {constructorId.slice(0, 3).toUpperCase()}
      </span>
    </div>
  )
}

type SortKey = 'default' | 'championships' | 'wins' | 'seasons'

export default function TeamsPage() {
  const [teams, setTeams]   = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('default')

  useEffect(() => {
    api.getTeams().then((data) => {
      if (Array.isArray(data)) setTeams(data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return teams
      .filter(t => {
        return `${t.name ?? ''} ${t.nationality ?? ''} ${t.constructor_id ?? ''}`
          .toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (sortKey === 'default') {
          const aC = CURRENT_TEAM_IDS.has(a.constructor_id) ? 0 : 1
          const bC = CURRENT_TEAM_IDS.has(b.constructor_id) ? 0 : 1
          if (aC !== bC) return aC - bC
          return (parseInt(b.last_season) || 0) - (parseInt(a.last_season) || 0)
        }
        if (sortKey === 'championships') return (parseInt(b.championships) || 0) - (parseInt(a.championships) || 0)
        if (sortKey === 'wins')         return (parseInt(b.total_wins) || 0) - (parseInt(a.total_wins) || 0)
        if (sortKey === 'seasons')      return (parseInt(b.total_seasons) || 0) - (parseInt(a.total_seasons) || 0)
        return 0
      })
  }, [teams, search, sortKey])

  const hasFilters = search.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Écuries</h1>
          <p className="text-f1muted text-sm mt-0.5">{filtered.length} / {teams.length} écuries</p>
        </div>
        <input
          className="bg-f1card border border-f1border rounded-lg px-3 py-2 text-sm outline-none focus:border-f1red w-64"
          placeholder="Nom, nationalité..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filtres & tri */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-f1muted text-xs mr-1">Trier par :</span>
          {([
            ['default',      'Par défaut'],
            ['championships','Titres'],
            ['wins',         'Victoires'],
            ['seasons',      'Saisons'],
          ] as [SortKey, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setSortKey(key)}
              className={`btn text-xs ${sortKey === key ? 'btn-primary' : 'btn-ghost'}`}>
              {label}
            </button>
          ))}
        </div>

        {hasFilters && (
          <button onClick={() => { setSearch(''); setSortKey('default') }}
            className="text-xs text-f1muted hover:text-white transition-colors">
            ✕ Réinitialiser les filtres
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array(20).fill(0).map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-f1muted text-center py-12">Aucune écurie ne correspond aux filtres</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((t: any) => {
            const isCurrent     = CURRENT_TEAM_IDS.has(t.constructor_id)
            const championships = parseInt(t.championships) || 0
            const wins          = parseInt(t.total_wins) || 0
            const seasons       = parseInt(t.total_seasons) || 0
            const color         = TEAM_COLORS[t.constructor_id] ?? '#E10600'

            return (
              <Link key={t.constructor_id} href={`/teams/${t.constructor_id}`}
                className="card hover:border-f1red transition-colors group overflow-hidden p-0 flex flex-col relative">

                {/* Barre couleur équipe */}
                <div className="h-1 w-full" style={{ backgroundColor: color }} />

                {/* Badge actif */}
                {isCurrent && sortKey === 'default' && (
                  <div className="absolute top-3 right-2 z-10 bg-f1red/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    2025
                  </div>
                )}

                {/* Logo / Icone */}
                <div className="w-full h-28 bg-f1border/20 overflow-hidden flex items-center justify-center">
                  <TeamLogo constructorId={t.constructor_id} logoUrl={t.logo_url} />
                </div>

                {/* Infos */}
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <div className="font-semibold text-sm leading-tight group-hover:text-f1red transition-colors">
                    {t.name ?? t.constructor_id}
                  </div>
                  <span className="text-f1muted text-xs truncate">{t.nationality ?? ''}</span>

                  {/* Stats */}
                  {sortKey !== 'default' && (
                    <div className="flex gap-2 mt-1 pt-1 border-t border-f1border/40 text-xs">
                      {sortKey === 'championships' && championships > 0 && (
                        <span className="text-yellow-400 font-bold">🏆 {championships}</span>
                      )}
                      {sortKey === 'wins' && (
                        <span className="text-white font-bold">{wins}V</span>
                      )}
                      {sortKey === 'seasons' && (
                        <span className="text-f1muted">{seasons} saisons</span>
                      )}
                    </div>
                  )}

                  {/* Toujours afficher le nombre de titres si > 0 en mode default */}
                  {sortKey === 'default' && championships > 0 && (
                    <div className="flex gap-1 mt-1 pt-1 border-t border-f1border/40 text-xs">
                      <span className="text-yellow-400 font-bold">🏆 {championships}</span>
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
