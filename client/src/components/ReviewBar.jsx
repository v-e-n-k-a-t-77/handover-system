import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

// Remove empty fields so the server only receives what the lead filled in
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== ''))

export default function ReviewBar({ item }) {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    statement: item.statement,
    owner: item.owner || '',
    successor: item.successor || '',
    note: '',
  })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const mut = useMutation({
    mutationFn: (body) =>
      api(`/items/${item.id}/review`, { method: 'POST', body: clean(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['items'] })
      qc.invalidateQueries({ queryKey: ['readiness'] })
      setEditing(false)
    },
  })

  // Demo: the incoming member is Kiran
  const canHand = item.type === 'task' && item.task_state !== 'done' && !item.successor
  const btn = 'rounded-lg px-3 py-1 text-sm font-semibold disabled:opacity-60'
  const field = 'mt-1 w-full rounded-lg border border-slate-300 px-2 py-1 text-sm font-normal'

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex flex-wrap gap-2">
        <button
          disabled={mut.isPending}
          onClick={() => mut.mutate({ action: 'approve' })}
          className={`${btn} bg-green-600 text-white hover:bg-green-700`}
        >
          Approve
        </button>
        {canHand && (
          <button
            disabled={mut.isPending}
            onClick={() => mut.mutate({ action: 'approve', successor: 'Kiran' })}
            className={`${btn} bg-teal-700 text-white hover:bg-teal-800`}
          >
            Approve and hand to Kiran
          </button>
        )}
        <button
          onClick={() => setEditing(!editing)}
          className={`${btn} border border-slate-300 text-slate-700 hover:bg-slate-100`}
        >
          Correct
        </button>
        <button
          disabled={mut.isPending}
          onClick={() => mut.mutate({ action: 'reject' })}
          className={`${btn} bg-red-600 text-white hover:bg-red-700`}
        >
          Reject
        </button>
      </div>

      {editing && (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
          <label className="block text-xs font-semibold text-slate-600">
            Statement
            <textarea value={form.statement} onChange={set('statement')} rows={2} className={field} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-semibold text-slate-600">
              Owner
              <input value={form.owner} onChange={set('owner')} className={field} />
            </label>
            <label className="block text-xs font-semibold text-slate-600">
              Successor
              <input value={form.successor} onChange={set('successor')} className={field} />
            </label>
          </div>
          <label className="block text-xs font-semibold text-slate-600">
            Note (why you changed it)
            <input value={form.note} onChange={set('note')} className={field} />
          </label>
          <button
            disabled={mut.isPending}
            onClick={() => mut.mutate({ action: 'correct', ...form })}
            className={`${btn} bg-slate-800 text-white hover:bg-slate-900`}
          >
            Save correction
          </button>
        </div>
      )}

      {mut.error && <p className="mt-2 text-sm text-red-600">{mut.error.message}</p>}
    </div>
  )
}