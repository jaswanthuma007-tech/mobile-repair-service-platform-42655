import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Badge } from '../components/ui';
import { isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * PUBLIC_INTERFACE
 * Public landing page.
 */
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="fade-in-up">
      <section className="hero">
        <div className="hero-card">
          <div className="row" style={{ marginBottom: 8 }}>
            <Badge tone="blue">Mobile-first</Badge>
            <Badge tone="amber">Same-day slots</Badge>
            {!isSupabaseConfigured() ? <Badge tone="gray">Demo data mode</Badge> : <Badge tone="green">Live mode</Badge>}
          </div>

          <h1 className="h1">Doorstep device repairs, handled professionally.</h1>
          <p className="p">
            Book a repair in minutes. Our technicians come to you for phones, tablets, and laptops—transparent pricing,
            clean workmanship, and real-time status updates (ready for Supabase integration).
          </p>

          <div className="hero-actions">
            <Button variant="primary" onClick={() => navigate('/book')}>
              Book a Repair
            </Button>
            <Button variant="ghost" onClick={() => navigate('/admin/login')}>
              Admin Login
            </Button>
          </div>

          <div className="section">
            <div className="grid-2">
              <Card className="card-pad">
                <h2 className="h2">Fast booking</h2>
                <p className="p">Animated multi-step form with validation and confirmation.</p>
              </Card>
              <Card className="card-pad">
                <h2 className="h2">Manage requests</h2>
                <p className="p">Admin dashboard to search, filter, and update status.</p>
              </Card>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="kpi">
            <strong>15–45 min</strong>
            <small>Typical phone repair turnaround</small>
          </div>
          <div className="kpi">
            <strong>New → In Progress → Completed</strong>
            <small>Simple status workflow for admins</small>
          </div>
          <div className="kpi">
            <strong>Secure-ready</strong>
            <small>Prepared for Supabase Auth + DB integration</small>
          </div>
          <Card className="card-pad">
            <h2 className="h2">Popular services</h2>
            <p className="p">
              Screen replacement · Battery swap · Charging port fix · Diagnostics · Water damage treatment
            </p>
            <div className="section">
              <Button variant="amber" onClick={() => navigate('/book')}>
                Get a slot
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
