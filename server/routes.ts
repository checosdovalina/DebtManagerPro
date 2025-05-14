import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import MemoryStore from "memorystore";
import { z } from "zod";
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
  USER_ROLES
} from "@shared/schema";

// Create session store
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Configure session
  app.use(
    session({
      secret: "siscobranza-secret-key",
      resave: false,
      saveUninitialized: false,
      store: new SessionStore({ checkPeriod: 86400000 }), // Prune expired entries every 24h
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === "production"
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
            return done(null, false, { message: "Incorrect email." });
          }
          if (user.password !== password) { // In a real app, use bcrypt.compare
            return done(null, false, { message: "Incorrect password." });
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
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as any;
    // Update last login time (async)
    storage.updateUser(user.id, { lastLogin: new Date() });
    // Return user without password
    const { password, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      const { password, ...userWithoutPassword } = user;
      res.json({ authenticated: true, user: userWithoutPassword });
    } else {
      res.json({ authenticated: false });
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

  return httpServer;
}
