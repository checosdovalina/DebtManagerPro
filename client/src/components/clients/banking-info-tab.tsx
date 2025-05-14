import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ClientBankingInfo } from "@shared/schema";
import { BankingInfoView } from "./banking-info-view";
import { BankingInfoForm } from "./banking-info-form";

interface BankingInfoTabProps {
  clientId: number;
}

export function BankingInfoTab({ clientId }: BankingInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: bankingInfo } = useQuery<ClientBankingInfo>({
    queryKey: [`/api/clients/${clientId}/banking-info`],
    retry: false,
  });

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSuccess = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <BankingInfoForm
        clientId={clientId}
        existingInfo={bankingInfo}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    );
  }

  return <BankingInfoView clientId={clientId} onEdit={handleEdit} />;
}