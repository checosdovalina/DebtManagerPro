import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { insertPaymentSchema, PAYMENT_METHOD } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from 'wouter';
import { format } from 'date-fns';

// Extend schema with validation rules
const paymentSchema = insertPaymentSchema.extend({
  amount: z.number().positive("El monto debe ser mayor a cero"),
  paymentDate: z.string().min(1, "La fecha de pago es obligatoria"),
  paymentMethod: z.string().min(1, "El método de pago es obligatorio"),
});

type PaymentFormProps = {
  debtId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  debtAmount: number;
};

export function PaymentForm({ debtId, onSuccess, onCancel, debtAmount }: PaymentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  const form = useForm<z.infer<typeof paymentSchema>>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      debtId,
      amount: 0,
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentMethod: PAYMENT_METHOD.CASH,
      reference: "",
      notes: "",
      receiptUrl: "",
    },
  });

  const createPayment = useMutation({
    mutationFn: async (data: z.infer<typeof paymentSchema>) => {
      return apiRequest("POST", `/api/debts/${debtId}/payments`, data)
        .then(res => res.json());
    },
    onSuccess: () => {
      toast({
        title: "Pago registrado",
        description: "El pago se ha registrado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/debts/${debtId}/payments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/debts/${debtId}`] });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al registrar el pago.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof paymentSchema>) => {
    if (data.amount > debtAmount) {
      toast({
        title: "Error",
        description: "El monto del pago no puede ser mayor al monto de la deuda.",
        variant: "destructive",
      });
      return;
    }
    createPayment.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto del Pago</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                    onChange={e => field.onChange(parseFloat(e.target.value || "0"))} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="paymentDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Pago</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de Pago</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione método de pago" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={PAYMENT_METHOD.CASH}>Efectivo</SelectItem>
                    <SelectItem value={PAYMENT_METHOD.TRANSFER}>Transferencia</SelectItem>
                    <SelectItem value={PAYMENT_METHOD.CHECK}>Cheque</SelectItem>
                    <SelectItem value={PAYMENT_METHOD.CARD}>Tarjeta</SelectItem>
                    <SelectItem value={PAYMENT_METHOD.OTHER}>Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referencia (opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="# de referencia o transacción" {...field} />
                </FormControl>
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
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observaciones o detalles adicionales sobre el pago"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="receiptUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Recibo (opcional)</FormLabel>
              <FormControl>
                <Input placeholder="URL del recibo o comprobante" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2 mt-6">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={createPayment.isPending}>
            {createPayment.isPending ? "Registrando..." : "Registrar Pago"}
          </Button>
        </div>
      </form>
    </Form>
  );
}