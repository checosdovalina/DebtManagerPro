import { useState } from "react";
import { Link, useLocation } from "wouter";
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
  ArrowRight,
  Menu,
  ChevronRight
} from "lucide-react";

// Definición de los módulos del sistema
const systemModules = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: <LayoutDashboard className="h-5 w-5" />, 
    description: 'Vista general del sistema', 
    path: '/',
    details: 'Muestra estadísticas clave, actividades recientes y deudores pendientes.' 
  },
  { 
    id: 'clients', 
    name: 'Clientes', 
    icon: <Building2 className="h-5 w-5" />, 
    description: 'Gestión de clientes', 
    path: '/clients',
    details: 'Administración de clientes, información de contacto y datos bancarios.' 
  },
  { 
    id: 'debtors', 
    name: 'Deudores', 
    icon: <Users className="h-5 w-5" />, 
    description: 'Gestión de deudores', 
    path: '/debtors',
    details: 'Administración de deudores, deudas, información de contacto y seguimiento de pagos.' 
  },
  { 
    id: 'management', 
    name: 'Gestión y Seguimiento', 
    icon: <ListTodo className="h-5 w-5" />, 
    description: 'Módulo Actual', 
    path: '/management',
    current: true,
    details: 'Registro de actividades de cobranza, calendario de eventos programados y generación de informes.'
  },
  { 
    id: 'reports', 
    name: 'Reportes', 
    icon: <BarChart className="h-5 w-5" />, 
    description: 'Análisis y estadísticas', 
    path: '/reports/analytics',
    details: 'Reportes analíticos, gráficos de rendimiento y estadísticas de cobranza.' 
  },
  { 
    id: 'judicial', 
    name: 'Área Judicial', 
    icon: <Gavel className="h-5 w-5" />, 
    description: 'Seguimiento jurídico', 
    path: '/debtors?status=in_litigation',
    details: 'Gestión de casos legales, seguimiento de procesos jurídicos y litigios.' 
  },
  { 
    id: 'documents', 
    name: 'Documentos', 
    icon: <FileText className="h-5 w-5" />, 
    description: 'Gestión documental', 
    path: '/documents',
    details: 'Almacenamiento y gestión de documentos relacionados con clientes y deudores.' 
  },
  { 
    id: 'payments', 
    name: 'Pagos', 
    icon: <Wallet className="h-5 w-5" />, 
    description: 'Gestión de pagos', 
    path: '#',
    disabled: true,
    details: 'Registro y seguimiento de abonos, pagos completos y conciliación.' 
  },
  { 
    id: 'admin', 
    name: 'Administración', 
    icon: <UserCog className="h-5 w-5" />, 
    description: 'Configuración del sistema', 
    path: '/users',
    details: 'Gestión de usuarios, roles, permisos y configuración general del sistema.' 
  }
];

// Componente para mostrar un módulo individual
const ModuleItem = ({ module, isActive = false }) => {
  const [location, setLocation] = useLocation();
  
  return (
    <div 
      className={`flex items-center justify-between p-3 cursor-pointer rounded-lg transition-colors
        ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
        ${module.disabled ? 'opacity-60 cursor-not-allowed' : ''}
      `}
      onClick={() => !module.disabled && setLocation(module.path)}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isActive ? 'bg-primary/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
          {module.icon}
        </div>
        <div>
          <h3 className="font-medium">{module.name}</h3>
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );
};

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("system-overview");
  const [location] = useLocation();

  return (
    <div className="container p-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión y Seguimiento</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel lateral con menú de módulos */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Menu className="h-5 w-5 text-primary" />
              Módulos del Sistema
            </CardTitle>
            <CardDescription>
              Acceso rápido a las funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemModules.map((module) => (
              <ModuleItem 
                key={module.id} 
                module={module} 
                isActive={module.current || location === module.path}
              />
            ))}
          </CardContent>
        </Card>
        
        {/* Contenido principal */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Herramientas de Gestión</CardTitle>
            <CardDescription>
              Seguimiento de actividades, calendario y reportes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              defaultValue="system-overview" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="system-overview" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Visión General</span>
                  <span className="sm:hidden">General</span>
                </TabsTrigger>
                <TabsTrigger value="activity-log" className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4" />
                  <span className="hidden sm:inline">Registro</span>
                  <span className="sm:hidden">Registro</span>
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
                  <h2 className="text-xl font-semibold mb-2">Gestión y Seguimiento</h2>
                  <p className="text-muted-foreground">
                    Este módulo permite dar seguimiento a todas las actividades de cobranza, gestionar el calendario
                    de eventos programados y generar informes para clientes.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ListTodo className="h-5 w-5 text-primary" />
                        Registro de Actividades
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      Seguimiento de todas las acciones realizadas en el proceso de cobranza.
                    </CardContent>
                    <CardFooter>
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab("activity-log")}>
                        <span className="flex items-center gap-1">
                          Ver Actividades
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarDays className="h-5 w-5 text-primary" />
                        Calendario
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      Visualización de visitas programadas, fechas importantes y próximos seguimientos.
                    </CardContent>
                    <CardFooter>
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab("calendar")}>
                        <span className="flex items-center gap-1">
                          Ver Calendario
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5 text-primary" />
                        Informes para Clientes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      Generación y gestión de reportes para los clientes sobre el avance de la cobranza.
                    </CardContent>
                    <CardFooter>
                      <Button variant="secondary" size="sm" onClick={() => setActiveTab("client-reports")}>
                        <span className="flex items-center gap-1">
                          Ver Informes
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="flex justify-center mt-4">
                  <p className="text-sm text-muted-foreground max-w-lg text-center">
                    Seleccione una de las herramientas de arriba o utilice las tarjetas para acceder directamente a las funcionalidades.
                    El menú lateral le permite navegar rápidamente entre los diferentes módulos del sistema.
                  </p>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}