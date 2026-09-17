import { useAuth } from './lib/useAuth'
import Login from './pages/Login'
import NavBar from './components/NavBar'
import SalesReport from './pages/SalesReport'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--color-gray)', fontSize: 14 }}>Loading…</span>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <NavBar />
      <SalesReport />
    </div>
  )
}
