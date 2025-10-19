// Accessibility analyzer module using Puppeteer and axe-core
import puppeteer from "puppeteer";
import type { ViolationDetail } from "@shared/schema";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { validateHTML, type HTMLValidationMessage } from "./html-validator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AnalysisResult {
  url: string;
  testedUrl: string;
  pageTitle: string;
  totalViolations: number;
  criticalCount: number;
  seriousCount: number;
  moderateCount: number;
  minorCount: number;
  passedCount: number;
  violations: ViolationDetail[];
  passes: any[];
  incomplete: any[];
  htmlErrorCount: number;
  htmlWarningCount: number;
  htmlValidationMessages: HTMLValidationMessage[];
}

// Get the system chromium path
function getChromiumPath(): string | undefined {
  try {
    const chromiumPath = execSync('which chromium', { encoding: 'utf-8' }).trim();
    return chromiumPath || undefined;
  } catch {
    return undefined;
  }
}

export async function analyzeAccessibility(url: string): Promise<AnalysisResult> {
  let browser;
  
  try {
    const chromiumPath = getChromiumPath();
    
    // Launch Puppeteer in headless mode
    browser = await puppeteer.launch({
      headless: true,
      executablePath: chromiumPath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const page = await browser.newPage();
    
    // Set viewport for consistent testing
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Navigate to the URL with timeout
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Get the final URL (after redirects) and page title
    const testedUrl = page.url();
    const pageTitle = await page.title();

    // Get HTML content for validation
    const htmlContent = await page.content();

    // Inject axe-core library
    const axeCorePath = join(__dirname, '..', 'node_modules', 'axe-core', 'axe.min.js');
    await page.addScriptTag({
      path: axeCorePath,
    });

    // Run axe-core accessibility checks
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore - axe is injected at runtime
        axe.run({
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
          }
        }).then((results: any) => {
          resolve(results);
        });
      });
    });

    // Process results
    const axeResults = results as any;
    
    // Count violations by impact level
    let criticalCount = 0;
    let seriousCount = 0;
    let moderateCount = 0;
    let minorCount = 0;

    axeResults.violations.forEach((violation: any) => {
      switch (violation.impact) {
        case 'critical':
          criticalCount++;
          break;
        case 'serious':
          seriousCount++;
          break;
        case 'moderate':
          moderateCount++;
          break;
        case 'minor':
          minorCount++;
          break;
      }
    });

    // Perform HTML validation
    const htmlValidation = await validateHTML(htmlContent);

    return {
      url,
      testedUrl,
      pageTitle,
      totalViolations: axeResults.violations.length,
      criticalCount,
      seriousCount,
      moderateCount,
      minorCount,
      passedCount: axeResults.passes?.length || 0,
      violations: axeResults.violations || [],
      passes: axeResults.passes || [],
      incomplete: axeResults.incomplete || [],
      htmlErrorCount: htmlValidation.errorCount,
      htmlWarningCount: htmlValidation.warningCount,
      htmlValidationMessages: htmlValidation.messages,
    };

  } catch (error) {
    console.error('Error analyzing accessibility:', error);
    throw new Error(`Failed to analyze URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
