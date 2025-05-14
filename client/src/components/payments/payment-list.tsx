import { useQuery } from "@tanstack/react-query";
import { Payment } from "@shared/schema";
import { formatCurrency, formatDate } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownIcon, FileTextIcon, RefreshCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PaymentListProps = {
  debtId: number;
  onAddPayment?: () => void;
};

export function PaymentList({ debtId, onAddPayment }: PaymentListProps) {
  const { data: payments, isLoading, isError, refetch } = useQuery<Payment[]>({
    queryKey: [`/api/debts/${debtId}/payments`],
  });

  // Helper function to get badge color based on payment method
  const getMethodBadgeVariant = (method: string) => {
    switch (method) {
      case "cash": return "default";
      case "transfer": return "secondary";
      case "check": return "outline";
      case "card": return "destructive";
      default: return "default";
    }
  };

  // Helper function to get method display name
  const getMethodDisplayName = (method: string) => {
    switch (method) {
      case "cash": return "Efectivo";
      case "transfer": return "Transferencia";
      case "check": return "Cheque";
      case "card": return "Tarjeta";
      default: return "Otro";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Historial de Pagos</CardTitle>
          <CardDescription>
            {payments?.length 
              ? `Mostrando ${payments.length} pagos registrados` 
              : "No hay pagos registrados para esta deuda"
            }
          </CardDescription>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcwIcon className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button size="sm" onClick={onAddPayment}>
            <ArrowDownIcon className="h-4 w-4 mr-2" />
            Registrar Pago
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : isError ? (
          <div className="py-8 text-center text-muted-foreground">
            Error al cargar los pagos. Por favor, inténtalo de nuevo.
          </div>
        ) : payments?.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay pagos registrados para esta deuda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments?.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getMethodBadgeVariant(payment.paymentMethod)}>
                      {getMethodDisplayName(payment.paymentMethod)}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.reference || "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(payment.amount)}
                  </TableCell>
                  <TableCell>
                    {payment.notes ? (
                      <div className="flex items-center text-muted-foreground">
                        <FileTextIcon className="h-4 w-4 mr-1" />
                        <span className="truncate max-w-[200px]">{payment.notes}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}