import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  insertUserSchema,
  insertClientSchema,
  insertDebtorSchema,
  insertDebtSchema,
  insertActivityLogSchema,
  insertDocumentSchema,
  insertLitigationSchema,
  insertVisitSchema,
  insertClientReportSchema,
  insertClientContactSchema,
  insertClientBankingInfoSchema,
  insertNotificationSchema,
  USER_ROLES
} from "@shared/schema";

// Create session store
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "dcs-secret-key-2024",
      resave: true,
      saveUninitialized: true,
      store: new SessionStore({ 
        checkPeriod: 86400000,  // Prune expired entries every 24h
        stale: false            // Avoid using stale data
      }),
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false,                // Set to false to work in development
        sameSite: 'lax',
        httpOnly: true
      }
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Correo electrónico incorrecto." });
          }
          
          // For development purpose, allow plain password for the demo credentials
          if (email === "admin@dcs.com" && password === "password123" && user.password === "password123") {
            return done(null, user);
          }
          
          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Contraseña incorrecta." });
          }
          
          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Role-based authorization middleware
  const hasRole = (roles: string[]) => {
    return (req: Request, res: Response, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = req.user as any;
      if (roles.includes(user.role)) {
        return next();
      }
      
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    };
  };

  // Authentication Routes
  app.post("/api/auth/login", (req, res, next) => {
    // Log the login attempt
    console.log("Login attempt:", req.body.email);
    
    passport.authenticate("local", (err, user, info) => {
      console.log("Authentication result:", { err, user: user ? 'User found' : 'No user', info });
      
      if (err) {
        console.error("Authentication error:", err);
        return res.status(500).json({ message: "Error de autenticación" });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciales inválidas" });
      }
      
      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("Login error:", loginErr);
          return res.status(500).json({ message: "Error al iniciar sesión" });
        }
        
        console.log("Login successful for user:", user.email);
        
        // Update last login time (async)
        storage.updateUser(user.id, { lastLogin: new Date() });
        
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        return res.json({ 
          success: true,
          user: userWithoutPassword,
          authenticated: true 
        });
      });
    })(req, res, next);
  });

  app.get("/api/auth/session", (req, res) => {
    console.log("Session check - authenticated:", req.isAuthenticated());
    
    if (req.isAuthenticated()) {
      const user = req.user as any;
      console.log("User is authenticated:", user.email);
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        authenticated: true, 
        user: userWithoutPassword 
      });
    } else {
      console.log("No authenticated session found");
      res.json({ 
        authenticated: false 
      });
    }
  });
  
  // Debug endpoint
  app.get("/api/auth/debug", async (req, res) => {
    try {
      // Check if specific user exists
      const testUser = await storage.getUserByEmail("admin@dcs.com");
      // Get all users in memory for debugging
      const allUsers = await storage.getUsers();
      const safeUsers = allUsers.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json({
        testUserExists: !!testUser,
        testUser: testUser ? { email: testUser.email, role: testUser.role } : null,
        userCount: safeUsers.length,
        users: safeUsers.map(u => ({ id: u.id, email: u.email }))
      });
    } catch (error) {
      console.error("Debug error:", error);
      res.status(500).json({ error: "Error in debug endpoint" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(function(err) {
      if (err) { return res.status(500).json({ message: err.message }); }
      res.json({ success: true });
    });
  });

  // User Routes
  app.get("/api/users", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(safeUsers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only allow admin/superadmin to view other users, or users to view themselves
      const currentUser = req.user as any;
      if (currentUser.id !== id && 
          ![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(currentUser.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });

  app.post("/api/users", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      validatedData.password = await bcrypt.hash(validatedData.password, salt);
      
      const user = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating user" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only allow admin/superadmin to update other users, or users to update themselves
      const currentUser = req.user as any;
      if (currentUser.id !== id && 
          ![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(currentUser.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const userData = req.body;
      
      // Prevent role escalation if not an admin/superadmin
      if (userData.role && 
          ![USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN].includes(currentUser.role)) {
        delete userData.role;
      }
      
      // If password is being updated, hash it
      if (userData.password) {
        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(userData.password, salt);
      }
      
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  // Client Routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      let clients;
      const currentUser = req.user as any;
      
      // Filter clients based on user role
      if ([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.COLLECTION_MANAGER].includes(currentUser.role)) {
        clients = await storage.getClients();
      } else if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE) {
        clients = await storage.getClientsByExecutive(currentUser.id);
      } else {
        // For collectors, get clients associated with their assigned debtors
        const debtors = await storage.getDebtorsByUser(currentUser.id);
        const clientIds = [...new Set(debtors.map(d => d.clientId))];
        clients = [];
        for (const id of clientIds) {
          const client = await storage.getClient(id);
          if (client) clients.push(client);
        }
      }
      
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Error fetching clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client" });
    }
  });

  app.post("/api/clients", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.COMMERCIAL_EXECUTIVE]), async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating client" });
    }
  });

  app.put("/api/clients/:id", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.COMMERCIAL_EXECUTIVE]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      // For commercial executives, ensure they only update their own clients
      if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE) {
        const client = await storage.getClient(id);
        if (!client || client.executiveId !== currentUser.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const updatedClient = await storage.updateClient(id, req.body);
      
      if (!updatedClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Error updating client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);
      
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Error deleting client" });
    }
  });

  // Client Contacts Routes
  app.get("/api/clients/:clientId/contacts", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const contacts = await storage.getClientContacts(clientId);
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching contacts" });
    }
  });

  app.post("/api/clients/:clientId/contacts", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.COMMERCIAL_EXECUTIVE]), async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // For commercial executives, ensure they only update their own clients
      const currentUser = req.user as any;
      if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE && client.executiveId !== currentUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const contactData = { ...req.body, clientId };
      const validatedData = insertClientContactSchema.parse(contactData);
      const contact = await storage.createClientContact(validatedData);
      res.status(201).json(contact);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating contact" });
    }
  });
  
  // Client Banking Info Routes
  app.get("/api/clients/:clientId/banking-info", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const bankingInfo = await storage.getClientBankingInfo(clientId);
      
      if (!bankingInfo) {
        return res.status(404).json({ message: "Información bancaria no encontrada" });
      }
      
      res.json(bankingInfo);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener información bancaria" });
    }
  });
  
  app.post("/api/clients/:clientId/banking-info", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.ACCOUNTING]), async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }
      
      // Check if banking info already exists for this client
      const existingInfo = await storage.getClientBankingInfo(clientId);
      if (existingInfo) {
        return res.status(400).json({ message: "La información bancaria ya existe para este cliente" });
      }
      
      const bankingData = { ...req.body, clientId };
      const validatedData = insertClientBankingInfoSchema.parse(bankingData);
      const bankingInfo = await storage.createClientBankingInfo(validatedData);
      res.status(201).json(bankingInfo);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error al crear información bancaria" });
    }
  });
  
  app.put("/api/clients/:clientId/banking-info", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.ACCOUNTING]), async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      
      // Check if banking info exists
      const existingInfo = await storage.getClientBankingInfo(clientId);
      if (!existingInfo) {
        return res.status(404).json({ message: "Información bancaria no encontrada" });
      }
      
      const updatedBankingInfo = await storage.updateClientBankingInfo(clientId, req.body);
      
      if (!updatedBankingInfo) {
        return res.status(404).json({ message: "Información bancaria no encontrada" });
      }
      
      res.json(updatedBankingInfo);
    } catch (error) {
      res.status(500).json({ message: "Error al actualizar información bancaria" });
    }
  });

  // Debtor Routes
  app.get("/api/debtors", isAuthenticated, async (req, res) => {
    try {
      let debtors;
      const currentUser = req.user as any;
      const status = req.query.status as string;
      const clientId = req.query.clientId ? parseInt(req.query.clientId as string) : undefined;
      
      // First apply role-based filters
      if ([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.COLLECTION_MANAGER].includes(currentUser.role)) {
        debtors = await storage.getDebtors();
      } else if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE) {
        const clients = await storage.getClientsByExecutive(currentUser.id);
        debtors = [];
        for (const client of clients) {
          const clientDebtors = await storage.getDebtorsByClient(client.id);
          debtors.push(...clientDebtors);
        }
      } else {
        // Collectors only see their assigned debtors
        debtors = await storage.getDebtorsByUser(currentUser.id);
      }
      
      // Then apply query filters
      if (status) {
        debtors = debtors.filter(d => d.status === status);
      }
      
      if (clientId) {
        debtors = debtors.filter(d => d.clientId === clientId);
      }
      
      res.json(debtors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching debtors" });
    }
  });

  app.get("/api/debtors/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const debtor = await storage.getDebtor(id);
      
      if (!debtor) {
        return res.status(404).json({ message: "Debtor not found" });
      }
      
      // Verify user has access to this debtor
      const currentUser = req.user as any;
      if (currentUser.role === USER_ROLES.COLLECTOR && debtor.assignedUserId !== currentUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      } else if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE) {
        const client = await storage.getClient(debtor.clientId);
        if (!client || client.executiveId !== currentUser.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      res.json(debtor);
    } catch (error) {
      res.status(500).json({ message: "Error fetching debtor" });
    }
  });

  app.post("/api/debtors", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.COLLECTION_MANAGER, USER_ROLES.COMMERCIAL_EXECUTIVE]), async (req, res) => {
    try {
      const validatedData = insertDebtorSchema.parse(req.body);
      
      // Verify user has access to create debtor for this client
      const currentUser = req.user as any;
      if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE) {
        const client = await storage.getClient(validatedData.clientId);
        if (!client || client.executiveId !== currentUser.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const debtor = await storage.createDebtor(validatedData);
      res.status(201).json(debtor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating debtor" });
    }
  });

  app.put("/api/debtors/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const debtor = await storage.getDebtor(id);
      
      if (!debtor) {
        return res.status(404).json({ message: "Debtor not found" });
      }
      
      // Verify user has access to update this debtor
      const currentUser = req.user as any;
      if (currentUser.role === USER_ROLES.COLLECTOR && debtor.assignedUserId !== currentUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      } else if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE) {
        const client = await storage.getClient(debtor.clientId);
        if (!client || client.executiveId !== currentUser.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const updatedDebtor = await storage.updateDebtor(id, req.body);
      res.json(updatedDebtor);
    } catch (error) {
      res.status(500).json({ message: "Error updating debtor" });
    }
  });

  // Debt Routes
  app.get("/api/debtors/:debtorId/debts", isAuthenticated, async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const debts = await storage.getDebtsByDebtor(debtorId);
      res.json(debts);
    } catch (error) {
      res.status(500).json({ message: "Error fetching debts" });
    }
  });

  app.post("/api/debtors/:debtorId/debts", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.COLLECTION_MANAGER, USER_ROLES.COMMERCIAL_EXECUTIVE]), async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const debtor = await storage.getDebtor(debtorId);
      
      if (!debtor) {
        return res.status(404).json({ message: "Debtor not found" });
      }
      
      // Verify user has access to add debt to this debtor
      const currentUser = req.user as any;
      if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE) {
        const client = await storage.getClient(debtor.clientId);
        if (!client || client.executiveId !== currentUser.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const debtData = { ...req.body, debtorId };
      const validatedData = insertDebtSchema.parse(debtData);
      const debt = await storage.createDebt(validatedData);
      res.status(201).json(debt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating debt" });
    }
  });

  // Activity Log Routes
  app.get("/api/debtors/:debtorId/activity", isAuthenticated, async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const logs = await storage.getActivityLogsByDebtor(debtorId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activity logs" });
    }
  });

  app.post("/api/debtors/:debtorId/activity", isAuthenticated, async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const debtor = await storage.getDebtor(debtorId);
      
      if (!debtor) {
        return res.status(404).json({ message: "Debtor not found" });
      }
      
      // Verify user has access to add activity to this debtor
      const currentUser = req.user as any;
      if (currentUser.role === USER_ROLES.COLLECTOR && debtor.assignedUserId !== currentUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      } else if (currentUser.role === USER_ROLES.COMMERCIAL_EXECUTIVE) {
        const client = await storage.getClient(debtor.clientId);
        if (!client || client.executiveId !== currentUser.id) {
          return res.status(403).json({ message: "Forbidden" });
        }
      }
      
      const logData = { 
        ...req.body, 
        debtorId,
        userId: currentUser.id
      };
      const validatedData = insertActivityLogSchema.parse(logData);
      const log = await storage.createActivityLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating activity log" });
    }
  });

  // Dashboard Routes
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error fetching dashboard stats" });
    }
  });

  app.get("/api/dashboard/recent-debtors", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const debtors = await storage.getRecentDebtors(limit);
      res.json(debtors);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent debtors" });
    }
  });

  app.get("/api/dashboard/recent-activities", isAuthenticated, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const activities = await storage.getRecentActivities(limit);
      
      // Enhance activities with user and debtor data
      const enhancedActivities = [];
      for (const activity of activities) {
        const user = await storage.getUser(activity.userId);
        const debtor = await storage.getDebtor(activity.debtorId);
        
        if (user && debtor) {
          const { password, ...safeUser } = user;
          enhancedActivities.push({
            ...activity,
            user: safeUser,
            debtor: {
              id: debtor.id,
              name: debtor.name
            }
          });
        }
      }
      
      res.json(enhancedActivities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching recent activities" });
    }
  });

  // Management Routes
  app.get("/api/activities/recent", isAuthenticated, async (req, res) => {
    try {
      // You can add filter parameters here from req.query
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const activities = await storage.getActivityLogs({
        page,
        limit,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        debtorId: req.query.debtorId ? parseInt(req.query.debtorId as string) : undefined,
        type: req.query.type as string | undefined,
      });
      
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Error fetching activities" });
    }
  });
  
  app.get("/api/activities/calendar", isAuthenticated, async (req, res) => {
    try {
      const startDate = req.query.start as string;
      const endDate = req.query.end as string;
      
      // Get all scheduled events (visits, follow-ups, etc.)
      const activityLogs = await storage.getScheduledActivities(startDate, endDate);
      
      res.json(activityLogs);
    } catch (error) {
      res.status(500).json({ message: "Error fetching calendar events" });
    }
  });
  
  app.get("/api/reports/client", isAuthenticated, async (req, res) => {
    try {
      const clientReports = await storage.getClientReports({
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        status: req.query.status as string | undefined,
      });
      
      res.json(clientReports);
    } catch (error) {
      res.status(500).json({ message: "Error fetching client reports" });
    }
  });

  app.get("/api/debtors/:debtorId/reports", isAuthenticated, async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const reports = await storage.getClientReportsByDebtor(debtorId);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ message: "Error fetching reports" });
    }
  });

  app.post("/api/debtors/:debtorId/reports", isAuthenticated, async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const debtor = await storage.getDebtor(debtorId);
      if (!debtor) return res.status(404).json({ message: "Debtor not found" });
      const currentUser = req.user as any;
      const reportData = {
        ...req.body,
        debtorId,
        clientId: debtor.clientId,
        createdById: currentUser.id,
      };
      const validatedData = insertClientReportSchema.parse(reportData);
      const report = await storage.createClientReport(validatedData);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating report" });
    }
  });

  // Documents Routes
  app.get("/api/documents/:entityType/:entityId", isAuthenticated, async (req, res) => {
    try {
      const entityType = req.params.entityType;
      const entityId = parseInt(req.params.entityId);
      const documents = await storage.getDocumentsByEntity(entityType, entityId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Error fetching documents" });
    }
  });

  // Litigation Routes
  app.get("/api/debtors/:debtorId/litigation", isAuthenticated, async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const litigations = await storage.getLitigationsByDebtor(debtorId);
      res.json(litigations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching litigation records" });
    }
  });

  app.post("/api/debtors/:debtorId/litigation", isAuthenticated, hasRole([USER_ROLES.SUPERADMIN, USER_ROLES.ADMIN, USER_ROLES.COLLECTION_MANAGER]), async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const debtor = await storage.getDebtor(debtorId);
      
      if (!debtor) {
        return res.status(404).json({ message: "Debtor not found" });
      }
      
      const litigationData = { ...req.body, debtorId };
      const validatedData = insertLitigationSchema.parse(litigationData);
      const litigation = await storage.createLitigation(validatedData);
      
      // Update debtor status to in_litigation
      await storage.updateDebtor(debtorId, { status: "in_litigation" });
      
      res.status(201).json(litigation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating litigation record" });
    }
  });

  // Visits Routes
  app.get("/api/debtors/:debtorId/visits", isAuthenticated, async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const visits = await storage.getVisitsByDebtor(debtorId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ message: "Error fetching visits" });
    }
  });

  app.post("/api/debtors/:debtorId/visits", isAuthenticated, async (req, res) => {
    try {
      const debtorId = parseInt(req.params.debtorId);
      const debtor = await storage.getDebtor(debtorId);
      
      if (!debtor) {
        return res.status(404).json({ message: "Debtor not found" });
      }
      
      // Verify user has access to add visit to this debtor
      const currentUser = req.user as any;
      if (currentUser.role === USER_ROLES.COLLECTOR && debtor.assignedUserId !== currentUser.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const visitData = { 
        ...req.body, 
        debtorId,
        userId: currentUser.id
      };
      const validatedData = insertVisitSchema.parse(visitData);
      const visit = await storage.createVisit(validatedData);
      res.status(201).json(visit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating visit record" });
    }
  });

  // PAYMENT ROUTES
  app.get("/api/debts/:debtId/payments", isAuthenticated, async (req, res) => {
    try {
      const debtId = parseInt(req.params.debtId);
      const payments = await storage.getPaymentsByDebtId(debtId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payments" });
    }
  });
  
  app.post("/api/debts/:debtId/payments", isAuthenticated, async (req, res) => {
    try {
      const debtId = parseInt(req.params.debtId);
      const debt = await storage.getDebt(debtId);
      
      if (!debt) {
        return res.status(404).json({ message: "Debt not found" });
      }
      
      const currentUser = req.user as any;
      // Make sure we use the correct field names as per schema
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        debtId,
        registeredById: currentUser.id
      });
      
      // Validate payment amount does not exceed current debt amount
      if (paymentData.amount > debt.currentAmount) {
        return res.status(400).json({ message: "Payment amount cannot exceed current debt amount" });
      }
      
      // Create the payment record
      const payment = await storage.createPayment(paymentData);
      
      // Update the debt's current amount
      const newDebtAmount = debt.currentAmount - paymentData.amount;
      await storage.updateDebtAmountAfterPayment(debtId, newDebtAmount);
      
      // Log the payment activity
      await storage.createActivityLog({
        debtorId: debt.debtorId,
        userId: currentUser.id,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].slice(0, 5),
        contactType: CONTACT_TYPE.OTHER,
        result: CONTACT_RESULT.PAID,
        comments: `Pago registrado por $${paymentData.amount.toFixed(2)} mediante ${paymentData.paymentMethod}`,
        nextAction: null,
        nextActionDate: null
      });
      
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating payment" });
    }
  });
  
  app.get("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const payment = await storage.getPayment(id);
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching payment" });
    }
  });

  // BÚSQUEDA GLOBAL
  app.get("/api/search", isAuthenticated, async (req, res) => {
    try {
      const q = ((req.query.q as string) || "").trim().toLowerCase();
      if (!q || q.length < 2) return res.json({ clients: [], debtors: [], debts: [] });

      const [allClients, allDebtors, allDebts] = await Promise.all([
        storage.getClients(),
        storage.getDebtors(),
        storage.getDebts ? storage.getDebts() : Promise.resolve([]),
      ]);

      const clients = allClients
        .filter(c => c.name.toLowerCase().includes(q) || c.rfc?.toLowerCase().includes(q))
        .slice(0, 5)
        .map(c => ({ id: c.id, label: c.name, sub: c.rfc || "", type: "client" }));

      const debtors = allDebtors
        .filter(d => d.name.toLowerCase().includes(q) || d.rfc?.toLowerCase().includes(q) || d.phone?.includes(q))
        .slice(0, 5)
        .map(d => ({ id: d.id, label: d.name, sub: d.rfc || d.phone || "", type: "debtor" }));

      const debts = (allDebts as any[])
        .filter((d: any) => d.concept?.toLowerCase().includes(q))
        .slice(0, 5)
        .map((d: any) => ({ id: d.id, label: d.concept, sub: `$${Number(d.currentAmount).toLocaleString('es-MX')}`, type: "debt" }));

      res.json({ clients, debtors, debts });
    } catch (error) {
      res.status(500).json({ message: "Error en búsqueda" });
    }
  });

  // ESTADÍSTICAS ENRIQUECIDAS PARA DASHBOARD
  app.get("/api/dashboard/chart-data", isAuthenticated, async (req, res) => {
    try {
      const allDebtors = await storage.getDebtors();
      const allDebts = await storage.getDebts ? await storage.getDebts() : [];

      // Deudores por estado
      const statusMap: Record<string, number> = {};
      for (const d of allDebtors) {
        statusMap[d.status] = (statusMap[d.status] || 0) + 1;
      }
      const debtorsByStatus = [
        { name: "Nuevo", value: statusMap["new"] || 0, fill: "#3b82f6" },
        { name: "En gestión", value: statusMap["in_management"] || 0, fill: "#f59e0b" },
        { name: "Prometedor", value: statusMap["promising"] || 0, fill: "#8b5cf6" },
        { name: "Pagado", value: statusMap["paid"] || 0, fill: "#10b981" },
        { name: "Judicial", value: statusMap["in_litigation"] || 0, fill: "#ef4444" },
        { name: "Cancelado", value: statusMap["canceled"] || 0, fill: "#6b7280" },
      ].filter(s => s.value > 0);

      // Cobranza simulada por mes (últimos 6 meses)
      const now = new Date();
      const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        const label = months[d.getMonth()];
        const payments = (allDebts as any[])
          .filter((debt: any) => {
            const upd = new Date(debt.updatedAt || debt.createdAt);
            return upd.getFullYear() === d.getFullYear() && upd.getMonth() === d.getMonth();
          })
          .reduce((sum: number, debt: any) => sum + (Number(debt.originalAmount) - Number(debt.currentAmount)), 0);
        return { mes: label, cobranza: Math.round(payments), meta: 50000 };
      });

      // Resumen de cartera
      const totalOriginal = (allDebts as any[]).reduce((s: number, d: any) => s + Number(d.originalAmount), 0);
      const totalCurrent = (allDebts as any[]).reduce((s: number, d: any) => s + Number(d.currentAmount), 0);
      const totalRecovered = totalOriginal - totalCurrent;
      const recoveryRate = totalOriginal > 0 ? Math.round((totalRecovered / totalOriginal) * 100) : 0;

      res.json({ debtorsByStatus, monthlyData, totalOriginal, totalCurrent, totalRecovered, recoveryRate });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener datos del dashboard" });
    }
  });

  // PRÓXIMAS ACCIONES (alertas/pendientes)
  app.get("/api/dashboard/upcoming-actions", isAuthenticated, async (req, res) => {
    try {
      const currentUser = req.user as any;
      const allLogs = await storage.getRecentActivityLogs(50);
      const today = new Date().toISOString().split("T")[0];

      const upcoming = allLogs
        .filter(l => l.nextActionDate && l.nextActionDate >= today)
        .sort((a, b) => (a.nextActionDate! > b.nextActionDate! ? 1 : -1))
        .slice(0, 10);

      res.json(upcoming);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener acciones pendientes" });
    }
  });

  // ─── NOTIFICACIONES ────────────────────────────────────────────────────────
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const list = await storage.getNotifications(userId);
      res.json(list);
    } catch { res.status(500).json({ message: "Error al obtener notificaciones" }); }
  });

  app.get("/api/notifications/unread-count", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const parsed = insertNotificationSchema.parse({ ...req.body, userId });
      const notif = await storage.createNotification(parsed);
      res.status(201).json(notif);
    } catch (e: any) {
      res.status(400).json({ message: e.message || "Error al crear notificación" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notif = await storage.markNotificationRead(Number(req.params.id));
      if (!notif) return res.status(404).json({ message: "No encontrada" });
      res.json(notif);
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.post("/api/notifications/mark-all-read", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      await storage.markAllNotificationsRead(userId);
      res.json({ ok: true });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const ok = await storage.deleteNotification(Number(req.params.id));
      if (!ok) return res.status(404).json({ message: "No encontrada" });
      res.json({ ok: true });
    } catch { res.status(500).json({ message: "Error" }); }
  });

  // ─── EXPORTACIÓN DE DATOS ─────────────────────────────────────────────────
  app.get("/api/export/debtors", isAuthenticated, async (req, res) => {
    try {
      const allDebtors = await storage.getDebtors();
      const allClients = await storage.getClients();
      const clientMap = new Map(allClients.map(c => [c.id, c.name]));

      const data = allDebtors.map(d => ({
        ID: d.id,
        Nombre: d.name,
        RFC: d.rfc || "",
        Cliente: clientMap.get(d.clientId) || "",
        Teléfono: d.phone || "",
        Email: d.email || "",
        Estado: d.status,
        Ciudad: d.city || "",
        "Código Postal": d.zipCode || "",
        "Fecha Registro": d.createdAt ? new Date(d.createdAt).toLocaleDateString("es-MX") : "",
      }));

      res.json(data);
    } catch { res.status(500).json({ message: "Error al exportar" }); }
  });

  app.get("/api/export/debts", isAuthenticated, async (req, res) => {
    try {
      const allDebts = await storage.getDebts();
      const allDebtors = await storage.getDebtors();
      const debtorMap = new Map(allDebtors.map(d => [d.id, d.name]));

      const data = allDebts.map(d => ({
        ID: d.id,
        Deudor: debtorMap.get(d.debtorId) || "",
        Concepto: d.concept,
        "Monto Original": d.originalAmount,
        "Saldo Actual": d.currentAmount,
        "Tipo": d.debtType,
        "Fecha Inicio": d.startDate,
        "Fecha Vencimiento": d.dueDate,
        "Interés (%)": d.interest || 0,
      }));

      res.json(data);
    } catch { res.status(500).json({ message: "Error al exportar" }); }
  });

  // ─── PAYMENT PROMISES ─────────────────────────────────────────────────────
  app.get("/api/debtors/:debtorId/payment-promises", isAuthenticated, async (req, res) => {
    try {
      const promises = await storage.getPaymentPromisesByDebtor(Number(req.params.debtorId));
      res.json(promises);
    } catch { res.status(500).json({ message: "Error al obtener promesas" }); }
  });

  app.post("/api/debtors/:debtorId/payment-promises", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const data = { ...req.body, debtorId: Number(req.params.debtorId), userId: user.id };
      const promise = await storage.createPaymentPromise(data);
      res.json(promise);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/payment-promises/:id", isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updatePaymentPromise(Number(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Promesa no encontrada" });
      res.json(updated);
    } catch { res.status(500).json({ message: "Error al actualizar promesa" }); }
  });

  app.delete("/api/payment-promises/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deletePaymentPromise(Number(req.params.id));
      res.json({ ok: true });
    } catch { res.status(500).json({ message: "Error al eliminar promesa" }); }
  });

  // ─── MESSAGE TEMPLATES ────────────────────────────────────────────────────
  app.get("/api/message-templates", isAuthenticated, async (_req, res) => {
    try {
      const templates = await storage.getMessageTemplates();
      res.json(templates);
    } catch { res.status(500).json({ message: "Error al obtener plantillas" }); }
  });

  app.post("/api/message-templates", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const template = await storage.createMessageTemplate({ ...req.body, createdById: user.id });
      res.json(template);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.patch("/api/message-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const updated = await storage.updateMessageTemplate(Number(req.params.id), req.body);
      if (!updated) return res.status(404).json({ message: "Plantilla no encontrada" });
      res.json(updated);
    } catch { res.status(500).json({ message: "Error al actualizar plantilla" }); }
  });

  app.delete("/api/message-templates/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMessageTemplate(Number(req.params.id));
      res.json({ ok: true });
    } catch { res.status(500).json({ message: "Error al eliminar plantilla" }); }
  });

  // ─── IMPORT EXPEDIENTE DCS (formato Marelli / un archivo por deudor) ────
  app.post("/api/import/expediente", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const today = new Date().toISOString().split("T")[0];

      const {
        clientId: rawClientId,
        createClient: shouldCreateClient,
        clientData,
        debtorData,
        debts = [],
        payments = [],
        activityLogs = [],
        visits = [],
      } = req.body as {
        clientId?: number;
        createClient?: boolean;
        clientData?: {
          name: string;
          rfc?: string;
          phone?: string;
          email?: string;
          street?: string;
          colony?: string;
          zipCode?: string;
          city?: string;
          state?: string;
          businessType?: string;
        };
        debtorData: {
          name: string;
          phone?: string;
          address?: string;
          contact?: string;
          notes?: string;
          fechaAlta?: string;
        };
        debts: { concept: string; originalAmount: number; currentBalance: number }[];
        payments: { paymentNumber: number; amount: number; date: string; newBalance: number; debtConcept: string }[];
        activityLogs: { date: string; time: string; comment: string; promise: string }[];
        visits: { reportNumber: string; date: string; content: string; commitment: string; nextReport: string }[];
      };

      if (!debtorData?.name) {
        return res.status(400).json({ message: "Nombre del deudor es requerido" });
      }
      if (!rawClientId && !shouldCreateClient) {
        return res.status(400).json({ message: "Se requiere clientId o createClient=true con clientData" });
      }

      // Resolve the client: use existing or create new
      let resolvedClientId: number;
      let clientCreated = false;

      if (shouldCreateClient && clientData?.name) {
        const rfc = clientData.rfc?.trim() || `SIN-RFC-${Date.now()}`;
        const newClient = await storage.createClient({
          name: clientData.name,
          rfc,
          curp: null,
          personType: "company" as const,
          street: clientData.street || null,
          number: null,
          colony: clientData.colony || null,
          zipCode: clientData.zipCode || null,
          city: clientData.city || null,
          state: clientData.state || null,
          phone: clientData.phone || null,
          email: clientData.email || null,
          legalRepresentative: null,
          businessType: clientData.businessType || null,
          executiveId: null,
          status: "active" as const,
          notes: "Creado automáticamente desde importación de expediente",
        });
        resolvedClientId = newClient.id;
        clientCreated = true;
      } else {
        const clientId = Number(rawClientId);
        const client = await storage.getClient(clientId);
        if (!client) return res.status(404).json({ message: "Cliente no encontrado" });
        resolvedClientId = clientId;
      }

      // Parse address into street
      const debtorAddress = debtorData.address || "";

      // Create debtor
      const debtor = await storage.createDebtor({
        name: debtorData.name,
        rfc: null,
        curp: null,
        personType: "company" as const,
        street: debtorAddress,
        number: null,
        colony: null,
        zipCode: null,
        city: null,
        state: null,
        phone: debtorData.phone || null,
        email: null,
        contactName: debtorData.contact || null,
        clientId: resolvedClientId,
        assignedUserId: userId,
        status: "new" as const,
        notes: debtorData.notes || null,
      });
      console.log(`[import/expediente] Deudor creado: id=${debtor.id} nombre="${debtor.name}" clientId=${debtor.clientId}`);

      // Create debts and track concept→id mapping
      let debtsCreated = 0;
      const debtIdByConceptMap: Map<string, number> = new Map();

      for (const d of debts) {
        if (!d.concept || !d.originalAmount) continue;
        const startDate = debtorData.fechaAlta || today;
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
        debtIdByConceptMap.set(d.concept, createdDebt.id);
        debtsCreated++;
      }

      // Create payments (abonos)
      let paymentsCreated = 0;
      for (const p of payments) {
        if (!p.amount || !p.date) continue;
        const debtId = debtIdByConceptMap.get(p.debtConcept);
        if (!debtId) continue;
        try {
          await storage.createPayment({
            debtId,
            amount: p.amount,
            paymentDate: p.date,
            paymentMethod: "transfer" as const,
            reference: `Abono #${p.paymentNumber}`,
            notes: `Importado desde expediente. Saldo nuevo: ${p.newBalance}`,
            receiptUrl: null,
            registeredById: userId,
          });
          paymentsCreated++;
        } catch (_) {}
      }

      // Create activity log entries from bitácora
      let activityLogsCreated = 0;
      for (const a of activityLogs) {
        if (!a.comment) continue;
        const logDate = a.date || today;
        try {
          await storage.createActivityLog({
            debtorId: debtor.id,
            userId,
            date: logDate,
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

      // Create visits
      let visitsCreated = 0;
      for (const v of visits) {
        if (!v.content) continue;
        const visitDate = v.date || today;
        try {
          await storage.createVisit({
            debtorId: debtor.id,
            userId,
            date: visitDate,
            time: "00:00",
            address: debtorAddress || "Sin dirección",
            result: v.content,
            personContacted: null,
            evidence: null,
            notes: [v.commitment, v.nextReport].filter(Boolean).join(" | ") || null,
            nextVisitDate: null,
          });
          visitsCreated++;
        } catch (_) {}
      }

      await storage.createNotification({
        userId,
        type: "system",
        title: "Expediente importado",
        message: `Se importó el expediente de "${debtor.name}" con ${debtsCreated} adeudo(s).${clientCreated ? " Se creó el cliente automáticamente." : ""}`,
        read: false,
        entityType: "debtor",
        entityId: debtor.id,
      });

      res.json({
        debtorId: debtor.id,
        clientId: resolvedClientId,
        clientCreated,
        debtsCreated,
        paymentsCreated,
        activityLogsCreated,
        visitsCreated,
      });
    } catch (err: any) {
      console.error("import/expediente error:", err);
      res.status(500).json({ message: err.message || "Error al importar expediente" });
    }
  });

  // ─── BULK IMPORT ─────────────────────────────────────────────────────────
  app.post("/api/import/debtors", isAuthenticated, async (req, res) => {
    try {
      const { clientId, rows } = req.body as { clientId: number; rows: Record<string, string>[] };
      if (!clientId || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "clientId y rows son requeridos" });
      }

      const client = await storage.getClient(clientId);
      if (!client) return res.status(404).json({ message: "Cliente no encontrado" });

      const today = new Date().toISOString().split("T")[0];
      let imported = 0;
      const errors: { row: number; error: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          const name = r["name"] || r["Nombre"] || r["NOMBRE"] || "";
          if (!name) { errors.push({ row: i + 2, error: "Nombre requerido" }); continue; }

          const debtorData = {
            name,
            rfc: r["rfc"] || r["RFC"] || null,
            curp: null,
            personType: "individual" as const,
            street: r["street"] || r["Calle"] || null,
            number: null,
            colony: r["colony"] || r["Colonia"] || null,
            zipCode: r["zipCode"] || r["Código Postal"] || r["Codigo Postal"] || null,
            city: r["city"] || r["Ciudad"] || null,
            state: r["state"] || r["Estado"] || null,
            phone: r["phone"] || r["Teléfono"] || r["Telefono"] || null,
            email: r["email"] || r["Email"] || null,
            contactName: null,
            clientId,
            assignedUserId: null,
            status: "new" as const,
            notes: null,
          };

          const debtor = await storage.createDebtor(debtorData);
          console.log(`[import/debtors] Deudor creado: id=${debtor.id} nombre="${debtor.name}"`);

          const amountRaw = r["originalAmount"] || r["Monto Original"] || r["Monto"] || "0";
          const amount = parseFloat(String(amountRaw).replace(/[,$]/g, "")) || 0;
          const dueDate = r["dueDate"] || r["Fecha Vencimiento"] || today;
          const startDate = r["startDate"] || r["Fecha Inicio"] || today;
          const concept = r["concept"] || r["Concepto"] || "Adeudo importado";

          await storage.createDebt({
            debtorId: debtor.id,
            concept,
            originalAmount: amount,
            currentAmount: amount,
            startDate,
            dueDate,
            interest: null,
            debtType: "other" as const,
            supportDocuments: null,
            notes: null,
          });

          imported++;
        } catch (err: any) {
          errors.push({ row: i + 2, error: String(err?.message || "Error desconocido") });
        }
      }

      res.json({ imported, errors, total: rows.length });
    } catch (err) {
      console.error("import/debtors error:", err);
      res.status(500).json({ message: "Error en importación de deudores" });
    }
  });

  app.post("/api/import/clients", isAuthenticated, async (req, res) => {
    try {
      const { rows } = req.body as { rows: Record<string, string>[] };
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ message: "rows es requerido" });
      }

      let imported = 0;
      const errors: { row: number; error: string }[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        try {
          const name = r["name"] || r["Nombre"] || r["NOMBRE"] || r["Razón Social"] || r["Razon Social"] || "";
          const rfc = r["rfc"] || r["RFC"] || "";
          if (!name) { errors.push({ row: i + 2, error: "Nombre requerido" }); continue; }
          if (!rfc) { errors.push({ row: i + 2, error: "RFC requerido" }); continue; }

          const personTypeRaw = (r["personType"] || r["Tipo"] || r["Tipo Persona"] || "individual").toLowerCase();
          const personType = personTypeRaw.includes("moral") || personTypeRaw.includes("empresa") || personTypeRaw.includes("company")
            ? "company" as const
            : "individual" as const;

          await storage.createClient({
            name,
            rfc,
            curp: r["curp"] || r["CURP"] || null,
            personType,
            street: r["street"] || r["Calle"] || null,
            number: null,
            colony: r["colony"] || r["Colonia"] || null,
            zipCode: r["zipCode"] || r["Código Postal"] || r["Codigo Postal"] || null,
            city: r["city"] || r["Ciudad"] || null,
            state: r["state"] || r["Estado"] || null,
            phone: r["phone"] || r["Teléfono"] || r["Telefono"] || null,
            email: r["email"] || r["Email"] || null,
            legalRepresentative: r["legalRepresentative"] || r["Representante Legal"] || null,
            businessType: r["businessType"] || r["Giro"] || r["Giro Comercial"] || null,
            executiveId: null,
            status: "active" as const,
            notes: r["notes"] || r["Notas"] || null,
          });

          imported++;
        } catch (err: any) {
          errors.push({ row: i + 2, error: String(err?.message || "Error desconocido") });
        }
      }

      res.json({ imported, errors, total: rows.length });
    } catch (err) {
      console.error("import/clients error:", err);
      res.status(500).json({ message: "Error en importación de clientes" });
    }
  });

  // ─── ACTIVITIES LOGS (management module) ─────────────────────────────────
  app.get("/api/activities/logs", isAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const perPage = parseInt(req.query.perPage as string) || 10;
      const typeFilter = req.query.type as string;
      const entityType = req.query.entityType as string;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      const [allUsers, allDebtors] = await Promise.all([
        storage.getUsers(),
        storage.getDebtors(),
      ]);
      const userMap = new Map((allUsers as any[]).map((u: any) => [u.id, u]));

      // Collect from all debtors' activity logs
      const allLogs: any[] = [];
      for (const d of allDebtors) {
        const dLogs = await storage.getActivityLogsByDebtor(d.id);
        for (const log of dLogs) {
          allLogs.push({
            ...log,
            entityType: "debtor",
            entityId: d.id,
            debtorName: d.name,
          });
        }
      }

      // Apply filters
      let filtered = allLogs;
      if (typeFilter && typeFilter !== "all") {
        filtered = filtered.filter(l => l.contactType === typeFilter || l.contactType === typeFilter.replace("phone_call", "phone"));
      }
      if (entityType && entityType !== "all") {
        filtered = filtered.filter(l => l.entityType === entityType);
      }
      if (userId) {
        filtered = filtered.filter(l => l.userId === userId);
      }
      if (dateFrom) {
        filtered = filtered.filter(l => (l.contactDate || "") >= dateFrom);
      }
      if (dateTo) {
        filtered = filtered.filter(l => (l.contactDate || "") <= dateTo);
      }

      // Sort newest first
      filtered.sort((a, b) => {
        const da = a.contactDate || "";
        const db = b.contactDate || "";
        return db.localeCompare(da);
      });

      const total = filtered.length;
      const offset = (page - 1) * perPage;
      const paginated = filtered.slice(offset, offset + perPage);

      const contactTypeToType: Record<string, string> = {
        phone: "phone_call",
        whatsapp: "note",
        email: "note",
        visit: "visit",
        letter: "document",
        other: "note",
      };

      const mapped = paginated.map(l => {
        const user = userMap.get(l.userId);
        return {
          id: l.id,
          createdAt: l.contactDate ? `${l.contactDate}T00:00:00.000Z` : new Date().toISOString(),
          type: contactTypeToType[l.contactType] || "note",
          entityType: l.entityType || "debtor",
          entityId: l.entityId || l.debtorId,
          description: [l.result, l.notes].filter(Boolean).join(" — ") || "Sin descripción",
          additionalData: l.nextAction ? { nextAction: l.nextAction, nextActionDate: l.nextActionDate } : null,
          user: { fullName: user?.fullName || "Usuario desconocido" },
          debtorName: l.debtorName,
        };
      });

      res.json({ logs: mapped, total });
    } catch (err) {
      console.error("activities/logs error:", err);
      res.status(500).json({ message: "Error al obtener actividades", logs: [], total: 0 });
    }
  });

  // ─── ACTIVITIES CALENDAR ──────────────────────────────────────────────────
  app.get("/api/activities/calendar", isAuthenticated, async (req, res) => {
    try {
      const startDate = req.query.start as string;
      const endDate = req.query.end as string;

      const debtorList = await storage.getDebtors();

      const events: any[] = [];

      for (const d of debtorList) {
        // Visits
        const visits = await storage.getVisitsByDebtor(d.id);
        for (const v of visits) {
          if (!v.date) continue;
          if (startDate && v.date < startDate) continue;
          if (endDate && v.date > endDate) continue;
          events.push({
            id: `visit-${v.id}`,
            title: `Visita: ${d.name}`,
            date: v.date,
            time: v.time || "10:00",
            type: "visit",
            description: v.notes || v.address,
            entityId: d.id,
            entityType: "debtor",
          });
        }
        // Activity logs with nextActionDate
        const logs = await storage.getActivityLogsByDebtor(d.id);
        for (const l of logs) {
          if (!l.nextActionDate) continue;
          if (startDate && l.nextActionDate < startDate) continue;
          if (endDate && l.nextActionDate > endDate) continue;
          events.push({
            id: `followup-${l.id}`,
            title: `Seguimiento: ${d.name}`,
            date: l.nextActionDate,
            time: "09:00",
            type: "follow-up",
            description: l.nextAction || "",
            entityId: d.id,
            entityType: "debtor",
          });
        }
      }

      res.json(events);
    } catch (err) {
      console.error("activities/calendar error:", err);
      res.status(500).json([]);
    }
  });

  // ─── PENDING FOLLOW-UPS ───────────────────────────────────────────────────
  app.get("/api/followups/pending", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const userId = req.query.mine === "true" ? user.id : undefined;
      const followups = await storage.getPendingFollowups(userId);
      res.json(followups);
    } catch { res.status(500).json({ message: "Error al obtener seguimientos" }); }
  });

  return httpServer;
}
