import { useState, useRef } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Client } from "@shared/schema";
import {
  Upload, FileText, CheckCircle2, XCircle, AlertTriangle,
  Download, ArrowRight, RefreshCw, Table2, Users, UserCheck,
  Info, Building2, ClipboardList, Calendar, DollarSign, MessageSquare, MapPin
} from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportMode = "expediente" | "debtors" | "clients";
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

interface DebtData {
  concept: string;
  originalAmount: number;
  currentBalance: number;
}

interface PaymentData {
  paymentNumber: number;
  amount: number;
  date: string;
  newBalance: number;
  debtConcept: string;
}

interface ActivityEntry {
  date: string;
  time: string;
  comment: string;
  promise: string;
}

interface VisitEntry {
  reportNumber: string;
  date: string;
  content: string;
  commitment: string;
  nextReport: string;
}

interface ExpedienteData {
  fileName: string;
  debtorName: string;
  debtorPhone: string;
  debtorAddress: string;
  debtorContact: string;
  debtorNotes: string;
  debtorService: string;
  clientName: string;
  clientRfc: string;
  clientStreet: string;
  clientColony: string;
  clientEmail: string;
  clientCity: string;
  clientZipCode: string;
  clientState: string;
  clientPhone: string;
  clientBusinessType: string;
  fechaAlta: string;
  debts: DebtData[];
  payments: PaymentData[];
  activityLogs: ActivityEntry[];
  visits: VisitEntry[];
  parseErrors: string[];
}

// ── Excel date helper ─────────────────────────────────────────────────────────

function excelDateToString(serial: unknown): string {
  if (!serial || typeof serial !== "number") return "";
  const d = new Date((serial - 25569) * 86400 * 1000);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

function str(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

// ── Marelli / DCS expediente parser ──────────────────────────────────────────

function parseExpediente(arrayBuffer: ArrayBuffer, fileName: string): ExpedienteData {
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const parseErrors: string[] = [];

  const getSheet = (name: string) => {
    const match = wb.SheetNames.find(n => n.toLowerCase().includes(name.toLowerCase()));
    if (!match) return null;
    return XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[match], { header: 1, defval: "" });
  };

  const genRows = getSheet("Datos Generales") || getSheet("General") || [];
  const adeudoRows = getSheet("Adeudo") || [];
  const bitacoraRows = getSheet("Bit") || getSheet("Bitacora") || [];
  const visitRows = getSheet("Visitas") || getSheet("Visit") || [];

  const gv = (row: number, col: number): string => str((genRows[row] as unknown[])?.[col] ?? "");

  // ── Datos Generales ──────────────────────────────────────────────────────
  const debtorName = gv(1, 3) || fileName.replace(/\.[^.]+$/, "").replace(/_/g, " ");
  const fechaAltaSerial = (genRows[2] as unknown[])?.[13];
  const fechaAlta = excelDateToString(fechaAltaSerial as number);
  const debtorService = gv(7, 3);
  const debtorAddress = gv(9, 3);
  const debtorPhone = gv(11, 3);
  const debtorContact = gv(13, 3);
  const debtorNotes = gv(14, 3);

  const clientName = gv(25, 1);
  const clientRfc = gv(25, 8);
  const clientStreet = gv(26, 1);
  const clientColony = gv(26, 5);
  const clientEmail = gv(26, 8);
  const clientCity = gv(27, 1);
  const clientZipCodeRaw = (genRows[27] as unknown[])?.[5];
  const clientZipCode = clientZipCodeRaw ? String(clientZipCodeRaw) : "";
  const clientState = gv(27, 8);
  const clientPhone = gv(28, 1);
  const clientBusinessType = gv(28, 4);

  // ── Adeudo ────────────────────────────────────────────────────────────────
  const debts: DebtData[] = [];
  const payments: PaymentData[] = [];

  // Parse debts from row index 1 — can have up to 2 debts side-by-side
  const debtSlots = [
    { colStart: 0, amtCol: 1, conceptCol: 2 },
    { colStart: 7, amtCol: 8, conceptCol: 9 },
  ];

  const debtOriginals: { concept: string; amount: number }[] = [];

  for (const slot of debtSlots) {
    let foundDebt = false;
    for (let ri = 0; ri < Math.min(adeudoRows.length, 5); ri++) {
      const row = adeudoRows[ri] as unknown[];
      const label = str(row[slot.colStart]);
      if (label.toLowerCase().includes("adeudo")) {
        const amount = Number(row[slot.amtCol]) || 0;
        const concept = str(row[slot.conceptCol]);
        if (amount > 0 && concept) {
          debtOriginals.push({ concept, amount });
          foundDebt = true;
          break;
        }
      }
    }
    if (!foundDebt) break; // no second debt
  }

  // Find the payment table header rows and parse payments per debt
  // Payments table structure: header row has "No. Abono", data follows until "Tot.Abonos"
  for (let slotIdx = 0; slotIdx < debtSlots.length && slotIdx < debtOriginals.length; slotIdx++) {
    const slot = debtSlots[slotIdx];
    const orig = debtOriginals[slotIdx];
    let headerRow = -1;
    let totalAbonos = 0;

    for (let ri = 0; ri < adeudoRows.length; ri++) {
      const row = adeudoRows[ri] as unknown[];
      const cell = str(row[slot.colStart]);
      if (cell.toLowerCase().includes("no. abono") || cell.toLowerCase().includes("num")) {
        headerRow = ri;
        break;
      }
    }

    if (headerRow >= 0) {
      for (let ri = headerRow + 1; ri < adeudoRows.length; ri++) {
        const row = adeudoRows[ri] as unknown[];
        const noAbono = row[slot.colStart];
        const amountRaw = row[slot.colStart + 1];
        const dateRaw = row[slot.colStart + 2];
        const newBalRaw = row[slot.colStart + 3];

        const cellLabel = str(row[slot.colStart]);
        if (cellLabel.toLowerCase().includes("tot")) {
          totalAbonos = Number(amountRaw) || 0;
          break;
        }

        const amount = Number(amountRaw) || 0;
        if (!noAbono || amount === 0) continue;

        const dateStr = typeof dateRaw === "number"
          ? excelDateToString(dateRaw)
          : str(dateRaw);

        if (dateStr) {
          payments.push({
            paymentNumber: Number(noAbono),
            amount,
            date: dateStr,
            newBalance: Number(newBalRaw) || 0,
            debtConcept: orig.concept,
          });
        }
      }
    }

    // currentBalance = original - totalAbonos (or last newBalance from payments)
    const lastPayment = payments.filter(p => p.debtConcept === orig.concept).slice(-1)[0];
    const currentBalance = lastPayment?.newBalance ?? orig.amount;

    debts.push({
      concept: orig.concept,
      originalAmount: orig.amount,
      currentBalance,
    });
  }

  if (debts.length === 0) {
    parseErrors.push("No se encontraron adeudos en la hoja 'Adeudo'");
  }

  // ── Bitácora ──────────────────────────────────────────────────────────────
  const activityLogs: ActivityEntry[] = [];
  if (bitacoraRows.length > 1) {
    for (let ri = 1; ri < bitacoraRows.length; ri++) {
      const row = bitacoraRows[ri] as unknown[];
      const dateRaw = row[0];
      const time = str(row[1]);
      const comment = str(row[2]);
      const promise = str(row[3]);

      if (!dateRaw && !comment) continue;

      const dateStr = typeof dateRaw === "number"
        ? excelDateToString(dateRaw)
        : str(dateRaw);

      if (comment) {
        activityLogs.push({ date: dateStr, time, comment, promise });
      }
    }
  }

  // ── Datos de Visitas ──────────────────────────────────────────────────────
  const visits: VisitEntry[] = [];
  if (visitRows.length > 1) {
    for (let ri = 1; ri < visitRows.length; ri++) {
      const row = visitRows[ri] as unknown[];
      const reportNumber = str(row[0]);
      const dateRaw = row[1];
      const content = str(row[2]);
      const commitment = str(row[3]);
      const nextReport = str(row[4]);

      if (!content && !reportNumber) continue;

      const dateStr = typeof dateRaw === "number"
        ? excelDateToString(dateRaw)
        : str(dateRaw);

      if (content) {
        visits.push({ reportNumber, date: dateStr, content, commitment, nextReport });
      }
    }
  }

  return {
    fileName,
    debtorName,
    debtorPhone,
    debtorAddress,
    debtorContact,
    debtorNotes,
    debtorService,
    clientName,
    clientRfc,
    clientStreet,
    clientColony,
    clientEmail,
    clientCity,
    clientZipCode,
    clientState,
    clientPhone,
    clientBusinessType,
    fechaAlta,
    debts,
    payments,
    activityLogs,
    visits,
    parseErrors,
  };
}

// ── Legacy columns for bulk import ────────────────────────────────────────────

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
];

function downloadTemplate(type: "debtors" | "clients") {
  const columns = type === "debtors" ? DEBTOR_COLUMNS : CLIENT_COLUMNS;
  const headers = columns.map(c => c.label.replace(" (YYYY-MM-DD)", ""));
  const exampleDebtor = ["Juan García López", "GALJ850101ABC", "8441234567", "juan@email.com", "Av. Juárez 100", "Centro", "27000", "Torreón", "Coahuila", "Crédito personal", "50000", "2025-12-31"];
  const exampleClient = ["Empresa ABC SA de CV", "EAB850101XYZ", "empresa", "8441234567", "contacto@empresa.com", "Blvd. Independencia 200", "Centro", "27000", "Torreón", "Coahuila"];
  const example = type === "debtors" ? exampleDebtor : exampleClient;
  const ws = XLSX.utils.aoa_to_sheet([headers, example]);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  const wb2 = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb2, ws, type === "debtors" ? "Deudores" : "Clientes");
  XLSX.writeFile(wb2, `plantilla_${type === "debtors" ? "deudores" : "clientes"}.xlsx`);
}

function validateLegacyRow(row: ImportRow, type: "debtors" | "clients"): string[] {
  const errors: string[] = [];
  const get = (...keys: string[]) => keys.map(k => row[k]).find(v => v && v.trim()) || "";
  if (type === "debtors") {
    if (!get("name", "Nombre", "NOMBRE")) errors.push("Nombre requerido");
    if (!get("concept", "Concepto", "CONCEPTO")) errors.push("Concepto requerido");
    const amount = get("originalAmount", "Monto Original", "Monto");
    if (!amount || isNaN(parseFloat(String(amount).replace(/[,$]/g, "")))) errors.push("Monto inválido");
    if (!get("dueDate", "Fecha Vencimiento")) errors.push("Fecha vencimiento requerida");
  } else {
    if (!get("name", "Nombre", "Razón Social", "NOMBRE")) errors.push("Nombre requerido");
    if (!get("rfc", "RFC")) errors.push("RFC requerido");
  }
  return errors;
}

// ── Format currency ────────────────────────────────────────────────────────────

function fmtMXN(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2 }).format(n);
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ImportacionPage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<ImportMode>("expediente");

  // ── Expediente state ────────────────────────────────────────────────────────
  const [expediente, setExpediente] = useState<ExpedienteData | null>(null);
  const [expedienteClientId, setExpedienteClientId] = useState<string>("");
  const [createNewClient, setCreateNewClient] = useState(false);
  const [expedienteStep, setExpedienteStep] = useState<1 | 2 | 3>(1);
  const [expedienteResult, setExpedienteResult] = useState<any>(null);

  // ── Legacy bulk state ───────────────────────────────────────────────────────
  const [legacyType, setLegacyType] = useState<"debtors" | "clients">("debtors");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [legacyStep, setLegacyStep] = useState<1 | 2 | 3>(1);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  // ── Expediente import mutation ──────────────────────────────────────────────
  const expedienteMutation = useMutation({
    mutationFn: async (payload: any) => apiRequest("POST", "/api/import/expediente", payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/debtors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setExpedienteResult(data);
      setExpedienteStep(3);
      const clientMsg = data.clientCreated ? " · Cliente creado automáticamente." : "";
      toast({ title: "Expediente importado", description: `Deudor "${expediente?.debtorName}" creado con ${data.debtsCreated} adeudo(s).${clientMsg}` });
    },
    onError: (e: any) => {
      toast({ title: "Error al importar", description: e?.message || "No se pudo importar el expediente.", variant: "destructive" });
    },
  });

  // ── Legacy import mutation ──────────────────────────────────────────────────
  const legacyMutation = useMutation({
    mutationFn: async (payload: { type: "debtors" | "clients"; clientId?: number; rows: ImportRow[] }) => {
      const endpoint = payload.type === "debtors" ? "/api/import/debtors" : "/api/import/clients";
      const body = payload.type === "debtors" ? { clientId: payload.clientId, rows: payload.rows } : { rows: payload.rows };
      return apiRequest("POST", endpoint, body);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/debtors"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setImportResult(data as ImportResult);
      setLegacyStep(3);
      toast({ title: "Importación completada", description: `${data.imported} registros importados.` });
    },
    onError: () => {
      toast({ title: "Error en importación", description: "No se pudo completar la importación.", variant: "destructive" });
    },
  });

  // ── Expediente file handler ─────────────────────────────────────────────────
  function handleExpedienteFile(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Archivo muy grande", description: "El archivo no puede superar 10 MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = parseExpediente(e.target?.result as ArrayBuffer, file.name);
        setExpediente(data);

        // Auto-match client by name or RFC
        if (data.clientName || data.clientRfc) {
          const match = clients.find(c =>
            (data.clientRfc && c.rfc.toLowerCase() === data.clientRfc.toLowerCase()) ||
            c.name.toLowerCase() === data.clientName.toLowerCase()
          );
          if (match) {
            // Found existing client — link to it
            setExpedienteClientId(String(match.id));
            setCreateNewClient(false);
          } else if (data.clientName) {
            // No match but has data — will create new client automatically
            setExpedienteClientId("");
            setCreateNewClient(true);
          } else {
            setExpedienteClientId("");
            setCreateNewClient(false);
          }
        } else {
          setExpedienteClientId("");
          setCreateNewClient(false);
        }

        setExpedienteStep(2);
      } catch (err: any) {
        toast({ title: "Error al leer el archivo", description: err.message || "Formato no reconocido.", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleExpedienteImport() {
    if (!expediente) return;
    if (!createNewClient && !expedienteClientId) {
      toast({ title: "Selecciona un cliente", description: "Debes asignar este expediente a un cliente.", variant: "destructive" });
      return;
    }
    const payload: any = {
      debtorData: {
        name: expediente.debtorName,
        phone: expediente.debtorPhone,
        address: expediente.debtorAddress,
        contact: expediente.debtorContact,
        notes: [expediente.debtorNotes, expediente.debtorService].filter(Boolean).join("\n"),
        fechaAlta: expediente.fechaAlta,
      },
      debts: expediente.debts,
      payments: expediente.payments,
      activityLogs: expediente.activityLogs,
      visits: expediente.visits,
    };

    if (createNewClient) {
      payload.createClient = true;
      payload.clientData = {
        name: expediente.clientName,
        rfc: expediente.clientRfc,
        phone: expediente.clientPhone,
        email: expediente.clientEmail,
        street: expediente.clientStreet,
        colony: expediente.clientColony,
        zipCode: expediente.clientZipCode,
        city: expediente.clientCity,
        state: expediente.clientState,
        businessType: expediente.clientBusinessType,
      };
    } else {
      payload.clientId = Number(expedienteClientId);
    }

    await expedienteMutation.mutateAsync(payload);
  }

  function resetExpediente() {
    setExpediente(null);
    setExpedienteClientId("");
    setCreateNewClient(false);
    setExpedienteStep(1);
    setExpedienteResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ── Legacy file handler ─────────────────────────────────────────────────────
  function parseLegacyFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Archivo demasiado grande", description: "El archivo no puede superar 5 MB.", variant: "destructive" });
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    const processData = (rawRows: ImportRow[]) => {
      if (rawRows.length === 0) { toast({ title: "Archivo vacío", variant: "destructive" }); return; }
      setHeaders(Object.keys(rawRows[0]));
      setRows(rawRows.map((row, i) => {
        const errors = validateLegacyRow(row, legacyType);
        return { rowIndex: i + 2, data: row, status: errors.length ? "error" : "pending", error: errors.join("; ") };
      }));
      setLegacyStep(2);
    };
    if (ext === "csv") {
      Papa.parse<ImportRow>(file, { header: true, skipEmptyLines: true, complete: r => processData(r.data) });
    } else {
      const reader = new FileReader();
      reader.onload = e => {
        const wb2 = XLSX.read(e.target?.result, { type: "array" });
        const ws = wb2.Sheets[wb2.SheetNames[0]];
        processData(XLSX.utils.sheet_to_json<ImportRow>(ws, { defval: "" }));
      };
      reader.readAsArrayBuffer(file);
    }
  }

  async function handleLegacyImport() {
    if (legacyType === "debtors" && !selectedClientId) {
      toast({ title: "Selecciona un cliente", variant: "destructive" }); return;
    }
    const validRows = rows.filter(r => r.status !== "error").map(r => r.data);
    if (validRows.length === 0) { toast({ title: "Sin registros válidos", variant: "destructive" }); return; }
    setImportProgress(10);
    const timer = setInterval(() => setImportProgress(p => Math.min(p + 12, 85)), 500);
    try {
      await legacyMutation.mutateAsync({ type: legacyType, clientId: legacyType === "debtors" ? Number(selectedClientId) : undefined, rows: validRows });
    } finally {
      clearInterval(timer);
      setImportProgress(100);
    }
  }

  function resetLegacy() {
    setRows([]); setHeaders([]); setLegacyStep(1);
    setImportProgress(0); setImportResult(null); setSelectedClientId("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const okCount = rows.filter(r => r.status !== "error").length;
  const errCount = rows.filter(r => r.status === "error").length;
  const legacyColumns = legacyType === "debtors" ? DEBTOR_COLUMNS : CLIENT_COLUMNS;
  const totalDebt = expediente?.debts.reduce((s, d) => s + d.originalAmount, 0) ?? 0;
  const totalBalance = expediente?.debts.reduce((s, d) => s + d.currentBalance, 0) ?? 0;

  return (
    <Layout title="Importación">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* Mode tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Importación</h1>
            <p className="text-sm text-gray-500 mt-0.5">Importa expedientes o registros masivos desde Excel</p>
          </div>
          <Tabs value={importMode} onValueChange={v => {
            setImportMode(v as ImportMode);
            resetExpediente(); resetLegacy();
          }}>
            <TabsList>
              <TabsTrigger value="expediente" className="gap-2" data-testid="tab-import-expediente">
                <ClipboardList className="h-4 w-4" /> Expediente DCS
              </TabsTrigger>
              <TabsTrigger value="debtors" className="gap-2" data-testid="tab-import-debtors">
                <Users className="h-4 w-4" /> Deudores
              </TabsTrigger>
              <TabsTrigger value="clients" className="gap-2" data-testid="tab-import-clients">
                <UserCheck className="h-4 w-4" /> Clientes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            EXPEDIENTE MODE
        ══════════════════════════════════════════════════════════════════════ */}
        {importMode === "expediente" && (
          <>
            {/* Steps */}
            <div className="flex items-center gap-2 text-sm">
              {[{ n: 1, label: "Cargar expediente" }, { n: 2, label: "Revisar datos" }, { n: 3, label: "Resultado" }].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                    ${expedienteStep >= s.n ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                    {expedienteStep > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                  </div>
                  <span className={expedienteStep >= s.n ? "font-medium" : "text-gray-400"}>{s.label}</span>
                  {i < 2 && <ArrowRight className="h-4 w-4 text-gray-300" />}
                </div>
              ))}
            </div>

            {/* Step 1: Upload */}
            {expedienteStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" /> Cargar expediente DCS
                  </CardTitle>
                  <CardDescription>
                    Sube un expediente en formato DCS (archivo .xls o .xlsx con pestañas: Datos Generales, Adeudo, Bitácora, Visitas)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleExpedienteFile(f); }}
                    data-testid="dropzone-expediente"
                  >
                    <ClipboardList className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-gray-700 text-base">Arrastra el expediente aquí o haz clic para seleccionar</p>
                    <p className="text-sm text-gray-400 mt-1">Formato: .xls / .xlsx — Máximo 10 MB</p>
                    <input
                      ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleExpedienteFile(f); }}
                      data-testid="input-expediente-file"
                    />
                  </div>

                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700 text-sm space-y-1">
                      <p className="font-semibold">Formato esperado (Expediente DCS):</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li><strong>Datos Generales</strong> — Nombre del deudor, datos del cliente, domicilio, teléfonos</li>
                        <li><strong>Adeudo</strong> — Montos originales y tabla de abonos</li>
                        <li><strong>Bitácora</strong> — Historial de gestiones (fecha, hora, comentario)</li>
                        <li><strong>Datos de Visitas</strong> — Reportes de visitas realizadas</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Review */}
            {expedienteStep === 2 && expediente && (
              <div className="space-y-4">
                {expediente.parseErrors.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 text-sm">
                      {expediente.parseErrors.join(" · ")}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Header with actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {expediente.debtorName || "Sin nombre"}
                        </CardTitle>
                        <CardDescription className="mt-0.5">{expediente.fileName}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={resetExpediente} data-testid="btn-change-expediente">
                          <RefreshCw className="h-4 w-4 mr-2" /> Cambiar archivo
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleExpedienteImport}
                          disabled={expedienteMutation.isPending || (!createNewClient && !expedienteClientId)}
                          data-testid="btn-import-expediente"
                        >
                          {expedienteMutation.isPending
                            ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Importando...</>
                            : <><Upload className="h-4 w-4 mr-2" /> Importar expediente</>}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Client assignment */}
                    <div className="mb-2">
                      <label className="text-sm font-medium mb-2 block">
                        Cliente al que pertenece este deudor
                      </label>

                      {/* Auto-create banner */}
                      {createNewClient && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-green-800">
                                Se creará el cliente: <span className="font-bold">{expediente.clientName}</span>
                              </p>
                              <p className="text-xs text-green-700 mt-0.5">
                                RFC: {expediente.clientRfc || "—"} · No existe en el sistema — se creará automáticamente
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-green-700 hover:text-green-900 shrink-0"
                            onClick={() => setCreateNewClient(false)}
                            data-testid="btn-use-existing-client"
                          >
                            Usar existente
                          </Button>
                        </div>
                      )}

                      {/* Existing client matched */}
                      {!createNewClient && expedienteClientId && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-sm font-semibold text-blue-800">
                                Cliente vinculado: <span className="font-bold">{clients.find(c => String(c.id) === expedienteClientId)?.name}</span>
                              </p>
                              <p className="text-xs text-blue-700 mt-0.5">Se encontró en el sistema y se vinculará automáticamente</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-700 hover:text-blue-900 shrink-0"
                            onClick={() => setExpedienteClientId("")}
                            data-testid="btn-change-client"
                          >
                            Cambiar
                          </Button>
                        </div>
                      )}

                      {/* Manual selector — shown when no auto-match and not creating new */}
                      {!createNewClient && !expedienteClientId && (
                        <div className="space-y-2">
                          <Select value={expedienteClientId} onValueChange={setExpedienteClientId}>
                            <SelectTrigger data-testid="select-expediente-client">
                              <SelectValue placeholder="Selecciona un cliente existente..." />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map(c => (
                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {expediente.clientName && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-green-700 border-green-300 hover:bg-green-50"
                              onClick={() => setCreateNewClient(true)}
                              data-testid="btn-create-client-from-file"
                            >
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Crear nuevo cliente "{expediente.clientName}" desde el expediente
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Debtor info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Datos del Deudor
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <InfoRow label="Nombre" value={expediente.debtorName} />
                      {expediente.fechaAlta && <InfoRow label="Fecha alta" value={expediente.fechaAlta} />}
                      {expediente.debtorPhone && <InfoRow label="Teléfono" value={expediente.debtorPhone} icon={<MapPin className="h-3 w-3" />} />}
                      {expediente.debtorAddress && <InfoRow label="Domicilio" value={expediente.debtorAddress} />}
                      {expediente.debtorContact && <InfoRow label="Contacto" value={expediente.debtorContact} />}
                      {expediente.debtorService && <InfoRow label="Servicio/Mercancía" value={expediente.debtorService} />}
                      {expediente.debtorNotes && (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">Notas</p>
                          <p className="text-xs text-gray-700 bg-gray-50 rounded p-2 line-clamp-3">{expediente.debtorNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Client info from file */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" /> Cliente (en expediente)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <InfoRow label="Nombre" value={expediente.clientName || "—"} />
                      <InfoRow label="RFC" value={expediente.clientRfc || "—"} />
                      {expediente.clientPhone && <InfoRow label="Teléfono" value={expediente.clientPhone} />}
                      {expediente.clientEmail && <InfoRow label="Email" value={expediente.clientEmail} />}
                      {expediente.clientCity && <InfoRow label="Ciudad" value={`${expediente.clientCity}${expediente.clientState ? ", " + expediente.clientState : ""}`} />}
                      {expediente.clientStreet && <InfoRow label="Calle" value={expediente.clientStreet} />}
                      {expediente.clientBusinessType && <InfoRow label="Giro" value={expediente.clientBusinessType} />}
                    </CardContent>
                  </Card>
                </div>

                {/* Debts summary */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      Adeudos ({expediente.debts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {expediente.debts.length === 0 ? (
                      <p className="text-sm text-gray-400 italic">No se encontraron adeudos</p>
                    ) : (
                      <div className="space-y-2">
                        {expediente.debts.map((d, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div>
                              <p className="font-medium text-sm">{d.concept}</p>
                              <p className="text-xs text-gray-500">
                                {expediente.payments.filter(p => p.debtConcept === d.concept).length} abono(s) registrados
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Original: {fmtMXN(d.originalAmount)}</p>
                              <p className={`font-semibold text-sm ${d.currentBalance < d.originalAmount ? "text-green-600" : "text-red-600"}`}>
                                Saldo: {fmtMXN(d.currentBalance)}
                              </p>
                            </div>
                          </div>
                        ))}
                        <Separator />
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Total original:</span>
                          <span>{fmtMXN(totalDebt)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold text-red-600">
                          <span>Saldo pendiente:</span>
                          <span>{fmtMXN(totalBalance)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary chips */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SummaryChip icon={<DollarSign className="h-4 w-4" />} label="Abonos" value={expediente.payments.length} color="blue" />
                  <SummaryChip icon={<MessageSquare className="h-4 w-4" />} label="Bitácora" value={expediente.activityLogs.length} color="purple" />
                  <SummaryChip icon={<MapPin className="h-4 w-4" />} label="Visitas" value={expediente.visits.length} color="green" />
                  <SummaryChip icon={<Calendar className="h-4 w-4" />} label="Fecha alta" value={expediente.fechaAlta || "—"} color="gray" />
                </div>

                {/* Activity log preview */}
                {expediente.activityLogs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Bitácora ({expediente.activityLogs.length} entradas)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {expediente.activityLogs.slice(0, 20).map((a, i) => (
                          <div key={i} className="flex gap-3 text-xs border-b pb-2 last:border-0">
                            <div className="text-gray-400 whitespace-nowrap">{a.date} {a.time}</div>
                            <div className="text-gray-700 line-clamp-2">{a.comment}</div>
                          </div>
                        ))}
                        {expediente.activityLogs.length > 20 && (
                          <p className="text-xs text-gray-400 text-center">
                            + {expediente.activityLogs.length - 20} entradas más
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Step 3: Result */}
            {expedienteStep === 3 && expedienteResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-6 w-6" /> Expediente importado correctamente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <SummaryChip icon={<Users className="h-4 w-4" />} label="Deudor" value={1} color="blue" />
                    <SummaryChip icon={<DollarSign className="h-4 w-4" />} label="Adeudos" value={expedienteResult.debtsCreated ?? 0} color="green" />
                    <SummaryChip icon={<MessageSquare className="h-4 w-4" />} label="Bitácora" value={expedienteResult.activityLogsCreated ?? 0} color="purple" />
                    <SummaryChip icon={<MapPin className="h-4 w-4" />} label="Visitas" value={expedienteResult.visitsCreated ?? 0} color="gray" />
                  </div>
                  {expedienteResult.paymentsCreated > 0 && (
                    <p className="text-sm text-gray-600">
                      También se registraron <strong>{expedienteResult.paymentsCreated}</strong> abono(s) en el historial de pagos.
                    </p>
                  )}
                  <div className="flex gap-3">
                    <Button onClick={resetExpediente} data-testid="btn-import-another">
                      <Upload className="h-4 w-4 mr-2" /> Importar otro expediente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════
            LEGACY BULK IMPORT (Debtors / Clients)
        ══════════════════════════════════════════════════════════════════════ */}
        {(importMode === "debtors" || importMode === "clients") && (
          <>
            {/* Sub-tab sync */}
            {importMode !== legacyType && (() => { setLegacyType(importMode as "debtors" | "clients"); return null; })()}

            {/* Steps */}
            <div className="flex items-center gap-2 text-sm">
              {[{ n: 1, label: "Cargar archivo" }, { n: 2, label: "Revisar datos" }, { n: 3, label: "Resultado" }].map((s, i) => (
                <div key={s.n} className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold
                    ${legacyStep >= s.n ? "bg-primary text-white" : "bg-gray-200 text-gray-500"}`}>
                    {legacyStep > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
                  </div>
                  <span className={legacyStep >= s.n ? "font-medium" : "text-gray-400"}>{s.label}</span>
                  {i < 2 && <ArrowRight className="h-4 w-4 text-gray-300" />}
                </div>
              ))}
            </div>

            {/* Step 1 */}
            {legacyStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Importar {importMode === "debtors" ? "Deudores" : "Clientes"} en masa
                  </CardTitle>
                  <CardDescription>
                    Sube un archivo Excel o CSV con una fila por {importMode === "debtors" ? "deudor" : "cliente"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) parseLegacyFile(f); }}
                    data-testid="dropzone-import"
                  >
                    <FileText className="h-14 w-14 mx-auto text-gray-300 mb-3" />
                    <p className="font-semibold text-gray-700 text-base">Arrastra tu archivo aquí o haz clic para seleccionar</p>
                    <p className="text-sm text-gray-400 mt-1">Formatos: .xlsx, .xls, .csv — Máximo 5 MB</p>
                    <input
                      ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) parseLegacyFile(f); }}
                      data-testid="input-import-file"
                    />
                  </div>

                  <Alert>
                    <Download className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between flex-wrap gap-3">
                      <span>Descarga la plantilla con el formato correcto</span>
                      <Button variant="outline" size="sm" onClick={() => downloadTemplate(legacyType)} data-testid="btn-download-template">
                        <Download className="h-4 w-4 mr-2" /> Plantilla Excel
                      </Button>
                    </AlertDescription>
                  </Alert>

                  <div className="bg-gray-50 rounded-xl p-4 border">
                    <p className="text-sm font-semibold mb-3 flex items-center gap-2 text-gray-700">
                      <Table2 className="h-4 w-4" /> Columnas esperadas:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {legacyColumns.map(c => (
                        <Badge key={c.key} variant={c.required ? "default" : "secondary"} className="text-xs" data-testid={`badge-col-${c.key}`}>
                          {c.label.replace(" (YYYY-MM-DD)", "")}
                          {c.required && <span className="ml-0.5 text-red-300"> *</span>}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                      <Info className="h-3 w-3" /> Las columnas marcadas con * son obligatorias
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2 */}
            {legacyStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Table2 className="h-5 w-5" /> Revisar datos
                  </CardTitle>
                  <CardDescription>
                    <span className="text-green-600 font-semibold">{okCount} registros válidos</span>
                    {errCount > 0 && <span className="text-red-500 font-semibold ml-3">{errCount} con errores</span>}
                    <span className="text-gray-400 ml-3">({rows.length} total)</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    {legacyType === "debtors" && (
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
                    <div className={`flex gap-2 ${legacyType === "debtors" ? "" : "ml-auto"}`}>
                      <Button variant="outline" onClick={resetLegacy} data-testid="btn-change-file">
                        <RefreshCw className="h-4 w-4 mr-2" /> Cambiar archivo
                      </Button>
                      <Button
                        onClick={handleLegacyImport}
                        disabled={legacyMutation.isPending || (legacyType === "debtors" && !selectedClientId) || okCount === 0}
                        data-testid="btn-start-import"
                      >
                        {legacyMutation.isPending
                          ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Importando...</>
                          : <><Upload className="h-4 w-4 mr-2" /> Importar {okCount} registros</>}
                      </Button>
                    </div>
                  </div>

                  {legacyMutation.isPending && (
                    <div className="space-y-1">
                      <Progress value={importProgress} className="h-2" />
                      <p className="text-xs text-gray-500 text-center">Importando registros...</p>
                    </div>
                  )}

                  {errCount > 0 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 text-sm">
                        {errCount} fila(s) tienen errores y serán omitidas.
                      </AlertDescription>
                    </Alert>
                  )}

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

                  {errCount > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-red-600 font-medium hover:text-red-700">
                        Ver detalle de errores ({errCount})
                      </summary>
                      <ul className="mt-2 space-y-1 pl-4">
                        {rows.filter(r => r.status === "error").map(r => (
                          <li key={r.rowIndex} className="text-red-600">Fila {r.rowIndex}: {r.error}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3 */}
            {legacyStep === 3 && importResult && (
              <Card>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${importResult.imported > 0 ? "text-green-600" : "text-red-600"}`}>
                    {importResult.imported > 0
                      ? <><CheckCircle2 className="h-6 w-6" /> Importación completada</>
                      : <><XCircle className="h-6 w-6" /> Importación con errores</>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center border">
                      <p className="text-3xl font-bold text-gray-700">{importResult.total}</p>
                      <p className="text-xs text-gray-500 mt-1">Total registros</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                      <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                      <p className="text-xs text-green-600 mt-1">Importados</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                      <p className="text-3xl font-bold text-red-500">{importResult.errors?.length ?? 0}</p>
                      <p className="text-xs text-red-500 mt-1">Errores</p>
                    </div>
                  </div>
                  <Button onClick={resetLegacy} data-testid="btn-import-more">
                    <Upload className="h-4 w-4 mr-2" /> Importar otro archivo
                  </Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

// ── Helper components ──────────────────────────────────────────────────────────

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 min-w-[80px] shrink-0">{label}:</span>
      <span className="text-gray-700 flex items-center gap-1">{icon}{value}</span>
    </div>
  );
}

function SummaryChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number | string; color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    gray: "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colors[color] || colors.gray}`}>
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
