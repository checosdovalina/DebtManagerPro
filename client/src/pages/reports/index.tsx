import React from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  FileText,
  Calendar,
  Search,
  FileDown,
  Printer,
  Clock,
  FileCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function ReportsPage() {
  return (
    <Layout title="Gestión y Seguimiento">
      {/* Page title and actions */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión y Seguimiento</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitorea las actividades y genera reportes para clientes
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex items-center space-x-3">
          <Button variant="outline" className="inline-flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Búsqueda Avanzada
          </Button>
          <Button className="inline-flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Generar Reporte
          </Button>
        </div>
      </div>

      {/* Tabs for different report sections */}
      <Tabs defaultValue="actividades" className="space-y-6">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="actividades" className="data-[state=active]:bg-white">
            <ClipboardList className="h-4 w-4 mr-2" />
            Actividades
          </TabsTrigger>
          <TabsTrigger value="reportes" className="data-[state=active]:bg-white">
            <FileText className="h-4 w-4 mr-2" />
            Reportes a Clientes
          </TabsTrigger>
          <TabsTrigger value="calendario" className="data-[state=active]:bg-white">
            <Calendar className="h-4 w-4 mr-2" />
            Calendario
          </TabsTrigger>
        </TabsList>

        {/* Activities Tab */}
        <TabsContent value="actividades">
          <Card>
            <CardHeader>
              <CardTitle>Actividades Recientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Activity items */}
                <div className="relative pl-6 border-l-2 border-gray-200 pb-6">
                  <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-primary"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Llamada a Transportes Veloz</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Se contactó al responsable para gestionar el pago pendiente. Promete pago parcial para la próxima semana.
                      </p>
                      <div className="flex items-center mt-2">
                        <Badge className="bg-blue-100 text-blue-800">Promesa de pago</Badge>
                        <span className="text-xs text-gray-500 ml-3">15/06/2023 10:30</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Detalles
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="relative pl-6 border-l-2 border-gray-200 pb-6">
                  <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-amber-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Visita a Comercializadora La Huerta</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Visita presencial para entregar documentación. Se programó reunión con el gerente financiero.
                      </p>
                      <div className="flex items-center mt-2">
                        <Badge className="bg-amber-100 text-amber-800">Visita realizada</Badge>
                        <span className="text-xs text-gray-500 ml-3">14/06/2023 15:45</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Detalles
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="relative pl-6 border-l-2 border-gray-200 pb-6">
                  <div className="absolute left-[-8px] top-0 h-4 w-4 rounded-full bg-green-500"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">Pago recibido de Juan Pérez</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Se registró un pago parcial de $5,000.00 MXN correspondiente a la factura F-2023-156.
                      </p>
                      <div className="flex items-center mt-2">
                        <Badge className="bg-green-100 text-green-800">Pago parcial</Badge>
                        <span className="text-xs text-gray-500 ml-3">13/06/2023 09:15</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Detalles
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button variant="outline">Cargar más actividades</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Reports Tab */}
        <TabsContent value="reportes">
          <Card>
            <CardHeader>
              <CardTitle>Reportes a Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <FileCheck className="h-10 w-10 text-primary mr-4" />
                      <div>
                        <h3 className="font-medium text-gray-900">Informe Mensual - GAFI Ferreléctrico</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Reporte de gestiones realizadas para el cliente durante el mes de Junio 2023.
                        </p>
                        <div className="flex items-center mt-2">
                          <Badge className="bg-green-100 text-green-800">Enviado</Badge>
                          <span className="text-xs text-gray-500 ml-3">30/06/2023</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <FileDown className="h-3 w-3 mr-1" />
                        Descargar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="h-3 w-3 mr-1" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <FileCheck className="h-10 w-10 text-primary mr-4" />
                      <div>
                        <h3 className="font-medium text-gray-900">Informe Quincenal - Autos Industriales</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Reporte de la segunda quincena de Junio 2023 con detalle de gestiones y pagos recibidos.
                        </p>
                        <div className="flex items-center mt-2">
                          <Badge className="bg-amber-100 text-amber-800">Pendiente</Badge>
                          <span className="text-xs text-gray-500 ml-3">15/06/2023</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Clock className="h-3 w-3 mr-1" />
                        Programar envío
                      </Button>
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start">
                      <FileCheck className="h-10 w-10 text-primary mr-4" />
                      <div>
                        <h3 className="font-medium text-gray-900">Informe Especial - Distribuidora Méndez</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Reporte detallado de situación legal de deudores morosos con más de 90 días.
                        </p>
                        <div className="flex items-center mt-2">
                          <Badge className="bg-green-100 text-green-800">Enviado</Badge>
                          <span className="text-xs text-gray-500 ml-3">10/06/2023</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <FileDown className="h-3 w-3 mr-1" />
                        Descargar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="h-3 w-3 mr-1" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendario">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Actividades</CardTitle>
            </CardHeader>
            <CardContent className="h-[500px] flex items-center justify-center bg-gray-50 border border-dashed border-gray-300 rounded-md">
              <div className="text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Calendario en desarrollo</h3>
                <p className="mt-1 text-sm text-gray-500">
                  El calendario de actividades estará disponible en la próxima versión.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
