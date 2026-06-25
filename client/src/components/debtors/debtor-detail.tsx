import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter as DialogFooterUI,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/avatar";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { DebtDetail } from "./debt-detail";
import { ActivityLog } from "./activity-log";
import { Debtor, Client, Debt, ActivityLog as ActivityLogType } from "@shared/schema";
import { Printer, PencilLine, CreditCard, MessageSquare, Gavel, CalendarDays, FileText, Clock } from "lucide-react";
import { InteractionTimeline } from "./interaction-timeline";
import { PaymentPromises } from "./payment-promises";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// ── Form schemas ──────────────────────────────────────────────────────────────
const visitSchema = z.object({
  date: z.string().nonempty("Fecha requerida"),
  time: z.string().nonempty("Hora requerida"),
  address: z.string().nonempty("Dirección requerida"),
  result: z.string().default("programada"),
  personContacted: z.string().optional(),
  notes: z.string().optional(),
});

const litigationSchema = z.object({
  startDate: z.string().nonempty("Fecha requerida"),
  processType: z.string().nonempty("Tipo de proceso requerido"),
  caseNumber: z.string().optional(),
  court: z.string().optional(),
  status: z.string().default("active"),
});

const reportSchema = z.object({
  reportDate: z.string().nonempty("Fecha requerida"),
  periodStart: z.string().nonempty("Inicio de período requerido"),
  periodEnd: z.string().nonempty("Fin de período requerido"),
  summary: z.string().min(10, "El resumen debe tener al menos 10 caracteres"),
  recommendations: z.string().optional(),
  status: z.string().default("draft"),
});

type VisitForm = z.infer<typeof visitSchema>;
type LitigationForm = z.infer<typeof litigationSchema>;
type ReportForm = z.infer<typeof reportSchema>;

interface DebtorDetailProps {
  debtorId: number;
  initialTab?: string;
}

export const DebtorDetail: React.FC<DebtorDetailProps> = ({ 
  debtorId, 
  initialTab = "datos-generales" 
}) => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState(initialTab);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog open states
  const [visitOpen, setVisitOpen] = useState(false);
  const [litigationOpen, setLitigationOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // Forms
  const visitForm = useForm<VisitForm>({
    resolver: zodResolver(visitSchema),
    defaultValues: { date: "", time: "", address: "", result: "programada", personContacted: "", notes: "" },
  });
  const litigationForm = useForm<LitigationForm>({
    resolver: zodResolver(litigationSchema),
    defaultValues: { startDate: "", processType: "", caseNumber: "", court: "", status: "active" },
  });
  const reportForm = useForm<ReportForm>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reportDate: "", periodStart: "", periodEnd: "", summary: "", recommendations: "", status: "draft" },
  });

  // Mutations
  const createVisitMutation = useMutation({
    mutationFn: (data: VisitForm) => apiRequest("POST", `/api/debtors/${debtorId}/visits`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}/visits`] });
      toast({ title: "Visita programada", description: "La visita fue registrada correctamente." });
      setVisitOpen(false);
      visitForm.reset();
    },
    onError: () => toast({ title: "Error", description: "No se pudo programar la visita.", variant: "destructive" }),
  });

  const createLitigationMutation = useMutation({
    mutationFn: (data: LitigationForm) => apiRequest("POST", `/api/debtors/${debtorId}/litigation`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}/litigation`] });
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}`] });
      toast({ title: "Proceso iniciado", description: "El proceso judicial fue registrado." });
      setLitigationOpen(false);
      litigationForm.reset();
    },
    onError: () => toast({ title: "Error", description: "No se pudo iniciar el proceso.", variant: "destructive" }),
  });

  const createReportMutation = useMutation({
    mutationFn: (data: ReportForm) => apiRequest("POST", `/api/debtors/${debtorId}/reports`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}/reports`] });
      toast({ title: "Reporte generado", description: "El reporte fue creado correctamente." });
      setReportOpen(false);
      reportForm.reset();
    },
    onError: () => toast({ title: "Error", description: "No se pudo generar el reporte.", variant: "destructive" }),
  });

  const { data: debtor, isLoading: isDebtorLoading } = useQuery<Debtor>({
    queryKey: [`/api/debtors/${debtorId}`],
  });

  const { data: client, isLoading: isClientLoading } = useQuery<Client>({
    queryKey: [`/api/clients/${debtor?.clientId}`],
    enabled: !!debtor?.clientId,
  });

  const { data: debts = [], isLoading: isDebtsLoading } = useQuery<Debt[]>({
    queryKey: [`/api/debtors/${debtorId}/debts`],
    enabled: !!debtorId,
  });

  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery<ActivityLogType[]>({
    queryKey: [`/api/debtors/${debtorId}/activity`],
    enabled: !!debtorId,
  });

  const { data: visits = [], isLoading: isVisitsLoading } = useQuery<any[]>({
    queryKey: [`/api/debtors/${debtorId}/visits`],
    enabled: !!debtorId,
  });

  const { data: reports = [], isLoading: isReportsLoading } = useQuery<any[]>({
    queryKey: [`/api/debtors/${debtorId}/reports`],
    enabled: !!debtorId,
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Nuevo
          </Badge>
        );
      case "in_management":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            En gestión
          </Badge>
        );
      case "promising":
        return (
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-200">
            Promesa
          </Badge>
        );
      case "paid":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Pagado
          </Badge>
        );
      case "in_litigation":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Judicializado
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isDebtorLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="ml-4 space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <Skeleton className="h-8 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!debtor) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900">Deudor no encontrado</h3>
            <p className="mt-2 text-sm text-gray-500">
              No se pudo encontrar la información del deudor solicitado.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/debtors")}
            >
              Volver a la lista de deudores
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate debt totals
  const totalOriginalDebt = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const totalCurrentDebt = debts.reduce((sum, debt) => sum + debt.currentAmount, 0);

  return (
    <div className="space-y-6">
      <Breadcrumb 
        items={[
          { label: "Inicio", href: "/" },
          { label: "Deudores", href: "/debtors" },
          { label: debtor.name, href: `/debtors/${debtorId}`, active: true },
        ]} 
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row">
            <div className="flex items-center">
              <Avatar name={debtor.name} personType={debtor.personType} size="lg" />
              <div className="ml-4">
                <div className="flex items-center">
                  <CardTitle className="text-xl mr-3">{debtor.name}</CardTitle>
                  {renderStatusBadge(debtor.status)}
                </div>
                <div className="flex items-center mt-1">
                  <p className="text-sm text-gray-500 mr-4">
                    Cliente: {client?.name || "Cargando..."}
                  </p>
                  {debtor.rfc && (
                    <p className="text-sm text-gray-500">
                      RFC: {debtor.rfc}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir ficha
              </Button>
              <Button size="sm" onClick={() => navigate(`/debtors/${debtorId}/edit`)}>
                <PencilLine className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </CardHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-200">
            <div className="px-6">
              <TabsList className="h-10 w-full justify-start rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="datos-generales"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Datos Generales
                </TabsTrigger>
                <TabsTrigger
                  value="debt"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Adeudo
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Bitácora
                </TabsTrigger>
                <TabsTrigger
                  value="reports"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Reporte al Cliente
                </TabsTrigger>
                <TabsTrigger
                  value="visits"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Visitas
                </TabsTrigger>
                <TabsTrigger
                  value="litigation"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Judicialización
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Documentos
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  <Clock className="h-4 w-4 mr-1.5" />
                  Historial
                </TabsTrigger>
                <TabsTrigger
                  value="promises"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Promesas
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <TabsContent value="datos-generales" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Nombre / Razón social</h3>
                  <p className="mt-1 text-sm text-gray-900">{debtor.name}</p>
                </div>
                
                {debtor.rfc && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">RFC</h3>
                    <p className="mt-1 text-sm text-gray-900">{debtor.rfc}</p>
                  </div>
                )}
                
                {debtor.curp && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">CURP</h3>
                    <p className="mt-1 text-sm text-gray-900">{debtor.curp}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Tipo de persona</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {debtor.personType === "company" ? "Moral" : "Física"}
                  </p>
                </div>
                
                {debtor.contactName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Nombre del contacto</h3>
                    <p className="mt-1 text-sm text-gray-900">{debtor.contactName}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Cliente asociado</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {client?.name || "No disponible"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Dirección</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {[
                      debtor.street ? `${debtor.street} ${debtor.number || ""}` : null,
                      debtor.colony,
                      debtor.city ? `${debtor.city}, ${debtor.state || ""}` : debtor.state,
                      debtor.zipCode ? `CP ${debtor.zipCode}` : null
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Teléfono</h3>
                  <p className="mt-1 text-sm text-gray-900">{debtor.phone || "No especificado"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Correo electrónico</h3>
                  <p className="mt-1 text-sm text-gray-900">{debtor.email || "No especificado"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Fecha de registro</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(debtor.createdAt), "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Monto total de deuda</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    ${totalCurrentDebt.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {totalOriginalDebt !== totalCurrentDebt && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Original: ${totalOriginalDebt.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            {debtor.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700">Observaciones</h3>
                <p className="mt-1 text-sm text-gray-900">{debtor.notes}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="debt" className="p-6">
            <DebtDetail debtorId={debtorId} />
          </TabsContent>
          
          <TabsContent value="activity" className="p-6">
            <ActivityLog debtorId={debtorId} activities={activities} isLoading={isActivitiesLoading} />
          </TabsContent>
          
          <TabsContent value="reports" className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium text-gray-900">Reportes al cliente</h3>
                <Button onClick={() => setReportOpen(true)} data-testid="btn-new-report">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar nuevo reporte
                </Button>
              </div>
              {isReportsLoading ? (
                <div className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
              ) : reports.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Sin reportes</h3>
                    <p className="mt-1 text-sm text-gray-500">No hay reportes generados para este deudor.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {reports.map((r: any) => (
                    <Card key={r.id} data-testid={`card-report-${r.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Reporte del {r.reportDate}</span>
                              <Badge variant="outline" className="text-xs capitalize">{r.status === "draft" ? "Borrador" : r.status}</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">Período: {r.periodStart} — {r.periodEnd}</p>
                            <p className="text-sm text-gray-700 line-clamp-2">{r.summary}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="visits" className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium text-gray-900">Visitas registradas</h3>
                <Button onClick={() => setVisitOpen(true)} data-testid="btn-schedule-visit">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Programar visita
                </Button>
              </div>
              {isVisitsLoading ? (
                <div className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
              ) : visits.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CalendarDays className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Sin visitas programadas</h3>
                    <p className="mt-1 text-sm text-gray-500">No hay visitas registradas para este deudor.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {visits.map((v: any) => (
                    <Card key={v.id} data-testid={`card-visit-${v.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarDays className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">{v.date} a las {v.time}</span>
                              <Badge variant="outline" className="text-xs capitalize">{v.result}</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">
                              <span className="font-medium">Dirección:</span> {v.address}
                            </p>
                            {v.personContacted && (
                              <p className="text-xs text-gray-500">
                                <span className="font-medium">Persona contactada:</span> {v.personContacted}
                              </p>
                            )}
                            {v.notes && <p className="text-sm text-gray-700 mt-1">{v.notes}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="litigation" className="p-6">
            {debtor.status === "in_litigation" ? (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800">
                  <div className="flex">
                    <Gavel className="h-5 w-5 mr-2" />
                    <div>
                      <h3 className="font-medium">Caso judicial activo</h3>
                      <p className="text-sm mt-1">
                        Este deudor tiene un proceso judicial en curso. Contacte al departamento legal para más detalles.
                      </p>
                    </div>
                  </div>
                </div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalles del proceso judicial</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-500 text-sm">
                      La información detallada del proceso judicial está pendiente de ser cargada por el departamento legal.
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Gavel className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin procesos judiciales</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este deudor no tiene procesos judiciales activos.
                  </p>
                  <Button className="mt-4" onClick={() => setLitigationOpen(true)} data-testid="btn-start-litigation">
                    <Gavel className="h-4 w-4 mr-2" />
                    Iniciar proceso judicial
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="documents" className="p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin documentos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay documentos asociados a este deudor.
                </p>
                <Button className="mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Subir documento
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="p-6">
            <InteractionTimeline debtorId={debtor.id} />
          </TabsContent>

          <TabsContent value="promises" className="p-6">
            <PaymentPromises debtorId={debtor.id} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* ── Dialog: Programar Visita ────────────────────────────────────── */}
      <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Programar Visita</DialogTitle>
          </DialogHeader>
          <Form {...visitForm}>
            <form onSubmit={visitForm.handleSubmit((d) => createVisitMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={visitForm.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-visit-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={visitForm.control} name="time" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl><Input type="time" {...field} data-testid="input-visit-time" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={visitForm.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl><Input placeholder="Calle, número, colonia, ciudad" {...field} data-testid="input-visit-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={visitForm.control} name="personContacted" render={({ field }) => (
                <FormItem>
                  <FormLabel>Persona a contactar (opcional)</FormLabel>
                  <FormControl><Input placeholder="Nombre de la persona" {...field} data-testid="input-visit-person" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={visitForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Observaciones adicionales" className="min-h-[80px]" {...field} data-testid="input-visit-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooterUI>
                <Button type="button" variant="outline" onClick={() => setVisitOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createVisitMutation.isPending} data-testid="btn-submit-visit">
                  {createVisitMutation.isPending ? "Guardando..." : "Programar visita"}
                </Button>
              </DialogFooterUI>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Iniciar Proceso Judicial ───────────────────────────── */}
      <Dialog open={litigationOpen} onOpenChange={setLitigationOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Iniciar Proceso Judicial</DialogTitle>
          </DialogHeader>
          <Form {...litigationForm}>
            <form onSubmit={litigationForm.handleSubmit((d) => createLitigationMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={litigationForm.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de inicio</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-lit-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={litigationForm.control} name="processType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de proceso</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-lit-type">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="civil">Civil</SelectItem>
                        <SelectItem value="mercantil">Mercantil</SelectItem>
                        <SelectItem value="ejecutivo">Ejecutivo mercantil</SelectItem>
                        <SelectItem value="ordinario">Ordinario</SelectItem>
                        <SelectItem value="otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={litigationForm.control} name="caseNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de expediente (opcional)</FormLabel>
                    <FormControl><Input placeholder="Ej. 123/2024" {...field} data-testid="input-lit-case" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={litigationForm.control} name="court" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Juzgado / Tribunal (opcional)</FormLabel>
                    <FormControl><Input placeholder="Nombre del juzgado" {...field} data-testid="input-lit-court" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooterUI>
                <Button type="button" variant="outline" onClick={() => setLitigationOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createLitigationMutation.isPending} data-testid="btn-submit-litigation">
                  {createLitigationMutation.isPending ? "Registrando..." : "Iniciar proceso"}
                </Button>
              </DialogFooterUI>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: Generar Reporte ─────────────────────────────────────── */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Generar Reporte al Cliente</DialogTitle>
          </DialogHeader>
          <Form {...reportForm}>
            <form onSubmit={reportForm.handleSubmit((d) => createReportMutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <FormField control={reportForm.control} name="reportDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha del reporte</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-report-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={reportForm.control} name="periodStart" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período inicio</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-report-start" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={reportForm.control} name="periodEnd" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período fin</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-report-end" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={reportForm.control} name="summary" render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen de gestiones</FormLabel>
                  <FormControl><Textarea placeholder="Describe las gestiones realizadas en el período..." className="min-h-[100px]" {...field} data-testid="input-report-summary" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={reportForm.control} name="recommendations" render={({ field }) => (
                <FormItem>
                  <FormLabel>Recomendaciones (opcional)</FormLabel>
                  <FormControl><Textarea placeholder="Recomendaciones para el cliente..." className="min-h-[80px]" {...field} data-testid="input-report-recommendations" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooterUI>
                <Button type="button" variant="outline" onClick={() => setReportOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={createReportMutation.isPending} data-testid="btn-submit-report">
                  {createReportMutation.isPending ? "Generando..." : "Generar reporte"}
                </Button>
              </DialogFooterUI>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
