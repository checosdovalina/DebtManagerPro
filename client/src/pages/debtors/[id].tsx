import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/layout";
import { DebtorDetail } from "@/components/debtors/debtor-detail";
import { Loader2 } from "lucide-react";

interface DebtorDetailPageProps {
  id: number;
}

export default function DebtorDetailPage({ id }: DebtorDetailPageProps) {
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("datos-generales");
  
  // Extract tab from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1]);
    const tab = params.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [location]);

  const { data: debtor, isLoading } = useQuery({
    queryKey: [`/api/debtors/${id}`],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-lg font-medium">Cargando información del deudor...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={debtor?.name || "Detalle de Deudor"}>
      <DebtorDetail debtorId={id} initialTab={activeTab} />
    </Layout>
  );
}
