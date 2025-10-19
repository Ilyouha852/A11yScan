// Accessibility analyzer module using Puppeteer and axe-core
import puppeteer from "puppeteer";
import type { ViolationDetail, ExtendedChecks } from "@shared/schema";
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
  htmlValidationFailed: boolean;
  htmlValidationError?: string;
  extendedChecks: ExtendedChecks;
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

// Extended WCAG checks - run in browser context
async function performExtendedChecks(page: any): Promise<ExtendedChecks> {
  const checks = await page.evaluate(() => {
    const results: ExtendedChecks = {
      viewport: {
        blocksZoom: false,
        userScalable: true,
        maxScale: null,
        issues: [],
      },
      autoplayMedia: {
        hasAutoplayAudio: false,
        hasAutoplayVideo: false,
        elements: [],
        issues: [],
      },
      tabOrder: {
        hasPositiveTabindex: false,
        maxTabindex: 0,
        elementsWithTabindex: [],
        issues: [],
      },
      focusVisible: {
        hasFocusStyles: false,
        elementsWithoutFocus: 0,
        checkedSelectors: [],
        issues: [],
      },
      timing: {
        hasSetTimeout: false,
        hasSetInterval: false,
        refreshMeta: false,
        issues: [],
      },
    };

    // 1. Check viewport meta for zoom blocking (WCAG 1.4.4)
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      const content = viewportMeta.getAttribute('content') || '';
      const userScalable = content.match(/user-scalable\s*=\s*([^,\s]+)/i);
      const maxScale = content.match(/maximum-scale\s*=\s*([\d.]+)/i);
      
      if (userScalable && userScalable[1].toLowerCase() === 'no') {
        results.viewport.userScalable = false;
        results.viewport.blocksZoom = true;
        results.viewport.issues.push('WCAG 1.4.4: Viewport блокирует масштабирование (user-scalable=no)');
      }
      
      if (maxScale) {
        const maxScaleValue = parseFloat(maxScale[1]);
        results.viewport.maxScale = maxScaleValue;
        if (maxScaleValue < 2) {
          results.viewport.blocksZoom = true;
          results.viewport.issues.push(`WCAG 1.4.4: Максимальное масштабирование ограничено ${maxScaleValue} (должно быть минимум 2)`);
        }
      }
    }

    // 2. Check for autoplay media (WCAG 1.4.2, 2.2.2)
    const audioElements = Array.from(document.querySelectorAll('audio[autoplay]'));
    const videoElements = Array.from(document.querySelectorAll('video[autoplay]'));
    
    if (audioElements.length > 0) {
      results.autoplayMedia.hasAutoplayAudio = true;
      audioElements.forEach((el, idx) => {
        const hasControls = el.hasAttribute('controls');
        results.autoplayMedia.elements.push({
          tag: 'audio',
          hasControls,
          selector: `audio[autoplay]:nth-of-type(${idx + 1})`,
        });
        if (!hasControls) {
          results.autoplayMedia.issues.push('WCAG 1.4.2: Аудио автоматически воспроизводится без элементов управления');
        }
      });
    }
    
    if (videoElements.length > 0) {
      results.autoplayMedia.hasAutoplayVideo = true;
      videoElements.forEach((el, idx) => {
        const hasControls = el.hasAttribute('controls');
        results.autoplayMedia.elements.push({
          tag: 'video',
          hasControls,
          selector: `video[autoplay]:nth-of-type(${idx + 1})`,
        });
        if (!hasControls) {
          results.autoplayMedia.issues.push('WCAG 2.2.2: Видео автоматически воспроизводится без элементов управления');
        }
      });
    }

    // 3. Check tabindex order (WCAG 2.4.3)
    const elementsWithTabindex = Array.from(document.querySelectorAll('[tabindex]'));
    elementsWithTabindex.forEach((el) => {
      const tabindex = parseInt(el.getAttribute('tabindex') || '0', 10);
      if (tabindex > 0) {
        results.tabOrder.hasPositiveTabindex = true;
        results.tabOrder.maxTabindex = Math.max(results.tabOrder.maxTabindex, tabindex);
        
        let selector = el.tagName.toLowerCase();
        if (el.id) selector += `#${el.id}`;
        else if (el.className) selector += `.${el.className.split(' ')[0]}`;
        
        results.tabOrder.elementsWithTabindex.push({
          selector,
          tabindex,
        });
      }
    });
    
    if (results.tabOrder.hasPositiveTabindex) {
      results.tabOrder.issues.push(`WCAG 2.4.3: Обнаружены положительные значения tabindex (может нарушать логический порядок навигации)`);
    }

    // 4. Check focus visibility (WCAG 2.4.7)
    const interactiveSelectors = ['a[href]', 'button', 'input:not([type="hidden"])', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'];
    let totalInteractive = 0;
    let withoutFocusStyles = 0;
    
    interactiveSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      totalInteractive += elements.length;
      results.focusVisible.checkedSelectors.push(`${selector} (${elements.length})`);
    });

    // Check if there are any :focus styles defined
    const styleSheets = Array.from(document.styleSheets);
    let hasFocusRules = false;
    
    try {
      styleSheets.forEach((sheet) => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          rules.forEach((rule: any) => {
            if (rule.selectorText && rule.selectorText.includes(':focus')) {
              hasFocusRules = true;
            }
          });
        } catch (e) {
          // Skip CORS-protected stylesheets
        }
      });
    } catch (e) {
      // Silently handle errors
    }
    
    results.focusVisible.hasFocusStyles = hasFocusRules;
    
    if (!hasFocusRules && totalInteractive > 0) {
      results.focusVisible.issues.push(`WCAG 2.4.7: Не обнаружены CSS правила для :focus (может затруднять навигацию с клавиатуры)`);
    }

    // 5. Check for timing/auto-refresh (WCAG 2.2.1)
    const refreshMeta = document.querySelector('meta[http-equiv="refresh"]');
    if (refreshMeta) {
      results.timing.refreshMeta = true;
      results.timing.issues.push('WCAG 2.2.1: Обнаружен meta refresh (автоматическое обновление/перенаправление)');
    }

    // Check if setTimeout/setInterval are used (we can only detect if they're defined, not actual usage)
    results.timing.hasSetTimeout = typeof window.setTimeout === 'function';
    results.timing.hasSetInterval = typeof window.setInterval === 'function';

    return results;
  });

  return checks;
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

    // Perform extended WCAG checks
    const extendedChecks = await performExtendedChecks(page);

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
      htmlValidationFailed: htmlValidation.validationFailed,
      htmlValidationError: htmlValidation.validationError,
      extendedChecks,
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
