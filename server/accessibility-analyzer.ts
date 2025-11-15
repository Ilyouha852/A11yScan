// Accessibility analyzer module using Puppeteer and axe-core
import puppeteer from "puppeteer";
import type { ViolationDetail, ExtendedChecks } from "@shared/schema";
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
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
  wcagLevel: string;
}

// Get the system chromium path
function getChromiumPath(): string | undefined {
  try {
    // Try Linux/Unix path first
    try {
      const chromiumPath = execSync('which chromium', { encoding: 'utf-8' }).trim();
      if (chromiumPath) return chromiumPath;
    } catch {
      // Continue to Windows check
    }
    
    // Try Windows path
    if (process.platform === 'win32') {
      try {
        // Try common Windows Chrome locations
        const possiblePaths = [
          process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
          process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
          process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ];
        
        for (const path of possiblePaths) {
          if (path && existsSync(path)) {
            return path;
          }
        }
      } catch {
        // Continue to fallback
      }
    }
    
    // If no system browser found, return undefined to use Puppeteer's bundled Chromium
    return undefined;
  } catch {
    // Fallback to Puppeteer's bundled Chromium
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
      language: {
        hasLangAttribute: false,
        langValue: null,
        issues: [],
      },
      mediaAccessibility: {
        videoWithoutCaptions: 0,
        audioWithoutTranscript: 0,
        elements: [],
        issues: [],
      },
      iframes: {
        iframesWithoutTitle: 0,
        totalIframes: 0,
        elements: [],
        issues: [],
      },
      emptyLinks: {
        count: 0,
        elements: [],
        issues: [],
      },
      placeholderAsLabel: {
        count: 0,
        elements: [],
        issues: [],
      },
      tables: {
        tablesWithoutHeaders: 0,
        totalTables: 0,
        elements: [],
        issues: [],
      },
      redundantAria: {
        count: 0,
        elements: [],
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

    // 6. Check for lang attribute on html element (WCAG 3.1.1)
    const htmlElement = document.documentElement;
    const langAttr = htmlElement.getAttribute('lang');
    results.language.hasLangAttribute = !!langAttr;
    results.language.langValue = langAttr;
    if (!langAttr) {
      results.language.issues.push('WCAG 3.1.1: Отсутствует атрибут lang у элемента <html>');
    }

    // 7. Check video/audio for captions/transcripts (WCAG 1.2.2, 1.2.3)
    const allVideoElements = Array.from(document.querySelectorAll('video'));
    const allAudioElements = Array.from(document.querySelectorAll('audio'));
    
    allVideoElements.forEach((video, idx) => {
      const hasCaptions = video.querySelector('track[kind="captions"], track[kind="subtitles"]');
      if (!hasCaptions) {
        results.mediaAccessibility.videoWithoutCaptions++;
        results.mediaAccessibility.issues.push(`WCAG 1.2.2: Видео без субтитров/подписей: video:nth-of-type(${idx + 1})`);
      }
      results.mediaAccessibility.elements.push({
        tag: 'video',
        selector: `video:nth-of-type(${idx + 1})`,
        hasTrack: !!hasCaptions,
      });
    });
    
    allAudioElements.forEach((audio, idx) => {
      const hasTranscript = audio.querySelector('track');
      if (!hasTranscript) {
        results.mediaAccessibility.audioWithoutTranscript++;
        results.mediaAccessibility.issues.push(`WCAG 1.2.1: Аудио без транскрипта: audio:nth-of-type(${idx + 1})`);
      }
      results.mediaAccessibility.elements.push({
        tag: 'audio',
        selector: `audio:nth-of-type(${idx + 1})`,
        hasTrack: !!hasTranscript,
      });
    });

    // 8. Check iframes for title attribute (WCAG 4.1.2)
    const iframes = Array.from(document.querySelectorAll('iframe'));
    results.iframes.totalIframes = iframes.length;
    iframes.forEach((iframe, idx) => {
      const hasTitle = iframe.hasAttribute('title') && iframe.getAttribute('title')?.trim() !== '';
      const title = iframe.getAttribute('title');
      if (!hasTitle) {
        results.iframes.iframesWithoutTitle++;
        results.iframes.issues.push(`WCAG 4.1.2: iframe без title: iframe:nth-of-type(${idx + 1})`);
      }
      results.iframes.elements.push({
        selector: `iframe:nth-of-type(${idx + 1})`,
        hasTitle,
        title: title || undefined,
      });
    });

    // 9. Check for empty links (WCAG 2.4.4)
    const links = Array.from(document.querySelectorAll('a[href]'));
    links.forEach((link) => {
      const href = link.getAttribute('href') || '';
      const text = link.textContent?.trim() || '';
      const ariaLabel = link.getAttribute('aria-label');
      const ariaLabelledby = link.getAttribute('aria-labelledby');
      const title = link.getAttribute('title');
      
      const hasText = text.length > 0;
      const hasLabel = ariaLabel || ariaLabelledby || title;
      
      if (!hasText && !hasLabel) {
        results.emptyLinks.count++;
        let selector = 'a';
        if (link.id) selector += `#${link.id}`;
        else if (link.className) selector += `.${link.className.split(' ')[0]}`;
        results.emptyLinks.elements.push({
          selector,
          href,
        });
        results.emptyLinks.issues.push(`WCAG 2.4.4: Пустая ссылка без текста или aria-label: ${selector}`);
      }
    });

    // 10. Check for placeholder-only form fields (WCAG 3.3.2)
    const formInputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
    formInputs.forEach((input) => {
      const hasPlaceholder = input.hasAttribute('placeholder');
      const id = input.getAttribute('id');
      const hasLabel = id ? document.querySelector(`label[for="${id}"]`) !== null : false;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      
      if (hasPlaceholder && !hasLabel && !ariaLabel && !ariaLabelledby) {
        results.placeholderAsLabel.count++;
        let selector = input.tagName.toLowerCase();
        if (input.id) selector += `#${input.id}`;
        else if (input.className) selector += `.${input.className.split(' ')[0]}`;
        results.placeholderAsLabel.elements.push({
          selector,
          hasPlaceholder,
          hasLabel,
        });
        results.placeholderAsLabel.issues.push(`WCAG 3.3.2: Использование только placeholder вместо label: ${selector}`);
      }
    });

    // 11. Check tables for headers (WCAG 1.3.1)
    const tables = Array.from(document.querySelectorAll('table'));
    results.tables.totalTables = tables.length;
    tables.forEach((table, idx) => {
      const hasHeaders = table.querySelector('th') !== null;
      if (!hasHeaders) {
        results.tables.tablesWithoutHeaders++;
        let selector = `table:nth-of-type(${idx + 1})`;
        if (table.id) selector = `table#${table.id}`;
        results.tables.elements.push({
          selector,
          hasHeaders,
        });
        results.tables.issues.push(`WCAG 1.3.1: Таблица без заголовков <th>: ${selector}`);
      } else {
        results.tables.elements.push({
          selector: `table:nth-of-type(${idx + 1})`,
          hasHeaders,
        });
      }
    });

    // 12. Check for redundant ARIA (best practice)
    const elementsWithRole = Array.from(document.querySelectorAll('[role]'));
    const redundantMappings: Record<string, string[]> = {
      button: ['button'],
      link: ['a'],
      navigation: ['nav'],
      main: ['main'],
      header: ['header'],
      footer: ['footer'],
      article: ['article'],
      section: ['section'],
      aside: ['aside'],
      form: ['form'],
    };
    
    elementsWithRole.forEach((el) => {
      const role = el.getAttribute('role');
      const tagName = el.tagName.toLowerCase();
      
      if (role && redundantMappings[role]) {
        if (redundantMappings[role].includes(tagName)) {
          results.redundantAria.count++;
          let selector = tagName;
          if (el.id) selector += `#${el.id}`;
          else if (el.className) selector += `.${el.className.split(' ')[0]}`;
          results.redundantAria.elements.push({
            selector,
            element: tagName,
            ariaRole: role,
          });
          results.redundantAria.issues.push(`Best Practice: Избыточное использование role="${role}" на <${tagName}>: ${selector}`);
        }
      }
    });

    return results;
  });

  return checks;
}

// Calculate WCAG conformance level based on violations
function calculateWCAGLevel(violations: ViolationDetail[]): string {
  // WCAG conformance is determined by which level's success criteria are violated
  // A site conforms to a level if it satisfies all success criteria at that level
  
  // Check if there are any violations for each WCAG level
  const hasLevelAViolations = violations.some(v => 
    v.tags && v.tags.some(tag => tag === 'wcag2a' || tag === 'wcag21a')
  );
  
  const hasLevelAAViolations = violations.some(v => 
    v.tags && v.tags.some(tag => tag === 'wcag2aa' || tag === 'wcag21aa')
  );
  
  const hasLevelAAAViolations = violations.some(v => 
    v.tags && v.tags.some(tag => tag === 'wcag2aaa' || tag === 'wcag21aaa')
  );

  // Determine conformance level:
  // - If there are Level A violations, the site doesn't conform to Level A
  if (hasLevelAViolations) {
    return 'fail';
  }
  
  // - If there are Level AA violations (but no A violations), the site conforms to A but not AA
  if (hasLevelAAViolations) {
    return 'A';
  }
  
  // - If there are Level AAA violations (but no A or AA violations), the site conforms to AA but not AAA
  if (hasLevelAAAViolations) {
    return 'AA';
  }
  
  // - If there are no violations at any level, the site conforms to AAA
  return 'AAA';
}

export async function analyzeAccessibility(url: string): Promise<AnalysisResult> {
  let browser;
  
  try {
    const chromiumPath = getChromiumPath();
    
    // Launch Puppeteer in headless mode
    const launchOptions: any = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    };
    
    // Only set executablePath if a system browser was found
    // Otherwise, Puppeteer will use its bundled Chromium
    if (chromiumPath) {
      launchOptions.executablePath = chromiumPath;
      console.log(`[Accessibility] Using system browser: ${chromiumPath}`);
    } else {
      console.log(`[Accessibility] Using Puppeteer's bundled Chromium`);
    }
    
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    
    // Set viewport for consistent testing
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log(`[Accessibility] Starting analysis for: ${url}`);
    
    // Navigate to the URL with more flexible settings
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 60000,
      });
      
      // Wait a bit for dynamic content
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log(`[Accessibility] Page loaded successfully`);
    } catch (navError) {
      console.error(`[Accessibility] Navigation error:`, navError);
      throw new Error(`Cannot load page: ${navError instanceof Error ? navError.message : 'Unknown error'}`);
    }

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
    let htmlValidation = await validateHTML(htmlContent);
    
    // Обогащаем сообщения валидации данными из DOM
    if (htmlValidation.messages && htmlValidation.messages.length > 0) {
      const { enrichValidationMessagesWithDOM } = await import('./html-validator');
      htmlValidation = {
        ...htmlValidation,
        messages: await enrichValidationMessagesWithDOM(htmlValidation.messages, page)
      };
    }

    // Perform extended WCAG checks
    const extendedChecks = await performExtendedChecks(page);

    // Calculate WCAG conformance level
    const wcagLevel = calculateWCAGLevel(axeResults.violations || []);

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
      wcagLevel,
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
