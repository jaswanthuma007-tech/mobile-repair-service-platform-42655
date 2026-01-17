import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { Card } from './ui';

/**
 * PUBLIC_INTERFACE
 * Protects admin routes. Redirects to /admin/login if not authed.
 */
export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Card className="card-pad">
        <div className="spread">
          <div>
            <h2 className="h2">Loading…</h2>
            <p className="p">Checking admin session.</p>
          </div>
          <span className="badge badge-gray">Please wait</span>
        </div>
      </Card>
    );
  }

  if (!session.isAdminAuthed) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
