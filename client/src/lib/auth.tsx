import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Verificamos de manera explícita el estado de la sesión
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include'
        });
        const sessionData = await response.json();
        
        if (!sessionData.authenticated) {
          console.log("Session check: Not authenticated, redirecting to login");
          window.location.href = '/login'; // Usar window.location para un reinicio completo
        } else {
          console.log("Session check: Authenticated as:", sessionData.user);
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };

    // Solo verificar si no está cargando y parece que no está autenticado
    if (!isLoading && !isAuthenticated) {
      console.log("Running session check...");
      checkSession();
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Mostrar un indicador de carga mientras se verifica el estado
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 mt-2 text-xl font-medium text-gray-800">Cargando DCS...</span>
        </div>
      </div>
    );
  }

  // Si no está autenticado según el hook, verificamos una vez más antes de bloquear
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

  // Si todo está bien, mostrar el contenido protegido
  return <>{children}</>;
};