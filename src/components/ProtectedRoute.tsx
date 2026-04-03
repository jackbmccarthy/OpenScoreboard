// Protected Route - redirects to /login if not authenticated
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
