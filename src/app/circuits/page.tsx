'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCircuits().then((data) => {
      if (Array.isArray(data)) setCircuits(data)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = circuits.filter(c =>
    `${c.name ?? ''} ${c.country ?? ''} ${c.city ?? ''}`
      .toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Circuits <span className="text-f1muted text-xl">({circuits.length})</span></h1>
        <input
          className="bg-f1card border border-f1border rounded-lg px-3 py-2 text-sm outline-none focus:border-f1red w-64"
          placeholder="Rechercher par nom, pays..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array(18).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {filtered.map((c: any) => (
            <Link
              key={c.circuit_key}
              href={`/circuits/${c.circuit_key}`}
              className="card hover:border-f1red transition-colors"
            >
              <div className="font-bold truncate">{c.name}</div>
              <div className="text-f1muted text-sm mt-1">{c.city}, {c.country}</div>
              <div className="flex gap-4 mt-2 text-xs text-f1muted">
                {c.length_km && <span>🏁 {c.length_km} km</span>}
                {c.turns && <span>{c.turns} virages</span>}
                {c.lap_record_time && <span>⏱ {c.lap_record_time}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
