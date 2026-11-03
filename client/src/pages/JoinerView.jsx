import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'
import Layout from '../components/Layout'
import Ring from '../components/Ring'
import ItemCard from '../components/ItemCard'

const ORDER = { red: 0, amber: 1, green: 2 }

export default function JoinerView() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({ queryKey: ['items'], queryFn: () => api('/items') })
  const ack = useMutation({
    mutationFn: () => api('/handover/acknowledge', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })

  const items = data?.items || []
  const tasks = items.filter((i) => i.type === 'task')
  const open = tasks.filter((i) => i.task_state !== 'done')
  const pct = tasks.length ? Math.round(((tasks.length - open.length) / tasks.length) * 100) : 0
  const start = [...open].sort((a, b) => ORDER[a.status] - ORDER[b.status]).slice(0, 3)
  const decisions = items.filter((i) => ['decision', 'recurring_issue'].includes(i.type))
  const watch = items.filter((i) => ['risk', 'dependency', 'open_question'].includes(i.type))
  const unresolved = items.filter((i) => i.status !== 'green').length

  return (
    <Layout>
      {isLoading && <p className="text-slate-500">Loading...</p>}
      {error && <p className="text-red-600">{error.message}</p>}

      {data && items.length === 0 && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Your handover is not ready yet</h2>
          <p className="mt-2 text-slate-600">
            Your team lead has not approved anything for you so far. Nothing is shown until it is approved.
          </p>
          {data.restricted > 0 && (
            <p className="mt-3 text-sm text-slate-500">{data.restricted} item(s) are restricted.</p>
          )}
        </div>
      )}

      {data && items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-green-50 p-4">
            <div>
              <p className="font-semibold text-green-900">
                Approved by your team lead | Version {data.version}
              </p>
              <p className="text-sm text-green-800">
                {unresolved} item(s) are still amber or red. Check their evidence before acting on them.
              </p>
            </div>
            {data.acknowledged ? (
              <span className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-green-700">
                Receipt acknowledged
              </span>
            ) : (
              <button
                onClick={() => ack.mutate()}
                disabled={ack.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
              >
                Acknowledge receipt
              </button>
            )}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section>
                <h2 className="mb-2 text-lg font-bold text-slate-900">Start here: your next actions</h2>
                <div className="space-y-3">
                  {start.length === 0 && <p className="text-slate-500">No open tasks.</p>}
                  {start.map((i) => <ItemCard key={i.id} item={i} showState={false} />)}
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-bold text-slate-900">Key decisions and the reasons</h2>
                <div className="space-y-3">
                  {decisions.map((i) => <ItemCard key={i.id} item={i} showState={false} />)}
                </div>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-bold text-slate-900">Risks, dependencies and open questions</h2>
                <div className="space-y-3">
                  {watch.map((i) => <ItemCard key={i.id} item={i} showState={false} />)}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="font-bold text-slate-900">Project progress</h2>
                <div className="mt-2 flex items-center gap-4">
                  <Ring value={pct} caption="% tasks done" size="h-28 w-28" />
                  <p className="text-sm text-slate-600">
                    {tasks.length - open.length} of {tasks.length} tasks done
                  </p>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Circle colour on cards shows evidence confidence only. Rings show task progress.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h2 className="font-bold text-slate-900">Who owns what</h2>
                <table className="mt-2 w-full text-left text-sm">
                  <thead className="text-xs text-slate-500">
                    <tr><th className="py-1">Task</th><th>Owner</th><th>Next</th></tr>
                  </thead>
                  <tbody>
                    {tasks.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="py-1 pr-2">{t.statement}</td>
                        <td className="pr-2">{t.owner || '-'}</td>
                        <td>{t.successor || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.restricted > 0 && (
                <div className="rounded-2xl border border-dashed border-slate-400 bg-white p-5">
                  <p className="font-bold text-slate-900">{data.restricted} item(s) restricted</p>
                  <p className="text-sm text-slate-500">
                    These contain confidential details. Ask your team lead for access.
                  </p>
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </Layout>
  )
}