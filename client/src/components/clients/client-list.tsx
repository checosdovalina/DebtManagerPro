import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { User, Building2, UsersRound, PencilLine, Eye } from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import { Pagination } from "@/components/common/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Client, ClientStatus } from "@shared/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientListProps {
  searchQuery?: string;
  status?: ClientStatus;
  executiveId?: number;
}

export const ClientList: React.FC<ClientListProps> = ({
  searchQuery = "",
  status,
  executiveId,
}) => {
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const {
    data: clients = [],
    isLoading,
    error,
  } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Filter clients based on props
  const filteredClients = React.useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        !searchQuery ||
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.rfc && client.rfc.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = !status || client.status === status;

      const matchesExecutive = !executiveId || client.executiveId === executiveId;

      return matchesSearch && matchesStatus && matchesExecutive;
    });
  }, [clients, searchQuery, status, executiveId]);

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderClientStatus = (status: ClientStatus) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Activo
          </Badge>
        );
      case "inactive":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Inactivo
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Pendiente
          </Badge>
        );
      default:
        return null;
    }
  };

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Cliente",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex items-center">
            <Avatar name={client.name} personType={client.personType} />
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{client.name}</div>
              <div className="text-sm text-gray-500">
                Desde: {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: es })}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "rfc",
      header: "RFC",
      cell: ({ row }) => <div className="text-sm text-gray-500">{row.original.rfc}</div>,
    },
    {
      accessorKey: "contact",
      header: "Contacto",
      cell: ({ row }) => (
        <div>
          <div className="text-sm text-gray-900">{row.original.legalRepresentative || "N/A"}</div>
          <div className="text-sm text-gray-500">{row.original.email || "N/A"}</div>
        </div>
      ),
    },
    {
      accessorKey: "executiveName",
      header: "Ejecutivo",
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          {/* This would be populated by looking up the user's name */}
          {row.original.executiveId ? "Ejecutivo Asignado" : "Sin asignar"}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => renderClientStatus(row.original.status as ClientStatus),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-600 hover:text-primary-900"
            title="Ver detalles"
            onClick={() => navigate(`/clients/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            title="Editar"
            onClick={() => navigate(`/clients/${row.original.id}/edit`)}
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            title="Ver deudores"
            onClick={() => navigate(`/debtors?clientId=${row.original.id}`)}
          >
            <UsersRound className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-60" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
        Error al cargar los clientes. Por favor, intente nuevamente.
      </div>
    );
  }

  if (filteredClients.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No hay clientes</h3>
        <p className="mt-1 text-sm text-gray-500">
          No se encontraron clientes con los criterios de búsqueda especificados.
        </p>
        <div className="mt-6">
          <Link href="/clients/new">
            <Button className="inline-flex items-center">
              <User className="mr-2 h-4 w-4" />
              Crear nuevo cliente
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
      <DataTable
        data={paginatedClients}
        columns={columns}
        isLoading={isLoading}
      />
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredClients.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
};
