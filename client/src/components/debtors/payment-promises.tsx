import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, isPast, isToday, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PaymentPromise, PROMISE_STATUS } from "@shared/schema";
import { PlusCircle, DollarSign, Calendar, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const promiseSchema = z.object({
  promisedAmount: z.string().nonempty("El monto es requerido").refine(v => !isNaN(Number(v)) && Number(v) > 0, "Monto inválido"),
  promisedDate: z.string().nonempty("La fecha es requerida"),
  notes: z.string().optional(),
});

type PromiseForm = z.infer<typeof promiseSchema>;

const statusConfig = (status: string) => {
  switch (status) {
    case "pending": return { label: "Pendiente", className: "bg-blue-100 text-blue-700 border-blue-200", icon: <Clock className="h-3 w-3" /> };
    case "fulfilled": return { label: "Cumplida", className: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> };
    case "broken": return { label: "Incumplida", className: "bg-red-100 text-red-700 border-red-200", icon: <XCircle className="h-3 w-3" /> };
    case "rescheduled": return { label: "Reprogramada", className: "bg-amber-100 text-amber-700 border-amber-200", icon: <RefreshCw className="h-3 w-3" /> };
    default: return { label: status, className: "bg-gray-100 text-gray-600", icon: null };
  }
};

interface Props {
  debtorId: number;
}

export function PaymentPromises({ debtorId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: promises = [], isLoading } = useQuery<PaymentPromise[]>({
    queryKey: [`/api/debtors/${debtorId}/payment-promises`],
  });

  const form = useForm<PromiseForm>({
    resolver: zodResolver(promiseSchema),
    defaultValues: { promisedAmount: "", promisedDate: "", notes: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PromiseForm) => {
      const res = await apiRequest("POST", `/api/debtors/${debtorId}/payment-promises`, {
        debtorId,
        userId: user?.id,
        promisedAmount: parseFloat(data.promisedAmount),
        promisedDate: data.promisedDate,
        notes: data.notes || null,
        status: "pending",
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Promesa registrada", description: "La promesa de pago ha sido guardada." });
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}/payment-promises`] });
      queryClient.invalidateQueries({ queryKey: ["/api/followups/pending"] });
      form.reset();
      setIsOpen(false);
    },
    onError: () => toast({ title: "Error", description: "No se pudo guardar la promesa.", variant: "destructive" }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/payment-promises/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Estado actualizado" });
      queryClient.invalidateQueries({ queryKey: [`/api/debtors/${debtorId}/payment-promises`] });
      queryClient.invalidateQueries({ queryKey: ["/api/followups/pending"] });
    },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
  });

  const getUrgency = (promise: PaymentPromise) => {
    if (promise.status !== "pending") return null;
    try {
      const d = parseISO(promise.promisedDate);
      if (isPast(d) && !isToday(d)) return "overdue";
      if (isToday(d)) return "today";
    } catch {}
    return null;
  };

  const pendingCount = promises.filter(p => p.status === "pending").length;
  const overdueCount = promises.filter(p => {
    if (p.status !== "pending") return false;
    try { return isPast(parseISO(p.promisedDate)) && !isToday(parseISO(p.promisedDate)); } catch { return false; }
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Promesas de Pago</h2>
          <p className="text-sm text-gray-500">
            {pendingCount} pendientes{overdueCount > 0 && <span className="text-red-600 font-medium"> · {overdueCount} vencidas</span>}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button data-testid="btn-add-promise">
              <PlusCircle className="h-4 w-4 mr-2" />
              Nueva promesa
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Registrar Promesa de Pago</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
                <FormField control={form.control} name="promisedAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto prometido ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input type="number" step="0.01" placeholder="0.00" className="pl-9" {...field} data-testid="input-promise-amount" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="promisedDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de pago prometida</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-promise-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Condiciones, forma de pago, etc." {...field} />
                    </FormControl>
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="btn-save-promise">
                    {createMutation.isPending ? "Guardando..." : "Guardar promesa"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : promises.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-700">Sin promesas de pago</p>
            <p className="text-xs text-gray-500 mt-1">Registra la primera promesa del deudor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {promises.map(p => {
            const sc = statusConfig(p.status);
            const urgency = getUrgency(p);
            return (
              <Card key={p.id} className={urgency === "overdue" ? "border-red-300 bg-red-50" : urgency === "today" ? "border-blue-300 bg-blue-50" : ""} data-testid={`promise-card-${p.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg font-bold text-gray-900">
                          ${p.promisedAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${sc.className}`}>
                          {sc.icon}{sc.label}
                        </span>
                        {urgency === "overdue" && (
                          <span className="text-xs text-red-600 font-semibold">⚠ Vencida</span>
                        )}
                        {urgency === "today" && (
                          <span className="text-xs text-blue-600 font-semibold">📅 Hoy</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Fecha: {format(parseISO(p.promisedDate), "dd 'de' MMMM yyyy", { locale: es })}
                      </p>
                      {p.notes && <p className="text-xs text-gray-500 mt-1">{p.notes}</p>}
                    </div>

                    {p.status === "pending" && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          onClick={() => updateStatusMutation.mutate({ id: p.id, status: "fulfilled" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`btn-fulfill-${p.id}`}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Cumplida
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => updateStatusMutation.mutate({ id: p.id, status: "broken" })}
                          disabled={updateStatusMutation.isPending}
                          data-testid={`btn-break-${p.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Incumplida
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
