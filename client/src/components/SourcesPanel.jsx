import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export default function SourcesPanel() {
  const qc = useQueryClient()
  const [type, setType] = useState('chat')
  const [label, setLabel] = useState('team')
  const [note, setNote] = useState('')
  const sources = useQuery({ queryKey: ['sources'], queryFn: () => api('/sources') })

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ['sources'] })
    qc.invalidateQueries({ queryKey: ['items'] })
    qc.invalidateQueries({ queryKey: ['readiness'] })
  }

  const upload = useMutation({
    mutationFn: async (file) => {
      const content = await file.text()
      return api('/sources', {
        method: 'POST',
        body: { name: file.name, type, access_label: label, content },
      })
    },
    onSuccess: () => {
      setNote('File added. Click "Rebuild from sources" to analyse it.')
      qc.invalidateQueries({ queryKey: ['sources'] })
    },
  })
  const remove = useMutation({
    mutationFn: (id) => api(`/sources/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setNote('Source removed. Click "Rebuild from sources" to update the items.')
      qc.invalidateQueries({ queryKey: ['sources'] })
    },
  })
  const rebuild = useMutation({
    mutationFn: () => api('/handover/rebuild', { method: 'POST' }),
    onSuccess: (d) => {
      setNote(`Rebuilt: ${d.created} items created. All reviews were reset.`)
      refreshAll()
    },
  })

  const field = 'rounded-lg border border-slate-300 px-2 py-1 text-sm'
  const err = upload.error || remove.error || rebuild.error

  return (
    <div className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">1. Connect sources</h2>
      <p className="text-xs text-slate-500">
        Upload exported files (synthetic or permissioned data only). Mark confidential files as "Leads only".
      </p>

      <ul className="mt-3 space-y-1 text-sm">
        {(sources.data?.sources || []).map((s) => (
          <li key={s.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1">
            <span>
              {s.name} <span className="text-slate-400">({s.type}, {s.chars} chars)</span>
              {s.access_label === 'leads_only' && (
                <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-xs text-white">Leads only</span>
              )}
            </span>
            <button onClick={() => remove.mutate(s.id)} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
          <option value="chat">Chat export (.txt)</option>
          <option value="notes">Meeting notes (.md / .txt)</option>
          <option value="tasks">Task sheet (.csv)</option>
        </select>
        <select value={label} onChange={(e) => setLabel(e.target.value)} className={field}>
          <option value="team">Visible to team</option>
          <option value="leads_only">Leads only</option>
        </select>
        <input
          type="file"
          accept=".txt,.md,.csv"
          onChange={(e) => {
            const f = e.target.files[0]
            if (f) upload.mutate(f)
            e.target.value = ''
          }}
          className="text-sm"
        />
        <button
          onClick={() => rebuild.mutate()}
          disabled={rebuild.isPending}
          className="rounded-lg bg-teal-700 px-3 py-1 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          {rebuild.isPending ? 'Rebuilding...' : 'Rebuild from sources'}
        </button>
      </div>

      <details className="mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer font-semibold">Accepted file formats</summary>
        <p className="mt-1"><b>Chat:</b> one message per line, like <code>[01/11/2026, 09:05] Meera: text</code> or <code>01/11/2026, 09:05 - Meera: text</code> (WhatsApp export).</p>
        <p className="mt-1"><b>Notes:</b> lines starting with <code>Decision:</code>, <code>Recurring issue:</code>, <code>Action: Name to do something by 12 Dec</code>, <code>Contact:</code> or <code>Payment:</code>.</p>
        <p className="mt-1"><b>Tasks:</b> CSV with the header <code>task,owner,due,status</code>.</p>
      </details>

      {note && <p className="mt-2 text-sm text-teal-700">{note}</p>}
      {err && <p className="mt-2 text-sm text-red-600">{err.message}</p>}
    </div>
  )
}