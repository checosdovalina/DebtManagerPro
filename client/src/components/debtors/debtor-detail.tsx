import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/common/avatar";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { DebtDetail } from "./debt-detail";
import { ActivityLog } from "./activity-log";
import { Debtor, Client, Debt, ActivityLog as ActivityLogType } from "@shared/schema";
import { Printer, PencilLine, CreditCard, MessageSquare, Gavel, CalendarDays, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

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
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin reportes</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay reportes generados para este deudor.
                </p>
                <Button className="mt-4">
                  <FileText className="h-4 w-4 mr-2" />
                  Generar nuevo reporte
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="visits" className="p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <CalendarDays className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin visitas programadas</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay visitas registradas para este deudor.
                </p>
                <Button className="mt-4">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Programar visita
                </Button>
              </CardContent>
            </Card>
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
                  <Button className="mt-4">
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
        </Tabs>
      </Card>
    </div>
  );
};
