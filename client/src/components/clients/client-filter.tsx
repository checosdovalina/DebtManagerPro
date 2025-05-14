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
import { ClientStatus } from "@shared/schema";

interface ClientFilterProps {
  onFilterChange: (filters: {
    searchQuery: string;
    status: ClientStatus | "all";
    executiveId: number | null;
  }) => void;
  executives?: { id: number; fullName: string }[];
}

export const ClientFilter: React.FC<ClientFilterProps> = ({ 
  onFilterChange,
  executives = [] 
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<ClientStatus | "all">("all");
  const [executiveId, setExecutiveId] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({
      searchQuery,
      status,
      executiveId
    });
  };

  const handleReset = () => {
    setSearchQuery("");
    setStatus("all");
    setExecutiveId(null);
    onFilterChange({
      searchQuery: "",
      status: "all",
      executiveId: null
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
                Buscar cliente
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
                onValueChange={(value) => setStatus(value as ClientStatus | "all")}
              >
                <SelectTrigger id="filter-estado">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Filtro por ejecutivo comercial */}
            <div className="w-full md:w-64">
              <label htmlFor="filter-ejecutivo" className="block text-sm font-medium text-gray-700">
                Ejecutivo comercial
              </label>
              <Select
                value={executiveId?.toString() || ""}
                onValueChange={(value) => 
                  setExecutiveId(value ? parseInt(value) : null)
                }
              >
                <SelectTrigger id="filter-ejecutivo">
                  <SelectValue placeholder="Todos los ejecutivos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los ejecutivos</SelectItem>
                  {executives.map((executive) => (
                    <SelectItem key={executive.id} value={executive.id.toString()}>
                      {executive.fullName}
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
