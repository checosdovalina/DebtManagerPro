import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AuthSession {
  authenticated: boolean;
  user?: any;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: session, isLoading, refetch } = useQuery<AuthSession>({
    queryKey: ["/api/auth/session"],
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 2 * 60 * 1000, // Refresh session every 2 minutes
    refetchOnMount: true,
    staleTime: 10 * 1000, // Consider data stale after 10 seconds
    initialData: { authenticated: false }
  });

  const login = async (email: string, password: string) => {
    const response = await apiRequest("POST", "/api/auth/login", { email, password });
    
    if (!response.ok) {
      throw new Error("Login failed");
    }
    
    // Obtener la respuesta de login
    const result = await response.json();
    
    // Forzar una actualización del estado de autenticación
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    
    // Esperar a que se complete la actualización
    await queryClient.refetchQueries({ queryKey: ["/api/auth/session"] });
    
    console.log("Login successful, session refreshed");
    return result;
  };

  const logout = async () => {
    const response = await apiRequest("POST", "/api/auth/logout");
    
    if (!response.ok) {
      throw new Error("Logout failed");
    }
    
    // Invalidate the auth query to refresh the user data
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    return response.json();
  };

  return {
    user: session?.authenticated ? session.user : null,
    isLoading,
    isAuthenticated: session?.authenticated ?? false,
    login,
    logout,
  };
}