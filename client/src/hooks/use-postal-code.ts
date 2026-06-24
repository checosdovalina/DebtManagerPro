import { useCallback, useRef } from "react";
import { UseFormReturn } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { getPostalCodeData } from "@/lib/postalCodeService";

export function usePostalCode(form: UseFormReturn<any>) {
  const { toast } = useToast();
  const lastQueried = useRef<string>("");

  const handleZipChange = useCallback(
    async (value: string) => {
      form.setValue("zipCode", value);
      if (value.length !== 5 || value === lastQueried.current) return;
      lastQueried.current = value;

      const data = await getPostalCodeData(value);
      if (!data) return;

      form.setValue("state", data.estado, { shouldValidate: true });
      form.setValue("city", data.municipio, { shouldValidate: true });
      if (data.colonia && !form.getValues("colony")) {
        form.setValue("colony", data.colonia, { shouldValidate: true });
      }

      toast({
        title: "Dirección autocompletada",
        description: `${data.municipio}, ${data.estado}`,
        duration: 2500,
      });
    },
    [form, toast]
  );

  return { handleZipChange };
}
