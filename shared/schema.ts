import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Accessibility check results table
export const accessibilityChecks = sqliteTable("accessibility_checks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  url: text("url").notNull(),
  checkedAt: integer("checked_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  
  // Summary statistics
  totalViolations: integer("total_violations").notNull().default(0),
  criticalCount: integer("critical_count").notNull().default(0),
  seriousCount: integer("serious_count").notNull().default(0),
  moderateCount: integer("moderate_count").notNull().default(0),
  minorCount: integer("minor_count").notNull().default(0),
  passedCount: integer("passed_count").notNull().default(0),
  
  // Full results as JSON (stored as TEXT in SQLite, parsed as JSON)
  violations: text("violations", { mode: "json" }).notNull(),
  passes: text("passes", { mode: "json" }),
  incomplete: text("incomplete", { mode: "json" }),
  
  // Page metadata
  pageTitle: text("page_title"),
  testedUrl: text("tested_url"), // Final URL after redirects
  
  // HTML validation results
  htmlErrorCount: integer("html_error_count").notNull().default(0),
  htmlWarningCount: integer("html_warning_count").notNull().default(0),
  htmlValidationMessages: text("html_validation_messages", { mode: "json" }),
  htmlValidationFailed: integer("html_validation_failed").notNull().default(0),
  htmlValidationError: text("html_validation_error"),
  
  // Extended WCAG checks
  extendedChecks: text("extended_checks", { mode: "json" }),
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

// Extended WCAG checks interface
export interface ExtendedChecks {
  viewport: {
    blocksZoom: boolean;
    userScalable: boolean;
    maxScale: number | null;
    issues: string[];
  };
  autoplayMedia: {
    hasAutoplayAudio: boolean;
    hasAutoplayVideo: boolean;
    elements: Array<{
      tag: string;
      hasControls: boolean;
      selector: string;
    }>;
    issues: string[];
  };
  tabOrder: {
    hasPositiveTabindex: boolean;
    maxTabindex: number;
    elementsWithTabindex: Array<{
      selector: string;
      tabindex: number;
    }>;
    issues: string[];
  };
  focusVisible: {
    hasFocusStyles: boolean;
    elementsWithoutFocus: number;
    checkedSelectors: string[];
    issues: string[];
  };
  timing: {
    hasSetTimeout: boolean;
    hasSetInterval: boolean;
    refreshMeta: boolean;
    issues: string[];
  };
}
