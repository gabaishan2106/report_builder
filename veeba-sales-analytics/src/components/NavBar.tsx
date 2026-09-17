import { supabase } from '../lib/supabaseClient'
import './NavBar.css'

export default function NavBar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-brand">
          <span className="navbar-brand-mark">VF</span>
          <span className="navbar-brand-name">Veeba Analytics</span>
        </div>

        <nav className="navbar-links">
          <a className="navbar-link navbar-link-active" href="#">Dashboard</a>
          <a className="navbar-link" href="#">Reports</a>
          <a className="navbar-link" href="#">Customers</a>
          <a className="navbar-link" href="#">Data</a>
          <a className="navbar-link" href="#">Admin</a>
        </nav>

        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-logout"
            onClick={() => supabase.auth.signOut()}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
