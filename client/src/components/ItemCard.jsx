import { useState } from 'react'

const DOT = { green: 'bg-green-500', amber: 'bg-amber-400', red: 'bg-red-500' }
const LABEL = { green: 'Green', amber: 'Amber', red: 'Red' }
const TYPE = {
  task: 'Task', decision: 'Decision', dependency: 'Dependency', risk: 'Risk',
  open_question: 'Open question', recurring_issue: 'Recurring issue',
  contact: 'Contact', payment: 'Payment',
}
const STATE = {
  pending: ['Pending review', 'text-slate-500'],
  approved: ['Approved', 'text-green-700'],
  rejected: ['Rejected', 'text-red-600'],
  corrected: ['Corrected and approved', 'text-teal-700'],
}

export default function ItemCard({ item, children, showState = true }) {
  const [open, setOpen] = useState(false)
  const [stateText, stateColor] = STATE[item.review_state]
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${DOT[item.status]}`}
          title={LABEL[item.status]}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-slate-500">
              {TYPE[item.type] || item.type}
            </span>
            {item.access_label === 'leads_only' && (
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-white">Leads only</span>
            )}
            {showState && <span className={`font-semibold ${stateColor}`}>{stateText}</span>}
          </div>

          <p className="mt-1 font-medium text-slate-900">{item.statement}</p>

          <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-slate-600">
            {item.owner && <span>Owner: <b>{item.owner}</b></span>}
            {item.successor && <span>Successor: <b>{item.successor}</b></span>}
            {item.due_date && <span>Due: <b>{item.due_date}</b></span>}
            {item.task_state && <span>Status: <b>{item.task_state}</b></span>}
          </div>

          <p className="mt-1 text-sm text-slate-500">
            <b className="text-slate-700">{LABEL[item.status]}:</b> {item.status_reason}
          </p>

          <button
            onClick={() => setOpen(!open)}
            className="mt-2 text-sm font-medium text-teal-700 hover:underline"
          >
            {open ? 'Hide evidence' : `Show evidence (${item.evidence.length})`}
          </button>

          {open && (
            <div className="mt-2 space-y-2">
              {item.evidence.map((e, i) => (
                <div key={i} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="text-xs font-semibold text-teal-700">
                    {e.source} | {e.locator}
                  </div>
                  <p className="mt-1 italic text-slate-800">"{e.quote}"</p>
                  <div className={`mt-1 text-xs font-semibold ${e.verified ? 'text-green-700' : 'text-red-600'}`}>
                    {e.verified ? 'Quote verified in source' : 'Quote NOT found in source'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}