import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import { useAuth } from '../store'

export default function Home() {
  const { user, logout } = useAuth()
  const { data, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: () => api('/items'),
  })

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">
            {user.name} <span className="text-sm font-normal text-slate-500">({user.role})</span>
          </h1>
          <button onClick={logout} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">
            Log out
          </button>
        </div>

        {isLoading && <p className="mt-6 text-slate-500">Loading...</p>}
        {error && <p className="mt-6 text-red-600">{error.message}</p>}
        {data && (
          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <p>Visible items: <b>{data.items.length}</b></p>
            <p>Restricted items hidden: <b>{data.restricted}</b></p>
            <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
              {data.items.map((i) => <li key={i.id}>{i.statement}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}