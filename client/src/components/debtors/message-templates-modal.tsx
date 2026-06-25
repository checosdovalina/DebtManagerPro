import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageTemplate, TEMPLATE_TYPE } from "@shared/schema";
import { FileText, MessageSquare, Phone, Mail, Copy, Plus, Trash2, CheckCheck } from "lucide-react";

const typeConfig = (type: string) => {
  switch (type) {
    case "whatsapp": return { label: "WhatsApp", icon: <MessageSquare className="h-3.5 w-3.5" />, className: "bg-green-100 text-green-700 border-green-200" };
    case "email": return { label: "Email", icon: <Mail className="h-3.5 w-3.5" />, className: "bg-amber-100 text-amber-700 border-amber-200" };
    case "call": return { label: "Guión llamada", icon: <Phone className="h-3.5 w-3.5" />, className: "bg-blue-100 text-blue-700 border-blue-200" };
    case "sms": return { label: "SMS", icon: <MessageSquare className="h-3.5 w-3.5" />, className: "bg-purple-100 text-purple-700 border-purple-200" };
    default: return { label: type, icon: <FileText className="h-3.5 w-3.5" />, className: "bg-gray-100 text-gray-600" };
  }
};

const newTemplateSchema = z.object({
  name: z.string().min(3, "Nombre muy corto"),
  type: z.string().nonempty("Tipo requerido"),
  scenario: z.string().nonempty("Escenario requerido"),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres"),
});
type NewTemplateForm = z.infer<typeof newTemplateSchema>;

interface Props {
  onSelect?: (content: string) => void;
  triggerLabel?: string;
}

export function MessageTemplatesModal({ onSelect, triggerLabel = "Usar plantilla" }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("all");

  const { data: templates = [], isLoading } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/message-templates"],
    enabled: open,
  });

  const form = useForm<NewTemplateForm>({
    resolver: zodResolver(newTemplateSchema),
    defaultValues: { name: "", type: "whatsapp", scenario: "", content: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (data: NewTemplateForm) => {
      const res = await apiRequest("POST", "/api/message-templates", { ...data, isDefault: false });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Plantilla creada" });
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
      form.reset();
      setShowNew(false);
    },
    onError: () => toast({ title: "Error al crear plantilla", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/message-templates/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Plantilla eliminada" });
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates"] });
    },
  });

  const handleCopy = (t: MessageTemplate) => {
    navigator.clipboard.writeText(t.content).then(() => {
      setCopiedId(t.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "Copiado al portapapeles" });
    });
  };

  const handleSelect = (t: MessageTemplate) => {
    if (onSelect) {
      onSelect(t.content);
      setOpen(false);
      toast({ title: "Plantilla aplicada", description: t.name });
    }
  };

  const filteredTemplates = activeType === "all"
    ? templates
    : templates.filter(t => t.type === activeType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="btn-open-templates">
          <FileText className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Plantillas de Mensajes</span>
            <Button size="sm" variant="outline" onClick={() => setShowNew(v => !v)} className="mr-6">
              <Plus className="h-4 w-4 mr-1" />
              Nueva
            </Button>
          </DialogTitle>
        </DialogHeader>

        {showNew && (
          <div className="border rounded-lg p-4 bg-gray-50 mb-4">
            <h3 className="font-medium text-sm mb-3">Nueva plantilla</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(d => createMutation.mutate(d))} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl><Input placeholder="Ej: Recordatorio amable" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="call">Guión de llamada</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="scenario" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escenario</FormLabel>
                    <FormControl><Input placeholder="Ej: primer_contacto, recordatorio, aviso_legal" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenido <span className="text-gray-400 font-normal">(usa [NOMBRE], [MONTO], [FECHA], [FOLIO])</span></FormLabel>
                    <FormControl><Textarea rows={4} placeholder="Contenido del mensaje..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancelar</Button>
                  <Button type="submit" size="sm" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        <Tabs value={activeType} onValueChange={setActiveType}>
          <TabsList className="w-full justify-start h-auto flex-wrap gap-1 bg-transparent p-0 border-b pb-2">
            {[
              { value: "all", label: "Todas" },
              { value: "whatsapp", label: "WhatsApp" },
              { value: "email", label: "Email" },
              { value: "call", label: "Llamada" },
              { value: "sms", label: "SMS" },
            ].map(t => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className="rounded-md border data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-3 py-1 text-xs"
              >
                {t.label}
                {t.value !== "all" && (
                  <span className="ml-1 text-xs opacity-60">
                    ({templates.filter(tmpl => tmpl.type === t.value).length})
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeType} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />)}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No hay plantillas en esta categoría</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTemplates.map(t => {
                  const tc = typeConfig(t.type);
                  return (
                    <div key={t.id} className="border rounded-lg p-4 bg-white hover:border-primary/40 transition-colors" data-testid={`template-${t.id}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-gray-900">{t.name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${tc.className}`}>
                            {tc.icon}{tc.label}
                          </span>
                          {t.isDefault && (
                            <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">Predeterminada</Badge>
                          )}
                        </div>
                        {!t.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-600 h-7 w-7 p-0 shrink-0"
                            onClick={() => deleteMutation.mutate(t.id)}
                            data-testid={`btn-delete-template-${t.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed line-clamp-4 bg-gray-50 rounded p-2 font-mono">
                        {t.content}
                      </p>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => handleCopy(t)}
                          data-testid={`btn-copy-template-${t.id}`}
                        >
                          {copiedId === t.id ? (
                            <><CheckCheck className="h-3.5 w-3.5 mr-1 text-green-500" />Copiado</>
                          ) : (
                            <><Copy className="h-3.5 w-3.5 mr-1" />Copiar</>
                          )}
                        </Button>
                        {onSelect && (
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() => handleSelect(t)}
                            data-testid={`btn-use-template-${t.id}`}
                          >
                            Usar en actividad
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
