import { useState } from "react";
import { Layout } from "@/components/layout/layout";
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
import { ActivityLog } from "@/components/management/activity-log";
import { Calendar } from "@/components/management/calendar";
import { ClientReports } from "@/components/management/client-reports";
import { 
  CalendarDays, 
  ListTodo, 
  FileText, 
  ArrowRight,
  LayoutDashboard
} from "lucide-react";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("system-overview");

  return (
    <Layout title="Gestión y Seguimiento">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gestión y Seguimiento</h1>
      
      <Card>
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
    </Layout>
  );
}