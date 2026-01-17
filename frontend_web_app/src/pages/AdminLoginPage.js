import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, Input, Badge } from '../components/ui';
import { useToast } from '../components/ToastProvider';
import { useAuth } from '../state/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
}

/**
 * PUBLIC_INTERFACE
 * Admin login page (Supabase auth-ready).
 */
export default function AdminLoginPage() {
  const { session, signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const redirectTo = location.state?.from || '/admin/dashboard';

  const validation = useMemo(() => {
    const e = {};
    if (!isEmail(form.email)) e.email = 'Enter a valid email.';
    if (!form.password || form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    return e;
  }, [form]);

  async function onSubmit(e) {
    e.preventDefault();
    const v = validation;
    if (Object.keys(v).length) {
      setErrors(v);
      toast.error('Login failed', 'Please correct the fields and try again.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await signIn({ email: form.email, password: form.password });
      if (error) throw error;
      toast.success('Signed in', 'Welcome back.');
      navigate(redirectTo);
    } catch (err) {
      toast.error('Login failed', err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  }

  if (session.isAdminAuthed) {
    return (
      <Card className="card-pad fade-in-up">
        <div className="spread">
          <div>
            <h1 className="h1" style={{ fontSize: 'clamp(26px, 4vw, 36px)' }}>
              You’re already signed in
            </h1>
            <p className="p">Continue to the dashboard to manage repair requests.</p>
          </div>
          <Badge tone="green">{session.email || 'Admin'}</Badge>
        </div>
        <div className="section row">
          <Button variant="primary" onClick={() => navigate('/admin/dashboard')}>
            Go to dashboard
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="fade-in-up">
      <div className="spread" style={{ marginBottom: 12 }}>
        <div>
          <h1 className="h1" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
            Admin Login
          </h1>
          <p className="p">
            Sign in to manage repair requests. {!isSupabaseConfigured() ? 'Demo mode accepts any credentials.' : null}
          </p>
        </div>
        {!isSupabaseConfigured() ? <Badge tone="gray">Demo auth</Badge> : <Badge tone="green">Supabase auth</Badge>}
      </div>

      <Card className="card-pad">
        <form onSubmit={onSubmit} aria-label="Admin login form">
          <div className="grid-2">
            <Input
              label="Email"
              name="email"
              value={form.email}
              onChange={(e) => {
                setForm((p) => ({ ...p, email: e.target.value }));
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={errors.email}
              autoComplete="email"
              inputMode="email"
            />
            <Input
              label="Password"
              name="password"
              type="password"
              value={form.password}
              onChange={(e) => {
                setForm((p) => ({ ...p, password: e.target.value }));
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              error={errors.password}
              autoComplete="current-password"
            />
          </div>

          <div className="section row">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/')}>
              Cancel
            </Button>
          </div>

          <div className="section">
            <p className="help">
              Supabase env vars required: <span className="mono">REACT_APP_SUPABASE_URL</span> and{' '}
              <span className="mono">REACT_APP_SUPABASE_KEY</span>.
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}
