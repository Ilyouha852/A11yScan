import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { analyzeAccessibility } from "./accessibility-analyzer";
import { z } from "zod";
import type { AccessibilityCheck } from "@shared/schema";

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
      try {
        const check = await storage.createCheck({
          url: analysisResult.url,
          testedUrl: analysisResult.testedUrl || null,
          pageTitle: analysisResult.pageTitle || null,
          totalViolations: analysisResult.totalViolations,
          criticalCount: analysisResult.criticalCount,
          seriousCount: analysisResult.seriousCount,
          moderateCount: analysisResult.moderateCount,
          minorCount: analysisResult.minorCount,
          passedCount: analysisResult.passedCount,
          violations: analysisResult.violations || [],
          passes: analysisResult.passes || null,
          incomplete: analysisResult.incomplete || null,
          htmlErrorCount: analysisResult.htmlErrorCount,
          htmlWarningCount: analysisResult.htmlWarningCount,
          htmlValidationMessages: analysisResult.htmlValidationMessages || null,
          htmlValidationFailed: analysisResult.htmlValidationFailed ? 1 : 0,
          htmlValidationError: analysisResult.htmlValidationError || null,
          extendedChecks: analysisResult.extendedChecks || null,
          wcagLevel: analysisResult.wcagLevel,
        });

        res.json(check);
      } catch (dbError) {
        console.error("Database error in /api/analyze:", dbError);
        // Return analysis result even if database save fails
        res.status(200).json({
          ...analysisResult,
          id: undefined,
          saved: false,
          error: "Results were analyzed but could not be saved to database",
        });
      }
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

  // GET /api/history - Get all check history with optional pagination
  app.get("/api/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : 0;
      const url = req.query.url as string | undefined;
      
      let checks: AccessibilityCheck[];
      if (url) {
        checks = await storage.getChecksByUrl(url, limit);
      } else {
        checks = await storage.getAllChecks(limit, offset);
      }
      
      res.json(checks);
    } catch (error) {
      console.error("Error in /api/history:", error);
      res.status(500).json({ 
        error: "Failed to retrieve history" 
      });
    }
  });

  // DELETE /api/checks/:id - Delete a specific check
  app.delete("/api/checks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCheck(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Check not found" });
      }
      
      res.json({ success: true, message: "Check deleted successfully" });
    } catch (error) {
      console.error("Error in DELETE /api/checks/:id:", error);
      res.status(500).json({ 
        error: "Failed to delete check" 
      });
    }
  });

  // GET /api/history/count - Get total number of checks
  app.get("/api/history/count", async (req, res) => {
    try {
      const count = await storage.getChecksCount();
      res.json({ count });
    } catch (error) {
      console.error("Error in /api/history/count:", error);
      res.status(500).json({ 
        error: "Failed to get checks count" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
