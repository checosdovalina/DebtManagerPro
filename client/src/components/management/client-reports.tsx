import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  FileText, 
  MessageSquare, 
  Clock, 
  Calendar, 
  Filter, 
  CheckCircle, 
  AlertCircle, 
  MoreHorizontal 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientReport {
  id: number;
  title: string;
  client: {
    id: number;
    name: string;
  };
  status: "pending" | "delivered" | "reviewed";
  reportType: string;
  period: {
    start: string;
    end: string;
  };
  createdAt: string;
  comments?: string;
}

export function ClientReports() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Mock data
  const reports: ClientReport[] = [
    {
      id: 1,
      title: "Informe Mensual Mayo 2023",
      client: {
        id: 1,
        name: "Transportes Veloz"
      },
      status: "delivered",
      reportType: "Mensual",
      period: {
        start: "2023-05-01",
        end: "2023-05-31"
      },
      createdAt: "2023-06-02",
      comments: "Enviado al departamento de finanzas"
    },
    {
      id: 2,
      title: "Análisis de Deudores Comercializadora La Huerta",
      client: {
        id: 2,
        name: "Comercializadora La Huerta"
      },
      status: "pending",
      reportType: "Analítico",
      period: {
        start: "2023-01-01",
        end: "2023-06-15"
      },
      createdAt: "2023-06-15"
    },
    {
      id: 3,
      title: "Reporte de Pagos Q2 2023",
      client: {
        id: 3,
        name: "Distribuidora Del Valle"
      },
      status: "reviewed",
      reportType: "Trimestral",
      period: {
        start: "2023-04-01",
        end: "2023-06-30"
      },
      createdAt: "2023-07-03",
      comments: "Aprobado por el cliente"
    }
  ];

  // Filtra reportes basados en búsqueda y filtro de estado
  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         report.client.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM, yyyy", { locale: es });
  };

  // Función para obtener color de estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "delivered":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "reviewed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Función para obtener icono de estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "delivered":
        return <FileText className="h-4 w-4" />;
      case "reviewed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Función para obtener texto de estado en español
  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "delivered":
        return "Entregado";
      case "reviewed":
        return "Revisado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar reportes..."
            className="pl-10 w-full sm:w-80"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <span>Estado</span>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="delivered">Entregados</SelectItem>
              <SelectItem value="reviewed">Revisados</SelectItem>
            </SelectContent>
          </Select>
          
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            <span>Nuevo Reporte</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredReports.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            <AlertCircle className="mx-auto h-12 w-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium">No se encontraron reportes</h3>
            <p className="mt-1">Intenta con otra búsqueda o cambia los filtros.</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <Card key={report.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        <span>Descargar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="h-4 w-4 mr-2" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span>Comentar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardDescription>
                  Cliente: {report.client.name}
                </CardDescription>
                <div className="mt-2">
                  <Badge 
                    variant="outline" 
                    className={`flex items-center gap-1 ${getStatusColor(report.status)}`}
                  >
                    {getStatusIcon(report.status)}
                    <span>{getStatusText(report.status)}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Tipo</Label>
                    <p className="font-medium">{report.reportType}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Fecha</Label>
                    <p className="font-medium">{formatDate(report.createdAt)}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Periodo</Label>
                    <p className="font-medium">
                      {formatDate(report.period.start)} - {formatDate(report.period.end)}
                    </p>
                  </div>
                  {report.comments && (
                    <div className="col-span-2 mt-2">
                      <Label className="text-xs text-gray-500">Comentarios</Label>
                      <p className="text-sm text-gray-700">{report.comments}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button variant="outline" size="sm" className="w-full">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Ver Detalles</span>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}