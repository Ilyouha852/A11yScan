import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Accessibility check results table
export const accessibilityChecks = pgTable("accessibility_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
  
  // Summary statistics
  totalViolations: integer("total_violations").notNull().default(0),
  criticalCount: integer("critical_count").notNull().default(0),
  seriousCount: integer("serious_count").notNull().default(0),
  moderateCount: integer("moderate_count").notNull().default(0),
  minorCount: integer("minor_count").notNull().default(0),
  passedCount: integer("passed_count").notNull().default(0),
  
  // Full results as JSON
  violations: jsonb("violations").notNull(),
  passes: jsonb("passes"),
  incomplete: jsonb("incomplete"),
  
  // Page metadata
  pageTitle: text("page_title"),
  testedUrl: text("tested_url"), // Final URL after redirects
  
  // HTML validation results
  htmlErrorCount: integer("html_error_count").notNull().default(0),
  htmlWarningCount: integer("html_warning_count").notNull().default(0),
  htmlValidationMessages: jsonb("html_validation_messages"),
  htmlValidationFailed: integer("html_validation_failed").notNull().default(0),
  htmlValidationError: text("html_validation_error"),
});

export const insertAccessibilityCheckSchema = createInsertSchema(accessibilityChecks).omit({
  id: true,
  checkedAt: true,
});

export type InsertAccessibilityCheck = z.infer<typeof insertAccessibilityCheckSchema>;
export type AccessibilityCheck = typeof accessibilityChecks.$inferSelect;

// Violation details type (for TypeScript)
export interface ViolationDetail {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: {
    html: string;
    target: string[];
    failureSummary?: string;
  }[];
}

// Category mapping for violations
export const violationCategories = {
  images: ['image-alt', 'image-redundant-alt', 'object-alt', 'input-image-alt'],
  contrast: ['color-contrast', 'color-contrast-enhanced'],
  navigation: ['bypass', 'focus-order-semantics', 'tabindex', 'focus-visible'],
  semantics: ['heading-order', 'landmark-one-main', 'region', 'page-has-heading-one'],
  forms: ['label', 'button-name', 'form-field-multiple-labels', 'input-button-name'],
  aria: ['aria-allowed-attr', 'aria-required-attr', 'aria-valid-attr-value', 'aria-roles'],
} as const;
