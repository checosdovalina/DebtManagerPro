import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  DEBT_TYPE, 
  type Debt, 
  type InsertDebt,
  type Payment
} from "@shared/schema";
import { PlusCircle, FileText, DollarSign, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PaymentForm } from "@/components/payments/payment-form";
import { PaymentList } from "@/components/payments/payment-list";

const debtFormSchema = z.object({
  concept: z.string().nonempty("El concepto del adeudo es requerido"),
  originalAmount: z.coerce.number().positive("El monto debe ser mayor a cero"),
  currentAmount: z.coerce.number().positive("El monto debe ser mayor a cero"),
  startDate: z.string().nonempty("La fecha de inicio es requerida"),
  dueDate: z.string().nonempty("La fecha de vencimiento es requerida"),
  interest: z.coerce.number().min(0, "El interés no puede ser negativo").optional(),
  debtType: z.string().nonempty("El tipo de deuda es requerido"),
  supportDocuments: z.string().optional(),
  notes: z.string().optional(),
});

type DebtFormType = z.infer<typeof debtFormSchema>;

interface DebtDetailProps {
  debtorId: number;
}

export const DebtDetail: React.FC<DebtDetailProps> = ({ debtorId }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<number | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const { data: debts = [], isLoading } = useQuery<Debt[]>({
    queryKey: [`/api/debtors/${debtorId}/debts`],
  });

  const form = useForm<DebtFormType>({
    resolver: zodResolver(debtFormSchema),
    defaultValues: {
      concept: "",
      originalAmount: 0,
      currentAmount: 0,
      startDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: format(new Date(new Date().setMonth(new Date().getMonth() + 3)), "yyyy-MM-dd"),
      interest: 0,
      debtType: DEBT_TYPE.INVOICE,
      supportDocuments: "",
      notes: "",
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: async (data: DebtFormType) => {
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate),
        dueDate: new Date(data.dueDate),
      };
      const response = await apiRequest(
        "POST", 
        `/api/debtors/${debtorId}/debts`, 
        formattedData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Adeudo registrado",
        description: "El adeudo ha sido registrado correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}/debts`] });
      setIsAddDebtOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al registrar el adeudo: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DebtFormType) => {
    createDebtMutation.mutate(data);
  };

  // Calculate totals
  const totalOriginalAmount = debts.reduce((sum, debt) => sum + debt.originalAmount, 0);
  const totalCurrentAmount = debts.reduce((sum, debt) => sum + debt.currentAmount, 0);

  const getDebtTypeName = (type: string) => {
    switch (type) {
      case "promissory_note": return "Pagaré";
      case "invoice": return "Factura";
      case "credit": return "Crédito";
      case "contract": return "Contrato";
      case "other": return "Otro";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Información de Adeudo
          </h2>
          <p className="text-sm text-gray-500">
            Detalle de las deudas registradas para este deudor
          </p>
        </div>
        <Dialog open={isAddDebtOpen} onOpenChange={setIsAddDebtOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Registrar Adeudo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Adeudo</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="concept"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Concepto del Adeudo</FormLabel>
                      <FormControl>
                        <Input placeholder="Descripción breve del adeudo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="originalAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Original</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <Input 
                              type="number" 
                              step="0.01" 
                              className="pl-7" 
                              placeholder="0.00" 
                              {...field} 
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                field.onChange(value);
                                // Update current amount automatically if it's empty or same as original
                                if (!form.getValues("currentAmount") || 
                                    form.getValues("currentAmount") === field.value) {
                                  form.setValue("currentAmount", value);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monto Actual</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                            <Input type="number" step="0.01" className="pl-7" placeholder="0.00" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Inicio</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Vencimiento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interés (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
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
                    name="debtType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Deuda</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={DEBT_TYPE.PROMISSORY_NOTE}>Pagaré</SelectItem>
                            <SelectItem value={DEBT_TYPE.INVOICE}>Factura</SelectItem>
                            <SelectItem value={DEBT_TYPE.CREDIT}>Crédito</SelectItem>
                            <SelectItem value={DEBT_TYPE.CONTRACT}>Contrato</SelectItem>
                            <SelectItem value={DEBT_TYPE.OTHER}>Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="supportDocuments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documentos de Respaldo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombres o referencias de los documentos" {...field} />
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
                      <FormLabel>Observaciones</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas adicionales sobre la deuda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDebtOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createDebtMutation.isPending}>
                    {createDebtMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : debts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <DollarSign className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Sin adeudos registrados</h3>
            <p className="mt-1 text-sm text-gray-500">
              No hay adeudos registrados para este deudor.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Adeudos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <p className="text-sm text-blue-700 font-medium">Monto Original Total</p>
                  <p className="text-2xl font-semibold text-blue-900">
                    ${totalOriginalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-amber-50 p-4 rounded-md">
                  <p className="text-sm text-amber-700 font-medium">Monto Actual Total</p>
                  <p className="text-2xl font-semibold text-amber-900">
                    ${totalCurrentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-md">
                  <p className="text-sm text-green-700 font-medium">Diferencia</p>
                  <p className="text-2xl font-semibold text-green-900">
                    ${(totalCurrentAmount - totalOriginalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {debts.map((debt) => (
              <Card key={debt.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between flex-wrap">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <h3 className="font-medium text-gray-900">{getDebtTypeName(debt.debtType)}</h3>
                        {debt.supportDocuments && (
                          <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <FileText className="h-3 w-3 mr-1" />
                            Con documentos
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {debt.concept}
                      </p>
                      <p className="text-sm text-gray-500">
                        Fecha de inicio: {format(new Date(debt.startDate), "dd/MM/yyyy", { locale: es })} |  
                        Fecha de vencimiento: {format(new Date(debt.dueDate), "dd/MM/yyyy", { locale: es })}
                      </p>
                      {debt.notes && (
                        <p className="text-sm text-gray-600 mt-2">{debt.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-500">Monto Original:</span>
                        <span className="text-lg font-semibold text-gray-900">
                          ${debt.originalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex flex-col mt-2">
                        <span className="text-sm text-gray-500">Monto Actual:</span>
                        <span className="text-lg font-semibold text-amber-600">
                          ${debt.currentAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {debt.interest && (
                        <div className="text-sm text-gray-500 mt-1">
                          Interés: {debt.interest}%
                        </div>
                      )}
                      <div className="mt-3">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedDebtId(debt.id);
                            setIsPaymentModalOpen(true);
                          }}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CreditCard className="h-4 w-4 mr-1" />
                          Registrar Pago
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 border-t border-gray-100">
                  <Tabs defaultValue="pagos" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="pagos" className="flex-1">Pagos</TabsTrigger>
                      <TabsTrigger value="documentos" className="flex-1">Documentos</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pagos" className="mt-4">
                      <PaymentList 
                        debtId={debt.id} 
                        onAddPayment={() => {
                          setSelectedDebtId(debt.id);
                          setIsPaymentModalOpen(true);
                        }} 
                      />
                    </TabsContent>
                    <TabsContent value="documentos" className="mt-4">
                      <div className="text-center p-4 text-sm text-gray-500">
                        No hay documentos registrados para esta deuda.
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Modal para registrar pagos */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
          </DialogHeader>
          {selectedDebtId && (
            <PaymentForm 
              debtId={selectedDebtId} 
              debtAmount={debts.find(d => d.id === selectedDebtId)?.currentAmount || 0}
              onSuccess={() => {
                setIsPaymentModalOpen(false);
                toast({
                  title: "Pago registrado",
                  description: "El pago ha sido registrado con éxito.",
                });
                // Invalidar las consultas para actualizar los datos
                queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}/debts`] });
              }} 
              onCancel={() => setIsPaymentModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
