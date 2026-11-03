import { useAuth } from '../store'
import LeadConsole from './LeadConsole'
import JoinerView from './JoinerView'
import LeaverView from './LeaverView'

export default function Home() {
  const role = useAuth((s) => s.user.role)
  if (role === 'lead') return <LeadConsole />
  if (role === 'joiner') return <JoinerView />
  return <LeaverView />
}