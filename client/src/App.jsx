import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store'
import Login from './pages/Login'
import Home from './pages/Home'

function Protected({ children }) {
  const token = useAuth((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Home /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}