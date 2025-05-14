import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  FileText, Download, Eye, Search, Filter, Plus 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface ReportFilters {
  clientId?: number;
  status?: string;
}

export function ClientReports() {
  const [filters, setFilters] = useState<ReportFilters>({});
  const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch reports with filters
  const { 
    data: reports = [], 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ["/api/reports/client", filters],
    keepPreviousData: true,
  });
  
  // Fetch clients for filter dropdown
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const handleOpenReport = (report: ClientReport) => {
    setSelectedReport(report);
  };

  const handleCloseReportDialog = () => {
    setSelectedReport(null);
  };

  const handleCreateReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      await apiRequest("POST", "/api/reports/client", {
        clientId: parseInt(formData.get("clientId") as string),
        summary: formData.get("summary"),
        status: "pending",
        reportDate: new Date().toISOString(),
        periodStart: formData.get("periodStart"),
        periodEnd: formData.get("periodEnd"),
        reportType: formData.get("reportType"),
        comments: formData.get("comments") || null,
        createdById: 1, // This should be the current user's ID
      });
      
      toast({
        title: "Informe creado",
        description: "El informe ha sido creado exitosamente",
      });
      
      setIsCreateDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error al crear el informe",
        variant: "destructive",
      });
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "delivered":
        return "text-blue-600 bg-blue-100";
      case "reviewed":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl flex justify-between">
          <span>Informes para Clientes</span>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Informe
          </Button>
        </CardTitle>
        <div className="flex items-end gap-4 mt-4 flex-wrap">
          <div className="w-[250px]">
            <Label htmlFor="client-filter">Filtrar por Cliente</Label>
            <Select
              value={filters.clientId?.toString() || ""}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  clientId: val ? parseInt(val) : undefined,
                }))
              }
            >
              <SelectTrigger id="client-filter">
                <SelectValue placeholder="Todos los clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-[200px]">
            <Label htmlFor="status-filter">Estado</Label>
            <Select
              value={filters.status || ""}
              onValueChange={(val) =>
                setFilters((prev) => ({
                  ...prev,
                  status: val || undefined,
                }))
              }
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="reviewed">Revisado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="secondary" size="icon" className="ml-2">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No hay informes para mostrar con los filtros seleccionados.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/50">
                  <TableCell>{report.client.name}</TableCell>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>
                    {format(parseISO(report.period.start), "dd/MM/yyyy")} - {format(parseISO(report.period.end), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {getStatusText(report.status)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(parseISO(report.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenReport(report)}
                      title="Ver detalles"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Descargar informe"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* View report dialog */}
      <Dialog open={!!selectedReport} onOpenChange={handleCloseReportDialog}>
        {selectedReport && (
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalles del Informe</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Cliente:</Label>
                <div className="col-span-3">{selectedReport.client.name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Título:</Label>
                <div className="col-span-3">{selectedReport.title}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Período:</Label>
                <div className="col-span-3">
                  {format(parseISO(selectedReport.period.start), "dd/MM/yyyy")} - {format(parseISO(selectedReport.period.end), "dd/MM/yyyy")}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Estado:</Label>
                <div className="col-span-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                      selectedReport.status
                    )}`}
                  >
                    {getStatusText(selectedReport.status)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Fecha de Creación:</Label>
                <div className="col-span-3">
                  {format(parseISO(selectedReport.createdAt), "dd/MM/yyyy")}
                </div>
              </div>
              {selectedReport.comments && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">Comentarios:</Label>
                  <div className="col-span-3 whitespace-pre-line">
                    {selectedReport.comments}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="flex justify-between">
              <Button
                onClick={handleCloseReportDialog}
                variant="secondary"
              >
                Cerrar
              </Button>
              <Button
                variant="default"
                className="flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar Informe
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Create report dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Informe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReport}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="clientId" className="text-right">
                  Cliente:
                </Label>
                <div className="col-span-3">
                  <Select name="clientId" required>
                    <SelectTrigger id="clientId">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="summary" className="text-right">
                  Título:
                </Label>
                <div className="col-span-3">
                  <Input
                    id="summary"
                    name="summary"
                    placeholder="Título del informe"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reportType" className="text-right">
                  Tipo:
                </Label>
                <div className="col-span-3">
                  <Select name="reportType" required>
                    <SelectTrigger id="reportType">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="periodStart" className="text-right">
                  Período Desde:
                </Label>
                <div className="col-span-3">
                  <Input
                    type="date"
                    id="periodStart"
                    name="periodStart"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="periodEnd" className="text-right">
                  Período Hasta:
                </Label>
                <div className="col-span-3">
                  <Input type="date" id="periodEnd" name="periodEnd" required />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="comments" className="text-right">
                  Comentarios:
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="comments"
                    name="comments"
                    placeholder="Comentarios o notas sobre el informe"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setIsCreateDialogOpen(false)} variant="secondary">
                Cancelar
              </Button>
              <Button type="submit">Crear Informe</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}