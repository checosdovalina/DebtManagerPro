import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/layout";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RecentDebtors } from "@/components/dashboard/recent-debtors";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import {
  Building2, Users, DollarSign, Gavel,
  TrendingUp, TrendingDown, CalendarClock, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import type { Debtor, ActivityLog } from "@shared/schema";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

interface ChartData {
  debtorsByStatus: { name: string; value: number; fill: string }[];
  monthlyData: { mes: string; cobranza: number; meta: number }[];
  totalOriginal: number;
  totalCurrent: number;
  totalRecovered: number;
  recoveryRate: number;
}

interface UpcomingAction extends ActivityLog {
  nextActionDate: string;
}

const MXNF = (n: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { data: stats, isLoading: isStatsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentDebtors = [], isLoading: isDebtorsLoading } = useQuery<Debtor[]>({
    queryKey: ["/api/dashboard/recent-debtors"],
  });

  const { data: recentActivities = [], isLoading: isActivitiesLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/dashboard/recent-activities"],
  });

  const { data: chartData, isLoading: isChartLoading } = useQuery<ChartData>({
    queryKey: ["/api/dashboard/chart-data"],
  });

  const { data: upcomingActions = [] } = useQuery<UpcomingAction[]>({
    queryKey: ["/api/dashboard/upcoming-actions"],
  });

  const enhancedDebtors = recentDebtors.map((d) => ({ ...d, clientName: "", debt: 0 }));

  return (
    <Layout title="Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Resumen ejecutivo de cobranza y actividades</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isStatsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : (
          <>
            <StatsCard title="Clientes activos" value={stats?.activeClients || 0}
              icon={Building2} iconColor="text-primary-600" iconBgColor="bg-primary-50" />
            <StatsCard title="Deudores totales" value={stats?.totalDebtors || 0}
              icon={Users} iconColor="text-green-600" iconBgColor="bg-green-50" />
            <StatsCard title="Cobranza mensual"
              value={MXNF(stats?.monthlyCollection || 0)}
              icon={DollarSign} iconColor="text-blue-600" iconBgColor="bg-blue-50" />
            <StatsCard title="Asuntos judiciales" value={stats?.litigationCases || 0}
              icon={Gavel} iconColor="text-amber-600" iconBgColor="bg-amber-50" />
          </>
        )}
      </div>

      {/* Cartera Summary + Recovery Rate */}
      {!isChartLoading && chartData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-gray-500 mb-1">Cartera original</p>
              <p className="text-2xl font-bold text-gray-800">{MXNF(chartData.totalOriginal)}</p>
              <p className="text-xs text-gray-400 mt-1">Total asignado</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-gray-500 mb-1">Saldo pendiente</p>
              <p className="text-2xl font-bold text-red-600">{MXNF(chartData.totalCurrent)}</p>
              <p className="text-xs text-gray-400 mt-1">Por recuperar</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-gray-500 mb-1">Tasa de recuperación</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold text-green-600">{chartData.recoveryRate}%</p>
                {chartData.recoveryRate >= 50
                  ? <TrendingUp className="h-5 w-5 text-green-500 mb-1" />
                  : <TrendingDown className="h-5 w-5 text-red-400 mb-1" />}
              </div>
              <Progress value={chartData.recoveryRate} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Monthly Bar Chart */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Cobranza mensual vs Meta</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {isChartLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData?.monthlyData || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => MXNF(v)} />
                  <Legend />
                  <Bar dataKey="cobranza" name="Cobranza" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="meta" name="Meta" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart — Status */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Deudores por estado</CardTitle>
          </CardHeader>
          <CardContent>
            {isChartLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : chartData?.debtorsByStatus?.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={chartData.debtorsByStatus} cx="50%" cy="50%"
                    innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {chartData.debtorsByStatus.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string) => [v, name]} />
                  <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-sm text-gray-400">
                Sin datos de deudores
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Debtors + Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="col-span-1 lg:col-span-2">
          {isDebtorsLoading ? (
            <Card><CardContent className="space-y-3 pt-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </CardContent></Card>
          ) : (
            <RecentDebtors debtors={enhancedDebtors} />
          )}
        </div>
        <div className="col-span-1">
          {isActivitiesLoading ? (
            <Card><CardContent className="space-y-3 pt-4">
              {[1,2].map(i => <Skeleton key={i} className="h-20 w-full" />)}
            </CardContent></Card>
          ) : (
            <ActivityFeed activities={recentActivities} />
          )}
        </div>
      </div>

      {/* Upcoming Actions */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-semibold">Próximas acciones programadas</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingActions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-400">
              <CheckCircle2 className="h-10 w-10 mb-2 text-green-400" />
              <p className="text-sm font-medium text-gray-600">Todo al día</p>
              <p className="text-xs mt-1">No hay acciones pendientes programadas.</p>
            </div>
          ) : (
            <div className="divide-y">
              {upcomingActions.slice(0, 5).map((action) => (
                <div key={action.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{action.nextAction}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{action.comments}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {new Date(action.nextActionDate).toLocaleDateString("es-MX")}
                    </Badge>
                    <Link href={`/debtors/${action.debtorId}`}>
                      <span className="text-xs text-primary cursor-pointer hover:underline">Ver</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
