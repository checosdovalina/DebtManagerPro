import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { DebtorForm } from "@/components/debtors/debtor-form";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { useQuery } from "@tanstack/react-query";
import { Client } from "@shared/schema";

export default function NewDebtorPage() {
  const [location] = useLocation();
  const [clientId, setClientId] = useState<number | undefined>();
  const [clientName, setClientName] = useState<string | undefined>();

  // Extract clientId from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const id = params.get("clientId");
    if (id) {
      setClientId(Number(id));
    }
  }, [location]);

  // If clientId is provided, fetch client name for breadcrumb
  const { data: client } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
    enabled: !!clientId,
  });

  // Update client name when data is loaded
  useEffect(() => {
    if (client) {
      setClientName(client.name);
    }
  }, [client]);

  return (
    <Layout title="Nuevo Deudor">
      <div className="space-y-6">
        <Breadcrumb 
          items={[
            { label: "Inicio", href: "/" },
            { label: "Deudores", href: "/debtors" },
            ...(clientId && clientName ? [
              { label: clientName, href: `/clients/${clientId}` }
            ] : []),
            { label: "Nuevo Deudor", href: "/debtors/new", active: true },
          ]} 
        />

        <DebtorForm preselectedClientId={clientId} />
      </div>
    </Layout>
  );
}
