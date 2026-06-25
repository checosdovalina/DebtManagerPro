import { useState, useRef } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Client } from "@shared/schema";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  Download, ArrowRight, RefreshCw, Table2, Users, UserCheck,
  Info
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

type ImportType = "debtors" | "clients";
type ImportRow = Record<string, string>;
type RowStatus = "pending" | "ok" | "error";

interface ParsedRow {
  rowIndex: number;
  data: ImportRow;
  status: RowStatus;
  error?: string;
}

interface ImportResult {
  imported: number;
  errors: { row: number; error: string }[];
  total: number;
}

// ── Column definitions ────────────────────────────────────────────────────────

const DEBTOR_COLUMNS = [
  { key: "name", label: "Nombre", required: true },
  { key: "rfc", label: "RFC", required: false },
  { key: "phone", label: "Teléfono", required: false },
  { key: "email", label: "Email", required: false },
  { key: "street", label: "Calle", required: false },
  { key: "colony", label: "Colonia", required: false },
  { key: "zipCode", label: "Código Postal", required: false },
  { key: "city", label: "Ciudad", required: false },
  { key: "state", label: "Estado", required: false },
  { key: "concept", label: "Concepto", required: true },
  { key: "originalAmount", label: "Monto Original", required: true },
  { key: "dueDate", label: "Fecha Vencimiento (YYYY-MM-DD)", required: true },
  { key: "startDate", label: "Fecha Inicio (YYYY-MM-DD)", required: false },
];

const CLIENT_COLUMNS = [
  { key: "name", label: "Nombre / Razón Social", required: true },
  { key: "rfc", label: "RFC", required: true },
  { key: "personType", label: "Tipo (individual/empresa)", required: false },
  { key: "phone", label: "Teléfono", required: false },
  { key: "email", label: "Email", required: false },
  { key: "street", label: "Calle", required: false },
  { key: "colony", label: "Colonia", required: false },
  { key: "zipCode", label: "Código Postal", required: false },
  { key: "city", label: "Ciudad", required: false },
  { key: "state", label: "Estado", required: false },
  { key: "legalRepresentative", label: "Representante Legal", required: false },
  { key: "businessType", label: "Giro Comercial", required: false },
  { key: "notes", label: "Notas", required: false },
];

// ── Template download ─────────────────────────────────────────────────────────

function downloadTemplate(type: ImportType) {
  const columns = type === "debtors" ? DEBTOR_COLUMNS : CLIENT_COLUMNS;
  const headers = columns.map(c => c.label.replace(" (YYYY-MM-DD)", ""));

  const exampleDebtor = [
    "Juan García López", "GALJ850101ABC", "8441234567", "juan@email.com",
    "Av. Juárez 100", "Centro", "27000", "Torreón", "Coahuila",
    "Crédito personal", "50000", "2025-12-31", "2023-01-01",
  ];
  const exampleClient = [
    "Empresa ABC SA de CV", "EAB850101XYZ", "empresa", "8441234567", "contacto@empresa.com",
    "Blvd. Independencia 200", "Centro", "27000", "Torreón", "Coahuila",
    "María López", "Comercio al por menor", "Cliente importado",
  ];

  const example = type === "debtors" ? exampleDebtor : exampleClient;
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type === "debtors" ? "Deudores" : "Clientes");
  XLSX.writeFile(wb, `plantilla_importacion_${type === "debtors" ? "deudores" : "clientes"}.xlsx`);
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateRow(row: ImportRow, type: ImportType): string[] {
  const errors: string[] = [];
  const get = (...keys: string[]) => keys.map(k => row[k]).find(v => v && v.trim()) || "";

  if (type === "debtors") {
    const name = get("name", "Nombre", "NOMBRE");
    if (!name) errors.push("Nombre requerido");
    const concept = get("concept", "Concepto", "CONCEPTO");
    if (!concept) errors.push("Concepto requerido");
    const amount = get("originalAmount", "Monto Original", "Monto");
    if (!amount || isNaN(parseFloat(String(amount).replace(/[,$]/g, "")))) errors.push("Monto inválido");
    const dueDate = get("dueDate", "Fecha Vencimiento");
    if (!dueDate) errors.push("Fecha vencimiento requerida");
    else if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) errors.push("Fecha vencimiento debe ser YYYY-MM-DD");
  } else {
    const name = get("name", "Nombre", "Razón Social", "Razon Social", "NOMBRE");
    if (!name) errors.push("Nombre requerido");
    const rfc = get("rfc", "RFC");
    if (!rfc) errors.push("RFC requerido");
  }
  return errors;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportacionPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importType, setImportType] = useState<ImportType>("debtors");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  const importMutation = useMutation({
    mutationFn: async (payload: { type: ImportType; clientId?: number; rows: ImportRow[] }) => {
      const endpoint = payload.type === "debtors" ? "/api/import/debtors" : "/api/import/clients";
      const body = payload.type === "debtors"
        ? { clientId: payload.clientId, rows: payload.rows }
        : { rows: payload.rows };
      return apiRequest("POST", endpoint, body);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/debtors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setImportResult(data as ImportResult);
      setStep(3);
      toast({
        title: "Importación completada",
        description: `${data.imported} registros importados correctamente.${data.errors?.length ? ` ${data.errors.length} con errores.` : ""}`,
      });
    },
    onError: () => {
      toast({ title: "Error en importación", description: "No se pudo completar la importación.", variant: "destructive" });
    },
  });

  function handleTypeChange(t: ImportType) {
    setImportType(t);
    setRows([]);
    setHeaders([]);
    setStep(1);
    setImportResult(null);
    setSelectedClientId("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function parseFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "El archivo no puede superar 5 MB.", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();

    const processData = (rawRows: ImportRow[]) => {
      if (rawRows.length === 0) { toast({ title: "Archivo vacío", variant: "destructive" }); return; }
      const hdrs = Object.keys(rawRows[0]);
      setHeaders(hdrs);
      const parsed: ParsedRow[] = rawRows.map((row, i) => {
        const errors = validateRow(row, importType);
        return { rowIndex: i + 2, data: row, status: errors.length ? "error" : "pending", error: errors.join("; ") };
      });
      setRows(parsed);
      setStep(2);
    };

    if (ext === "csv") {
      Papa.parse<ImportRow>(file, { header: true, skipEmptyLines: true, complete: r => processData(r.data) });
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        const wb = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        processData(XLSX.utils.sheet_to_json<ImportRow>(ws, { defval: "" }));
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async function handleImport() {
    if (importType === "debtors" && !selectedClientId) {
      toast({ title: "Selecciona un cliente", variant: "destructive" }); return;
    }
    const validRows = rows.filter(r => r.status !== "error").map(r => r.data);
    if (validRows.length === 0) { toast({ title: "Sin registros válidos", variant: "destructive" }); return; }

    setImportProgress(10);
    const timer = setInterval(() => setImportProgress(p => Math.min(p + 12, 85)), 500);
    try {
      await importMutation.mutateAsync({
        type: importType,
        clientId: importType === "debtors" ? Number(selectedClientId) : undefined,
        rows: validRows,
      });
    } finally {
      clearInterval(timer);
      setImportProgress(100);
    }
  }

  function reset() {
    setRows([]);
    setHeaders([]);
    setStep(1);
    setImportProgress(0);
    setImportResult(null);
    setSelectedClientId("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const okCount = rows.filter(r => r.status !== "error").length;
  const errCount = rows.filter(r => r.status === "error").length;
  const columns = importType === "debtors" ? DEBTOR_COLUMNS : CLIENT_COLUMNS;
  const isDebtors = importType === "debtors";

  return (
    <Layout title="Importación Masiva">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Type selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Importación Masiva</h1>
            <p className="text-sm text-gray-500 mt-0.5">Importa clientes o deudores desde Excel o CSV</p>
          </div>
          <Tabs value={importType} onValueChange={v => handleTypeChange(v as ImportType)}>
            <TabsList>
              <TabsTrigger value="debtors" className="gap-2" data-testid="tab-import-debtors">
                <Users className="h-4 w-4" /> Deudores
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2" data-testid="tab-import-clients">
                <UserCheck className="h-4 w-4" /> Clientes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 text-sm">
          {[
            { n: 1, label: "Cargar archivo" },
            { n: 2, label: "Revisar datos" },
            { n: 3, label: "Resultado" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                ${step >= s.n ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
              </div>
              <span className={step >= s.n ? "font-medium" : "text-gray-400"}>{s.label}</span>
              {i < 2 && <ArrowRight className="h-4 w-4 text-gray-300" />}
            </div>
          ))}
        </div>

        {/* ─── Step 1: Upload ───────────────────────────────────────────────── */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Cargar archivo — {isDebtors ? "Deudores" : "Clientes"}
              </CardTitle>
              <CardDescription>
                Sube un archivo Excel (.xlsx, .xls) o CSV con los {isDebtors ? "deudores" : "clientes"} a importar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
                data-testid="dropzone-import"
              >
                <FileText className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                <p className="font-semibold text-gray-700 text-base">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                <p className="text-sm text-gray-400 mt-1">Formatos: .xlsx, .xls, .csv — Máximo 5 MB</p>
                <input
                  ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
                  data-testid="input-import-file"
                />
              </div>

              {/* Template download */}
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between flex-wrap gap-3">
                  <span>Descarga la plantilla con el formato correcto para importar {isDebtors ? "deudores" : "clientes"}</span>
                  <Button variant="outline" size="sm" onClick={() => downloadTemplate(importType)} data-testid="btn-download-template">
                    <Download className="h-4 w-4 mr-2" /> Plantilla Excel
                  </Button>
                </AlertDescription>
              </Alert>

              {/* Expected columns */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
                  <Table2 className="h-4 w-4" /> Columnas esperadas:
                </p>
                <div className="flex flex-wrap gap-2">
                  {columns.map(c => (
                    <Badge
                      key={c.key}
                      variant={c.required ? "default" : "secondary"}
                      className="text-xs"
                      data-testid={`badge-col-${c.key}`}
                    >
                      {c.label.replace(" (YYYY-MM-DD)", "")}
                      {c.required && <span className="ml-0.5 text-red-300"> *</span>}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Las columnas marcadas con * son obligatorias
                </p>
              </div>

              {isDebtors && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700 text-sm">
                    Al importar deudores, cada fila creará un deudor junto con su adeudo. Deberás seleccionar a qué cliente pertenecen en el siguiente paso.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Step 2: Review ───────────────────────────────────────────────── */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table2 className="h-5 w-5" /> Revisar datos — {isDebtors ? "Deudores" : "Clientes"}
              </CardTitle>
              <CardDescription>
                <span className="text-green-600 font-semibold">{okCount} registros válidos</span>
                {errCount > 0 && <span className="text-red-500 font-semibold ml-3">{errCount} con errores</span>}
                <span className="text-gray-400 ml-3">({rows.length} total)</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                {isDebtors && (
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-1.5 block">
                      Cliente al que pertenecen los deudores <span className="text-red-500">*</span>
                    </label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                      <SelectTrigger data-testid="select-client-import">
                        <SelectValue placeholder="Selecciona un cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className={`flex gap-2 ${isDebtors ? "" : "ml-auto"}`}>
                  <Button variant="outline" onClick={reset} data-testid="btn-change-file">
                    <RefreshCw className="h-4 w-4 mr-2" /> Cambiar archivo
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={importMutation.isPending || (isDebtors && !selectedClientId) || okCount === 0}
                    data-testid="btn-start-import"
                  >
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

              {errCount > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    {errCount} fila(s) tienen errores y serán omitidas. Solo se importarán las filas válidas.
                  </AlertDescription>
                </Alert>
              )}

              {/* Data table */}
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-3 py-2.5 text-left text-gray-500 font-semibold w-12">Fila</th>
                      <th className="px-3 py-2.5 text-left text-gray-500 font-semibold w-24">Estado</th>
                      {headers.slice(0, 7).map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-gray-500 font-semibold max-w-[130px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {rows.slice(0, 100).map(row => (
                      <tr key={row.rowIndex} className={row.status === "error" ? "bg-red-50" : "hover:bg-gray-50/50"}>
                        <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                        <td className="px-3 py-2">
                          {row.status === "error" ? (
                            <span title={row.error} className="flex items-center gap-1 text-red-600 cursor-help">
                              <XCircle className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate max-w-[80px]">Error</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> OK
                            </span>
                          )}
                        </td>
                        {headers.slice(0, 7).map(h => (
                          <td key={h} className="px-3 py-2 truncate max-w-[130px] text-gray-700" title={String(row.data[h] ?? "")}>
                            {row.data[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 100 && (
                  <p className="text-xs text-gray-400 text-center py-2 border-t bg-gray-50">
                    Mostrando 100 de {rows.length} filas
                  </p>
                )}
              </div>

              {/* Error details */}
              {errCount > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-red-600 font-medium hover:text-red-700">
                    Ver detalle de errores ({errCount})
                  </summary>
                  <ul className="mt-2 space-y-1 pl-4">
                    {rows.filter(r => r.status === "error").map(r => (
                      <li key={r.rowIndex} className="text-red-600">
                        Fila {r.rowIndex}: {r.error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─── Step 3: Result ───────────────────────────────────────────────── */}
        {step === 3 && importResult && (
          <Card>
            <CardHeader>
              <CardTitle className={`flex items-center gap-2 ${importResult.imported > 0 ? "text-green-600" : "text-red-600"}`}>
                {importResult.imported > 0
                  ? <><CheckCircle2 className="h-6 w-6" /> Importación completada</>
                  : <><XCircle className="h-6 w-6" /> Importación con errores</>
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center border">
                  <p className="text-3xl font-bold text-gray-700">{importResult.total}</p>
                  <p className="text-sm text-gray-500 mt-1">Total procesados</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                  <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                  <p className="text-sm text-green-700 mt-1">Importados</p>
                </div>
                <div className={`rounded-xl p-4 text-center border ${importResult.errors.length > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border"}`}>
                  <p className={`text-3xl font-bold ${importResult.errors.length > 0 ? "text-red-500" : "text-gray-400"}`}>
                    {importResult.errors.length}
                  </p>
                  <p className={`text-sm mt-1 ${importResult.errors.length > 0 ? "text-red-600" : "text-gray-500"}`}>Con error</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="border border-red-200 rounded-xl overflow-hidden">
                  <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                    <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" /> Filas con error
                    </p>
                  </div>
                  <ul className="divide-y divide-red-100 max-h-48 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <li key={i} className="px-4 py-2 text-xs flex gap-3">
                        <span className="font-medium text-gray-500">Fila {e.row}:</span>
                        <span className="text-red-600">{e.error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                <Button onClick={reset} variant="outline" data-testid="btn-new-import">
                  <Upload className="h-4 w-4 mr-2" /> Nueva importación
                </Button>
                <Button
                  onClick={() => window.location.href = isDebtors ? "/debtors" : "/clients"}
                  data-testid="btn-view-imported"
                >
                  Ver {isDebtors ? "deudores" : "clientes"} importados
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
