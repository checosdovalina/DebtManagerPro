import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertClientSchema, PERSON_TYPE, CLIENT_STATUS, type Client } from "@shared/schema";

// Extended schema with validations
const clientFormSchema = insertClientSchema
  .extend({
    // Add additional validation rules as needed
    email: z.string().email("Email inválido").optional().nullable(),
    rfc: z.string().min(10, "RFC debe tener al menos 10 caracteres").max(13, "RFC no puede exceder 13 caracteres"),
  });

type ClientFormSchema = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  initialData?: Partial<Client>;
  onSuccess?: (client: Client) => void;
  usersList?: { id: number; fullName: string }[];
}

export const ClientForm: React.FC<ClientFormProps> = ({ 
  initialData,
  onSuccess,
  usersList = []
}) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(initialData?.id);

  const form = useForm<ClientFormSchema>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      rfc: initialData?.rfc || "",
      curp: initialData?.curp || "",
      personType: initialData?.personType || PERSON_TYPE.COMPANY,
      street: initialData?.street || "",
      number: initialData?.number || "",
      colony: initialData?.colony || "",
      zipCode: initialData?.zipCode || "",
      state: initialData?.state || "",
      city: initialData?.city || "",
      phone: initialData?.phone || "",
      email: initialData?.email || "",
      legalRepresentative: initialData?.legalRepresentative || "",
      businessType: initialData?.businessType || "",
      executiveId: initialData?.executiveId || undefined,
      status: initialData?.status || CLIENT_STATUS.ACTIVE,
      notes: initialData?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormSchema) => {
      const response = await apiRequest("POST", "/api/clients", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cliente creado",
        description: "El cliente ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate("/clients");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ClientFormSchema) => {
      const response = await apiRequest(
        "PUT", 
        `/api/clients/${initialData?.id}`, 
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Cliente actualizado",
        description: "El cliente ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${initialData?.id}`] });
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate("/clients");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar el cliente: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ClientFormSchema) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre / Razón Social</FormLabel>
                      <FormControl>
                        <Input placeholder="Ingrese el nombre o razón social" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rfc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. XAXX010101000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="curp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CURP (si aplica)</FormLabel>
                      <FormControl>
                        <Input placeholder="Opcional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Persona</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione tipo de persona" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={PERSON_TYPE.COMPANY}>Moral</SelectItem>
                          <SelectItem value={PERSON_TYPE.INDIVIDUAL}>Física</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giro Empresarial</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Servicios, Comercio, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="legalRepresentative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Representante Legal</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del representante legal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Información de contacto */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calle</FormLabel>
                        <FormControl>
                          <Input placeholder="Calle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input placeholder="Número ext/int" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="colony"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colonia</FormLabel>
                      <FormControl>
                        <Input placeholder="Colonia" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal</FormLabel>
                        <FormControl>
                          <Input placeholder="CP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Estado" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad/Municipio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ciudad o municipio" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="correo@ejemplo.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="executiveId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ejecutivo Comercial</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un ejecutivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usersList.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={CLIENT_STATUS.ACTIVE}>Activo</SelectItem>
                        <SelectItem value={CLIENT_STATUS.INACTIVE}>Inactivo</SelectItem>
                        <SelectItem value={CLIENT_STATUS.PENDING}>Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas/Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Información adicional sobre el cliente"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => navigate("/clients")}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 
                "Guardando..." : 
                isEditing ? "Actualizar Cliente" : "Crear Cliente"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
