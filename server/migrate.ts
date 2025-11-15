// Database migration runner
// This script ensures the database schema is up to date
import { sqlite } from "./db";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function runMigrations() {
  try {
    console.log("[Migration] Running database migrations...");
    
    // Check if table already exists
    const tableCheck = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='accessibility_checks'
    `).get();
    
    if (tableCheck) {
      console.log("[Migration] Table 'accessibility_checks' already exists, skipping");
      return;
    }
    
    // Create table directly
    console.log("[Migration] Creating 'accessibility_checks' table...");
    sqlite.exec(`
      CREATE TABLE "accessibility_checks" (
        "id" TEXT PRIMARY KEY,
        "url" TEXT NOT NULL,
        "checked_at" INTEGER NOT NULL,
        "total_violations" INTEGER NOT NULL DEFAULT 0,
        "critical_count" INTEGER NOT NULL DEFAULT 0,
        "serious_count" INTEGER NOT NULL DEFAULT 0,
        "moderate_count" INTEGER NOT NULL DEFAULT 0,
        "minor_count" INTEGER NOT NULL DEFAULT 0,
        "passed_count" INTEGER NOT NULL DEFAULT 0,
        "violations" TEXT NOT NULL,
        "passes" TEXT,
        "incomplete" TEXT,
        "page_title" TEXT,
        "tested_url" TEXT,
        "html_error_count" INTEGER NOT NULL DEFAULT 0,
        "html_warning_count" INTEGER NOT NULL DEFAULT 0,
        "html_validation_messages" TEXT,
        "html_validation_failed" INTEGER NOT NULL DEFAULT 0,
        "html_validation_error" TEXT,
        "extended_checks" TEXT
      );
    `);
    
    // Create indexes
    sqlite.exec(`
      CREATE INDEX "accessibility_checks_checked_at_idx" ON "accessibility_checks" ("checked_at" DESC);
    `);
    
    sqlite.exec(`
      CREATE INDEX "accessibility_checks_url_idx" ON "accessibility_checks" ("url");
    `);
    
    // Verify table was created
    const verifyCheck = sqlite.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='accessibility_checks'
    `).get();
    
    if (verifyCheck) {
      console.log("[Migration] Database migrations completed successfully");
    } else {
      throw new Error("Table was not created successfully");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("already exists") || 
      errorMessage.includes("duplicate") ||
      errorMessage.includes("UNIQUE constraint")
    ) {
      console.log("[Migration] Database schema already exists, skipping");
      return;
    }
    
    console.error("[Migration] Error running migrations:", error);
    throw error; // Re-throw to prevent app from starting with broken database
  }
}

