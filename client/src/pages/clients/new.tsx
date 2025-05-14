import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { ClientForm } from "@/components/clients/client-form";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "@shared/schema";

export default function NewClientPage() {
  // Fetch users with executive role for dropdown
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Filter by role (executive)
  const executives = users.filter(user => user.role === "executive");

  return (
    <Layout title="Nuevo Cliente">
      <div className="space-y-6">
        <Breadcrumb 
          items={[
            { label: "Inicio", href: "/" },
            { label: "Clientes", href: "/clients" },
            { label: "Nuevo Cliente", href: "/clients/new", active: true },
          ]} 
        />

        <ClientForm 
          usersList={executives.map(exec => ({
            id: exec.id,
            fullName: exec.fullName
          }))}
        />
      </div>
    </Layout>
  );
}
