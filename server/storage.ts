import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient,
  debtors, type Debtor, type InsertDebtor,
  debts, type Debt, type InsertDebt,
  activityLogs, type ActivityLog, type InsertActivityLog,
  documents, type Document, type InsertDocument,
  litigations, type Litigation, type InsertLitigation,
  visits, type Visit, type InsertVisit,
  clientReports, type ClientReport, type InsertClientReport,
  clientContacts, type ClientContact, type InsertClientContact,
  clientBankingInfo, type ClientBankingInfo, type InsertClientBankingInfo,
  payments, type Payment, type InsertPayment,
  USER_ROLES
} from "@shared/schema";

// Storage interface for all operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;

  // Clients
  getClient(id: number): Promise<Client | undefined>;
  getClients(): Promise<Client[]>;
  getClientsByExecutive(executiveId: number): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Client Contacts
  getClientContacts(clientId: number): Promise<ClientContact[]>;
  createClientContact(contact: InsertClientContact): Promise<ClientContact>;
  updateClientContact(id: number, contact: Partial<ClientContact>): Promise<ClientContact | undefined>;
  deleteClientContact(id: number): Promise<boolean>;

  // Debtors
  getDebtor(id: number): Promise<Debtor | undefined>;
  getDebtors(): Promise<Debtor[]>;
  getDebtorsByClient(clientId: number): Promise<Debtor[]>;
  getDebtorsByUser(userId: number): Promise<Debtor[]>;
  getDebtorsByStatus(status: string): Promise<Debtor[]>;
  createDebtor(debtor: InsertDebtor): Promise<Debtor>;
  updateDebtor(id: number, debtor: Partial<Debtor>): Promise<Debtor | undefined>;
  deleteDebtor(id: number): Promise<boolean>;

  // Debts
  getDebt(id: number): Promise<Debt | undefined>;
  getDebtsByDebtor(debtorId: number): Promise<Debt[]>;
  createDebt(debt: InsertDebt): Promise<Debt>;
  updateDebt(id: number, debt: Partial<Debt>): Promise<Debt | undefined>;
  deleteDebt(id: number): Promise<boolean>;

  // Activity Logs
  getActivityLog(id: number): Promise<ActivityLog | undefined>;
  getActivityLogsByDebtor(debtorId: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  updateActivityLog(id: number, log: Partial<ActivityLog>): Promise<ActivityLog | undefined>;
  deleteActivityLog(id: number): Promise<boolean>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByEntity(entityType: string, entityId: number): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Litigations
  getLitigation(id: number): Promise<Litigation | undefined>;
  getLitigationsByDebtor(debtorId: number): Promise<Litigation[]>;
  createLitigation(litigation: InsertLitigation): Promise<Litigation>;
  updateLitigation(id: number, litigation: Partial<Litigation>): Promise<Litigation | undefined>;
  deleteLitigation(id: number): Promise<boolean>;

  // Visits
  getVisit(id: number): Promise<Visit | undefined>;
  getVisitsByDebtor(debtorId: number): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;
  updateVisit(id: number, visit: Partial<Visit>): Promise<Visit | undefined>;
  deleteVisit(id: number): Promise<boolean>;

  // Client Reports
  getClientReport(id: number): Promise<ClientReport | undefined>;
  getClientReportsByClient(clientId: number): Promise<ClientReport[]>;
  getClientReportsByDebtor(debtorId: number): Promise<ClientReport[]>;
  createClientReport(report: InsertClientReport): Promise<ClientReport>;
  updateClientReport(id: number, report: Partial<ClientReport>): Promise<ClientReport | undefined>;
  deleteClientReport(id: number): Promise<boolean>;
  
  // Client Banking Info
  getClientBankingInfo(clientId: number): Promise<ClientBankingInfo | undefined>;
  createClientBankingInfo(bankingInfo: InsertClientBankingInfo): Promise<ClientBankingInfo>;
  updateClientBankingInfo(clientId: number, bankingInfo: Partial<ClientBankingInfo>): Promise<ClientBankingInfo | undefined>;

  // Dashboard Data
  getDashboardStats(): Promise<{
    activeClients: number;
    totalDebtors: number;
    monthlyCollection: number;
    litigationCases: number;
  }>;
  getRecentDebtors(limit?: number): Promise<Debtor[]>;
  getRecentActivities(limit?: number): Promise<ActivityLog[]>;
  
  // Payments (Abonos)
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByDebtId(debtId: number): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  updateDebtAmountAfterPayment(debtId: number, newAmount: number): Promise<Debt | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private debtors: Map<number, Debtor>;
  private debts: Map<number, Debt>;
  private activityLogs: Map<number, ActivityLog>;
  private documents: Map<number, Document>;
  private litigations: Map<number, Litigation>;
  private visits: Map<number, Visit>;
  private clientReports: Map<number, ClientReport>;
  private clientContacts: Map<number, ClientContact>;
  private clientBankingInfos: Map<number, ClientBankingInfo>;
  private payments: Map<number, Payment>;

  private userIdCounter: number;
  private clientIdCounter: number;
  private debtorIdCounter: number;
  private debtIdCounter: number;
  private activityLogIdCounter: number;
  private documentIdCounter: number;
  private litigationIdCounter: number;
  private visitIdCounter: number;
  private paymentIdCounter: number;
  private clientReportIdCounter: number;
  private clientContactIdCounter: number;
  private clientBankingInfoIdCounter: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.debtors = new Map();
    this.debts = new Map();
    this.activityLogs = new Map();
    this.documents = new Map();
    this.litigations = new Map();
    this.visits = new Map();
    this.clientReports = new Map();
    this.clientContacts = new Map();
    this.clientBankingInfos = new Map();
    this.payments = new Map();

    this.userIdCounter = 1;
    this.clientIdCounter = 1;
    this.debtorIdCounter = 1;
    this.debtIdCounter = 1;
    this.activityLogIdCounter = 1;
    this.documentIdCounter = 1;
    this.litigationIdCounter = 1;
    this.visitIdCounter = 1;
    this.clientReportIdCounter = 1;
    this.clientContactIdCounter = 1;
    this.clientBankingInfoIdCounter = 1;
    this.paymentIdCounter = 1;

    // Seed data
    this.seedData();
  }

  // USERS
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { 
      ...user, 
      id, 
      createdAt: new Date(),
      lastLogin: null
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  // CLIENTS
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }

  async getClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }

  async getClientsByExecutive(executiveId: number): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(client => client.executiveId === executiveId);
  }

  async createClient(client: InsertClient): Promise<Client> {
    const id = this.clientIdCounter++;
    const newClient: Client = { ...client, id, createdAt: new Date() };
    this.clients.set(id, newClient);
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = this.clients.get(id);
    if (!client) return undefined;
    
    const updatedClient = { ...client, ...clientData };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    return this.clients.delete(id);
  }

  // CLIENT CONTACTS
  async getClientContacts(clientId: number): Promise<ClientContact[]> {
    return Array.from(this.clientContacts.values()).filter(contact => contact.clientId === clientId);
  }

  async createClientContact(contact: InsertClientContact): Promise<ClientContact> {
    const id = this.clientContactIdCounter++;
    const newContact: ClientContact = { ...contact, id, createdAt: new Date() };
    this.clientContacts.set(id, newContact);
    return newContact;
  }

  async updateClientContact(id: number, contactData: Partial<ClientContact>): Promise<ClientContact | undefined> {
    const contact = this.clientContacts.get(id);
    if (!contact) return undefined;
    
    const updatedContact = { ...contact, ...contactData };
    this.clientContacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteClientContact(id: number): Promise<boolean> {
    return this.clientContacts.delete(id);
  }

  // DEBTORS
  async getDebtor(id: number): Promise<Debtor | undefined> {
    return this.debtors.get(id);
  }

  async getDebtors(): Promise<Debtor[]> {
    return Array.from(this.debtors.values());
  }

  async getDebtorsByClient(clientId: number): Promise<Debtor[]> {
    return Array.from(this.debtors.values()).filter(debtor => debtor.clientId === clientId);
  }

  async getDebtorsByUser(userId: number): Promise<Debtor[]> {
    return Array.from(this.debtors.values()).filter(debtor => debtor.assignedUserId === userId);
  }

  async getDebtorsByStatus(status: string): Promise<Debtor[]> {
    return Array.from(this.debtors.values()).filter(debtor => debtor.status === status);
  }

  async createDebtor(debtor: InsertDebtor): Promise<Debtor> {
    const id = this.debtorIdCounter++;
    const newDebtor: Debtor = { ...debtor, id, createdAt: new Date() };
    this.debtors.set(id, newDebtor);
    return newDebtor;
  }

  async updateDebtor(id: number, debtorData: Partial<Debtor>): Promise<Debtor | undefined> {
    const debtor = this.debtors.get(id);
    if (!debtor) return undefined;
    
    const updatedDebtor = { ...debtor, ...debtorData };
    this.debtors.set(id, updatedDebtor);
    return updatedDebtor;
  }

  async deleteDebtor(id: number): Promise<boolean> {
    return this.debtors.delete(id);
  }

  // DEBTS
  async getDebt(id: number): Promise<Debt | undefined> {
    return this.debts.get(id);
  }

  async getDebtsByDebtor(debtorId: number): Promise<Debt[]> {
    return Array.from(this.debts.values()).filter(debt => debt.debtorId === debtorId);
  }

  async createDebt(debt: InsertDebt): Promise<Debt> {
    const id = this.debtIdCounter++;
    const now = new Date();
    const newDebt: Debt = { 
      ...debt, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.debts.set(id, newDebt);
    return newDebt;
  }

  async updateDebt(id: number, debtData: Partial<Debt>): Promise<Debt | undefined> {
    const debt = this.debts.get(id);
    if (!debt) return undefined;
    
    const updatedDebt = { 
      ...debt, 
      ...debtData,
      updatedAt: new Date()
    };
    this.debts.set(id, updatedDebt);
    return updatedDebt;
  }

  async deleteDebt(id: number): Promise<boolean> {
    return this.debts.delete(id);
  }

  // ACTIVITY LOGS
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    return this.activityLogs.get(id);
  }

  async getActivityLogsByDebtor(debtorId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.debtorId === debtorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const newLog: ActivityLog = { ...log, id, createdAt: new Date() };
    this.activityLogs.set(id, newLog);
    return newLog;
  }

  async updateActivityLog(id: number, logData: Partial<ActivityLog>): Promise<ActivityLog | undefined> {
    const log = this.activityLogs.get(id);
    if (!log) return undefined;
    
    const updatedLog = { ...log, ...logData };
    this.activityLogs.set(id, updatedLog);
    return updatedLog;
  }

  async deleteActivityLog(id: number): Promise<boolean> {
    return this.activityLogs.delete(id);
  }

  // DOCUMENTS
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async getDocumentsByEntity(entityType: string, entityId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.entityType === entityType && doc.entityId === entityId);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documentIdCounter++;
    const newDocument: Document = { ...document, id, createdAt: new Date() };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...documentData };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // LITIGATIONS
  async getLitigation(id: number): Promise<Litigation | undefined> {
    return this.litigations.get(id);
  }

  async getLitigationsByDebtor(debtorId: number): Promise<Litigation[]> {
    return Array.from(this.litigations.values()).filter(litigation => litigation.debtorId === debtorId);
  }

  async createLitigation(litigation: InsertLitigation): Promise<Litigation> {
    const id = this.litigationIdCounter++;
    const now = new Date();
    const newLitigation: Litigation = { 
      ...litigation, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.litigations.set(id, newLitigation);
    return newLitigation;
  }

  async updateLitigation(id: number, litigationData: Partial<Litigation>): Promise<Litigation | undefined> {
    const litigation = this.litigations.get(id);
    if (!litigation) return undefined;
    
    const updatedLitigation = { 
      ...litigation, 
      ...litigationData,
      updatedAt: new Date()
    };
    this.litigations.set(id, updatedLitigation);
    return updatedLitigation;
  }

  async deleteLitigation(id: number): Promise<boolean> {
    return this.litigations.delete(id);
  }

  // VISITS
  async getVisit(id: number): Promise<Visit | undefined> {
    return this.visits.get(id);
  }

  async getVisitsByDebtor(debtorId: number): Promise<Visit[]> {
    return Array.from(this.visits.values()).filter(visit => visit.debtorId === debtorId);
  }

  async createVisit(visit: InsertVisit): Promise<Visit> {
    const id = this.visitIdCounter++;
    const newVisit: Visit = { ...visit, id, createdAt: new Date() };
    this.visits.set(id, newVisit);
    return newVisit;
  }

  async updateVisit(id: number, visitData: Partial<Visit>): Promise<Visit | undefined> {
    const visit = this.visits.get(id);
    if (!visit) return undefined;
    
    const updatedVisit = { ...visit, ...visitData };
    this.visits.set(id, updatedVisit);
    return updatedVisit;
  }

  async deleteVisit(id: number): Promise<boolean> {
    return this.visits.delete(id);
  }

  // CLIENT REPORTS
  async getClientReport(id: number): Promise<ClientReport | undefined> {
    return this.clientReports.get(id);
  }

  async getClientReportsByClient(clientId: number): Promise<ClientReport[]> {
    return Array.from(this.clientReports.values()).filter(report => report.clientId === clientId);
  }

  async getClientReportsByDebtor(debtorId: number): Promise<ClientReport[]> {
    return Array.from(this.clientReports.values()).filter(report => report.debtorId === debtorId);
  }

  async createClientReport(report: InsertClientReport): Promise<ClientReport> {
    const id = this.clientReportIdCounter++;
    const newReport: ClientReport = { ...report, id, createdAt: new Date() };
    this.clientReports.set(id, newReport);
    return newReport;
  }

  async updateClientReport(id: number, reportData: Partial<ClientReport>): Promise<ClientReport | undefined> {
    const report = this.clientReports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, ...reportData };
    this.clientReports.set(id, updatedReport);
    return updatedReport;
  }

  async deleteClientReport(id: number): Promise<boolean> {
    return this.clientReports.delete(id);
  }

  // CLIENT BANKING INFO
  async getClientBankingInfo(clientId: number): Promise<ClientBankingInfo | undefined> {
    return Array.from(this.clientBankingInfos.values()).find(info => info.clientId === clientId);
  }

  async createClientBankingInfo(bankingInfo: InsertClientBankingInfo): Promise<ClientBankingInfo> {
    const id = this.clientBankingInfoIdCounter++;
    const now = new Date();
    const newBankingInfo: ClientBankingInfo = { 
      ...bankingInfo, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.clientBankingInfos.set(id, newBankingInfo);
    return newBankingInfo;
  }

  async updateClientBankingInfo(clientId: number, bankingInfoData: Partial<ClientBankingInfo>): Promise<ClientBankingInfo | undefined> {
    const bankingInfo = Array.from(this.clientBankingInfos.values()).find(info => info.clientId === clientId);
    if (!bankingInfo) return undefined;
    
    const updatedBankingInfo = { 
      ...bankingInfo, 
      ...bankingInfoData,
      updatedAt: new Date()
    };
    this.clientBankingInfos.set(bankingInfo.id, updatedBankingInfo);
    return updatedBankingInfo;
  }

  // PAYMENTS
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const id = this.paymentIdCounter++;
    const now = new Date();
    const newPayment: Payment = {
      ...payment,
      id,
      createdAt: now,
      receiptUrl: payment.receiptUrl || null,
      notes: payment.notes || null,
      reference: payment.reference || null
    };
    this.payments.set(id, newPayment);
    return newPayment;
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByDebtId(debtId: number): Promise<Payment[]> {
    const result: Payment[] = [];
    for (const payment of this.payments.values()) {
      if (payment.debtId === debtId) {
        result.push(payment);
      }
    }
    return result;
  }

  async updateDebtAmountAfterPayment(debtId: number, newAmount: number): Promise<Debt | undefined> {
    const debt = this.debts.get(debtId);
    if (!debt) {
      return undefined;
    }
    
    const updatedDebt: Debt = {
      ...debt,
      currentAmount: newAmount,
      updatedAt: new Date()
    };
    
    this.debts.set(debtId, updatedDebt);
    return updatedDebt;
  }

  // DASHBOARD DATA
  async getDashboardStats(): Promise<{
    activeClients: number;
    totalDebtors: number;
    monthlyCollection: number;
    litigationCases: number;
  }> {
    const activeClients = Array.from(this.clients.values()).filter(client => client.status === 'active').length;
    const totalDebtors = this.debtors.size;
    
    // Calculate monthly collection (just a sample value for demonstration)
    const monthlyCollection = 145780;
    
    const litigationCases = this.litigations.size;
    
    return {
      activeClients,
      totalDebtors,
      monthlyCollection,
      litigationCases
    };
  }

  async getRecentDebtors(limit: number = 5): Promise<Debtor[]> {
    return Array.from(this.debtors.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async getRecentActivities(limit: number = 5): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Seed initial data for demonstration
  private seedData() {
    // Create users
    const adminUser: InsertUser = {
      fullName: "Juan Dominguez",
      email: "admin@dcs.com",
      phone: "555-123-4567",
      password: "password123", // Password for demo purposes
      role: USER_ROLES.ADMIN,
    };
    this.createUser(adminUser);

    const managerUser: InsertUser = {
      fullName: "Maria Lopez",
      email: "manager@dcs.com",
      phone: "555-987-6543",
      password: "password123",
      role: USER_ROLES.COLLECTION_MANAGER,
    };
    this.createUser(managerUser);

    const exec1: InsertUser = {
      fullName: "Carlos Jiménez",
      email: "carlos@dcs.com",
      phone: "555-111-2222",
      password: "password123",
      role: USER_ROLES.COMMERCIAL_EXECUTIVE,
    };
    this.createUser(exec1);

    const exec2: InsertUser = {
      fullName: "Laura Martínez",
      email: "laura@dcs.com",
      phone: "555-333-4444",
      password: "password123",
      role: USER_ROLES.COMMERCIAL_EXECUTIVE,
    };
    this.createUser(exec2);

    const collector1: InsertUser = {
      fullName: "Roberto Sánchez",
      email: "roberto@dcs.com",
      phone: "555-555-6666",
      password: "password123",
      role: USER_ROLES.COLLECTOR,
    };
    this.createUser(collector1);

    // Create clients
    const client1: InsertClient = {
      name: "GAFI Ferreléctrico",
      rfc: "GAF850312JK9",
      personType: "company",
      street: "Av. Industrial",
      number: "240",
      colony: "Zona Industrial",
      zipCode: "37490",
      state: "Guanajuato",
      city: "León",
      phone: "477-718-9242",
      email: "contacto@gafi.com",
      legalRepresentative: "Roberto Álvarez",
      businessType: "Venta de material eléctrico y ferretería",
      executiveId: 3, // Carlos Jiménez
      status: "active",
      notes: "Cliente con múltiples sucursales en la región",
    };
    this.createClient(client1);

    const client2: InsertClient = {
      name: "Autos Industriales S.A.",
      rfc: "AIS972301BC5",
      personType: "company",
      street: "Blvd. Aeropuerto",
      number: "1520",
      colony: "San Carlos",
      zipCode: "37670",
      state: "Guanajuato",
      city: "León",
      phone: "477-123-4567",
      email: "contacto@autos-ind.com",
      legalRepresentative: "María Fuentes",
      businessType: "Venta de vehículos industriales",
      executiveId: 4, // Laura Martínez
      status: "active",
      notes: "",
    };
    this.createClient(client2);

    const client3: InsertClient = {
      name: "Distribuidora Méndez",
      rfc: "DIM931127RF0",
      personType: "company",
      street: "Calle Reforma",
      number: "78",
      colony: "Centro",
      zipCode: "36700",
      state: "Guanajuato",
      city: "Salamanca",
      phone: "464-987-6543",
      email: "jmendez@distribuidora.com.mx",
      legalRepresentative: "Javier Méndez",
      businessType: "Distribución de productos alimenticios",
      executiveId: 5, // Roberto Sánchez
      status: "active",
      notes: "",
    };
    this.createClient(client3);

    // Create debtors
    const debtor1: InsertDebtor = {
      name: "Juan Pérez",
      rfc: "PERJ800523SH9",
      curp: "PERJ800523HGTRNN09",
      personType: "individual",
      street: "Calle Hidalgo",
      number: "123",
      colony: "Centro",
      zipCode: "37000",
      state: "Guanajuato",
      city: "León",
      phone: "477-111-2233",
      email: "juan.perez@gmail.com",
      clientId: 1, // GAFI Ferreléctrico
      assignedUserId: 2, // María Lopez (manager)
      status: "in_management",
      notes: "Cliente frecuente que ahora tiene problemas de pago",
    };
    this.createDebtor(debtor1);

    const debtor2: InsertDebtor = {
      name: "Transportes Veloz S.A. de C.V.",
      rfc: "TVE0205319G7",
      personType: "company",
      street: "Carretera Panamericana",
      number: "Km 245",
      colony: "Parque Industrial",
      zipCode: "37290",
      state: "Guanajuato",
      city: "Silao",
      phone: "472-722-9090",
      email: "operaciones@transportesveloz.mx",
      contactName: "Mónica Velázquez",
      clientId: 1, // GAFI Ferreléctrico
      assignedUserId: 5, // Roberto Sánchez (collector)
      status: "in_litigation",
      notes: "Empresa con múltiples facturas vencidas",
    };
    this.createDebtor(debtor2);

    const debtor3: InsertDebtor = {
      name: "Comercializadora La Huerta",
      rfc: "CLH1006128H3",
      personType: "company",
      street: "Av. López Mateos",
      number: "890",
      colony: "Jardines del Moral",
      zipCode: "37160",
      state: "Guanajuato",
      city: "León",
      phone: "477-298-8877",
      email: "contacto@lahuerta.mx",
      contactName: "Patricia Robles",
      clientId: 2, // Autos Industriales
      assignedUserId: 5, // Roberto Sánchez (collector)
      status: "new",
      notes: "",
    };
    this.createDebtor(debtor3);

    // Create debts
    const debt1: InsertDebt = {
      debtorId: 1, // Juan Pérez
      originalAmount: 28500,
      currentAmount: 32100,
      startDate: new Date(2023, 2, 15), // March 15, 2023
      dueDate: new Date(2023, 5, 15), // June 15, 2023
      interest: 12.5,
      debtType: "credit",
      supportDocuments: "contrato_credito_123.pdf",
      notes: "Crédito para materiales de construcción",
    };
    this.createDebt(debt1);

    const debt2: InsertDebt = {
      debtorId: 2, // Transportes Veloz
      originalAmount: 74380,
      currentAmount: 74380,
      startDate: new Date(2023, 0, 10), // January 10, 2023
      dueDate: new Date(2023, 2, 10), // March 10, 2023
      interest: 0,
      debtType: "invoice",
      supportDocuments: "facturas_456_457_458.pdf",
      notes: "Facturas por compra de materiales eléctricos",
    };
    this.createDebt(debt2);

    // Create activity logs
    const activityLog1: InsertActivityLog = {
      debtorId: 1, // Juan Pérez
      userId: 2, // María Lopez (manager)
      date: new Date(2023, 5, 20), // June 20, 2023
      time: "10:30",
      contactType: "phone",
      result: "promise",
      comments: "Se contactó al Sr. Pérez quien se comprometió a realizar un pago parcial la próxima semana",
      nextAction: "Verificar pago",
      nextActionDate: new Date(2023, 5, 27), // June 27, 2023
    };
    this.createActivityLog(activityLog1);

    const activityLog2: InsertActivityLog = {
      debtorId: 2, // Transportes Veloz
      userId: 5, // Roberto Sánchez (collector)
      date: new Date(2023, 5, 18), // June 18, 2023
      time: "15:45",
      contactType: "visit",
      result: "not_located",
      comments: "Se visitó las oficinas pero estaban cerradas. El guardia de seguridad informó que han estado trabajando remotamente",
      nextAction: "Intentar contacto telefónico",
      nextActionDate: new Date(2023, 5, 21), // June 21, 2023
    };
    this.createActivityLog(activityLog2);

    // Create litigation
    const litigation1: InsertLitigation = {
      debtorId: 2, // Transportes Veloz
      startDate: new Date(2023, 4, 15), // May 15, 2023
      processType: "Demanda mercantil",
      caseNumber: "DM-2023-127",
      court: "Juzgado Tercero Mercantil",
      lawyerId: 2, // María Lopez (manager)
      status: "active",
      resolution: "",
      keyDates: [
        { date: "2023-05-15", description: "Presentación de demanda" },
        { date: "2023-06-05", description: "Admisión de demanda" },
        { date: "2023-07-15", description: "Audiencia preliminar" }
      ],
    };
    this.createLitigation(litigation1);

    // Create visits
    const visit1: InsertVisit = {
      debtorId: 1, // Juan Pérez
      userId: 5, // Roberto Sánchez (collector)
      date: new Date(2023, 5, 10), // June 10, 2023
      time: "14:00",
      address: "Calle Hidalgo 123, Centro, León",
      result: "located",
      personContacted: "Juan Pérez",
      evidence: "foto_domicilio.jpg",
      notes: "Se encontró al deudor en su domicilio. Mencionó problemas financieros temporales",
      nextVisitDate: new Date(2023, 6, 10), // July 10, 2023
    };
    this.createVisit(visit1);

    // Create client contacts
    const contact1: InsertClientContact = {
      clientId: 1, // GAFI Ferreléctrico
      name: "Roberto Álvarez",
      position: "Director Financiero",
      phone: "477-222-3344",
      email: "roberto@gafi.com",
      isPrimary: true,
    };
    this.createClientContact(contact1);

    const contact2: InsertClientContact = {
      clientId: 1, // GAFI Ferreléctrico
      name: "Laura Pérez",
      position: "Contadora",
      phone: "477-444-5566",
      email: "lperez@gafi.com",
      isPrimary: false,
    };
    this.createClientContact(contact2);

    // Add more activity logs to have recent activity data
    const recentLogs = [
      {
        debtorId: 1,
        userId: 2,
        date: new Date(2023, 5, 30), // June 30, 2023
        time: "09:15",
        contactType: "phone",
        result: "located",
        comments: "Se verificó que realizó el pago parcial prometido",
      },
      {
        debtorId: 3,
        userId: 5,
        date: new Date(2023, 5, 29), // June 29, 2023
        time: "11:30",
        contactType: "email",
        result: "located",
        comments: "Se envió correo de notificación inicial",
      },
      {
        debtorId: 2,
        userId: 5,
        date: new Date(2023, 5, 28), // June 28, 2023
        time: "16:00",
        contactType: "whatsapp",
        result: "located",
        comments: "Se contactó al representante legal para informar sobre el proceso judicial",
      }
    ];

    for (const log of recentLogs) {
      this.createActivityLog({
        ...log,
        nextAction: "Seguimiento",
        nextActionDate: new Date(2023, 6, 5), // July 5, 2023
      });
    }
  }
}

import { db } from './db';
import { eq, desc, count, sum, gte } from 'drizzle-orm';


export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getClients(): Promise<Client[]> {
    return await db.select().from(clients);
  }

  async getClientsByExecutive(executiveId: number): Promise<Client[]> {
    return await db.select().from(clients).where(eq(clients.executiveId, executiveId));
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const [updatedClient] = await db
      .update(clients)
      .set({ ...clientData })
      .where(eq(clients.id, id))
      .returning();
    return updatedClient;
  }

  async deleteClient(id: number): Promise<boolean> {
    await db.delete(clients).where(eq(clients.id, id));
    return true;
  }

  // Client Contacts
  async getClientContacts(clientId: number): Promise<ClientContact[]> {
    return await db.select().from(clientContacts).where(eq(clientContacts.clientId, clientId));
  }

  async createClientContact(contact: InsertClientContact): Promise<ClientContact> {
    const [newContact] = await db.insert(clientContacts).values(contact).returning();
    return newContact;
  }

  async updateClientContact(id: number, contactData: Partial<ClientContact>): Promise<ClientContact | undefined> {
    const [updatedContact] = await db
      .update(clientContacts)
      .set({ ...contactData })
      .where(eq(clientContacts.id, id))
      .returning();
    return updatedContact;
  }

  async deleteClientContact(id: number): Promise<boolean> {
    await db.delete(clientContacts).where(eq(clientContacts.id, id));
    return true;
  }

  // Debtors
  async getDebtor(id: number): Promise<Debtor | undefined> {
    const [debtor] = await db.select().from(debtors).where(eq(debtors.id, id));
    return debtor;
  }

  async getDebtors(): Promise<Debtor[]> {
    return await db.select().from(debtors);
  }

  async getDebtorsByClient(clientId: number): Promise<Debtor[]> {
    return await db.select().from(debtors).where(eq(debtors.clientId, clientId));
  }

  async getDebtorsByUser(userId: number): Promise<Debtor[]> {
    return await db.select().from(debtors).where(eq(debtors.assignedUserId, userId));
  }

  async getDebtorsByStatus(status: string): Promise<Debtor[]> {
    return await db.select().from(debtors).where(eq(debtors.status, status));
  }

  async createDebtor(debtor: InsertDebtor): Promise<Debtor> {
    const [newDebtor] = await db.insert(debtors).values(debtor).returning();
    return newDebtor;
  }

  async updateDebtor(id: number, debtorData: Partial<Debtor>): Promise<Debtor | undefined> {
    const [updatedDebtor] = await db
      .update(debtors)
      .set({ ...debtorData })
      .where(eq(debtors.id, id))
      .returning();
    return updatedDebtor;
  }

  async deleteDebtor(id: number): Promise<boolean> {
    await db.delete(debtors).where(eq(debtors.id, id));
    return true;
  }

  // Debts
  async getDebt(id: number): Promise<Debt | undefined> {
    const [debt] = await db.select().from(debts).where(eq(debts.id, id));
    return debt;
  }

  async getDebtsByDebtor(debtorId: number): Promise<Debt[]> {
    return await db.select().from(debts).where(eq(debts.debtorId, debtorId));
  }

  async createDebt(debt: InsertDebt): Promise<Debt> {
    const [newDebt] = await db.insert(debts).values(debt).returning();
    return newDebt;
  }

  async updateDebt(id: number, debtData: Partial<Debt>): Promise<Debt | undefined> {
    const [updatedDebt] = await db
      .update(debts)
      .set({ ...debtData })
      .where(eq(debts.id, id))
      .returning();
    return updatedDebt;
  }

  async deleteDebt(id: number): Promise<boolean> {
    await db.delete(debts).where(eq(debts.id, id));
    return true;
  }

  // Activity Logs
  async getActivityLog(id: number): Promise<ActivityLog | undefined> {
    const [log] = await db.select().from(activityLogs).where(eq(activityLogs.id, id));
    return log;
  }

  async getActivityLogsByDebtor(debtorId: number): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).where(eq(activityLogs.debtorId, debtorId));
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async updateActivityLog(id: number, logData: Partial<ActivityLog>): Promise<ActivityLog | undefined> {
    const [updatedLog] = await db
      .update(activityLogs)
      .set({ ...logData })
      .where(eq(activityLogs.id, id))
      .returning();
    return updatedLog;
  }

  async deleteActivityLog(id: number): Promise<boolean> {
    await db.delete(activityLogs).where(eq(activityLogs.id, id));
    return true;
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async getDocumentsByEntity(entityType: string, entityId: number): Promise<Document[]> {
    return await db.select().from(documents)
      .where(eq(documents.entityType, entityType))
      .where(eq(documents.entityId, entityId));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set({ ...documentData })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    await db.delete(documents).where(eq(documents.id, id));
    return true;
  }

  // Litigations
  async getLitigation(id: number): Promise<Litigation | undefined> {
    const [litigation] = await db.select().from(litigations).where(eq(litigations.id, id));
    return litigation;
  }

  async getLitigationsByDebtor(debtorId: number): Promise<Litigation[]> {
    return await db.select().from(litigations).where(eq(litigations.debtorId, debtorId));
  }

  async createLitigation(litigation: InsertLitigation): Promise<Litigation> {
    const [newLitigation] = await db.insert(litigations).values(litigation).returning();
    return newLitigation;
  }

  async updateLitigation(id: number, litigationData: Partial<Litigation>): Promise<Litigation | undefined> {
    const [updatedLitigation] = await db
      .update(litigations)
      .set({ ...litigationData })
      .where(eq(litigations.id, id))
      .returning();
    return updatedLitigation;
  }

  async deleteLitigation(id: number): Promise<boolean> {
    await db.delete(litigations).where(eq(litigations.id, id));
    return true;
  }

  // Visits
  async getVisit(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit;
  }

  async getVisitsByDebtor(debtorId: number): Promise<Visit[]> {
    return await db.select().from(visits).where(eq(visits.debtorId, debtorId));
  }

  async createVisit(visit: InsertVisit): Promise<Visit> {
    const [newVisit] = await db.insert(visits).values(visit).returning();
    return newVisit;
  }

  async updateVisit(id: number, visitData: Partial<Visit>): Promise<Visit | undefined> {
    const [updatedVisit] = await db
      .update(visits)
      .set({ ...visitData })
      .where(eq(visits.id, id))
      .returning();
    return updatedVisit;
  }

  async deleteVisit(id: number): Promise<boolean> {
    await db.delete(visits).where(eq(visits.id, id));
    return true;
  }

  // Client Reports
  async getClientReport(id: number): Promise<ClientReport | undefined> {
    const [report] = await db.select().from(clientReports).where(eq(clientReports.id, id));
    return report;
  }

  async getClientReportsByClient(clientId: number): Promise<ClientReport[]> {
    return await db.select().from(clientReports).where(eq(clientReports.clientId, clientId));
  }

  async getClientReportsByDebtor(debtorId: number): Promise<ClientReport[]> {
    return await db.select().from(clientReports).where(eq(clientReports.debtorId, debtorId));
  }

  async createClientReport(report: InsertClientReport): Promise<ClientReport> {
    const [newReport] = await db.insert(clientReports).values(report).returning();
    return newReport;
  }

  async updateClientReport(id: number, reportData: Partial<ClientReport>): Promise<ClientReport | undefined> {
    const [updatedReport] = await db
      .update(clientReports)
      .set({ ...reportData })
      .where(eq(clientReports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteClientReport(id: number): Promise<boolean> {
    await db.delete(clientReports).where(eq(clientReports.id, id));
    return true;
  }
  
  // Client Banking Info
  async getClientBankingInfo(clientId: number): Promise<ClientBankingInfo | undefined> {
    try {
      const [bankingInfo] = await db
        .select()
        .from(clientBankingInfo)
        .where(eq(clientBankingInfo.clientId, clientId));
      return bankingInfo;
    } catch (error) {
      console.error("Error fetching client banking info:", error);
      return undefined;
    }
  }

  async createClientBankingInfo(info: InsertClientBankingInfo): Promise<ClientBankingInfo> {
    try {
      const [bankingInfo] = await db
        .insert(clientBankingInfo)
        .values(info)
        .returning();
      return bankingInfo;
    } catch (error) {
      console.error("Error creating client banking info:", error);
      throw error;
    }
  }

  async updateClientBankingInfo(clientId: number, info: Partial<ClientBankingInfo>): Promise<ClientBankingInfo | undefined> {
    try {
      const [bankingInfo] = await db
        .update(clientBankingInfo)
        .set({ ...info, updatedAt: new Date() })
        .where(eq(clientBankingInfo.clientId, clientId))
        .returning();
      return bankingInfo;
    } catch (error) {
      console.error("Error updating client banking info:", error);
      return undefined;
    }
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    try {
      const [newPayment] = await db
        .insert(payments)
        .values(payment)
        .returning();
      return newPayment;
    } catch (error) {
      console.error("Error creating payment:", error);
      throw error;
    }
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, id));
      return payment;
    } catch (error) {
      console.error("Error getting payment:", error);
      return undefined;
    }
  }

  async getPaymentsByDebtId(debtId: number): Promise<Payment[]> {
    try {
      const paymentsList = await db
        .select()
        .from(payments)
        .where(eq(payments.debtId, debtId));
      return paymentsList;
    } catch (error) {
      console.error("Error getting payments by debt ID:", error);
      return [];
    }
  }

  async updateDebtAmountAfterPayment(debtId: number, newAmount: number): Promise<Debt | undefined> {
    try {
      const [debt] = await db
        .update(debts)
        .set({ 
          currentAmount: newAmount,
          updatedAt: new Date()
        })
        .where(eq(debts.id, debtId))
        .returning();
      return debt;
    } catch (error) {
      console.error("Error updating debt amount after payment:", error);
      return undefined;
    }
  }

  // Dashboard Data
  async getDashboardStats(): Promise<{
    activeClients: number;
    totalDebtors: number;
    monthlyCollection: number;
    litigationCases: number;
  }> {
    const activeClientsCount = await db.select({ count: count() }).from(clients)
      .where(eq(clients.status, CLIENT_STATUS.ACTIVE));
    
    const totalDebtorsCount = await db.select({ count: count() }).from(debtors);
    
    // For monthly collection, we can sum up the amounts from debt records created in the current month
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthlyCollection = await db.select({ sum: sum(debts.amount) }).from(debts)
      .where(gte(debts.createdAt, firstDayOfMonth));
    
    const litigationCasesCount = await db.select({ count: count() }).from(litigations);
    
    return {
      activeClients: activeClientsCount[0].count || 0,
      totalDebtors: totalDebtorsCount[0].count || 0,
      monthlyCollection: monthlyCollection[0].sum || 0,
      litigationCases: litigationCasesCount[0].count || 0,
    };
  }

  async getRecentDebtors(limit: number = 5): Promise<Debtor[]> {
    return await db.select().from(debtors).orderBy(desc(debtors.createdAt)).limit(limit);
  }

  async getRecentActivities(limit: number = 5): Promise<ActivityLog[]> {
    return await db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
  }
}

// Usar MemStorage para el desarrollo/pruebas hasta que la base de datos esté completamente configurada
export const storage = new MemStorage();
// export const storage = new DatabaseStorage();
