import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  CalendarDays, 
  FileText, 
  FileCheck 
} from "lucide-react";
import { ActivityLog } from "@/components/management/activity-log";
import { Calendar } from "@/components/management/calendar";
import { ClientReports } from "@/components/management/client-reports";
import { useQuery } from "@tanstack/react-query";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("activities");
  
  const { data: activities, isLoading } = useQuery({
    queryKey: ["/api/activities/recent"],
    enabled: activeTab === "activities"
  });

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Gestión y Seguimiento</h1>
            <p className="text-gray-600">Monitorea las actividades y genera reportes para clientes</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" className="hidden md:flex">
              <Search className="h-4 w-4 mr-2" />
              <span>Búsqueda Avanzada</span>
            </Button>
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              <span>Generar Reporte</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="activities" onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="activities">
              <FileText className="h-4 w-4 mr-2" />
              Actividades
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileCheck className="h-4 w-4 mr-2" />
              Reportes a Clientes
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendario
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Buscar actividades..."
                  className="pl-10"
                />
              </div>
            </div>
            
            <ActivityLog isLoading={isLoading} activities={activities || []} />
          </TabsContent>

          <TabsContent value="reports">
            <ClientReports />
          </TabsContent>

          <TabsContent value="calendar">
            <Calendar />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}