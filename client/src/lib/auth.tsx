import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.authenticated) {
          console.log("Session check: Not authenticated");
          window.location.href = '/login';
        } else {
          console.log("Session check: Is authenticated");
        }
      } catch (error) {
        console.error("Error checking session:", error);
        window.location.href = '/login';
      }
    };

    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated in hook, checking server session");
      checkSession();
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Show loading indicator while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 mt-2 text-xl font-medium text-gray-800">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  // Only render children if authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 mt-2 text-xl font-medium text-gray-800">Verificando sesión...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};