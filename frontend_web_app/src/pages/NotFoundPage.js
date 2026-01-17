import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../components/ui';

/**
 * PUBLIC_INTERFACE
 * Not found page.
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Card className="card-pad fade-in-up">
      <h1 className="h1" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
        Page not found
      </h1>
      <p className="p">The page you’re looking for doesn’t exist (or was moved).</p>
      <div className="section row">
        <Button variant="primary" onClick={() => navigate('/')}>
          Go home
        </Button>
        <Button variant="ghost" onClick={() => navigate('/book')}>
          Book a repair
        </Button>
      </div>
    </Card>
  );
}
