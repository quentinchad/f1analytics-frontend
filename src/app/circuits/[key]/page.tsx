'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// SVG directs Wikimedia — pas de CORS contrairement aux thumbnails PNG
function getTrackImageUrl(circuitKey: string): string {
  const BASE = 'https://media.formula1.com/image/upload/f_auto,q_auto:best,w_1920/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/'
  const keyMap: Record<string, string> = {
    albert_park:    'Australia_Circuit',
    bahrain:        'Bahrain_Circuit',
    jeddah:         'Saudi_Arabia_Circuit',
    suzuka:         'Japan_Circuit',
    shanghai:       'China_Circuit',
    miami:          'Miami_Circuit',
    imola:          'Emilia_Romagna_Circuit',
    monaco:         'Monaco_Circuit',
    villeneuve:     'Canada_Circuit',
    catalunya:      'Spain_Circuit',
    red_bull_ring:  'Austria_Circuit',
    silverstone:    'Great_Britain_Circuit',
    hungaroring:    'Hungary_Circuit',
    spa:            'Belgium_Circuit',
    zandvoort:      'Netherlands_Circuit',
    monza:          'Italy_Circuit',
    baku:           'Azerbaijan_Circuit',
    marina_bay:     'Singapore_Circuit',
    americas:       'USA_Circuit',
    rodriguez:      'Mexico_Circuit',
    interlagos:     'Brazil_Circuit',
    vegas:          'Las_Vegas_Circuit',
    losail:         'Qatar_Circuit',
    yas_marina:     'Abu_Dhabi_Circuit',
    portimao:       'Portugal_Circuit',
    mugello:        'Tuscany_Circuit',
    sochi:          'Russia_Circuit',
    paul_ricard:    'France_Circuit',
    istanbul:       'Turkey_Circuit',
    nurburgring:    'Eifel_Circuit',
    hockenheimring: 'Germany_Circuit',
    sepang:         'Malaysia_Circuit',
    indianapolis:   'USA_Circuit',
    valencia:       'Europe_Circuit',
  }
  const name = keyMap[circuitKey]
  if (!name) return ''
  return `${BASE}${name}.webp`
}

function StatCard({ label, value, sub }: { label: string; value: string | number | null; sub?: string }) {
  if (!value) return null
  return (
    <div className="stat-card">
      <div className="text-f1muted text-xs">{label}</div>
      <div className="text-xl font-bold font-mono">{value}</div>
      {sub && <div className="text-xs text-f1muted mt-0.5">{sub}</div>}
    </div>
  )
}

export default function CircuitPage() {
  const params = useParams()
  const circuitKey = params.key as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [trackImgError, setTrackImgError] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    api.getCircuit(circuitKey).then(setData).finally(() => setLoading(false))
  }, [circuitKey])

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-8 w-32 rounded" />
      <div className="skeleton h-64 rounded-xl" />
      <div className="skeleton h-48 rounded-xl" />
    </div>
  )

  const circuit   = data?.circuit
  const lapRecord = data?.lap_record
  const winners: any[] = data?.winners ?? []
  const displayedWinners = showAll ? winners : winners.slice(0, 10)
  const trackUrl = circuit?.svg_url || getTrackImageUrl(circuitKey)

  return (
    <div className="space-y-6">
      <Link href="/circuits" className="text-f1muted hover:text-white text-sm">← Circuits</Link>

      {/* Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Tracé du circuit — affiché en haut sur desktop, grand format */}
          {trackUrl && !trackImgError ? (
            <div className="flex-shrink-0 flex items-center justify-center bg-f1border/10 rounded-xl p-4 w-full md:w-80 lg:w-96 md:h-64 lg:h-72">
              <img
                src={trackUrl}
                alt={`Tracé ${circuit?.name}`}
                className="max-w-full max-h-full object-contain drop-shadow-lg bg-white"
                onError={() => setTrackImgError(true)}
              />
            </div>
          ) : null}

          {/* Infos */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{circuit?.name}</h1>
            <p className="text-f1muted mt-1">
              {[circuit?.city, circuit?.country].filter(Boolean).join(', ')}
            </p>
            {circuit?.wiki_url && (
              <a href={circuit.wiki_url} target="_blank" rel="noopener noreferrer"
                className="text-f1muted text-xs hover:text-white mt-2 inline-block">
                Wikipédia →
              </a>
            )}

            <div className="grid grid-cols-2 gap-3 mt-5">
              {lapRecord && (
                <StatCard
                  label="Lap Record"
                  value={lapRecord.time}
                  sub={`${lapRecord.driver ?? ''} (${lapRecord.year ?? ''})`}
                />
              )}
              {!lapRecord && circuit?.lap_record_time && (
                <StatCard
                  label="Lap Record"
                  value={circuit.lap_record_time}
                  sub={`${circuit.lap_record_driver ?? ''} (${circuit.lap_record_year ?? ''})`}
                />
              )}
              {winners.length > 0 && (
                <StatCard label="Éditions" value={winners.length} />
              )}
              {circuit?.latitude && (
                <StatCard
                  label="Localisation"
                  value={`${parseFloat(circuit.latitude).toFixed(3)}°, ${parseFloat(circuit.longitude).toFixed(3)}°`}
                />
              )}
            </div>
          </div>


        </div>
      </div>

      {/* Palmarès */}
      {winners.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">
              Palmarès — {winners.length} édition{winners.length > 1 ? 's' : ''}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-f1border text-f1muted text-left">
                  <th className="pb-2">Année</th>
                  <th className="pb-2">Grand Prix</th>
                  <th className="pb-2">Vainqueur</th>
                  <th className="pb-2 hidden sm:table-cell">Écurie</th>
                </tr>
              </thead>
              <tbody>
                {displayedWinners.map((w: any, i: number) => (
                  <tr key={`${w.season_year}-${i}`} className="border-b border-f1border/40 hover:bg-f1mid/50">
                    <td className="py-2 font-semibold text-f1red">
                      <Link href={`/seasons/${w.season_year}`} className="hover:underline">
                        {w.season_year}
                      </Link>
                    </td>
                    <td className="py-2 text-f1muted text-xs hidden md:table-cell">
                      {w.race_name ?? '—'}
                    </td>
                    <td className="py-2">
                      {w.driver_id ? (
                        <Link href={`/drivers/${w.driver_id}`} className="font-semibold hover:text-f1red">
                          {w.first_name ? `${w.first_name} ${w.last_name}` : (w.code ?? w.driver_id)}
                        </Link>
                      ) : (
                        <span className="text-f1muted">—</span>
                      )}
                    </td>
                    <td className="py-2 text-f1muted text-sm hidden sm:table-cell">
                      {w.constructor_name ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {winners.length > 10 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 text-f1muted text-sm hover:text-white transition-colors"
            >
              {showAll ? '▲ Voir moins' : `▼ Voir les ${winners.length - 10} autres`}
            </button>
          )}
        </div>
      )}

      {winners.length === 0 && (
        <div className="card text-f1muted text-sm">
          Aucun résultat disponible pour ce circuit.
        </div>
      )}
    </div>
  )
}
