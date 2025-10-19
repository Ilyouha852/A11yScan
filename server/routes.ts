import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeAccessibility } from "./accessibility-analyzer";
import { z } from "zod";

const analyzeRequestSchema = z.object({
  url: z.string().url("Invalid URL format"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // POST /api/analyze - Run accessibility check on a URL
  app.post("/api/analyze", async (req, res) => {
    try {
      // Validate request body
      const { url } = analyzeRequestSchema.parse(req.body);

      // Run the accessibility analysis
      const analysisResult = await analyzeAccessibility(url);

      // Store the results in the database
      const check = await storage.createCheck({
        url: analysisResult.url,
        testedUrl: analysisResult.testedUrl,
        pageTitle: analysisResult.pageTitle,
        totalViolations: analysisResult.totalViolations,
        criticalCount: analysisResult.criticalCount,
        seriousCount: analysisResult.seriousCount,
        moderateCount: analysisResult.moderateCount,
        minorCount: analysisResult.minorCount,
        passedCount: analysisResult.passedCount,
        violations: analysisResult.violations as any,
        passes: analysisResult.passes as any,
        incomplete: analysisResult.incomplete as any,
        htmlErrorCount: analysisResult.htmlErrorCount,
        htmlWarningCount: analysisResult.htmlWarningCount,
        htmlValidationMessages: analysisResult.htmlValidationMessages as any,
      });

      res.json(check);
    } catch (error) {
      console.error("Error in /api/analyze:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: error.errors 
        });
      }
      
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to analyze URL"
      });
    }
  });

  // GET /api/checks/:id - Get a specific check result
  app.get("/api/checks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const check = await storage.getCheck(id);

      if (!check) {
        return res.status(404).json({ error: "Check not found" });
      }

      res.json(check);
    } catch (error) {
      console.error("Error in /api/checks/:id:", error);
      res.status(500).json({ 
        error: "Failed to retrieve check" 
      });
    }
  });

  // GET /api/history - Get all check history
  app.get("/api/history", async (req, res) => {
    try {
      const checks = await storage.getAllChecks();
      res.json(checks);
    } catch (error) {
      console.error("Error in /api/history:", error);
      res.status(500).json({ 
        error: "Failed to retrieve history" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
