import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { ClientForm } from "@/components/clients/client-form";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Breadcrumb } from "@/components/ui/breadcrumb-nav";
import type { Client } from "@shared/schema";

interface ClientEditPageProps {
  id: number;
}

export default function ClientEditPage({ id }: ClientEditPageProps) {
  const [, navigate] = useLocation();
  
  const { data: client, isLoading } = useQuery<Client>({
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

  if (!client) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <h2 className="text-lg font-medium">Cliente no encontrado</h2>
            <p className="mt-2 text-gray-500">No se encontró información para este cliente.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Editar: ${client.name}`}>
      <div className="space-y-6">
        <Breadcrumb 
          items={[
            { label: "Inicio", href: "/" },
            { label: "Clientes", href: "/clients" },
            { label: client.name, href: `/clients/${id}` },
            { label: "Editar", href: `/clients/${id}/edit`, active: true },
          ]} 
        />

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">Editar Cliente</h1>
          <ClientForm 
            initialData={client}
            onSuccess={() => {
              navigate(`/clients/${id}`);
            }}
          />
        </div>
      </div>
    </Layout>
  );
}