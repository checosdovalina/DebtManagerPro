import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { DebtorStatus } from "@shared/schema";

interface DebtorFilterProps {
  onFilterChange: (filters: {
    searchQuery: string;
    status: DebtorStatus | "all";
    clientId: number | null;
  }) => void;
  clients?: { id: number; name: string }[];
}

export const DebtorFilter: React.FC<DebtorFilterProps> = ({ 
  onFilterChange,
  clients = [] 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<DebtorStatus | "all">("all");
  const [clientId, setClientId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      searchQuery,
      status,
      clientId
    });
  };

  const handleReset = () => {
    setSearchQuery("");
    setStatus("all");
    setClientId(null);
    onFilterChange({
      searchQuery: "",
      status: "all",
      clientId: null
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col md:flex-row md:items-end space-y-4 md:space-y-0 md:space-x-4">
            {/* Búsqueda */}
            <div className="flex-1">
              <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700">
                Buscar deudor
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="filter-search"
                  className="pl-10"
                  placeholder="Nombre, RFC o contacto"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Filtro por estado */}
            <div className="w-full md:w-48">
              <label htmlFor="filter-estado" className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <Select 
                value={status} 
                onValueChange={(value) => setStatus(value as DebtorStatus | "all")}
              >
                <SelectTrigger id="filter-estado">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Nuevo</SelectItem>
                  <SelectItem value="in_management">En gestión</SelectItem>
                  <SelectItem value="promising">Promesa</SelectItem>
                  <SelectItem value="paid">Pagado</SelectItem>
                  <SelectItem value="in_litigation">Judicializado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro por cliente */}
            <div className="w-full md:w-64">
              <label htmlFor="filter-cliente" className="block text-sm font-medium text-gray-700">
                Cliente
              </label>
              <Select
                value={clientId?.toString() || ""}
                onValueChange={(value) => 
                  setClientId(value ? parseInt(value) : null)
                }
              >
                <SelectTrigger id="filter-cliente">
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Botones */}
            <div className="flex space-x-2">
              <Button type="submit" className="w-full md:w-auto">
                <Filter className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                className="w-full md:w-auto"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
