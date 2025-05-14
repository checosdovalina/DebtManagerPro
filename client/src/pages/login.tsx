import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const loginSchema = z.object({
  email: z.string().email("Por favor, ingrese un correo electrónico válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    setIsLoading(true);
    
    try {
      const loginResult = await login(data.email, data.password);
      console.log("Login successful:", loginResult);
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Has iniciado sesión correctamente",
      });
      
      // Hacer una petición explícita para verificar la sesión antes de redirigir
      try {
        const sessionCheck = await fetch('/api/auth/session', { 
          credentials: 'include'
        });
        const sessionData = await sessionCheck.json();
        
        console.log("Session check:", sessionData);
        
        if (sessionData.authenticated) {
          console.log("Session verified, redirecting to dashboard...");
          // Redireccionar al dashboard explícitamente con un pequeño retraso
          setTimeout(() => {
            window.location.href = '/'; // Usar window.location en lugar de navigate
          }, 800);
        } else {
          console.log("Session not authenticated yet, retrying...");
          // Si aún no está autenticado, intentar nuevamente después de un retraso
          setTimeout(() => {
            window.location.href = '/';
          }, 1500);
        }
      } catch (sessionError) {
        console.error("Error checking session:", sessionError);
        // Si hay un error, intentar redirigir de todos modos
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      }
      
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("Credenciales inválidas. Por favor, intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center flex flex-col items-center">
          <div className="mb-4">
            <img src="/logo.png" alt="DCS Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">DCS</h1>
          <p className="mt-2 text-sm text-gray-600">
            Debt Collection Services Mexico
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Iniciar sesión</CardTitle>
          </CardHeader>
          <CardContent>
            {loginError && (
              <div className="mb-4 p-3 rounded-md bg-red-50 text-red-800 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{loginError}</p>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo electrónico</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="usuario@ejemplo.com"
                          type="email"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            {...field}
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end">
                  <a
                    className="text-sm font-medium text-primary hover:text-primary-dark"
                    href="#"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    "Iniciar sesión"
                  )}
                </Button>
              </form>
            </Form>
            
            <div className="mt-6">
              <p className="text-center text-sm text-gray-600">
                Credenciales de prueba:
              </p>
              <div className="mt-2 bg-gray-50 p-2 rounded text-sm text-gray-700">
                <p><strong>Email:</strong> admin@dcs.com</p>
                <p><strong>Contraseña:</strong> password123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          &copy; {new Date().getFullYear()} DCS - Debt Collection Services. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
