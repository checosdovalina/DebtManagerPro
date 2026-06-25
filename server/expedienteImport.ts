import { storage } from "./storage";
import type { ExpedienteData } from "./expedienteParser";

export interface ImportExpedienteResult {
  debtorId: number;
  debtorName: string;
  clientId: number;
  clientName: string;
  clientCreated: boolean;
  debtsCreated: number;
  paymentsCreated: number;
  activityLogsCreated: number;
  visitsCreated: number;
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Imports a parsed expediente into the database. Resolves the client by
 * matching an existing one (by RFC, then by normalized name) and creates one
 * only when no match is found. Mirrors the behaviour of the single-file
 * /api/import/expediente route but performs client matching server-side so it
 * can run unattended during a bulk Dropbox migration.
 */
export async function importExpedienteData(
  data: ExpedienteData,
  userId: number,
): Promise<ImportExpedienteResult> {
  const today = new Date().toISOString().split("T")[0];

  // ── Resolve client (match existing or create) ──────────────────────────────
  const clients = await storage.getClients();
  const rfc = data.clientRfc?.trim();
  const nameNorm = data.clientName ? normalize(data.clientName) : "";

  let matched = undefined as (typeof clients)[number] | undefined;
  if (rfc) {
    matched = clients.find(c => c.rfc && c.rfc.trim().toLowerCase() === rfc.toLowerCase());
  }
  if (!matched && nameNorm) {
    matched = clients.find(c => c.name && normalize(c.name) === nameNorm);
  }

  let resolvedClientId: number;
  let resolvedClientName: string;
  let clientCreated = false;

  if (matched) {
    resolvedClientId = matched.id;
    resolvedClientName = matched.name;
  } else if (data.clientName) {
    const newClient = await storage.createClient({
      name: data.clientName,
      rfc: rfc || `SIN-RFC-${Date.now()}`,
      curp: null,
      personType: "company" as const,
      street: data.clientStreet || null,
      number: null,
      colony: data.clientColony || null,
      zipCode: data.clientZipCode || null,
      city: data.clientCity || null,
      state: data.clientState || null,
      phone: data.clientPhone || null,
      email: data.clientEmail || null,
      legalRepresentative: null,
      businessType: data.clientBusinessType || null,
      executiveId: null,
      status: "active" as const,
      notes: "Creado automáticamente desde migración masiva de Dropbox",
    });
    resolvedClientId = newClient.id;
    resolvedClientName = newClient.name;
    clientCreated = true;
  } else {
    throw new Error("Sin datos de cliente para enlazar o crear");
  }

  // ── Create debtor ──────────────────────────────────────────────────────────
  const debtor = await storage.createDebtor({
    name: data.debtorName,
    rfc: null,
    curp: null,
    personType: "company" as const,
    street: data.debtorAddress || "",
    number: null,
    colony: null,
    zipCode: null,
    city: null,
    state: null,
    phone: data.debtorPhone || null,
    email: null,
    contactName: data.debtorContact || null,
    clientId: resolvedClientId,
    assignedUserId: userId,
    status: "new" as const,
    notes: data.debtorNotes || null,
  });

  // ── Create debts ──────────────────────────────────────────────────────────
  let debtsCreated = 0;
  const debtIdByConcept = new Map<string, number>();
  for (const d of data.debts) {
    if (!d.concept || !d.originalAmount) continue;
    const startDate = data.fechaAlta || today;
    const createdDebt = await storage.createDebt({
      debtorId: debtor.id,
      concept: d.concept,
      originalAmount: d.originalAmount,
      currentAmount: d.currentBalance ?? d.originalAmount,
      startDate,
      dueDate: today,
      interest: null,
      debtType: "invoice" as const,
      supportDocuments: null,
      notes: null,
    });
    debtIdByConcept.set(d.concept, createdDebt.id);
    debtsCreated++;
  }

  // ── Create payments ───────────────────────────────────────────────────────
  let paymentsCreated = 0;
  for (const p of data.payments) {
    if (!p.amount || !p.date) continue;
    const debtId = debtIdByConcept.get(p.debtConcept);
    if (!debtId) continue;
    try {
      await storage.createPayment({
        debtId,
        amount: p.amount,
        paymentDate: p.date,
        paymentMethod: "transfer" as const,
        reference: `Abono #${p.paymentNumber}`,
        notes: `Importado desde Dropbox. Saldo nuevo: ${p.newBalance}`,
        receiptUrl: null,
        registeredById: userId,
      });
      paymentsCreated++;
    } catch (_) {}
  }

  // ── Create activity logs ──────────────────────────────────────────────────
  let activityLogsCreated = 0;
  for (const a of data.activityLogs) {
    if (!a.comment) continue;
    try {
      await storage.createActivityLog({
        debtorId: debtor.id,
        userId,
        date: a.date || today,
        time: a.time || "00:00",
        contactType: "phone" as const,
        result: "other" as const,
        comments: a.comment,
        nextAction: a.promise || null,
        nextActionDate: null,
      });
      activityLogsCreated++;
    } catch (_) {}
  }

  // ── Create visits ─────────────────────────────────────────────────────────
  let visitsCreated = 0;
  for (const v of data.visits) {
    if (!v.content) continue;
    try {
      await storage.createVisit({
        debtorId: debtor.id,
        userId,
        date: v.date || today,
        time: "00:00",
        address: data.debtorAddress || "Sin dirección",
        result: v.content,
        personContacted: null,
        evidence: null,
        notes: [v.commitment, v.nextReport].filter(Boolean).join(" | ") || null,
        nextVisitDate: null,
      });
      visitsCreated++;
    } catch (_) {}
  }

  return {
    debtorId: debtor.id,
    debtorName: debtor.name,
    clientId: resolvedClientId,
    clientName: resolvedClientName,
    clientCreated,
    debtsCreated,
    paymentsCreated,
    activityLogsCreated,
    visitsCreated,
  };
}
