import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import Layout from '../components/Layout'
import Ring from '../components/Ring'
import ItemCard from '../components/ItemCard'
import ReviewBar from '../components/ReviewBar'
import SourcesPanel from '../components/SourcesPanel'

function Bar({ label, weight, value }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500">{value}% (weight {weight})</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-slate-200">
        <div className="h-2 rounded-full bg-teal-600" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

const FILTERS = [
  ['all', 'All'], ['green', 'Green'], ['amber', 'Amber'], ['red', 'Red'], ['pending', 'Pending review'],
]

export default function LeadConsole() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all')
  const items = useQuery({ queryKey: ['items'], queryFn: () => api('/items') })
  const ready = useQuery({ queryKey: ['readiness'], queryFn: () => api('/readiness') })

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['items'] })
    qc.invalidateQueries({ queryKey: ['readiness'] })
  }
  const approveGreen = useMutation({
    mutationFn: () => api('/items/approve-green', { method: 'POST' }),
    onSuccess: refresh,
  })
  const loadDemo = useMutation({
    mutationFn: () => api('/handover/load-demo', { method: 'POST' }),
    onSuccess: refresh,
  })

  const all = items.data?.items || []
  const list = all.filter((i) =>
    filter === 'all' ? true : filter === 'pending' ? i.review_state === 'pending' : i.status === filter
  )
  const r = ready.data
  const color = !r ? '#0E7C86' : r.score >= 70 ? '#2E9E5B' : r.score >= 40 ? '#F0A202' : '#D64545'

  return (
    <Layout>
      <div className="grid gap-6 lg:grid-cols-3">
        <aside className="lg:col-span-1">
          <div className="rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-4">
            <h2 className="text-lg font-bold text-slate-900">Handover readiness</h2>
            <p className="text-xs text-slate-500">Aarav (leaving) to Kiran (joining)</p>

            {r ? (
              <>
                <div className="mt-3 flex items-center gap-4">
                  <Ring value={r.score} color={color} caption="out of 100" />
                  <div className="text-sm text-slate-600">
                    <p><b>{r.counts.total}</b> items</p>
                    <p className="text-green-700"><b>{r.counts.green}</b> green</p>
                    <p className="text-amber-600"><b>{r.counts.amber}</b> amber</p>
                    <p className="text-red-600"><b>{r.counts.red}</b> red</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <Bar label="Evidence strength" weight="35%" value={r.components.evidence} />
                  <Bar label="Gaps closed" weight="25%" value={r.components.gapsClosed} />
                  <Bar label="Ownership named" weight="20%" value={r.components.ownership} />
                  <Bar label="Items reviewed" weight="20%" value={r.components.reviewed} />
                </div>

                {r.heldOnlyByLeaver > 0 && (
                  <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                    <b>{r.heldOnlyByLeaver}</b> item(s) are supported only by the leaver's own messages.
                    Ask Aarav before he leaves.
                  </div>
                )}
                <p className="mt-3 text-sm text-slate-600">
                                    <b>{r.gapsOpen}</b> open gap(s). Items you approve while still amber or red are shown to the joiner as unresolved. Pending items stay hidden.
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Score = 100 x (0.35 evidence + 0.25 gaps closed + 0.20 ownership + 0.20 reviewed).
                  It is an indicator, not a guarantee.
                </p>
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-500">Loading...</p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <button
                onClick={() => approveGreen.mutate()}
                disabled={approveGreen.isPending}
                className="rounded-lg bg-teal-700 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                Approve all green items
              </button>
              <button
                onClick={() => {
                  if (confirm('This rebuilds every item from the source files and clears all reviews. Continue?')) {
                    loadDemo.mutate()
                  }
                }}
                disabled={loadDemo.isPending}
                className="rounded-lg border border-slate-300 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                {loadDemo.isPending ? 'Rebuilding...' : 'Reload demo project and rebuild'}
              </button>
            </div>
          </div>
        </aside>

                <section className="lg:col-span-2">
          <SourcesPanel />
          <div className="mb-3 flex flex-wrap gap-2">
            {FILTERS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full border px-3 py-1 text-sm ${
                  filter === key
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {items.isLoading && <p className="text-slate-500">Loading items...</p>}
          {items.error && <p className="text-red-600">{items.error.message}</p>}
          {items.data && all.length === 0 && (
            <p className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">
              No items yet. Click "Reload demo project and rebuild".
            </p>
          )}

          <div className="space-y-3">
            {list.map((item) => (
              <ItemCard key={item.id} item={item}>
                <ReviewBar item={item} />
              </ItemCard>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  )
}