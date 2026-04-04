import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleRedirectResult } from '@/lib/auth';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    handleRedirectResult()
      .then((result) => {
        if (result?.user) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      })
      .catch((error) => {
        console.error('OAuth callback error:', error);
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      background: '#09090b',
      color: 'white'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>Signing in...</h1>
        <p>Please wait while we complete the sign-in process.</p>
      </div>
    </div>
  );
}
