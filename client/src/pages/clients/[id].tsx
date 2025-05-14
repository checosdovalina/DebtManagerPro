import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { ClientDetail } from "@/components/clients/client-detail";
import { Loader2 } from "lucide-react";

interface ClientDetailPageProps {
  id: number;
}

export default function ClientDetailPage({ id }: ClientDetailPageProps) {
  const { data: client, isLoading } = useQuery({
    queryKey: [`/api/clients/${id}`],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg font-medium">Cargando información del cliente...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={client?.name || "Detalle de Cliente"}>
      <ClientDetail clientId={id} />
    </Layout>
  );
}
