import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from './lib/useAuth'
import Login from './pages/Login'
import NavBar from './components/NavBar'
import SalesReport from './pages/SalesReport'
import Reports from './pages/Reports'
import { ReportProvider } from './context/ReportContext'

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
    <BrowserRouter>
      <ReportProvider>
        <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
          <NavBar />
          <Routes>
            <Route path="/" element={<SalesReport />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </ReportProvider>
    </BrowserRouter>
  )
}
