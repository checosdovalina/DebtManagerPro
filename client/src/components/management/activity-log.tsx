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
import { Label } from "@/components/ui/label";
import {
  PhoneCall,
  UserRound,
  Home,
  Clock,
  ArrowUpRight,
  Filter,
  BookOpen,
  FileText,
  Calendar,
  Search,
  RefreshCw,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

export function ActivityLog() {
  const [filters, setFilters] = useState({
    page: 1,
    perPage: 10,
    type: "",
    entityType: "",
    dateFrom: "",
    dateTo: "",
    userId: "",
  });
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Fetch activity logs with filters
  const {
    data: activityData = { logs: [], total: 0 },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/activities/logs", filters],
    keepPreviousData: true,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  const totalPages = Math.ceil(activityData.total / filters.perPage);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      perPage: 10,
      type: "",
      entityType: "",
      dateFrom: "",
      dateTo: "",
      userId: "",
    });
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewActivity = (activity: any) => {
    setSelectedActivity(activity);
  };

  const handleCloseActivityDialog = () => {
    setSelectedActivity(null);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "phone_call":
        return <PhoneCall className="h-4 w-4" />;
      case "visit":
        return <Home className="h-4 w-4" />;
      case "payment":
        return <ArrowUpRight className="h-4 w-4" />;
      case "document":
        return <FileText className="h-4 w-4" />;
      case "status_change":
        return <RefreshCw className="h-4 w-4" />;
      case "note":
        return <BookOpen className="h-4 w-4" />;
      case "event":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityBadge = (type: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    
    switch (type) {
      case "phone_call":
        return <Badge variant="outline" className={`${baseClass} border-green-500 bg-green-100 text-green-700`}>Llamada</Badge>;
      case "visit":
        return <Badge variant="outline" className={`${baseClass} border-blue-500 bg-blue-100 text-blue-700`}>Visita</Badge>;
      case "payment":
        return <Badge variant="outline" className={`${baseClass} border-emerald-500 bg-emerald-100 text-emerald-700`}>Pago</Badge>;
      case "document":
        return <Badge variant="outline" className={`${baseClass} border-amber-500 bg-amber-100 text-amber-700`}>Documento</Badge>;
      case "status_change":
        return <Badge variant="outline" className={`${baseClass} border-purple-500 bg-purple-100 text-purple-700`}>Cambio de Estado</Badge>;
      case "note":
        return <Badge variant="outline" className={`${baseClass} border-slate-500 bg-slate-100 text-slate-700`}>Nota</Badge>;
      case "event":
        return <Badge variant="outline" className={`${baseClass} border-indigo-500 bg-indigo-100 text-indigo-700`}>Evento</Badge>;
      default:
        return <Badge variant="outline" className={`${baseClass} border-gray-500 bg-gray-100 text-gray-700`}>{type}</Badge>;
    }
  };

  const getEntityBadge = (entityType: string) => {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
    
    switch (entityType) {
      case "client":
        return <Badge variant="outline" className={`${baseClass} border-blue-500 bg-blue-100 text-blue-700`}>Cliente</Badge>;
      case "debtor":
        return <Badge variant="outline" className={`${baseClass} border-red-500 bg-red-100 text-red-700`}>Deudor</Badge>;
      case "debt":
        return <Badge variant="outline" className={`${baseClass} border-amber-500 bg-amber-100 text-amber-700`}>Deuda</Badge>;
      case "legal":
        return <Badge variant="outline" className={`${baseClass} border-purple-500 bg-purple-100 text-purple-700`}>Proceso Legal</Badge>;
      case "payment":
        return <Badge variant="outline" className={`${baseClass} border-green-500 bg-green-100 text-green-700`}>Pago</Badge>;
      case "system":
        return <Badge variant="outline" className={`${baseClass} border-slate-500 bg-slate-100 text-slate-700`}>Sistema</Badge>;
      default:
        return <Badge variant="outline" className={`${baseClass} border-gray-500 bg-gray-100 text-gray-700`}>{entityType}</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl flex justify-between">
          <span>Registro de Actividades</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          <div>
            <Label htmlFor="type-filter">Tipo de Actividad</Label>
            <Select
              value={filters.type}
              onValueChange={(value) => handleFilterChange("type", value)}
            >
              <SelectTrigger id="type-filter">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="phone_call">Llamada</SelectItem>
                <SelectItem value="visit">Visita</SelectItem>
                <SelectItem value="payment">Pago</SelectItem>
                <SelectItem value="document">Documento</SelectItem>
                <SelectItem value="status_change">Cambio de Estado</SelectItem>
                <SelectItem value="note">Nota</SelectItem>
                <SelectItem value="event">Evento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="entity-filter">Entidad</Label>
            <Select
              value={filters.entityType}
              onValueChange={(value) => handleFilterChange("entityType", value)}
            >
              <SelectTrigger id="entity-filter">
                <SelectValue placeholder="Todas las entidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las entidades</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="debtor">Deudor</SelectItem>
                <SelectItem value="debt">Deuda</SelectItem>
                <SelectItem value="legal">Proceso Legal</SelectItem>
                <SelectItem value="payment">Pago</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="user-filter">Usuario</Label>
            <Select
              value={filters.userId}
              onValueChange={(value) => handleFilterChange("userId", value)}
            >
              <SelectTrigger id="user-filter">
                <SelectValue placeholder="Todos los usuarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="date-from">Desde</Label>
            <Input
              type="date"
              id="date-from"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="date-to">Hasta</Label>
            <Input
              type="date"
              id="date-to"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
          
          <div className="flex items-end gap-2">
            <Button 
              variant="secondary" 
              onClick={resetFilters} 
              className="flex-1"
            >
              Limpiar Filtros
            </Button>
            <Button variant="default" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : activityData.logs.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            No hay actividades para mostrar con los filtros seleccionados.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityData.logs.map((activity: any) => (
                  <TableRow key={activity.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {format(parseISO(activity.createdAt), "dd/MM/yyyy")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(activity.createdAt), "HH:mm")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActivityBadge(activity.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEntityBadge(activity.entityType)}
                      <div className="text-xs mt-1">
                        ID: {activity.entityId}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={activity.description}>
                        {activity.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-muted-foreground" />
                        <span>{activity.user.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewActivity(activity)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  page={filters.page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Activity details dialog */}
      {selectedActivity && (
        <Dialog open={!!selectedActivity} onOpenChange={handleCloseActivityDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalles de la Actividad</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Tipo:</Label>
                <div className="col-span-3 flex items-center gap-2">
                  {getActivityIcon(selectedActivity.type)}
                  {getActivityBadge(selectedActivity.type)}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Fecha y Hora:</Label>
                <div className="col-span-3">
                  {format(parseISO(selectedActivity.createdAt), "dd/MM/yyyy HH:mm")}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Entidad:</Label>
                <div className="col-span-3 flex items-center gap-2">
                  {getEntityBadge(selectedActivity.entityType)}
                  <span>ID: {selectedActivity.entityId}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Usuario:</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedActivity.user.fullName}</span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right">Descripción:</Label>
                <div className="col-span-3">
                  {selectedActivity.description}
                </div>
              </div>
              {selectedActivity.additionalData && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right">Datos Adicionales:</Label>
                  <div className="col-span-3 whitespace-pre-line">
                    <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                      {JSON.stringify(selectedActivity.additionalData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleCloseActivityDialog} variant="secondary">
                Cerrar
              </Button>
              <Button
                onClick={() => {
                  // Navigate to related entity
                  const path = 
                    selectedActivity.entityType === "client"
                      ? `/clients/${selectedActivity.entityId}`
                      : selectedActivity.entityType === "debtor"
                      ? `/debtors/${selectedActivity.entityId}`
                      : selectedActivity.entityType === "debt"
                      ? `/debts/${selectedActivity.entityId}`
                      : selectedActivity.entityType === "legal"
                      ? `/legal/${selectedActivity.entityId}`
                      : selectedActivity.entityType === "payment"
                      ? `/payments/${selectedActivity.entityId}`
                      : "/";
                  window.location.href = path;
                }}
                variant="default"
              >
                Ver Entidad Relacionada
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}