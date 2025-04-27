import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertStudentSchema, extendedInsertStudentSchema } from "@shared/schema";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Student registration endpoint
  app.post("/api/students", async (req: Request, res: Response) => {
    try {
      // Validate the request body
      const validateResult = extendedInsertStudentSchema.safeParse(req.body);
      
      if (!validateResult.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validateResult.error.format() 
        });
      }
      
      // Create student record
      const student = await storage.createStudent(validateResult.data);
      return res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all students endpoint (protected for admin only)
  app.get("/api/students", (req: Request, res: Response) => {
    // Check if user is authenticated and is an admin
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    // Return all students
    storage.getStudents()
      .then(students => {
        res.status(200).json(students);
      })
      .catch(error => {
        console.error("Error fetching students:", error);
        res.status(500).json({ message: "Internal server error" });
      });
  });

  const httpServer = createServer(app);

  return httpServer;
}
