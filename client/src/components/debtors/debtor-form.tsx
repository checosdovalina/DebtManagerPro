import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import { 
  insertDebtorSchema, 
  PERSON_TYPE, 
  DEBTOR_STATUS, 
  type Debtor,
  type Client,
  type User
} from "@shared/schema";

// Extended schema with validations
const debtorFormSchema = insertDebtorSchema
  .extend({
    email: z.string().email("Email inválido").optional().nullable(),
  });

type DebtorFormSchema = z.infer<typeof debtorFormSchema>;

interface DebtorFormProps {
  initialData?: Partial<Debtor>;
  onSuccess?: (debtor: Debtor) => void;
  preselectedClientId?: number;
}

export const DebtorForm: React.FC<DebtorFormProps> = ({ 
  initialData,
  onSuccess,
  preselectedClientId
}) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = Boolean(initialData?.id);

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch users (collectors/managers) for dropdown
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get collectors and managers (roles)
  const collectors = users.filter(
    (user) => user.role === "collector" || user.role === "manager"
  );
  
  const form = useForm<DebtorFormSchema>({
    resolver: zodResolver(debtorFormSchema),
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
      contactName: initialData?.contactName || "",
      clientId: initialData?.clientId || preselectedClientId || undefined,
      assignedUserId: initialData?.assignedUserId || undefined,
      status: initialData?.status || DEBTOR_STATUS.NEW,
      notes: initialData?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: DebtorFormSchema) => {
      const response = await apiRequest("POST", "/api/debtors", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deudor creado",
        description: "El deudor ha sido creado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/debtors"] });
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate(`/debtors/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al crear el deudor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: DebtorFormSchema) => {
      const response = await apiRequest(
        "PUT", 
        `/api/debtors/${initialData?.id}`, 
        data
      );
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Deudor actualizado",
        description: "El deudor ha sido actualizado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/debtors"] });
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${initialData?.id}`] });
      if (onSuccess) {
        onSuccess(data);
      } else {
        navigate(`/debtors/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al actualizar el deudor: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DebtorFormSchema) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "Editar Deudor" : "Nuevo Deudor"}</CardTitle>
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
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Contacto</FormLabel>
                      <FormControl>
                        <Input placeholder="Contacto principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                        disabled={preselectedClientId !== undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id.toString()}>
                              {client.name}
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
                  name="assignedUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gestor Asignado</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione un gestor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {collectors.map((user) => (
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
                          <SelectItem value={DEBTOR_STATUS.NEW}>Nuevo</SelectItem>
                          <SelectItem value={DEBTOR_STATUS.IN_MANAGEMENT}>En gestión</SelectItem>
                          <SelectItem value={DEBTOR_STATUS.PROMISING}>Promesa</SelectItem>
                          <SelectItem value={DEBTOR_STATUS.PAID}>Pagado</SelectItem>
                          <SelectItem value={DEBTOR_STATUS.IN_LITIGATION}>Judicializado</SelectItem>
                          <SelectItem value={DEBTOR_STATUS.CANCELED}>Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas/Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Información adicional sobre el deudor"
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
              onClick={() => navigate("/debtors")}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? 
                "Guardando..." : 
                isEditing ? "Actualizar Deudor" : "Crear Deudor"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
