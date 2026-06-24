import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { queryClient } from "./lib/queryClient";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import ClientsPage from "@/pages/clients/index";
import ClientDetailPage from "@/pages/clients/[id]";
import ClientEditPage from "@/pages/clients/edit";
import NewClientPage from "@/pages/clients/new";
import DebtorsPage from "@/pages/debtors/index";
import DebtorDetailPage from "@/pages/debtors/[id]";
import NewDebtorPage from "@/pages/debtors/new";
import UsersPage from "@/pages/users/index";
import ReportsPage from "@/pages/reports/index";
import ManagementPage from "@/pages/management/index";
import CalculadoraPage from "@/pages/calculadora";
import { ProtectedRoute } from "./lib/auth";

function Router() {
  return (
    <Switch>
      {/* Rutas públicas */}
      <Route path="/login">
        <Login />
      </Route>
      
      {/* Ruta pública para redirigir a login para facilitar el manejo de URL */}
      <Route path="/redirect-to-login">
        {() => {
          window.location.href = '/login';
          return null;
        }}
      </Route>
      
      {/* Rutas protegidas */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients">
        <ProtectedRoute>
          <ClientsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients/new">
        <ProtectedRoute>
          <NewClientPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/clients/:id">
        {(params) => (
          <ProtectedRoute>
            <ClientDetailPage id={Number(params.id)} />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/clients/:id/edit">
        {(params) => (
          <ProtectedRoute>
            <ClientEditPage id={Number(params.id)} />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/debtors">
        <ProtectedRoute>
          <DebtorsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/debtors/new">
        <ProtectedRoute>
          <NewDebtorPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/debtors/:id">
        {(params) => (
          <ProtectedRoute>
            <DebtorDetailPage id={Number(params.id)} />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/users">
        <ProtectedRoute>
          <UsersPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports/analytics">
        <ProtectedRoute>
          <ReportsPage />
        </ProtectedRoute>
      </Route>

      <Route path="/management">
        <ProtectedRoute>
          <ManagementPage />
        </ProtectedRoute>
      </Route>

      <Route path="/calculadora">
        <ProtectedRoute>
          <CalculadoraPage />
        </ProtectedRoute>
      </Route>
      
      {/* La ruta raíz debe redireccionar al dashboard */}
      <Route path="/">
        {() => {
          window.location.href = '/dashboard';
          return null;
        }}
      </Route>
      
      {/* Ruta de 404 para cualquier otra ruta no definida */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
