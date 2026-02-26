'use client'
import { useEffect, useState, useMemo } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

const CURRENT_DRIVER_IDS = new Set([
  'max_verstappen','norris','leclerc','piastri','russell','hamilton',
  'sainz','alonso','stroll','ocon','gasly','albon','tsunoda','bottas',
  'zhou','hulkenberg','magnussen','lawson','bearman','hadjar','antonelli',
  'doohan','bortoleto','colapinto','iwasa',
])

function DriverPhoto({ driverId, code, photoUrl: dbPhotoUrl }: { driverId: string; code?: string; photoUrl?: string }) {
  const [error, setError] = useState(false)
  const url = dbPhotoUrl || `https://media.formula1.com/image/upload/f_auto,c_limit,q_75,w_320/content/dam/fom-website/drivers/2025Drivers/${driverId}`
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-f1border/60">
        <span className="text-f1red font-bold text-xl">{code?.[0] ?? '?'}</span>
      </div>
    )
  }
  return (
    <img src={url} alt={driverId}
      className="w-full h-full object-cover object-top"
      onError={() => setError(true)} />
  )
}

type SortKey = 'default' | 'championships' | 'wins' | 'seasons'

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [minChamp, setMinChamp]   = useState(0)
  const [minWins, setMinWins]     = useState(0)
  const [minSeasons, setMinSeasons] = useState(0)

  useEffect(() => {
    api.getDrivers().then((data) => {
      if (Array.isArray(data)) {
        console.log(data.find((d: any) => d.driver_id === 'rosberg'))
        setDrivers(data)
      }
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return drivers
      .filter(d => {
        const matchSearch = `${d.first_name ?? ''} ${d.last_name ?? ''} ${d.code ?? ''} ${d.nationality ?? ''}`
          .toLowerCase().includes(q)
        const matchChamp   = (parseInt(d.championships) || 0) >= minChamp
        const matchWins    = (parseInt(d.total_wins) || 0) >= minWins
        const matchSeasons = (parseInt(d.total_seasons) || 0) >= minSeasons
        return matchSearch && matchChamp && matchWins && matchSeasons
      })
      .sort((a, b) => {
        // Pilotes actuels toujours en haut (sauf si tri explicite)
        if (sortKey === 'default') {
          const aC = CURRENT_DRIVER_IDS.has(a.driver_id) ? 0 : 1
          const bC = CURRENT_DRIVER_IDS.has(b.driver_id) ? 0 : 1
          if (aC !== bC) return aC - bC
          // Ensuite par dernière saison DESC
          return (parseInt(b.last_season) || 0) - (parseInt(a.last_season) || 0)
        }
        if (sortKey === 'championships') return (parseInt(b.championships) || 0) - (parseInt(a.championships) || 0)
        if (sortKey === 'wins')         return (parseInt(b.total_wins) || 0) - (parseInt(a.total_wins) || 0)
        if (sortKey === 'seasons')      return (parseInt(b.total_seasons) || 0) - (parseInt(a.total_seasons) || 0)
        return 0
      })
  }, [drivers, search, sortKey, minChamp, minWins, minSeasons])

  const currentCount = filtered.filter(d => CURRENT_DRIVER_IDS.has(d.driver_id)).length
  const hasFilters = minChamp > 0 || minWins > 0 || minSeasons > 0 || search.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Pilotes</h1>
          <p className="text-f1muted text-sm mt-0.5">{filtered.length} / {drivers.length} pilotes</p>
        </div>
        <input
          className="bg-f1card border border-f1border rounded-lg px-3 py-2 text-sm outline-none focus:border-f1red w-64"
          placeholder="Nom, code, nationalité..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filtres & tri */}
      <div className="card p-4 space-y-4">
        {/* Tri */}
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
        {/*
         Sliders filtres 
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-f1muted block mb-1">
              Titres mondiaux minimum : <span className="text-white font-bold">{minChamp}</span>
            </label>
            <input type="range" min={0} max={7} value={minChamp}
              onChange={e => setMinChamp(parseInt(e.target.value))}
              className="w-full accent-f1red" />
            <div className="flex justify-between text-xs text-f1muted/50 mt-0.5">
              <span>0</span><span>7</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-f1muted block mb-1">
              Victoires minimum : <span className="text-white font-bold">{minWins}</span>
            </label>
            <input type="range" min={0} max={100} step={5} value={minWins}
              onChange={e => setMinWins(parseInt(e.target.value))}
              className="w-full accent-f1red" />
            <div className="flex justify-between text-xs text-f1muted/50 mt-0.5">
              <span>0</span><span>100+</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-f1muted block mb-1">
              Saisons minimum : <span className="text-white font-bold">{minSeasons}</span>
            </label>
            <input type="range" min={0} max={25} value={minSeasons}
              onChange={e => setMinSeasons(parseInt(e.target.value))}
              className="w-full accent-f1red" />
            <div className="flex justify-between text-xs text-f1muted/50 mt-0.5">
              <span>0</span><span>25</span>
            </div>
          </div>
        </div>*/}

        {hasFilters && (
          <button onClick={() => { setSearch(''); setMinChamp(0); setMinWins(0); setMinSeasons(0); setSortKey('default') }}
            className="text-xs text-f1muted hover:text-white transition-colors">
            ✕ Réinitialiser les filtres
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array(24).fill(0).map((_, i) => <div key={i} className="skeleton h-52 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-f1muted text-center py-12">Aucun pilote ne correspond aux filtres</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((d: any) => {
            const isCurrent    = CURRENT_DRIVER_IDS.has(d.driver_id)
            const championships = parseInt(d.championships) || 0
            const wins          = parseInt(d.total_wins) || 0
            const seasons       = parseInt(d.total_seasons) || 0
            return (
              <Link key={d.driver_id} href={`/drivers/${d.driver_id}`}
                className="card hover:border-f1red transition-colors group overflow-hidden p-0 flex flex-col relative">
                {/* Badge pilote actuel 
                {isCurrent && sortKey === 'default' && (
                  <div className="absolute top-2 left-2 z-10 bg-f1red text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    2025
                  </div>
                )}*/}
                {/* Badge numéro */}
                {d.number && (
                  <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    #{d.number}
                  </div>
                )}
                {/* Photo */}
                <div className="w-full h-36 bg-f1border/40 overflow-hidden">
                  <DriverPhoto driverId={d.driver_id} code={d.code} photoUrl={d.photo_url} />
                </div>
                {/* Infos */}
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <div className="font-semibold text-sm leading-tight group-hover:text-f1red transition-colors">
                    {d.first_name && <span className="text-f1muted font-normal">{d.first_name} </span>}
                    <span>{d.last_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    {d.code && <span className="text-f1red text-xs font-bold font-mono">{d.code}</span>}
                    <span className="text-f1muted text-xs truncate ml-1">{d.nationality ?? ''}</span>
                  </div>
                  {/* Stats — affichées si filtre actif ou tri par stats */}
                  {(sortKey !== 'default' || minChamp > 0 || minWins > 0 || minSeasons > 0) && (
                    <div className="flex gap-2 mt-1 pt-1 border-t border-f1border/40 text-xs">
                      {(sortKey === 'championships' || minChamp > 0) && championships > 0 && (
                        <span className="text-yellow-400 font-bold">🏆 {championships}</span>
                      )}
                      {(sortKey === 'wins' || minWins > 0) && (
                        <span className="text-white font-bold">{wins}V</span>
                      )}
                      {(sortKey === 'seasons' || minSeasons > 0) && (
                        <span className="text-f1muted">{seasons} saisons</span>
                      )}
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
