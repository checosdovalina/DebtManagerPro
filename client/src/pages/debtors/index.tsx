import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { DebtorList } from "@/components/debtors/debtor-list";
import { DebtorFilter } from "@/components/debtors/debtor-filter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Client, DebtorStatus } from "@shared/schema";

export default function DebtorsPage() {
  const [location, navigate] = useLocation();
  const [clientId, setClientId] = useState<number | null>(null);
  const [assigned, setAssigned] = useState(false);
  const [status, setStatus] = useState<DebtorStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  // Parse URL params to set initial filter state
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    
    if (params.has("clientId")) {
      setClientId(Number(params.get("clientId")));
    }
    
    if (params.has("assigned") && params.get("assigned") === "true") {
      setAssigned(true);
    }
    
    if (params.has("status")) {
      setStatus(params.get("status") as DebtorStatus);
    }
  }, [location]);

  // Fetch clients for filter dropdown
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const handleFilterChange = (newFilters: {
    searchQuery: string;
    status: DebtorStatus | "";
    clientId: number | null;
  }) => {
    setSearchQuery(newFilters.searchQuery);
    setStatus(newFilters.status);
    setClientId(newFilters.clientId);
  };

  return (
    <Layout title="Deudores">
      {/* Page title and actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Deudores</h1>
          <p className="mt-1 text-sm text-gray-500">
            {assigned
              ? "Deudores asignados a tu gestión"
              : status === "in_litigation"
              ? "Deudores en proceso judicial"
              : clientId
              ? "Deudores asociados al cliente seleccionado"
              : "Administra todos los deudores registrados en el sistema"}
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button 
            onClick={() => navigate(clientId ? `/debtors/new?clientId=${clientId}` : "/debtors/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Deudor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <DebtorFilter 
        onFilterChange={handleFilterChange} 
        clients={clients.map(client => ({ id: client.id, name: client.name }))}
      />

      {/* Debtors table */}
      <DebtorList 
        clientId={clientId}
        searchQuery={searchQuery}
        status={status as DebtorStatus}
        assigned={assigned}
      />
    </Layout>
  );
}
