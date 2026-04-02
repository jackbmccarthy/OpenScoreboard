import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, handleRedirectResult } from 'firebase/auth';
import { firebaseConfig } from '@/lib/firebase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);

    // Handle the OAuth redirect result
    handleRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // Successfully signed in, redirect to home
          navigate('/', { replace: true });
        } else {
          // No result, redirect to login
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
