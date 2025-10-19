// Storage interface and implementation
// Database storage implementation referenced from javascript_database blueprint
import { accessibilityChecks, type AccessibilityCheck, type InsertAccessibilityCheck } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Accessibility checks
  createCheck(check: InsertAccessibilityCheck): Promise<AccessibilityCheck>;
  getCheck(id: string): Promise<AccessibilityCheck | undefined>;
  getAllChecks(): Promise<AccessibilityCheck[]>;
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

  async getAllChecks(): Promise<AccessibilityCheck[]> {
    const checks = await db
      .select()
      .from(accessibilityChecks)
      .orderBy(desc(accessibilityChecks.checkedAt))
      .limit(50); // Limit to last 50 checks
    return checks;
  }
}

export const storage = new DatabaseStorage();
