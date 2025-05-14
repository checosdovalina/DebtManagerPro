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
import { Client, ClientContact } from "@shared/schema";
import { Printer, PencilLine, Users, FileText, Clock, PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DebtorList } from "@/components/debtors/debtor-list";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClientDetailProps {
  clientId: number;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({ clientId }) => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("datos-generales");

  const { data: client, isLoading: isClientLoading } = useQuery<Client>({
    queryKey: [`/api/clients/${clientId}`],
  });

  const { data: contacts = [], isLoading: isContactsLoading } = useQuery<ClientContact[]>({
    queryKey: [`/api/clients/${clientId}/contacts`],
  });

  if (isClientLoading) {
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

  if (!client) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-medium text-gray-900">Cliente no encontrado</h3>
            <p className="mt-2 text-sm text-gray-500">
              No se pudo encontrar la información del cliente solicitado.
            </p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/clients")}
            >
              Volver a la lista de clientes
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumb 
        items={[
          { label: "Inicio", href: "/" },
          { label: "Clientes", href: "/clients" },
          { label: client.name, href: `/clients/${clientId}`, active: true },
        ]} 
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row">
            <div className="flex items-center">
              <Avatar name={client.name} personType={client.personType} size="lg" />
              <div className="ml-4">
                <CardTitle className="text-xl">{client.name}</CardTitle>
                <p className="text-sm text-gray-500">
                  Cliente desde: {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: es })} | RFC: {client.rfc}
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <Button variant="outline" size="sm">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir ficha
              </Button>
              <Button size="sm" onClick={() => navigate(`/clients/${clientId}/edit`)}>
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
                  value="contactos"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Contactos
                </TabsTrigger>
                <TabsTrigger
                  value="deudores"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Deudores
                </TabsTrigger>
                <TabsTrigger
                  value="documentos"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Documentos
                </TabsTrigger>
                <TabsTrigger
                  value="historial"
                  className="rounded-none border-b-2 border-transparent px-4 py-3 hover:text-primary data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none"
                >
                  Historial
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          
          <TabsContent value="datos-generales" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Razón social</h3>
                  <p className="mt-1 text-sm text-gray-900">{client.name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">RFC</h3>
                  <p className="mt-1 text-sm text-gray-900">{client.rfc}</p>
                </div>
                
                {client.curp && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">CURP</h3>
                    <p className="mt-1 text-sm text-gray-900">{client.curp}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Tipo de persona</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {client.personType === "company" ? "Moral" : "Física"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Giro empresarial</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {client.businessType || "No especificado"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Dirección</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {[
                      client.street ? `${client.street} ${client.number || ""}` : null,
                      client.colony,
                      client.city ? `${client.city}, ${client.state || ""}` : client.state,
                      client.zipCode ? `CP ${client.zipCode}` : null
                    ].filter(Boolean).join(", ")}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Teléfono</h3>
                  <p className="mt-1 text-sm text-gray-900">{client.phone || "No especificado"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Correo electrónico</h3>
                  <p className="mt-1 text-sm text-gray-900">{client.email || "No especificado"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Representante legal</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {client.legalRepresentative || "No especificado"}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Estado</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {client.status === "active" ? "Activo" : 
                     client.status === "inactive" ? "Inactivo" : "Pendiente"}
                  </p>
                </div>
              </div>
            </div>
            
            {client.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700">Observaciones</h3>
                <p className="mt-1 text-sm text-gray-900">{client.notes}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="contactos" className="p-6">
            <div className="flex justify-end mb-4">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Agregar contacto
              </Button>
            </div>
            
            {isContactsLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="ml-4 space-y-2">
                          <Skeleton className="h-4 w-36" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Sin contactos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Este cliente no tiene contactos registrados.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <Avatar 
                            name={contact.name} 
                            personType="individual" 
                          />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {contact.name}
                              {contact.isPrimary && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                                  Principal
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-500">{contact.position || "Cargo no especificado"}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <PencilLine className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {contact.email && (
                          <div>
                            <span className="text-gray-500">Email:</span>{" "}
                            <span className="text-gray-900">{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div>
                            <span className="text-gray-500">Teléfono:</span>{" "}
                            <span className="text-gray-900">{contact.phone}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="deudores" className="p-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => navigate(`/debtors/new?clientId=${clientId}`)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Agregar deudor
              </Button>
            </div>
            <DebtorList clientId={clientId} />
          </TabsContent>
          
          <TabsContent value="documentos" className="p-6">
            <div className="flex justify-end mb-4">
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Subir documento
              </Button>
            </div>
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Sin documentos</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No hay documentos asociados a este cliente.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="historial" className="p-6">
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Historial no disponible</h3>
                <p className="mt-1 text-sm text-gray-500">
                  El historial de actividades para este cliente no está disponible.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};
