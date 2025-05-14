import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ClientBankingInfo } from "@shared/schema";

// Esquema de validación extendido para formulario
const bankingInfoSchema = z.object({
  bankName: z.string().nullable().optional(),
  accountHolder: z.string().nullable().optional(),
  accountNumber: z.string().nullable().optional(),
  clabe: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type BankingInfoFormValues = z.infer<typeof bankingInfoSchema>;

interface BankingInfoFormProps {
  clientId: number;
  existingInfo?: ClientBankingInfo;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BankingInfoForm({
  clientId,
  existingInfo,
  onSuccess,
  onCancel,
}: BankingInfoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isEditing = !!existingInfo;

  const form = useForm<BankingInfoFormValues>({
    resolver: zodResolver(bankingInfoSchema),
    defaultValues: {
      bankName: existingInfo?.bankName || null,
      accountHolder: existingInfo?.accountHolder || null,
      accountNumber: existingInfo?.accountNumber || null,
      clabe: existingInfo?.clabe || null,
      reference: existingInfo?.reference || null,
      notes: existingInfo?.notes || null,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: BankingInfoFormValues) => {
      return apiRequest(`/api/clients/${clientId}/banking-info`, {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Información bancaria añadida!",
        description: "Los datos bancarios se han guardado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/banking-info`] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error al crear información bancaria:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la información bancaria. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: BankingInfoFormValues) => {
      return apiRequest(`/api/clients/${clientId}/banking-info`, {
        method: "PUT",
        data,
      });
    },
    onSuccess: () => {
      toast({
        title: "¡Información bancaria actualizada!",
        description: "Los datos bancarios se han actualizado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/banking-info`] });
      onSuccess();
    },
    onError: (error) => {
      console.error("Error al actualizar información bancaria:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información bancaria. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (values: BankingInfoFormValues) => {
    setIsSubmitting(true);
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Banco</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nombre del banco" 
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
            name="accountHolder"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titular de la Cuenta</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del titular de la cuenta"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Cuenta</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Número de cuenta bancaria"
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
            name="clabe"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CLABE Interbancaria</FormLabel>
                <FormControl>
                  <Input
                    placeholder="CLABE (18 dígitos)"
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia para Pagos</FormLabel>
              <FormControl>
                <Input
                  placeholder="Referencia para identificar pagos"
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas Adicionales</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Información adicional sobre la cuenta bancaria"
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button variant="outline" type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Guardar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}