import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { ClientList } from "@/components/clients/client-list";
import { ClientFilter } from "@/components/clients/client-filter";
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  Users, 
  DollarSign, 
  Gavel, 
  Plus, 
  FileUp 
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { User, ClientStatus } from "@shared/schema";

export default function ClientsPage() {
  const [, navigate] = useLocation();
  
  // State for filters
  const [filters, setFilters] = useState({
    searchQuery: "",
    status: "" as ClientStatus | "",
    executiveId: null as number | null,
  });

  // Fetch executives for filter dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter only executives
  const executives = users.filter(user => user.role === "executive");

  // Fetch dashboard stats to show at the top
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const handleFilterChange = (newFilters: {
    searchQuery: string;
    status: ClientStatus | "";
    executiveId: number | null;
  }) => {
    setFilters(newFilters);
  };

  return (
    <Layout title="Clientes">
      {/* Page title and actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los clientes y sus deudores asociados
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Button
            variant="outline"
            className="inline-flex items-center"
          >
            <FileUp className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button 
            onClick={() => navigate("/clients/new")}
            className="inline-flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
        </div>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Clientes activos"
          value={stats?.activeClients || 0}
          icon={Building2}
          iconColor="text-primary-600"
          iconBgColor="bg-primary-50"
        />
        <StatsCard
          title="Deudores totales"
          value={stats?.totalDebtors || 0}
          icon={Users}
          iconColor="text-green-600"
          iconBgColor="bg-green-50"
        />
        <StatsCard
          title="Cobranza mensual"
          value={`$${(stats?.monthlyCollection || 0).toLocaleString('es-MX')}`}
          icon={DollarSign}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-50"
        />
        <StatsCard
          title="Asuntos judiciales"
          value={stats?.litigationCases || 0}
          icon={Gavel}
          iconColor="text-amber-600"
          iconBgColor="bg-amber-50"
        />
      </div>

      {/* Filters */}
      <ClientFilter 
        onFilterChange={handleFilterChange} 
        executives={executives.map(exec => ({ id: exec.id, fullName: exec.fullName }))}
      />

      {/* Clients table */}
      <ClientList 
        searchQuery={filters.searchQuery}
        status={filters.status as ClientStatus}
        executiveId={filters.executiveId}
      />
    </Layout>
  );
}
