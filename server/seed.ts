import { storage } from "./storage";
import { USER_ROLES } from "@shared/schema";

async function seed() {
  const existing = await storage.getUserByEmail("admin@dcs.com");
  if (existing) {
    console.log("Seed skipped: admin@dcs.com already exists.");
    return;
  }

  console.log("Seeding database...");

  await storage.createUser({
    fullName: "Juan Dominguez",
    email: "admin@dcs.com",
    phone: "555-123-4567",
    password: "password123",
    role: USER_ROLES.ADMIN,
  });
  await storage.createUser({
    fullName: "Maria Lopez",
    email: "manager@dcs.com",
    phone: "555-987-6543",
    password: "password123",
    role: USER_ROLES.COLLECTION_MANAGER,
  });
  await storage.createUser({
    fullName: "Carlos Jiménez",
    email: "carlos@dcs.com",
    phone: "555-111-2222",
    password: "password123",
    role: USER_ROLES.COMMERCIAL_EXECUTIVE,
  });
  await storage.createUser({
    fullName: "Laura Martínez",
    email: "laura@dcs.com",
    phone: "555-333-4444",
    password: "password123",
    role: USER_ROLES.COMMERCIAL_EXECUTIVE,
  });
  await storage.createUser({
    fullName: "Roberto Sánchez",
    email: "roberto@dcs.com",
    phone: "555-555-6666",
    password: "password123",
    role: USER_ROLES.COLLECTOR,
  });

  await storage.createClient({
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
    executiveId: 3,
    status: "active",
    notes: "Cliente con múltiples sucursales en la región",
  });
  await storage.createClient({
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
    executiveId: 4,
    status: "active",
    notes: "",
  });
  await storage.createClient({
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
    executiveId: 5,
    status: "active",
    notes: "",
  });

  await storage.createDebtor({
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
    clientId: 1,
    assignedUserId: 2,
    status: "in_management",
    notes: "Cliente frecuente que ahora tiene problemas de pago",
  });
  await storage.createDebtor({
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
    clientId: 1,
    assignedUserId: 5,
    status: "in_litigation",
    notes: "Empresa con múltiples facturas vencidas",
  });
  await storage.createDebtor({
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
    clientId: 2,
    assignedUserId: 5,
    status: "new",
    notes: "",
  });

  await storage.createDebt({
    debtorId: 1,
    concept: "Crédito de materiales",
    originalAmount: 28500,
    currentAmount: 32100,
    startDate: "2023-03-15",
    dueDate: "2023-06-15",
    interest: 12.5,
    debtType: "credit",
    supportDocuments: "contrato_credito_123.pdf",
    notes: "Crédito para materiales de construcción",
  });
  await storage.createDebt({
    debtorId: 2,
    concept: "Facturas vencidas",
    originalAmount: 74380,
    currentAmount: 74380,
    startDate: "2023-01-10",
    dueDate: "2023-03-10",
    interest: 0,
    debtType: "invoice",
    supportDocuments: "facturas_456_457_458.pdf",
    notes: "Facturas por compra de materiales eléctricos",
  });

  console.log("Seed complete.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
