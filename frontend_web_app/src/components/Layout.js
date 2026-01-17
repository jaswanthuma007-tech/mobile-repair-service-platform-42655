import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Button } from './ui';
import { useAuth } from '../state/AuthContext';

function linkClass({ isActive }) {
  return isActive ? undefined : undefined;
}

/**
 * PUBLIC_INTERFACE
 * Common layout with Ocean Professional header/footer.
 */
export function Layout({ children }) {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  return (
    <div className="App">
      <header className="site-header">
        <div className="container header-inner">
          <a className="brand" href="/" aria-label="Mobile Repair Service home">
            <span className="brand-mark" aria-hidden="true" />
            <span className="brand-title">
              OceanFix Mobile Repair
              <span className="brand-subtitle">Fast, friendly repairs at your doorstep</span>
            </span>
          </a>

          <nav className="nav" aria-label="Primary navigation">
            <NavLink to="/" className={linkClass} end>
              Home
            </NavLink>
            <NavLink to="/book" className={linkClass}>
              Book Repair
            </NavLink>
            <NavLink to="/admin/dashboard" className={linkClass}>
              Admin
            </NavLink>
          </nav>

          <div className="header-cta">
            {session.isAdminAuthed ? (
              <>
                <span className="badge badge-blue" title="Signed in admin">
                  {session.email || 'Admin'}
                </span>
                <Button
                  variant="ghost"
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                >
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/admin/login')}>
                  Admin Login
                </Button>
                <Button variant="primary" onClick={() => navigate('/book')}>
                  Book Now
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">{children}</div>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>OceanFix</strong> · Mobile Repair Service
          </div>
          <div>
            <span className="mono">© {new Date().getFullYear()}</span> · Built for fast booking + easy admin management
          </div>
        </div>
      </footer>
    </div>
  );
}
