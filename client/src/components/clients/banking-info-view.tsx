import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PencilIcon } from "lucide-react";
import type { ClientBankingInfo } from "@shared/schema";

interface BankingInfoViewProps {
  clientId: number;
  onEdit: () => void;
}

export function BankingInfoView({ clientId, onEdit }: BankingInfoViewProps) {
  const { data: bankingInfo, isLoading, error } = useQuery<ClientBankingInfo>({
    queryKey: [`/api/clients/${clientId}/banking-info`],
    retry: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información Bancaria</CardTitle>
          <CardDescription>Datos bancarios del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información Bancaria</CardTitle>
          <CardDescription>Datos bancarios del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Este cliente no tiene información bancaria registrada.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={onEdit}>Agregar Información Bancaria</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!bankingInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información Bancaria</CardTitle>
          <CardDescription>Datos bancarios del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Este cliente no tiene información bancaria registrada.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={onEdit}>Agregar Información Bancaria</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Información Bancaria</CardTitle>
          <CardDescription>Datos bancarios del cliente</CardDescription>
        </div>
        <Button variant="outline" size="icon" onClick={onEdit}>
          <PencilIcon className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Banco</h4>
            <p>{bankingInfo.bankName || 'No especificado'}</p>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Titular de la Cuenta</h4>
            <p>{bankingInfo.accountHolder || 'No especificado'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Número de Cuenta</h4>
              <p>{bankingInfo.accountNumber || 'No especificado'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">CLABE Interbancaria</h4>
              <p>{bankingInfo.clabe || 'No especificado'}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Referencia</h4>
            <p>{bankingInfo.reference || 'No especificado'}</p>
          </div>
          
          {bankingInfo.notes && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Notas</h4>
              <p>{bankingInfo.notes}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}