import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  User, 
  PencilLine, 
  Eye, 
  FileSignature, 
  MessageSquare, 
  Gavel 
} from "lucide-react";
import { Avatar } from "@/components/common/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/data-table";
import { Pagination } from "@/components/common/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Debtor, DebtorStatus } from "@shared/schema";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DebtorListProps {
  clientId?: number;
  searchQuery?: string;
  status?: DebtorStatus;
  assigned?: boolean;
}

export const DebtorList: React.FC<DebtorListProps> = ({
  clientId,
  searchQuery = "",
  status,
  assigned = false,
}) => {
  const [, navigate] = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Build the query key based on filters
  const queryKey = useMemo(() => {
    let key = "/api/debtors";
    const params = new URLSearchParams();
    if (clientId) params.append("clientId", clientId.toString());
    if (status) params.append("status", status);
    if (assigned) params.append("assigned", "true");
    
    const queryParams = params.toString();
    return queryParams ? `${key}?${queryParams}` : key;
  }, [clientId, status, assigned]);

  const {
    data: debtors = [],
    isLoading,
    error,
  } = useQuery<Debtor[]>({
    queryKey: [queryKey],
  });

  // Filter debtors by search query if provided
  const filteredDebtors = useMemo(() => {
    if (!searchQuery) return debtors;
    
    return debtors.filter((debtor) => 
      debtor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (debtor.rfc && debtor.rfc.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [debtors, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredDebtors.length / itemsPerPage);
  const paginatedDebtors = filteredDebtors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderDebtorStatus = (status: DebtorStatus) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Nuevo
          </Badge>
        );
      case "in_management":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            En gestión
          </Badge>
        );
      case "promising":
        return (
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
            Promesa
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Pagado
          </Badge>
        );
      case "in_litigation":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Judicializado
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  const columns: ColumnDef<Debtor>[] = [
    {
      accessorKey: "name",
      header: "Deudor",
      cell: ({ row }) => {
        const debtor = row.original;
        return (
          <div className="flex items-center">
            <Avatar name={debtor.name} personType={debtor.personType} />
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{debtor.name}</div>
              <div className="text-sm text-gray-500">
                {debtor.rfc ? `RFC: ${debtor.rfc}` : "Sin RFC"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contacto",
      cell: ({ row }) => (
        <div>
          <div className="text-sm text-gray-900">
            {row.original.contactName || "N/A"}
          </div>
          <div className="text-sm text-gray-500">
            {row.original.email || "Sin correo"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "client",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="text-sm text-gray-900">
          {/* This would be populated by a join or separate query */}
          {clientId ? "Cliente actual" : `Cliente ID: ${row.original.clientId}`}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => renderDebtorStatus(row.original.status as DebtorStatus),
    },
    {
      accessorKey: "createdAt",
      header: "Registro",
      cell: ({ row }) => (
        <div className="text-sm text-gray-500">
          {format(new Date(row.original.createdAt), "dd/MM/yyyy", { locale: es })}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => (
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-600 hover:text-primary-900"
            title="Ver detalles"
            onClick={() => navigate(`/debtors/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            title="Editar"
            onClick={() => navigate(`/debtors/${row.original.id}/edit`)}
          >
            <PencilLine className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-600 hover:text-gray-900"
            title="Registrar actividad"
            onClick={() => navigate(`/debtors/${row.original.id}?tab=activity`)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          {row.original.status === "in_litigation" ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-red-600 hover:text-red-900"
              title="Ver caso judicial"
              onClick={() => navigate(`/debtors/${row.original.id}?tab=litigation`)}
            >
              <Gavel className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-600 hover:text-gray-900"
              title="Registrar pago"
              onClick={() => navigate(`/debtors/${row.original.id}?tab=debt`)}
            >
              <FileSignature className="h-4 w-4" />
            </Button>
          )}
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
        Error al cargar los deudores. Por favor, intente nuevamente.
      </div>
    );
  }

  if (filteredDebtors.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">No hay deudores</h3>
        <p className="mt-1 text-sm text-gray-500">
          No se encontraron deudores con los criterios de búsqueda especificados.
        </p>
        <div className="mt-6">
          <Link href={clientId ? `/debtors/new?clientId=${clientId}` : "/debtors/new"}>
            <Button className="inline-flex items-center">
              <User className="mr-2 h-4 w-4" />
              Crear nuevo deudor
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
      <DataTable
        data={paginatedDebtors}
        columns={columns}
        isLoading={isLoading}
      />
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredDebtors.length}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
};
