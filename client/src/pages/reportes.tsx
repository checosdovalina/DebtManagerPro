import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Client, Debtor } from "@shared/schema";
import {
  Download, FileSpreadsheet, FileText, BarChart2, Users,
  Building2, TrendingUp, Loader2, Filter
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportType = "debtors" | "debts" | "payments" | "activity";

interface ExportColumn { key: string; label: string }

const REPORTS: { id: ReportType; title: string; description: string; icon: React.ReactNode }[] = [
  { id: "debtors", title: "Reporte de Deudores", description: "Lista completa de deudores con estado y datos de contacto", icon: <Users className="h-5 w-5" /> },
  { id: "debts", title: "Reporte de Adeudos", description: "Todos los conceptos de deuda con montos originales y saldos actuales", icon: <TrendingUp className="h-5 w-5" /> },
  { id: "activity", title: "Bitácora de Gestión", description: "Historial de actividades y gestiones realizadas", icon: <BarChart2 className="h-5 w-5" /> },
  { id: "payments", title: "Reporte de Pagos", description: "Historial de pagos y abonos registrados", icon: <FileSpreadsheet className="h-5 w-5" /> },
];

function formatCurrency(v: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v);
}

export default function ReportesPage() {
  const { toast } = useToast();
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [loadingReport, setLoadingReport] = useState<ReportType | null>(null);

  const { data: clients = [] } = useQuery<Client[]>({ queryKey: ["/api/clients"] });

  async function fetchData(endpoint: string) {
    const res = await fetch(endpoint, { credentials: "include" });
    if (!res.ok) throw new Error("Error al obtener datos");
    return res.json();
  }

  async function exportToExcel(reportId: ReportType) {
    setLoadingReport(reportId);
    try {
      const endpointMap: Record<ReportType, string> = {
        debtors: "/api/export/debtors",
        debts: "/api/export/debts",
        activity: "/api/export/debtors",
        payments: "/api/export/debts",
      };
      let data = await fetchData(endpointMap[reportId]);

      if (selectedClient !== "all") {
        const clientName = clients.find(c => String(c.id) === selectedClient)?.name;
        if (clientName) data = data.filter((r: any) => r.Cliente === clientName || r.Deudor);
      }

      const ws = XLSX.utils.json_to_sheet(data);
      const cols = Object.keys(data[0] || {}).map(() => ({ wch: 18 }));
      ws["!cols"] = cols;
      const wb = XLSX.utils.book_new();
      const reportTitle = REPORTS.find(r => r.id === reportId)?.title ?? reportId;
      XLSX.utils.book_append_sheet(wb, ws, reportTitle.slice(0, 31));

      // Add metadata sheet
      const meta = [
        ["Reporte:", reportTitle],
        ["Generado:", new Date().toLocaleString("es-MX")],
        ["Registros:", data.length],
        ["Filtro cliente:", selectedClient === "all" ? "Todos" : clients.find(c => String(c.id) === selectedClient)?.name ?? ""],
      ];
      const wsMeta = XLSX.utils.aoa_to_sheet(meta);
      XLSX.utils.book_append_sheet(wb, wsMeta, "Info");

      XLSX.writeFile(wb, `DCS_${reportId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Excel generado", description: `${data.length} registros exportados` });
    } catch (e: any) {
      toast({ title: "Error al exportar", description: e.message, variant: "destructive" });
    } finally {
      setLoadingReport(null);
    }
  }

  async function exportToPDF(reportId: ReportType) {
    setLoadingReport(reportId);
    try {
      const endpointMap: Record<ReportType, string> = {
        debtors: "/api/export/debtors",
        debts: "/api/export/debts",
        activity: "/api/export/debtors",
        payments: "/api/export/debts",
      };
      let data = await fetchData(endpointMap[reportId]);

      if (selectedClient !== "all") {
        const clientName = clients.find(c => String(c.id) === selectedClient)?.name;
        if (clientName) data = data.filter((r: any) => r.Cliente === clientName || r.Deudor === clientName);
      }

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const reportTitle = REPORTS.find(r => r.id === reportId)?.title ?? reportId;
      const clientLabel = selectedClient === "all" ? "Todos los clientes" : clients.find(c => String(c.id) === selectedClient)?.name ?? "";

      // Header
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, 297, 22, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DCS — Debt Collection Services Mexico", 14, 10);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(reportTitle, 14, 17);

      // Metadata
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.text(`Generado: ${new Date().toLocaleString("es-MX")}   |   Cliente: ${clientLabel}   |   Registros: ${data.length}`, 14, 28);

      if (data.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text("Sin datos para el filtro seleccionado", 14, 50);
      } else {
        const headers = Object.keys(data[0]);
        const rows = data.map((r: any) => headers.map(h => {
          const v = r[h];
          if (typeof v === "number" && (h.toLowerCase().includes("monto") || h.toLowerCase().includes("saldo"))) {
            return formatCurrency(v);
          }
          return String(v ?? "");
        }));

        autoTable(doc, {
          head: [headers],
          body: rows,
          startY: 32,
          theme: "grid",
          headStyles: { fillColor: [30, 58, 138], textColor: 255, fontSize: 8, fontStyle: "bold" },
          bodyStyles: { fontSize: 7.5 },
          alternateRowStyles: { fillColor: [245, 247, 255] },
          margin: { left: 14, right: 14 },
          styles: { overflow: "linebreak", cellPadding: 2 },
          columnStyles: Object.fromEntries(headers.map((_, i) => [i, { cellWidth: "auto" }])),
        });
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 5);
        doc.text("DCS Mexico — Confidencial", 297 - 14, doc.internal.pageSize.height - 5, { align: "right" });
      }

      doc.save(`DCS_${reportId}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "PDF generado", description: `${data.length} registros exportados` });
    } catch (e: any) {
      toast({ title: "Error al exportar", description: e.message, variant: "destructive" });
    } finally {
      setLoadingReport(null);
    }
  }

  return (
    <Layout title="Reportes y Exportación">
      <div className="space-y-6">
        {/* Filter */}
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <Filter className="h-4 w-4" /> Filtrar por cliente:
              </div>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-xs">
                {selectedClient === "all" ? "Sin filtro — todos los registros" : `Filtrado: ${clients.find(c => String(c.id) === selectedClient)?.name}`}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Report cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {REPORTS.map(report => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="p-2 bg-primary-50 rounded-lg text-primary-600">{report.icon}</span>
                  {report.title}
                </CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-green-700 border-green-300 hover:bg-green-50 text-xs"
                    onClick={() => exportToExcel(report.id)}
                    disabled={loadingReport === report.id}
                  >
                    {loadingReport === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-700 border-red-300 hover:bg-red-50 text-xs"
                    onClick={() => exportToPDF(report.id)}
                    disabled={loadingReport === report.id}
                  >
                    {loadingReport === report.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-5">
            <div className="flex gap-3">
              <Download className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Acerca de las exportaciones</p>
                <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                  <li>El archivo Excel incluye una hoja de metadatos con fecha de generación</li>
                  <li>El PDF está formateado en hoja horizontal con encabezado y pie de página</li>
                  <li>Usa el filtro de cliente para exportar solo los datos de un cliente específico</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
