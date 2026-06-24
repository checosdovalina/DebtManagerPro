import { useState, useRef } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Client } from "@shared/schema";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  Download, ArrowRight, RefreshCw, Table2
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type ImportRow = Record<string, string>;
type RowStatus = "pending" | "ok" | "error";

interface ParsedRow {
  rowIndex: number;
  data: ImportRow;
  status: RowStatus;
  error?: string;
}

const DEBTOR_COLUMNS = [
  { key: "name", label: "Nombre *", required: true },
  { key: "rfc", label: "RFC", required: false },
  { key: "phone", label: "Teléfono", required: false },
  { key: "email", label: "Email", required: false },
  { key: "street", label: "Calle", required: false },
  { key: "colony", label: "Colonia", required: false },
  { key: "zipCode", label: "Código Postal", required: false },
  { key: "city", label: "Ciudad", required: false },
  { key: "state", label: "Estado", required: false },
  { key: "concept", label: "Concepto *", required: true },
  { key: "originalAmount", label: "Monto Original *", required: true },
  { key: "dueDate", label: "Fecha Vencimiento * (YYYY-MM-DD)", required: true },
  { key: "startDate", label: "Fecha Inicio (YYYY-MM-DD)", required: false },
];

function downloadTemplate() {
  const headers = DEBTOR_COLUMNS.map(c => c.label.replace(" *", "").replace(" (YYYY-MM-DD)", ""));
  const example = [
    "Juan García López", "GALJ850101ABC", "8441234567", "juan@email.com",
    "Av. Juárez", "Centro", "27000", "Torreón", "Coahuila",
    "Crédito personal", "50000", "2025-12-31", "2023-01-01"
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Deudores");
  XLSX.writeFile(wb, "plantilla_importacion_deudores.xlsx");
}

export default function ImportacionPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importProgress, setImportProgress] = useState(0);

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const importMutation = useMutation({
    mutationFn: async (payload: { clientId: number; rows: ImportRow[] }) => {
      return apiRequest("POST", "/api/import/debtors", payload);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/debtors"] });
      setStep(3);
      toast({ title: "Importación completada", description: `${data.imported ?? rows.length} registros importados correctamente.` });
    },
    onError: () => {
      toast({ title: "Error en importación", description: "Algunos registros no pudieron importarse.", variant: "destructive" });
    },
  });

  function parseFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();

    const processData = (rawRows: ImportRow[]) => {
      if (rawRows.length === 0) { toast({ title: "Archivo vacío", variant: "destructive" }); return; }
      const hdrs = Object.keys(rawRows[0]);
      setHeaders(hdrs);
      const parsed: ParsedRow[] = rawRows.map((row, i) => {
        const errors: string[] = [];
        if (!row[hdrs[0]] && !row["name"] && !row["Nombre"]) errors.push("Nombre requerido");
        if (!row[hdrs[9]] && !row["concept"] && !row["Concepto"]) errors.push("Concepto requerido");
        if (!row[hdrs[10]] && !row["originalAmount"] && !row["Monto Original"]) errors.push("Monto requerido");
        if (!row[hdrs[11]] && !row["dueDate"] && !row["Fecha Vencimiento"]) errors.push("Fecha vencimiento requerida");
        return { rowIndex: i + 2, data: row, status: errors.length ? "error" : "pending", error: errors.join(", ") };
      });
      setRows(parsed);
      setStep(2);
    };

    if (ext === "csv") {
      Papa.parse<ImportRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => processData(result.data),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<ImportRow>(ws, { defval: "" });
        processData(data);
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async function handleImport() {
    if (!selectedClientId) { toast({ title: "Selecciona un cliente", variant: "destructive" }); return; }
    const validRows = rows.filter(r => r.status !== "error").map(r => r.data);
    if (validRows.length === 0) { toast({ title: "Sin registros válidos", variant: "destructive" }); return; }

    setImportProgress(10);
    const timer = setInterval(() => setImportProgress(p => Math.min(p + 15, 85)), 400);
    await importMutation.mutateAsync({ clientId: Number(selectedClientId), rows: validRows });
    clearInterval(timer);
    setImportProgress(100);
  }

  const okCount = rows.filter(r => r.status !== "error").length;
  const errCount = rows.filter(r => r.status === "error").length;

  return (
    <Layout title="Importación Masiva">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Steps */}
        <div className="flex items-center gap-2 text-sm">
          {[
            { n: 1, label: "Cargar archivo" },
            { n: 2, label: "Revisar datos" },
            { n: 3, label: "Resultado" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                ${step >= s.n ? "bg-primary-600 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span className={step >= s.n ? "font-medium" : "text-gray-400"}>{s.label}</span>
              {i < 2 && <ArrowRight className="h-4 w-4 text-gray-300" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Cargar archivo</CardTitle>
              <CardDescription>Sube un archivo Excel (.xlsx) o CSV con los deudores a importar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center cursor-pointer hover:border-primary-400 hover:bg-gray-50 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
              >
                <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="font-medium text-gray-600">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-400 mt-1">Formatos: .xlsx, .xls, .csv — Máximo 5 MB</p>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
              </div>

              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>Descarga la plantilla con el formato correcto para importar deudores</span>
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" /> Plantilla Excel
                  </Button>
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2"><Table2 className="h-4 w-4" /> Columnas esperadas:</p>
                <div className="flex flex-wrap gap-2">
                  {DEBTOR_COLUMNS.map(c => (
                    <Badge key={c.key} variant={c.required ? "default" : "secondary"} className="text-xs">
                      {c.label.replace(" (YYYY-MM-DD)", "")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Table2 className="h-5 w-5" /> Revisar datos</CardTitle>
              <CardDescription>
                <span className="text-green-600 font-medium">{okCount} registros válidos</span>
                {errCount > 0 && <span className="text-red-500 font-medium ml-3">{errCount} con errores</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1.5 block">Cliente al que pertenecen los deudores *</label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-5">
                  <Button variant="outline" onClick={() => { setRows([]); setStep(1); }}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Cambiar archivo
                  </Button>
                  <Button onClick={handleImport} disabled={importMutation.isPending || !selectedClientId || okCount === 0}>
                    {importMutation.isPending ? (
                      <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Importando...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Importar {okCount} registros</>
                    )}
                  </Button>
                </div>
              </div>

              {importMutation.isPending && (
                <div className="space-y-1">
                  <Progress value={importProgress} className="h-2" />
                  <p className="text-xs text-gray-500 text-center">Importando registros...</p>
                </div>
              )}

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2 text-left text-gray-500 font-medium w-12">Fila</th>
                      <th className="px-3 py-2 text-left text-gray-500 font-medium w-20">Estado</th>
                      {headers.slice(0, 6).map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.slice(0, 50).map(row => (
                      <tr key={row.rowIndex} className={row.status === "error" ? "bg-red-50" : ""}>
                        <td className="px-3 py-1.5 text-gray-400">{row.rowIndex}</td>
                        <td className="px-3 py-1.5">
                          {row.status === "error" ? (
                            <span title={row.error} className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-3.5 w-3.5" /> Error
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5" /> OK
                            </span>
                          )}
                        </td>
                        {headers.slice(0, 6).map(h => (
                          <td key={h} className="px-3 py-1.5 truncate max-w-[120px]">{row.data[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 50 && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Mostrando 50 de {rows.length} filas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Result */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-6 w-6" /> Importación completada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-green-600">{okCount}</p>
                  <p className="text-sm text-green-700 mt-1">Registros importados</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-500">{errCount}</p>
                  <p className="text-sm text-red-600 mt-1">Registros con error</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => { setRows([]); setStep(1); setImportProgress(0); }} variant="outline">
                  <Upload className="h-4 w-4 mr-2" /> Nueva importación
                </Button>
                <Button onClick={() => window.location.href = "/debtors"}>
                  Ver deudores importados
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
