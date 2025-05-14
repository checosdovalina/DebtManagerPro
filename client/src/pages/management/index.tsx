import { useState } from "react";
import { Link } from "wouter";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ActivityLog } from "@/components/management/activity-log";
import { Calendar } from "@/components/management/calendar";
import { ClientReports } from "@/components/management/client-reports";
import { 
  CalendarDays, 
  ListTodo, 
  FileText, 
  Building2, 
  Users, 
  BarChart, 
  Wallet,
  UserCog,
  LayoutDashboard,
  Gavel,
  ArrowRight
} from "lucide-react";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("system-overview");

  return (
    <div className="container p-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión y Seguimiento</h1>
      
      <Tabs 
        defaultValue="system-overview" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full md:w-[800px]">
          <TabsTrigger value="system-overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Visión General</span>
            <span className="sm:hidden">General</span>
          </TabsTrigger>
          <TabsTrigger value="activity-log" className="flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            <span className="hidden sm:inline">Registro de Actividades</span>
            <span className="sm:hidden">Actividades</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Calendario</span>
          </TabsTrigger>
          <TabsTrigger value="client-reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Informes</span>
            <span className="sm:hidden">Informes</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="system-overview" className="space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">Estructura del Sistema DCS</h2>
            <p className="text-muted-foreground">
              El sistema de gestión de cobranza (DCS) está organizado en los siguientes módulos:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Módulo 1: Dashboard */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  Dashboard
                </CardTitle>
                <CardDescription>
                  Vista general del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Muestra estadísticas clave, actividades recientes y deudores pendientes. 
                  Proporciona una visión rápida del estado general de las operaciones.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">
                    <span className="flex items-center gap-1">
                      Ir al Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Módulo 2: Clientes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Clientes
                </CardTitle>
                <CardDescription>
                  Gestión de clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administración de clientes, información de contacto y datos bancarios. 
                  Gestión de relaciones comerciales y configuración de parámetros.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/clients">
                    <span className="flex items-center gap-1">
                      Ir a Clientes
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Módulo 3: Deudores */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Deudores
                </CardTitle>
                <CardDescription>
                  Gestión de deudores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Administración de deudores, deudas, información de contacto 
                  y seguimiento de pagos. Permite la asignación a gestores.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/debtors">
                    <span className="flex items-center gap-1">
                      Ir a Deudores
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Módulo 4: Gestión y Seguimiento */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  Gestión y Seguimiento
                </CardTitle>
                <CardDescription>
                  <Badge variant="outline" className="bg-primary-50">Módulo Actual</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registro de actividades de cobranza, calendario de eventos
                  programados y generación de informes para clientes.
                </p>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab("activity-log")}>
                    <span className="flex items-center gap-1">
                      Actividades
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActiveTab("calendar")}>
                    <span className="flex items-center gap-1">
                      Calendario
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
            
            {/* Módulo 5: Reportes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  Reportes
                </CardTitle>
                <CardDescription>
                  Análisis y estadísticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Reportes analíticos, gráficos de rendimiento, estadísticas 
                  de cobranza y métricas de efectividad por gestor.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/reports/analytics">
                    <span className="flex items-center gap-1">
                      Ir a Reportes
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Módulo 6: Judicial */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5 text-primary" />
                  Área Judicial
                </CardTitle>
                <CardDescription>
                  Seguimiento jurídico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gestión de casos legales, seguimiento de procesos jurídicos,
                  litigios, fechas clave y documentación legal.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/debtors?status=in_litigation">
                    <span className="flex items-center gap-1">
                      Ver Casos Legales
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Módulo 7: Documentos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentos
                </CardTitle>
                <CardDescription>
                  Gestión documental
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Almacenamiento y gestión de documentos relacionados con
                  clientes, deudores, casos y evidencias de cobranza.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/documents">
                    <span className="flex items-center gap-1">
                      Ir a Documentos
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Módulo 8: Pagos */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Pagos
                </CardTitle>
                <CardDescription>
                  Gestión de pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registro y seguimiento de abonos, pagos completos,
                  conciliación y reportes financieros.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" disabled>
                  <span className="flex items-center gap-1">
                    Ver en deudores
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </CardFooter>
            </Card>
            
            {/* Módulo 9: Administración */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5 text-primary" />
                  Administración
                </CardTitle>
                <CardDescription>
                  Configuración del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gestión de usuarios, roles, permisos y configuración
                  general del sistema DCS.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/users">
                    <span className="flex items-center gap-1">
                      Ir a Administración
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="activity-log" className="space-y-4">
          <ActivityLog />
        </TabsContent>
        
        <TabsContent value="calendar" className="space-y-4">
          <Calendar />
        </TabsContent>
        
        <TabsContent value="client-reports" className="space-y-4">
          <ClientReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}