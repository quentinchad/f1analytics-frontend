'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// SVG directs Wikimedia — pas de CORS contrairement aux thumbnails PNG
function getTrackImageUrl(circuitKey: string): string {
  const W = 'https://upload.wikimedia.org/wikipedia/commons/'
  const keyMap: Record<string, string> = {
    albert_park:    W+'archive/3/31/20210403204531!Albert_Lake_Park_Street_Circuit_in_Melbourne%2C_Australia.svg',
    bahrain:        W+'5/5d/Bahrain_International_Circuit--2004.svg',
    jeddah:         W+'8/8d/Jeddah_Corniche_Circuit.svg',
    suzuka:         W+'9/9a/Suzuka_circuit_2005.svg',
    shanghai:       W+'6/6e/Shanghai_International_Circuit.svg',
    miami:          W+'0/0b/Miami_International_Autodrome_track_map.svg',
    imola:          W+'e/e4/Autodromo_Enzo_e_Dino_Ferrari_track_map.svg',
    monaco:         W+'e/e0/Circuit_de_Monaco.svg',
    villeneuve:     W+'0/08/Circuit_Gilles_Villeneuve.svg',
    catalunya:      W+'0/09/Circuit_de_Catalunya.svg',
    red_bull_ring:  W+'f/f0/Red_Bull_Ring_2016.svg',
    silverstone:    W+'e/e9/Silverstone_Circuit_2020.svg',
    hungaroring:    W+'2/25/Hungaroring.svg',
    spa:            W+'5/53/Circuit_de_Spa-Francorchamps_2007.svg',
    zandvoort:      W+'5/52/Circuit_Zandvoort_2020.svg',
    monza:          W+'6/60/Autodromo_Nazionale_Monza.svg',
    baku:           W+'e/e5/Baku_City_Circuit_2023.svg',
    marina_bay:     W+'b/b3/Marina_Bay_Street_Circuit_2023.svg',
    americas:       W+'0/01/Circuit_of_the_Americas_track_map.svg',
    rodriguez:      W+'5/5e/Autodromo_Hermanos_Rodriguez_2015.svg',
    interlagos:     W+'a/a9/Autodromo_Jose_Carlos_Pace.svg',
    vegas:          W+'2/29/Las_Vegas_Street_Circuit_2023.svg',
    losail:         W+'f/f9/Losail_International_Circuit.svg',
    yas_marina:     W+'4/44/Yas_Marina_Circuit_2021.svg',
    sepang:         W+'8/8a/Sepang_International_Circuit.svg',
    istanbul:       W+'8/8f/Istanbul_Park.svg',
    nurburgring:    W+'b/b2/N%C3%BCrburgring_GP-Strecke.svg',
    hockenheimring: W+'3/35/Hockenheimring.svg',
    magny_cours:    W+'6/60/Circuit_de_Nevers_Magny-Cours.svg',
    indianapolis:   W+'9/9c/Indianapolis_Motor_Speedway.svg',
    portimao:       W+'a/af/Algarve_International_Circuit.svg',
    mugello:        W+'3/34/Mugello_track_map.svg',
    sochi:          W+'c/c3/Sochi_Autodrom.svg',
    paul_ricard:    W+'4/4e/Circuit_Paul_Ricard.svg',
    valencia:       W+'6/6e/Valencia_Street_Circuit.svg',
  }
  return keyMap[circuitKey] ?? ''
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
