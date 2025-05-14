import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentDebtors } from "@/components/dashboard/recent-debtors";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  Building2,
  Users,
  DollarSign,
  Gavel,
  BarChart3,
  TrendingUp,
  Loader2,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Debtor, Client, ActivityLog } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentDebtors = [], isLoading: isDebtorsLoading } = useQuery<Debtor[]>({
    queryKey: ["/api/dashboard/recent-debtors"],
  });

  const { data: recentActivities = [], isLoading: isActivitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/dashboard/recent-activities"],
  });

  // Enhanced debtors with client name
  const enhancedDebtors = recentDebtors.map((debtor) => ({
    ...debtor,
    clientName: "Cliente ID: " + debtor.clientId,
    debt: 0 // This would be populated from debts data
  }));

  return (
    <Layout title="Dashboard">
      {/* Page title and description */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumen de las métricas clave y actividades recientes
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isStatsLoading ? (
          <>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <StatsCard
              title="Clientes activos"
              value={stats?.activeClients || 0}
              icon={Building2}
              iconColor="text-primary-600"
              iconBgColor="bg-primary-50"
            />
            <StatsCard
              title="Deudores totales"
              value={stats?.totalDebtors || 0}
              icon={Users}
              iconColor="text-green-600"
              iconBgColor="bg-green-50"
            />
            <StatsCard
              title="Cobranza mensual"
              value={`$${(stats?.monthlyCollection || 0).toLocaleString('es-MX')}`}
              icon={DollarSign}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-50"
            />
            <StatsCard
              title="Asuntos judiciales"
              value={stats?.litigationCases || 0}
              icon={Gavel}
              iconColor="text-amber-600"
              iconBgColor="bg-amber-50"
            />
          </>
        )}
      </div>

      {/* Performance Chart */}
      <div className="mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Desempeño de cobranza</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {isStatsLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-md border border-dashed border-gray-300">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Gráficas de desempeño</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Las métricas detalladas de desempeño estarán disponibles pronto.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Debtors and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent debtors */}
        <div className="col-span-1 lg:col-span-2">
          {isDebtorsLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <RecentDebtors debtors={enhancedDebtors} />
          )}
        </div>

        {/* Activity feed */}
        <div className="col-span-1">
          {isActivitiesLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <ActivityFeed activities={recentActivities} />
          )}
        </div>
      </div>

      {/* Upcoming tasks and reminders */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Tareas y recordatorios</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay tareas pendientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              No tienes tareas o recordatorios programados para hoy.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
