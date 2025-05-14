import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar } from "@/components/common/avatar";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Debtor } from "@shared/schema";

interface RecentDebtorsProps {
  debtors: (Debtor & { 
    debt?: number;
    clientName?: string;
  })[];
}

export const RecentDebtors: React.FC<RecentDebtorsProps> = ({ debtors }) => {
  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <CardTitle className="text-lg font-medium">
          Últimos deudores registrados
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 py-0 overflow-hidden">
        <ul className="divide-y divide-gray-200">
          {debtors.map((debtor) => (
            <li key={debtor.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar name={debtor.name} personType={debtor.personType} />
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {debtor.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      Cliente: {debtor.clientName}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-900">
                    {debtor.debt ? formatCurrency(debtor.debt) : "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    Registrado: {format(new Date(debtor.createdAt), "dd/MM/yyyy", { locale: es })}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="px-6 py-4 border-t border-gray-200">
        <Link href="/debtors">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-800">
            Ver todos los deudores →
          </a>
        </Link>
      </CardFooter>
    </Card>
  );
};
