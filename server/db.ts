// Database connection setup using SQLite
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get database path from environment or use default
// Use process.cwd() to ensure we're always relative to the project root
// Note: Ignore DATABASE_URL if it's a PostgreSQL connection string (this app uses SQLite)
let dbPath = join(process.cwd(), "database.sqlite");
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgres')) {
  dbPath = process.env.DATABASE_URL;
}

console.log("[DB] Database path:", dbPath);
console.log("[DB] Current working directory:", process.cwd());

// Create SQLite database connection
// fileMustExist: false allows better-sqlite3 to create the file if it doesn't exist
export const sqlite = new Database(dbPath, { fileMustExist: false });

// Enable foreign keys (SQLite requirement)
sqlite.pragma("foreign_keys = ON");

// Export Drizzle instance
export const db = drizzle(sqlite, { schema });
