import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

async function main() {
  console.log("Connecting to database:", process.env.DATABASE_URL);
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });
    
    console.log("Connected to database successfully");
    console.log("Creating tables...");
    
    // Create tables in order of dependencies
    const queries = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_login TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        rfc TEXT NOT NULL,
        curp TEXT,
        person_type TEXT NOT NULL,
        street TEXT,
        number TEXT,
        colony TEXT,
        zip_code TEXT,
        state TEXT,
        city TEXT,
        phone TEXT,
        email TEXT,
        legal_representative TEXT,
        business_type TEXT,
        executive_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        notes TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS debtors (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        rfc TEXT,
        curp TEXT,
        person_type TEXT NOT NULL,
        street TEXT,
        number TEXT,
        colony TEXT,
        zip_code TEXT,
        state TEXT,
        city TEXT,
        phone TEXT,
        email TEXT,
        contact_name TEXT,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        assigned_user_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        notes TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS debts (
        id SERIAL PRIMARY KEY,
        debtor_id INTEGER NOT NULL REFERENCES debtors(id),
        concept TEXT NOT NULL,
        original_amount REAL NOT NULL,
        current_amount REAL NOT NULL,
        start_date DATE NOT NULL,
        due_date DATE NOT NULL,
        interest REAL,
        debt_type TEXT NOT NULL,
        support_documents TEXT,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        debtor_id INTEGER NOT NULL REFERENCES debtors(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        time TEXT NOT NULL,
        contact_type TEXT NOT NULL,
        result TEXT NOT NULL,
        comments TEXT,
        next_action TEXT,
        next_action_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        uploaded_by_id INTEGER NOT NULL REFERENCES users(id),
        description TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS litigations (
        id SERIAL PRIMARY KEY,
        debtor_id INTEGER NOT NULL REFERENCES debtors(id),
        start_date DATE NOT NULL,
        process_type TEXT NOT NULL,
        case_number TEXT,
        court TEXT,
        lawyer_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL,
        resolution TEXT,
        key_dates JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        debtor_id INTEGER NOT NULL REFERENCES debtors(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        date DATE NOT NULL,
        time TEXT NOT NULL,
        address TEXT NOT NULL,
        result TEXT NOT NULL,
        person_contacted TEXT,
        evidence TEXT,
        notes TEXT,
        next_visit_date DATE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS client_reports (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        debtor_id INTEGER REFERENCES debtors(id),
        report_date DATE NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        summary TEXT NOT NULL,
        promises INTEGER,
        payments REAL,
        recommendations TEXT,
        status TEXT NOT NULL,
        comments TEXT,
        report_path TEXT,
        created_by_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS client_contacts (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id),
        name TEXT NOT NULL,
        position TEXT,
        phone TEXT,
        email TEXT,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS client_banking_info (
        id SERIAL PRIMARY KEY,
        client_id INTEGER NOT NULL REFERENCES clients(id) UNIQUE,
        account_number TEXT,
        clabe TEXT,
        bank_name TEXT,
        account_holder TEXT,
        notes TEXT,
        reference TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )`,
      
      // Also create the sessions table for Replit Auth
      `CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP NOT NULL
      )`,
      
      `CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions (expire)`
    ];
    
    // Execute each query
    for (const query of queries) {
      await pool.query(query);
      console.log("Executed query:", query.substring(0, 50) + "...");
    }
    
    console.log("All tables created successfully!");
    
    // Create a default admin user
    const adminExists = await pool.query(
      "SELECT * FROM users WHERE email = 'admin@dcs.com'"
    );
    
    if (adminExists.rowCount === 0) {
      await pool.query(`
        INSERT INTO users (full_name, email, password, role)
        VALUES ('Juan Dominguez', 'admin@dcs.com', '$2a$10$nOUIs5kJ7naTuTFkBy1veuK0kSxUFXfuaOKdOKf9xYT0KKIGSJwFa', 'superadmin')
      `);
      console.log("Created default admin user: admin@dcs.com (password: admin123)");
    } else {
      console.log("Default admin user already exists");
    }
    
    // Create sample data
    const clientsExist = await pool.query("SELECT * FROM clients LIMIT 1");
    if (clientsExist.rowCount === 0) {
      // Add a sample client
      const clientResult = await pool.query(`
        INSERT INTO clients (name, rfc, person_type, business_type, status)
        VALUES ('GAFI Ferreléctrico', 'GAF850312JK8', 'company', 'Venta de material eléctrico', 'active')
        RETURNING id
      `);
      
      const clientId = clientResult.rows[0].id;
      console.log(`Created sample client with ID ${clientId}`);
      
      // Add a contact for the client
      await pool.query(`
        INSERT INTO client_contacts (client_id, name, position, phone, email, is_primary)
        VALUES (${clientId}, 'Roberto Álvarez', 'Director Financiero', '5555123456', 'roberto@gafi.com', true)
      `);
      
      // Add banking info for the client
      await pool.query(`
        INSERT INTO client_banking_info (client_id, bank_name, account_holder, account_number, clabe, reference)
        VALUES (${clientId}, 'Banco Nacional de México', 'GAFI Ferreléctrico, S.A. de C.V.', '0112358132134', '012180001123581321', 'GAFI-COBRANZA')
      `);
      
      // Add a sample debtor
      const debtorResult = await pool.query(`
        INSERT INTO debtors (name, rfc, person_type, client_id, status)
        VALUES ('Juan Pérez', 'PERJ800523SH9', 'individual', ${clientId}, 'in_management')
        RETURNING id
      `);
      
      const debtorId = debtorResult.rows[0].id;
      console.log(`Created sample debtor with ID ${debtorId}`);
      
      // Add a debt for the debtor
      await pool.query(`
        INSERT INTO debts (debtor_id, concept, original_amount, current_amount, start_date, due_date, debt_type)
        VALUES (${debtorId}, 'Factura por materiales eléctricos', 28500, 30100, '2024-03-15', '2024-04-15', 'invoice')
      `);
      
      // Add an activity log
      await pool.query(`
        INSERT INTO activity_logs (debtor_id, user_id, date, time, contact_type, result, comments)
        VALUES (${debtorId}, 1, '2024-05-10', '10:15', 'phone', 'promise', 'El deudor promete pagar el 20 de mayo')
      `);
      
      console.log("Sample data created successfully!");
    } else {
      console.log("Sample data already exists");
    }
    
    await pool.end();
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Error during migration:", error);
    process.exit(1);
  }
}

main();