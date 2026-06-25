import * as XLSX from "xlsx";

export interface DebtData {
  concept: string;
  originalAmount: number;
  currentBalance: number;
}

export interface PaymentData {
  paymentNumber: number;
  amount: number;
  date: string;
  newBalance: number;
  debtConcept: string;
}

export interface ActivityEntry {
  date: string;
  time: string;
  comment: string;
  promise: string;
}

export interface VisitEntry {
  reportNumber: string;
  date: string;
  content: string;
  commitment: string;
  nextReport: string;
}

export interface ExpedienteData {
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

/**
 * Server-side port of the client expediente parser (Marelli / DCS format).
 * Accepts the raw file bytes (Buffer / ArrayBuffer / Uint8Array) and the
 * original file name. Mirrors the logic in client/src/pages/importacion.tsx.
 */
export function parseExpediente(
  input: Buffer | ArrayBuffer | Uint8Array,
  fileName: string,
): ExpedienteData {
  const wb = XLSX.read(input, { type: "buffer" });
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

  const debtSlots = [
    { colStart: 0, amtCol: 1, conceptCol: 2 },
    { colStart: 7, amtCol: 8, conceptCol: 9 },
  ];

  const debtOriginals: { concept: string; amount: number }[] = [];

  for (let slotI = 0; slotI < debtSlots.length; slotI++) {
    const slot = debtSlots[slotI];
    let foundDebt = false;
    for (let ri = 0; ri < Math.min(adeudoRows.length, 5); ri++) {
      const row = adeudoRows[ri] as unknown[];
      const label = str(row[slot.colStart]);
      if (label.toLowerCase().includes("adeudo")) {
        const amount = Number(row[slot.amtCol]) || 0;
        const concept = str(row[slot.conceptCol]) || (slotI === 0 ? "ADEUDO" : `ADEUDO ${slotI + 1}`);
        if (amount > 0) {
          debtOriginals.push({ concept, amount });
          foundDebt = true;
          break;
        }
      }
    }
    if (!foundDebt) break;
  }

  for (let slotIdx = 0; slotIdx < debtSlots.length && slotIdx < debtOriginals.length; slotIdx++) {
    const slot = debtSlots[slotIdx];
    const orig = debtOriginals[slotIdx];
    let headerRow = -1;

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

  // Detect whether the workbook even has the expected sheets.
  const hasGeneralSheet = !!(wb.SheetNames.find(n =>
    n.toLowerCase().includes("datos generales") || n.toLowerCase().includes("general")));
  const hasAdeudoSheet = !!(wb.SheetNames.find(n => n.toLowerCase().includes("adeudo")));
  if (!hasGeneralSheet) parseErrors.push("Falta la hoja 'Datos Generales'");
  if (!hasAdeudoSheet) parseErrors.push("Falta la hoja 'Adeudo'");

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

/**
 * Decide whether a parsed expediente conforms to the DCS format well enough
 * to be imported. Returns a list of reasons it fails; an empty list means valid.
 */
export function validateExpediente(data: ExpedienteData): string[] {
  const reasons: string[] = [];
  if (data.parseErrors.includes("Falta la hoja 'Datos Generales'")) {
    reasons.push("No tiene la hoja 'Datos Generales'");
  }
  if (data.parseErrors.includes("Falta la hoja 'Adeudo'")) {
    reasons.push("No tiene la hoja 'Adeudo'");
  }
  if (!data.debtorName) {
    reasons.push("Sin nombre de deudor");
  }
  if (data.debts.length === 0) {
    reasons.push("No se encontraron adeudos");
  }
  return reasons;
}
