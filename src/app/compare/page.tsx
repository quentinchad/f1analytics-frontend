'use client'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#E10600', '#0090FF', '#00D2BE', '#FFF500']

export default function ComparePage() {
  const [drivers, setDrivers] = useState<any[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [comparison, setComparison] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [driverSearch, setDriverSearch] = useState('')

  useEffect(() => {
    api.getDrivers().then(setDrivers)
  }, [])

  const filtered = drivers.filter(d =>
    `${d.first_name} ${d.last_name} ${d.code}`.toLowerCase().includes(driverSearch.toLowerCase())
  ).slice(0, 50)

  const toggleDriver = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : prev.length < 4 ? [...prev, id] : prev
    )
  }

  const runComparison = async () => {
    if (selected.length < 2) return
    setLoading(true)
    try {
      const data = await api.compare(selected, year)
      setComparison(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }

  // Build chart data: points per round for each driver
  const chartData: Record<number, any> = {}
  comparison.forEach((d: any, idx: number) => {
    let cumulative = 0
    d.race_results?.forEach((r: any) => {
      if (!chartData[r.round]) chartData[r.round] = { round: r.round }
      cumulative += parseFloat(r.points ?? 0)
      chartData[r.round][d.driver?.driver_id] = cumulative
    })
  })
  const sortedChartData = Object.values(chartData).sort((a, b) => a.round - b.round)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Driver Comparison</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Driver selector */}
        <div className="card space-y-3">
          <h2 className="font-bold">Select Drivers (2–4)</h2>
          <input
            className="w-full bg-f1mid border border-f1border rounded-lg px-3 py-2 text-sm outline-none focus:border-f1red"
            placeholder="Search driver..."
            value={driverSearch}
            onChange={e => setDriverSearch(e.target.value)}
          />
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {filtered.map((d: any) => {
              const isSelected = selected.includes(d.driver_id)
              const colorIdx = selected.indexOf(d.driver_id)
              return (
                <button
                  key={d.driver_id}
                  onClick={() => toggleDriver(d.driver_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    isSelected ? 'bg-f1border' : 'hover:bg-f1mid'
                  }`}
                >
                  {isSelected && (
                    <span className="w-3 h-3 rounded-full" style={{ background: COLORS[colorIdx] }} />
                  )}
                  {d.first_name} {d.last_name}
                  <span className="text-f1muted ml-auto">{d.code}</span>
                </button>
              )
            })}
          </div>

          <div className="flex gap-2 items-center">
            <label className="text-f1muted text-sm">Year:</label>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-24 bg-f1mid border border-f1border rounded px-2 py-1 text-sm"
              min={2018}
              max={new Date().getFullYear()}
            />
          </div>

          <button
            onClick={runComparison}
            disabled={selected.length < 2 || loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Compare'}
          </button>
        </div>

        {/* Results */}
        <div className="md:col-span-2 space-y-4">
          {comparison.length > 0 && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-3">
                {comparison.map((d: any, idx: number) => (
                  <div key={d.driver?.driver_id} className="card border-l-4" style={{ borderLeftColor: COLORS[idx] }}>
                    <div className="font-bold">{d.driver?.first_name} {d.driver?.last_name}</div>
                    <div className="text-f1muted text-xs">{d.championship?.constructor_name || 'N/A'}</div>
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div>
                        <div className="text-f1muted text-xs">Points</div>
                        <div className="font-bold text-lg">{d.points_total?.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-f1muted text-xs">Wins</div>
                        <div className="font-bold text-lg">{d.wins}</div>
                      </div>
                      <div>
                        <div className="text-f1muted text-xs">Podiums</div>
                        <div className="font-bold text-lg">{d.podiums}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Points evolution chart */}
              {sortedChartData.length > 0 && (
                <div className="card">
                  <h3 className="font-bold mb-4">Cumulative Points by Round</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={sortedChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#38384E" />
                      <XAxis dataKey="round" stroke="#888899" tick={{ fontSize: 11 }} label={{ value: 'Round', position: 'insideBottom', offset: -3 }} />
                      <YAxis stroke="#888899" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#242438', border: '1px solid #38384E', borderRadius: '8px' }} />
                      <Legend />
                      {comparison.map((d: any, idx: number) => (
                        <Line
                          key={d.driver?.driver_id}
                          type="monotone"
                          dataKey={d.driver?.driver_id}
                          name={`${d.driver?.first_name} ${d.driver?.last_name}`}
                          stroke={COLORS[idx]}
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {comparison.length === 0 && !loading && (
            <div className="card text-center py-12 text-f1muted">
              Select 2–4 drivers and click Compare to see analytics
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
