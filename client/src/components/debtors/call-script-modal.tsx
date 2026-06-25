import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageTemplate } from "@shared/schema";
import { Phone, ChevronRight } from "lucide-react";

interface Props {
  debtorName?: string;
}

export function CallScriptModal({ debtorName }: Props) {
  const [open, setOpen] = useState(false);
  const [activeScript, setActiveScript] = useState<string | null>(null);

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/message-templates"],
    enabled: open,
  });

  const callScripts = templates.filter(t => t.type === "call");

  const parseScript = (content: string, name?: string) => {
    return content
      .replace(/\[NOMBRE\]/g, name || "[NOMBRE]")
      .split("\n")
      .filter(l => l.trim());
  };

  const selected = callScripts.find(s => s.scenario === activeScript);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50" data-testid="btn-open-callscript">
          <Phone className="h-4 w-4 mr-2" />
          Guión de llamada
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-500" />
            Guión de Llamada
            {debtorName && <span className="text-sm font-normal text-gray-500">— {debtorName}</span>}
          </DialogTitle>
        </DialogHeader>

        {callScripts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Phone className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm">No hay guiones disponibles</p>
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="w-48 shrink-0 space-y-1 border-r pr-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Escenarios</p>
              {callScripts.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveScript(s.scenario)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    activeScript === s.scenario
                      ? "bg-blue-50 text-blue-700 font-medium border border-blue-200"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                  data-testid={`script-tab-${s.id}`}
                >
                  {s.name.replace("Guión - ", "")}
                </button>
              ))}
            </div>

            <div className="flex-1 min-w-0">
              {!activeScript ? (
                <div className="text-center py-8 text-gray-400">
                  <ChevronRight className="h-8 w-8 mx-auto" />
                  <p className="text-sm mt-2">Selecciona un escenario</p>
                </div>
              ) : selected ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {selected.name}
                    </Badge>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
                    {parseScript(selected.content, debtorName).map((line, i) => {
                      const isStep = /^\d+\./.test(line);
                      return isStep ? (
                        <div key={i} className="flex gap-3">
                          <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-xs font-bold">
                            {line.match(/^(\d+)\./)?.[1]}
                          </span>
                          <p className="text-sm text-gray-800 leading-relaxed pt-0.5">
                            {line.replace(/^\d+\.\s*/, "")}
                          </p>
                        </div>
                      ) : (
                        <p key={i} className="text-sm text-gray-600 italic pl-9">{line}</p>
                      );
                    })}
                  </div>
                  <div className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded p-2">
                    💡 Los marcadores <code>[NOMBRE]</code>, <code>[MONTO]</code>, <code>[FECHA]</code> son guías — reemplázalos con la información real del deudor.
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
