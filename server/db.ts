// Database connection setup using SQLite
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database path from environment or use default
const dbPath = process.env.DATABASE_URL || join(__dirname, "..", "database.sqlite");

// Create SQLite database connection
export const sqlite = new Database(dbPath);

// Enable foreign keys (SQLite requirement)
sqlite.pragma("foreign_keys = ON");

// Export Drizzle instance
export const db = drizzle(sqlite, { schema });
