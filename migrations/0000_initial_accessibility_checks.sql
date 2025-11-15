-- Migration: Create accessibility_checks table
-- This migration creates the initial table structure for storing accessibility check history

CREATE TABLE IF NOT EXISTS "accessibility_checks" (
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

-- Create index on checked_at for faster history queries
CREATE INDEX IF NOT EXISTS "accessibility_checks_checked_at_idx" ON "accessibility_checks" ("checked_at" DESC);

-- Create index on url for faster lookups
CREATE INDEX IF NOT EXISTS "accessibility_checks_url_idx" ON "accessibility_checks" ("url");
