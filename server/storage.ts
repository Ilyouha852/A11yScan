// Storage interface and implementation
// Database storage implementation referenced from javascript_database blueprint
import { accessibilityChecks, type AccessibilityCheck, type InsertAccessibilityCheck } from "@shared/schema";
import { db } from "./db";
import { eq, desc, count } from "drizzle-orm";

export interface IStorage {
  // Accessibility checks
  createCheck(check: InsertAccessibilityCheck): Promise<AccessibilityCheck>;
  getCheck(id: string): Promise<AccessibilityCheck | undefined>;
  getAllChecks(limit?: number, offset?: number): Promise<AccessibilityCheck[]>;
  getChecksByUrl(url: string, limit?: number): Promise<AccessibilityCheck[]>;
  deleteCheck(id: string): Promise<boolean>;
  getChecksCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async createCheck(insertCheck: InsertAccessibilityCheck): Promise<AccessibilityCheck> {
    const [check] = await db
      .insert(accessibilityChecks)
      .values(insertCheck)
      .returning();
    return check;
  }

  async getCheck(id: string): Promise<AccessibilityCheck | undefined> {
    const [check] = await db
      .select()
      .from(accessibilityChecks)
      .where(eq(accessibilityChecks.id, id));
    return check || undefined;
  }

  async getAllChecks(limit: number = 50, offset: number = 0): Promise<AccessibilityCheck[]> {
    const checks = await db
      .select()
      .from(accessibilityChecks)
      .orderBy(desc(accessibilityChecks.checkedAt))
      .limit(limit)
      .offset(offset);
    return checks;
  }

  async getChecksByUrl(url: string, limit: number = 10): Promise<AccessibilityCheck[]> {
    const checks = await db
      .select()
      .from(accessibilityChecks)
      .where(eq(accessibilityChecks.url, url))
      .orderBy(desc(accessibilityChecks.checkedAt))
      .limit(limit);
    return checks;
  }

  async deleteCheck(id: string): Promise<boolean> {
    const result = await db
      .delete(accessibilityChecks)
      .where(eq(accessibilityChecks.id, id));
    // For SQLite, result.changes contains the number of affected rows
    return (result as any).changes > 0;
  }

  async getChecksCount(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(accessibilityChecks);
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();

