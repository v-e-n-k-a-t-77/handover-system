import { useAuth } from '../store'

const ROLE = { lead: 'Team lead', leaver: 'Leaving member', joiner: 'New joiner' }

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <div className="text-lg font-bold text-slate-900">Evidence-Linked Handover</div>
            <div className="text-xs text-slate-500">Winter Food Drive (synthetic demo data)</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-slate-800">{user.name}</div>
              <div className="text-xs text-slate-500">{ROLE[user.role]}</div>
            </div>
            <button onClick={logout} className="rounded-lg border px-3 py-1 text-sm hover:bg-slate-100">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}