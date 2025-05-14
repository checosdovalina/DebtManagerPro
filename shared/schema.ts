import { pgTable, text, serial, integer, boolean, date, timestamp, json, real, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// USER ROLE ENUM
export const USER_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  COMMERCIAL_EXECUTIVE: "executive",
  COLLECTION_MANAGER: "manager",
  COLLECTOR: "collector",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// DEBTOR STATUS ENUM
export const DEBTOR_STATUS = {
  NEW: "new",
  IN_MANAGEMENT: "in_management",
  PROMISING: "promising",
  PAID: "paid",
  IN_LITIGATION: "in_litigation",
  CANCELED: "canceled",
} as const;

export type DebtorStatus = typeof DEBTOR_STATUS[keyof typeof DEBTOR_STATUS];

// CLIENT STATUS ENUM
export const CLIENT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending"
} as const;

export type ClientStatus = typeof CLIENT_STATUS[keyof typeof CLIENT_STATUS];

// PERSON TYPE ENUM
export const PERSON_TYPE = {
  INDIVIDUAL: "individual",
  COMPANY: "company",
} as const;

export type PersonType = typeof PERSON_TYPE[keyof typeof PERSON_TYPE];

// DEBT TYPE ENUM
export const DEBT_TYPE = {
  PROMISSORY_NOTE: "promissory_note",
  INVOICE: "invoice",
  CREDIT: "credit",
  CONTRACT: "contract",
  OTHER: "other",
} as const;

export type DebtType = typeof DEBT_TYPE[keyof typeof DEBT_TYPE];

// PAYMENT METHOD ENUM
export const PAYMENT_METHOD = {
  CASH: "cash",
  TRANSFER: "transfer",
  CHECK: "check",
  CARD: "card",
  OTHER: "other",
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

// CONTACT TYPE ENUM
export const CONTACT_TYPE = {
  PHONE: "phone",
  WHATSAPP: "whatsapp",
  VISIT: "visit",
  EMAIL: "email",
  OTHER: "other",
} as const;

export type ContactType = typeof CONTACT_TYPE[keyof typeof CONTACT_TYPE];

// CONTACT RESULT ENUM
export const CONTACT_RESULT = {
  LOCATED: "located",
  NOT_LOCATED: "not_located",
  PROMISE: "promise",
  REFUSED: "refused",
  PARTIAL_PAYMENT: "partial_payment",
  FULL_PAYMENT: "full_payment",
  OTHER: "other",
} as const;

export type ContactResult = typeof CONTACT_RESULT[keyof typeof CONTACT_RESULT];

// USERS TABLE
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").notNull().$type<UserRole>(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLogin: timestamp("last_login"),
});

// CLIENTS TABLE
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rfc: text("rfc").notNull(),
  curp: text("curp"),
  personType: text("person_type").notNull().$type<PersonType>(),
  street: text("street"),
  number: text("number"),
  colony: text("colony"),
  zipCode: text("zip_code"),
  state: text("state"),
  city: text("city"),
  phone: text("phone"),
  email: text("email"),
  legalRepresentative: text("legal_representative"),
  businessType: text("business_type"),
  executiveId: integer("executive_id").references(() => users.id),
  status: text("status").notNull().$type<ClientStatus>().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  notes: text("notes"),
});

// DEBTORS TABLE
export const debtors = pgTable("debtors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rfc: text("rfc"),
  curp: text("curp"),
  personType: text("person_type").notNull().$type<PersonType>(),
  street: text("street"),
  number: text("number"),
  colony: text("colony"),
  zipCode: text("zip_code"),
  state: text("state"),
  city: text("city"),
  phone: text("phone"),
  email: text("email"),
  contactName: text("contact_name"),
  clientId: integer("client_id").notNull().references(() => clients.id),
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  status: text("status").notNull().$type<DebtorStatus>().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  notes: text("notes"),
});

// DEBTS TABLE
export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  debtorId: integer("debtor_id").notNull().references(() => debtors.id),
  concept: text("concept").notNull(),
  originalAmount: real("original_amount").notNull(),
  currentAmount: real("current_amount").notNull(),
  startDate: date("start_date").notNull(),
  dueDate: date("due_date").notNull(),
  interest: real("interest"),
  debtType: text("debt_type").notNull().$type<DebtType>(),
  supportDocuments: text("support_documents"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// ACTIVITY LOG TABLE
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  debtorId: integer("debtor_id").notNull().references(() => debtors.id),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  time: text("time").notNull(),
  contactType: text("contact_type").notNull().$type<ContactType>(),
  result: text("result").notNull().$type<ContactResult>(),
  comments: text("comments"),
  nextAction: text("next_action"),
  nextActionDate: date("next_action_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// DOCUMENTS TABLE
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  type: text("type").notNull(),
  entityType: text("entity_type").notNull(), // client, debtor, debt
  entityId: integer("entity_id").notNull(),
  uploadedById: integer("uploaded_by_id").notNull().references(() => users.id),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// LITIGATION TABLE
export const litigations = pgTable("litigations", {
  id: serial("id").primaryKey(),
  debtorId: integer("debtor_id").notNull().references(() => debtors.id),
  startDate: date("start_date").notNull(),
  processType: text("process_type").notNull(),
  caseNumber: text("case_number"),
  court: text("court"),
  lawyerId: integer("lawyer_id").references(() => users.id),
  status: text("status").notNull(),
  resolution: text("resolution"),
  keyDates: json("key_dates").$type<{ date: string; description: string }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// VISITS TABLE
export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  debtorId: integer("debtor_id").notNull().references(() => debtors.id),
  userId: integer("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  time: text("time").notNull(),
  address: text("address").notNull(),
  result: text("result").notNull(),
  personContacted: text("person_contacted"),
  evidence: text("evidence"),
  notes: text("notes"),
  nextVisitDate: date("next_visit_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// CLIENT REPORTS TABLE
export const clientReports = pgTable("client_reports", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  debtorId: integer("debtor_id").references(() => debtors.id),
  reportDate: date("report_date").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  summary: text("summary").notNull(),
  promises: integer("promises"),
  payments: real("payments"),
  recommendations: text("recommendations"),
  status: text("status").notNull(),
  comments: text("comments"),
  reportPath: text("report_path"),
  createdById: integer("created_by_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// CLIENT CONTACTS TABLE
export const clientContacts = pgTable("client_contacts", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  name: text("name").notNull(),
  position: text("position"),
  phone: text("phone"),
  email: text("email"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// CLIENT BANKING INFO TABLE
export const clientBankingInfo = pgTable("client_banking_info", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id).unique(),
  accountNumber: text("account_number"),
  clabe: text("clabe"),
  bankName: text("bank_name"),
  accountHolder: text("account_holder"),
  notes: text("notes"),
  reference: text("reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SCHEMAS
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLogin: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertDebtorSchema = createInsertSchema(debtors).omit({ id: true, createdAt: true });
export const insertDebtSchema = createInsertSchema(debts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertLitigationSchema = createInsertSchema(litigations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVisitSchema = createInsertSchema(visits).omit({ id: true, createdAt: true });
export const insertClientReportSchema = createInsertSchema(clientReports).omit({ id: true, createdAt: true });
export const insertClientContactSchema = createInsertSchema(clientContacts).omit({ id: true, createdAt: true });
export const insertClientBankingInfoSchema = createInsertSchema(clientBankingInfo).omit({ id: true, createdAt: true, updatedAt: true });

// TYPES
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type InsertDebtor = z.infer<typeof insertDebtorSchema>;
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type InsertLitigation = z.infer<typeof insertLitigationSchema>;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type InsertClientReport = z.infer<typeof insertClientReportSchema>;
export type InsertClientContact = z.infer<typeof insertClientContactSchema>;
export type InsertClientBankingInfo = z.infer<typeof insertClientBankingInfoSchema>;

export type User = typeof users.$inferSelect;
export type Client = typeof clients.$inferSelect;
export type Debtor = typeof debtors.$inferSelect;
export type Debt = typeof debts.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Litigation = typeof litigations.$inferSelect;
export type Visit = typeof visits.$inferSelect;
export type ClientReport = typeof clientReports.$inferSelect;
export type ClientContact = typeof clientContacts.$inferSelect;
export type ClientBankingInfo = typeof clientBankingInfo.$inferSelect;
