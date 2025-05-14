import { useState } from "react";
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
  CardTitle 
} from "@/components/ui/card";
import { ActivityLog } from "@/components/management/activity-log";
import { Calendar } from "@/components/management/calendar";
import { ClientReports } from "@/components/management/client-reports";
import { CalendarDays, ListTodo, FileText } from "lucide-react";

export default function ManagementPage() {
  const [activeTab, setActiveTab] = useState("activity-log");

  return (
    <div className="container p-6 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión y Seguimiento</h1>
      
      <Tabs 
        defaultValue="activity-log" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 w-full md:w-[600px]">
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
            <span className="hidden sm:inline">Informes para Clientes</span>
            <span className="sm:hidden">Informes</span>
          </TabsTrigger>
        </TabsList>
        
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