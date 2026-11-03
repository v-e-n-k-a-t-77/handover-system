import { useQuery } from '@tanstack/react-query'
import { api } from '../api'
import Layout from '../components/Layout'
import ItemCard from '../components/ItemCard'

const ORDER = { red: 0, amber: 1, green: 2 }

export default function LeaverView() {
  const { data, isLoading, error } = useQuery({ queryKey: ['items'], queryFn: () => api('/items') })
  const items = [...(data?.items || [])].sort((a, b) => ORDER[a.status] - ORDER[b.status])

  return (
    <Layout>
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">What Baton reconstructed from your work</h2>
        <p className="mt-1 text-sm text-slate-600">
          Items that need your input (red and amber) are listed first. Tell your team lead about anything that
          is wrong or missing. A guided question flow for you is planned for Round 3.
        </p>
        {data?.restricted > 0 && (
          <p className="mt-2 text-sm text-slate-500">{data.restricted} item(s) are restricted to the team lead.</p>
        )}
      </div>
      {isLoading && <p className="mt-4 text-slate-500">Loading...</p>}
      {error && <p className="mt-4 text-red-600">{error.message}</p>}
      <div className="mt-4 space-y-3">
        {items.map((i) => <ItemCard key={i.id} item={i} showState={false} />)}
      </div>
    </Layout>
  )
}