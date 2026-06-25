import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  CONTACT_TYPE,
  CONTACT_RESULT,
  type ActivityLog as ActivityLogType,
  type InsertActivityLog,
} from "@shared/schema";
import { PlusCircle, Phone, MessageSquare, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { MessageTemplatesModal } from "./message-templates-modal";
import { CallScriptModal } from "./call-script-modal";

// Form schema for activity log
const activityLogSchema = z.object({
  date: z.string().nonempty("La fecha es requerida"),
  time: z.string().nonempty("La hora es requerida"),
  contactType: z.string().nonempty("El tipo de contacto es requerido"),
  result: z.string().nonempty("El resultado es requerido"),
  comments: z.string().min(5, "Los comentarios deben tener al menos 5 caracteres"),
  nextAction: z.string().optional(),
  nextActionDate: z.string().optional(),
});

type ActivityLogFormValues = z.infer<typeof activityLogSchema>;

interface ActivityLogProps {
  debtorId: number;
  activities: ActivityLogType[];
  isLoading: boolean;
}

export const ActivityLog: React.FC<ActivityLogProps> = ({
  debtorId,
  activities,
  isLoading,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);

  const form = useForm<ActivityLogFormValues>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      contactType: CONTACT_TYPE.PHONE,
      result: CONTACT_RESULT.LOCATED,
      comments: "",
      nextAction: "",
      nextActionDate: "",
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: ActivityLogFormValues) => {
      const formattedData = {
        ...data,
        date: new Date(data.date),
        nextActionDate: data.nextActionDate ? new Date(data.nextActionDate) : undefined,
      };
      const response = await apiRequest(
        "POST",
        `/api/debtors/${debtorId}/activity`,
        formattedData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Actividad registrada",
        description: "La actividad ha sido registrada correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}/activity`] });
      setIsAddActivityOpen(false);
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm"),
        contactType: CONTACT_TYPE.PHONE,
        result: CONTACT_RESULT.LOCATED,
        comments: "",
        nextAction: "",
        nextActionDate: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar la actividad: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ActivityLogFormValues) => {
    createActivityMutation.mutate(data);
  };

  const getContactTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="h-5 w-5 text-blue-500" />;
      case "whatsapp":
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case "visit":
        return <User className="h-5 w-5 text-purple-500" />;
      case "email":
        return <MessageSquare className="h-5 w-5 text-amber-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getContactTypeName = (type: string) => {
    switch (type) {
      case "phone":
        return "Llamada telefónica";
      case "whatsapp":
        return "Mensaje WhatsApp";
      case "visit":
        return "Visita presencial";
      case "email":
        return "Correo electrónico";
      case "other":
        return "Otro tipo de contacto";
      default:
        return type;
    }
  };

  const getResultBadgeColor = (result: string) => {
    switch (result) {
      case "located":
        return "bg-green-100 text-green-800";
      case "not_located":
        return "bg-red-100 text-red-800";
      case "promise":
        return "bg-blue-100 text-blue-800";
      case "refused":
        return "bg-amber-100 text-amber-800";
      case "partial_payment":
        return "bg-indigo-100 text-indigo-800";
      case "full_payment":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getResultName = (result: string) => {
    switch (result) {
      case "located":
        return "Localizado";
      case "not_located":
        return "No localizado";
      case "promise":
        return "Promesa de pago";
      case "refused":
        return "Se negó a pagar";
      case "partial_payment":
        return "Pago parcial";
      case "full_payment":
        return "Pago completo";
      case "other":
        return "Otro resultado";
      default:
        return result;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Bitácora de Actividades</h2>
          <p className="text-sm text-gray-500">
            Registro de gestiones realizadas con este deudor
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
            <CallScriptModal />
            <MessageTemplatesModal />
            <Dialog open={isAddActivityOpen} onOpenChange={setIsAddActivityOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Registrar Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Actividad</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hora</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medio de Contacto</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione medio de contacto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={CONTACT_TYPE.PHONE}>Llamada telefónica</SelectItem>
                            <SelectItem value={CONTACT_TYPE.WHATSAPP}>Mensaje WhatsApp</SelectItem>
                            <SelectItem value={CONTACT_TYPE.VISIT}>Visita presencial</SelectItem>
                            <SelectItem value={CONTACT_TYPE.EMAIL}>Correo electrónico</SelectItem>
                            <SelectItem value={CONTACT_TYPE.OTHER}>Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="result"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resultado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione resultado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={CONTACT_RESULT.LOCATED}>Localizado</SelectItem>
                            <SelectItem value={CONTACT_RESULT.NOT_LOCATED}>No localizado</SelectItem>
                            <SelectItem value={CONTACT_RESULT.PROMISE}>Promesa de pago</SelectItem>
                            <SelectItem value={CONTACT_RESULT.REFUSED}>Se negó a pagar</SelectItem>
                            <SelectItem value={CONTACT_RESULT.PARTIAL_PAYMENT}>Pago parcial</SelectItem>
                            <SelectItem value={CONTACT_RESULT.FULL_PAYMENT}>Pago completo</SelectItem>
                            <SelectItem value={CONTACT_RESULT.OTHER}>Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Comentarios</FormLabel>
                        <MessageTemplatesModal
                          triggerLabel="Insertar plantilla"
                          onSelect={(content) => field.onChange(content)}
                        />
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Detalles de la gestión realizada"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nextAction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próxima acción</FormLabel>
                        <FormControl>
                          <Input placeholder="Acción a realizar en el seguimiento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="nextActionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha próxima acción</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddActivityOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createActivityMutation.isPending}>
                    {createActivityMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin actividades registradas</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay actividades registradas para este deudor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex items-start">
                    <div className="mr-4">
                      {getContactTypeIcon(activity.contactType)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {getContactTypeName(activity.contactType)}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getResultBadgeColor(activity.result)}`}>
                          {getResultName(activity.result)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {format(new Date(activity.date), "dd/MM/yyyy", { locale: es })} a las {activity.time}
                      </p>
                      <div className="mt-3">
                        <p className="text-sm text-gray-700">{activity.comments}</p>
                      </div>
                      {activity.nextAction && (
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                          <div className="flex items-start">
                            <Calendar className="h-4 w-4 text-amber-500 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-amber-800">Próxima acción:</p>
                              <p className="text-sm text-amber-700">{activity.nextAction}</p>
                              {activity.nextActionDate && (
                                <p className="text-xs text-amber-600 mt-1">
                                  Fecha: {format(new Date(activity.nextActionDate), "dd/MM/yyyy", { locale: es })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center md:text-right md:min-w-[150px]">
                    <User className="h-4 w-4 mr-1 md:hidden" />
                    <span>Registrado por: {activity.userId === user?.id ? "Tú" : `ID: ${activity.userId}`}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
