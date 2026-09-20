import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import './NavBar.css'

const LINKS: { label: string; to: string; active: boolean }[] = [
  { label: 'Dashboard', to: '/', active: true },
  { label: 'Reports', to: '/reports', active: true },
  { label: 'Customers', to: '#', active: false },
  { label: 'Data', to: '#', active: false },
  { label: 'Admin', to: '#', active: false },
]

export default function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  function linkClass({ isActive }: { isActive: boolean }) {
    return 'navbar-link' + (isActive ? ' navbar-link-active' : '')
  }

  function drawerLinkClass({ isActive }: { isActive: boolean }) {
    return 'navbar-drawer-link' + (isActive ? ' navbar-drawer-link-active' : '')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <button
          type="button"
          className="navbar-hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>

        <div className="navbar-brand">
          <span className="navbar-brand-mark">VF</span>
          <span className="navbar-brand-name">Veeba Analytics</span>
        </div>

        <nav className="navbar-links">
          {LINKS.map((link) =>
            link.active ? (
              <NavLink key={link.label} to={link.to} end={link.to === '/'} className={linkClass}>
                {link.label}
              </NavLink>
            ) : (
              <span key={link.label} className="navbar-link navbar-link-disabled">
                {link.label}
              </span>
            )
          )}
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

      {drawerOpen && (
        <>
          <div className="navbar-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="navbar-drawer">
            <div className="navbar-drawer-header">
              <div className="navbar-brand">
                <span className="navbar-brand-mark">VF</span>
                <span className="navbar-brand-name">Veeba Analytics</span>
              </div>
              <button
                type="button"
                className="navbar-drawer-close"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="navbar-drawer-links">
              {LINKS.map((link) =>
                link.active ? (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    end={link.to === '/'}
                    className={drawerLinkClass}
                    onClick={() => setDrawerOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                ) : (
                  <span key={link.label} className="navbar-drawer-link navbar-drawer-link-disabled">
                    {link.label}
                  </span>
                )
              )}
            </nav>
            <button
              type="button"
              className="navbar-drawer-logout"
              onClick={() => supabase.auth.signOut()}
            >
              Logout
            </button>
          </div>
        </>
      )}
    </header>
  )
}
