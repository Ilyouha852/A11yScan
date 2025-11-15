import { spawn } from "child_process";
import { promisify } from "util";
import { execFile } from "child_process";
import { join } from "path";
import { tmpdir } from "os";
import { writeFile, unlink } from "fs/promises";
import { createHash } from "crypto";
import { createRequire } from "module";

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);

// Функция для запуска команды и получения вывода (не падает при ненулевом exit code)
function execCommand(command: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { shell: false });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

let vnuJarPath: string | null = null;
let javaAvailable: boolean | null = null;

// Инициализация пути к vnu-jar и проверка доступности Java
async function initializeVnu(): Promise<{ jarPath: string | null; javaAvailable: boolean }> {
  if (vnuJarPath !== null && javaAvailable !== null) {
    return { jarPath: vnuJarPath, javaAvailable };
  }

  try {
    // Проверяем наличие Java
    console.log('[HTML Validator] Checking Java availability...');
    await execFileAsync('java', ['-version']);
    javaAvailable = true;
    console.log('[HTML Validator] Java is available');

    // Получаем путь к JAR файлу через require (vnu-jar экспортирует путь как строку)
    try {
      vnuJarPath = require('vnu-jar');
      if (!vnuJarPath || typeof vnuJarPath !== 'string') {
        throw new Error('Invalid vnu-jar path');
      }
      console.log('[HTML Validator] vnu-jar found at:', vnuJarPath);
    } catch (err) {
      console.warn('[HTML Validator] vnu-jar not found, falling back to online validator:', err);
      javaAvailable = false;
      vnuJarPath = null;
    }
  } catch (error) {
    console.warn('[HTML Validator] Java is not available, falling back to online validator:', error);
    javaAvailable = false;
    vnuJarPath = null;
  }

  return { jarPath: vnuJarPath, javaAvailable };
}

export interface HTMLValidationMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  extract: string;
  firstLine: number;
  lastLine: number;
  firstColumn: number;
  lastColumn: number;
  hiliteStart: number;
  hiliteLength: number;
  // Дополнительная информация, полученная через Puppeteer
  selector?: string | null;
  elementInfo?: {
    tagName?: string;
    id?: string;
    className?: string;
    xpath?: string;
  } | null;
  actualLineNumber?: number | null;
  context?: string | null;
}

export interface HTMLValidationResult {
  errorCount: number;
  warningCount: number;
  messages: HTMLValidationMessage[];
  validationFailed: boolean;
  validationError?: string;
}

// Валидация через локальный Nu HTML Checker
async function validateHTMLLocal(html: string): Promise<HTMLValidationResult> {
  const tempFile = join(tmpdir(), `html-validate-${createHash('md5').update(html).digest('hex')}.html`);
  
  try {
    // Сохраняем HTML во временный файл
    await writeFile(tempFile, html, 'utf-8');

    const { jarPath, javaAvailable } = await initializeVnu();
    
    if (!javaAvailable || !jarPath) {
      throw new Error('Java or vnu-jar not available');
    }

    // Запускаем валидатор
    // Nu HTML Checker выводит результаты в stderr для JSON формата
    // Nu HTML Checker возвращает ненулевой exit code при наличии ошибок валидации, это нормально
    const { stdout, stderr, code } = await execCommand('java', [
      '-jar',
      jarPath,
      '--format', 'json',
      tempFile
    ]);
    
    // Nu HTML Checker выводит JSON в stderr (или stdout в некоторых случаях)
    const output = stderr || stdout || '';
    
    // Если код возврата != 0 и нет вывода, возможно это реальная ошибка выполнения
    if (code !== 0 && !output.trim()) {
      throw new Error(`Nu HTML Checker exited with code ${code} and no output`);
    }

    // Удаляем временный файл
    await unlink(tempFile).catch(() => {});

    // Парсим JSON результат
    let messagesArray: any[] = [];
    try {
      const cleanOutput = output.trim();
      
      if (!cleanOutput) {
        // Пустой вывод означает, что валидация прошла без ошибок
        messagesArray = [];
      } else {
        // Nu HTML Checker возвращает массив сообщений в JSON формате
        // Пытаемся найти JSON в выводе
        let jsonStr = '';
        const arrayStart = cleanOutput.indexOf('[');
        const objectStart = cleanOutput.indexOf('{');
        
        if (arrayStart !== -1) {
          // Это массив сообщений (стандартный формат)
          const arrayEnd = cleanOutput.lastIndexOf(']') + 1;
          if (arrayEnd > arrayStart) {
            jsonStr = cleanOutput.substring(arrayStart, arrayEnd);
            const parsed = JSON.parse(jsonStr);
            messagesArray = Array.isArray(parsed) ? parsed : [];
          }
        } else if (objectStart !== -1) {
          // Это объект, возможно с полем messages (альтернативный формат)
          const objectEnd = cleanOutput.lastIndexOf('}') + 1;
          if (objectEnd > objectStart) {
            jsonStr = cleanOutput.substring(objectStart, objectEnd);
            const parsed = JSON.parse(jsonStr);
            messagesArray = Array.isArray(parsed.messages) ? parsed.messages : [];
          }
        } else {
          // Не нашли JSON структуру, возможно это ошибка выполнения
          console.warn('[HTML Validator] Unexpected Nu HTML Checker output format:', cleanOutput.substring(0, 200));
          messagesArray = [];
        }
      }
    } catch (parseError) {
      // Если не удалось распарсить, логируем ошибку
      console.error('[HTML Validator] Failed to parse Nu HTML Checker output:', parseError);
      console.error('[HTML Validator] Output was:', output.substring(0, 500));
      messagesArray = [];
    }

    let errorCount = 0;
    let warningCount = 0;
    const messages: HTMLValidationMessage[] = [];

    for (const msg of messagesArray) {
      if (msg.type === 'error') {
        errorCount++;
      } else if (msg.type === 'info' && msg.subType === 'warning') {
        warningCount++;
      }

      messages.push({
        type: msg.type === 'error' ? 'error' : (msg.subType === 'warning' ? 'warning' : 'info'),
        message: msg.message || '',
        extract: msg.extract || '',
        firstLine: msg.firstLine || 0,
        lastLine: msg.lastLine || 0,
        firstColumn: msg.firstColumn || 0,
        lastColumn: msg.lastColumn || 0,
        hiliteStart: msg.hiliteStart !== undefined && msg.hiliteStart !== null ? msg.hiliteStart : 0,
        hiliteLength: msg.hiliteLength !== undefined && msg.hiliteLength !== null ? msg.hiliteLength : 0,
      });
    }

    return {
      errorCount,
      warningCount,
      messages,
      validationFailed: false,
    };
  } catch (error) {
    // Удаляем временный файл в случае ошибки
    await unlink(tempFile).catch(() => {});
    throw error;
  }
}

// Валидация через онлайн API (fallback)
async function validateHTMLOnline(html: string): Promise<HTMLValidationResult> {
  try {
    const response = await fetch('https://validator.w3.org/nu/?out=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'User-Agent': 'Accessibility-Checker/1.0',
      },
      body: html,
    });

    if (!response.ok) {
      throw new Error(`W3C Validator API returned status ${response.status}`);
    }

    const data = await response.json();
    
    let errorCount = 0;
    let warningCount = 0;
    const messages: HTMLValidationMessage[] = [];

    if (data.messages && Array.isArray(data.messages)) {
      for (const msg of data.messages) {
        if (msg.type === 'error') {
          errorCount++;
        } else if (msg.type === 'info' && msg.subType === 'warning') {
          warningCount++;
        }

        messages.push({
          type: msg.type === 'error' ? 'error' : (msg.subType === 'warning' ? 'warning' : 'info'),
          message: msg.message || '',
          extract: msg.extract || '',
          firstLine: msg.firstLine || 0,
          lastLine: msg.lastLine || 0,
          firstColumn: msg.firstColumn || 0,
          lastColumn: msg.lastColumn || 0,
          hiliteStart: msg.hiliteStart !== undefined && msg.hiliteStart !== null ? msg.hiliteStart : 0,
          hiliteLength: msg.hiliteLength !== undefined && msg.hiliteLength !== null ? msg.hiliteLength : 0,
        });
      }
    }

    return {
      errorCount,
      warningCount,
      messages,
      validationFailed: false,
    };
  } catch (error) {
    throw error;
  }
}

// Функция для обогащения сообщений валидации данными из Puppeteer
export async function enrichValidationMessagesWithDOM(
  messages: HTMLValidationMessage[],
  page: any
): Promise<HTMLValidationMessage[]> {
  if (!page || messages.length === 0) {
    return messages;
  }

  try {
    console.log('[HTML Validator] Enriching validation messages with DOM data...');

    const enrichedMessages = await Promise.all(
      messages.map(async (msg) => {
        // Если позиция уже известна и валидна, оставляем как есть
        if (msg.firstLine > 0 || msg.lastLine > 0) {
          // Пытаемся найти элемент в DOM по фрагменту
          try {
            const domInfo = await page.evaluate((extract: string, message: string) => {
              // Функция для получения XPath элемента
              function getXPath(element: Element | null): string | null {
                if (!element || element.nodeType !== 1) return null;
                if (element.id) return `//*[@id="${element.id}"]`;
                
                const parts: string[] = [];
                let node: Element | null = element;
                while (node && node.nodeType === 1) {
                  let index = 1;
                  let sibling = node.previousElementSibling;
                  while (sibling) {
                    if (sibling.nodeName === node.nodeName) index++;
                    sibling = sibling.previousElementSibling;
                  }
                  const tagName = node.nodeName.toLowerCase();
                  const part = index > 1 ? `${tagName}[${index}]` : tagName;
                  parts.unshift(part);
                  node = node.parentElement;
                }
                return parts.length ? `/${parts.join('/')}` : null;
              }

              // Функция для создания CSS селектора
              function getSelector(element: Element | null): string | null {
                if (!element) return null;
                
                if (element.id) {
                  return `#${element.id}`;
                }
                
                const parts: string[] = [];
                let current: Element | null = element;
                
                while (current && current.nodeType === 1) {
                  let selector = current.nodeName.toLowerCase();
                  
                  if (current.id) {
                    selector += `#${current.id}`;
                    parts.unshift(selector);
                    break;
                  }
                  
                  if (current.className && typeof current.className === 'string') {
                    const classes = current.className.trim().split(/\s+/).filter(c => c);
                    if (classes.length > 0) {
                      selector += `.${classes.join('.')}`;
                    }
                  }
                  
                  // Добавляем индекс, если есть братья с таким же тегом
                  let index = 1;
                  let sibling = current.previousElementSibling;
                  while (sibling) {
                    if (sibling.nodeName === current.nodeName) index++;
                    sibling = sibling.previousElementSibling;
                  }
                  if (index > 1) {
                    selector += `:nth-of-type(${index})`;
                  }
                  
                  parts.unshift(selector);
                  current = current.parentElement;
                  
                  // Ограничиваем глубину поиска
                  if (parts.length > 10) break;
                }
                
                return parts.join(' > ');
              }

              // Ищем элемент по фрагменту кода
              // Nu HTML Checker может возвращать обрезанные фрагменты, поэтому ищем по частичному совпадению
              const extractNormalized = extract.trim().replace(/\s+/g, ' ');
              let foundElement: Element | null = null;
              
              // Пытаемся найти по точному совпадению extract в тексте элемента или его стилях
              if (extractNormalized && extractNormalized.length > 5) {
                // Поиск в style атрибутах
                const allElements = document.querySelectorAll('*');
                for (const el of Array.from(allElements)) {
                  const styleAttr = el.getAttribute('style');
                  if (styleAttr) {
                    // Ищем как полное совпадение, так и частичное (для обрезанных фрагментов)
                    const styleNormalized = styleAttr.replace(/\s+/g, ' ');
                    if (styleNormalized.includes(extractNormalized) || 
                        (extractNormalized.length > 10 && styleNormalized.includes(extractNormalized.substring(0, Math.min(20, extractNormalized.length))))) {
                      foundElement = el;
                      break;
                    }
                  }
                }
                
                // Если не нашли, ищем в <style> тегах
                if (!foundElement) {
                  const styleTags = document.querySelectorAll('style');
                  for (const styleTag of Array.from(styleTags)) {
                    const styleContent = styleTag.textContent;
                    if (styleContent) {
                      const styleNormalized = styleContent.replace(/\s+/g, ' ');
                      // Ищем полное или частичное совпадение (для обрезанных фрагментов)
                      if (styleNormalized.includes(extractNormalized) ||
                          (extractNormalized.length > 10 && styleNormalized.includes(extractNormalized.substring(0, Math.min(30, extractNormalized.length))))) {
                        foundElement = styleTag;
                        break;
                      }
                    }
                  }
                }
              }
              
              // Если нашли элемент, получаем информацию о нем
              if (foundElement) {
                const tagName = foundElement.tagName.toLowerCase();
                const id = foundElement.id || undefined;
                const className = foundElement.className && typeof foundElement.className === 'string' 
                  ? foundElement.className.trim() 
                  : undefined;
                const xpath = getXPath(foundElement);
                const selector = getSelector(foundElement);
                
                return {
                  tagName,
                  id,
                  className,
                  xpath: xpath || undefined,
                  selector: selector || undefined
                };
              }
              
              // Если не нашли элемент, пытаемся определить по типу ошибки
              const messageLower = message.toLowerCase();
              if (messageLower.includes('css:') || messageLower.includes('parse error')) {
                // Для CSS ошибок, проверяем все style теги
                const styleTags = document.querySelectorAll('style');
                if (styleTags.length > 0) {
                  const firstStyle = styleTags[0];
                  return {
                    tagName: 'style',
                    selector: 'style',
                    context: 'Встроенные стили в <style> теге'
                  };
                }
              }
              
              return null;
            }, msg.extract, msg.message);

            if (domInfo) {
              // Пытаемся найти расширенный контекст вокруг extract в DOM
              let expandedExtract = msg.extract;
              try {
                const expandedContext = await page.evaluate((extract: string, selector: string) => {
                  if (!selector) return null;
                  
                  try {
                    const element = document.querySelector(selector);
                    if (!element) return null;
                    
                    // Если это style элемент, получаем больше контекста
                    if (element.tagName === 'STYLE' && element.textContent) {
                      const content = element.textContent;
                      const extractIndex = content.indexOf(extract);
                      if (extractIndex >= 0) {
                        // Берем контекст: 50 символов до и 100 символов после
                        const start = Math.max(0, extractIndex - 50);
                        const end = Math.min(content.length, extractIndex + extract.length + 100);
                        const context = content.substring(start, end);
                        return {
                          expandedExtract: context,
                          extractPosition: extractIndex - start // Позиция extract в расширенном контексте
                        };
                      }
                    }
                    
                    // Если это элемент со style атрибутом
                    const styleAttr = element.getAttribute('style');
                    if (styleAttr) {
                      const extractIndex = styleAttr.indexOf(extract);
                      if (extractIndex >= 0) {
                        const start = Math.max(0, extractIndex - 30);
                        const end = Math.min(styleAttr.length, extractIndex + extract.length + 50);
                        return {
                          expandedExtract: styleAttr.substring(start, end),
                          extractPosition: extractIndex - start
                        };
                      }
                    }
                  } catch (e) {
                    return null;
                  }
                  
                  return null;
                }, msg.extract, domInfo.selector || '');
                
                if (expandedContext && expandedContext.expandedExtract) {
                  expandedExtract = expandedContext.expandedExtract;
                }
              } catch (err) {
                // Если не удалось получить расширенный контекст, используем оригинальный extract
              }
              
              // Пересчитываем hiliteStart и hiliteLength для расширенного контекста
              let adjustedHiliteStart = msg.hiliteStart;
              let adjustedHiliteLength = msg.hiliteLength;
              
              if (expandedContext && expandedContext.extractPosition !== undefined && expandedContext.extractPosition >= 0) {
                // Если extract был найден в расширенном контексте, обновляем позицию выделения
                const originalExtractLength = msg.extract.length;
                const contextStart = expandedContext.extractPosition;
                
                // Если оригинальный extract был найден в расширенном контексте
                if (msg.hiliteStart !== undefined && msg.hiliteStart >= 0 && msg.hiliteLength !== undefined) {
                  // Адаптируем позицию выделения к новому контексту
                  adjustedHiliteStart = contextStart + msg.hiliteStart;
                  adjustedHiliteLength = msg.hiliteLength;
                } else {
                  // Если выделение не было определено, выделяем сам extract в расширенном контексте
                  adjustedHiliteStart = contextStart;
                  adjustedHiliteLength = originalExtractLength;
                }
              }
              
              return {
                ...msg,
                extract: expandedExtract, // Используем расширенный контекст, если нашли
                hiliteStart: adjustedHiliteStart,
                hiliteLength: adjustedHiliteLength,
                selector: domInfo.selector || null,
                elementInfo: domInfo.tagName ? {
                  tagName: domInfo.tagName,
                  id: domInfo.id,
                  className: domInfo.className,
                  xpath: domInfo.xpath
                } : null,
                context: domInfo.context || null
              };
            }
          } catch (err) {
            console.warn('[HTML Validator] Error enriching message:', err);
          }
        } else {
          // Для ошибок без позиции, пытаемся найти элемент
          try {
            const domInfo = await page.evaluate((extract: string, message: string) => {
              function getSelector(element: Element | null): string | null {
                if (!element) return null;
                if (element.id) return `#${element.id}`;
                
                const parts: string[] = [];
                let current: Element | null = element;
                while (current && current.nodeType === 1 && parts.length < 10) {
                  let selector = current.nodeName.toLowerCase();
                  if (current.className && typeof current.className === 'string') {
                    const classes = current.className.trim().split(/\s+/).slice(0, 3);
                    if (classes.length > 0) {
                      selector += `.${classes.join('.')}`;
                    }
                  }
                  parts.unshift(selector);
                  current = current.parentElement;
                }
                return parts.join(' > ');
              }

              const extractNormalized = extract.trim();
              let foundElement: Element | null = null;
              
              // Поиск в style атрибутах
              if (extractNormalized) {
                const allElements = document.querySelectorAll('*');
                for (const el of Array.from(allElements)) {
                  const styleAttr = el.getAttribute('style');
                  if (styleAttr && extractNormalized.length > 10 && styleAttr.includes(extractNormalized.substring(0, 20))) {
                    foundElement = el;
                    break;
                  }
                }
                
                // Поиск в <style> тегах
                if (!foundElement) {
                  const styleTags = document.querySelectorAll('style');
                  for (const styleTag of Array.from(styleTags)) {
                    if (styleTag.textContent && styleTag.textContent.includes(extractNormalized.substring(0, 30))) {
                      foundElement = styleTag;
                      break;
                    }
                  }
                }
              }
              
              if (foundElement) {
                const messageLower = message.toLowerCase();
                const isCSS = messageLower.includes('css:') || messageLower.includes('parse error');
                
                return {
                  tagName: foundElement.tagName.toLowerCase(),
                  id: foundElement.id || undefined,
                  className: foundElement.className && typeof foundElement.className === 'string' 
                    ? foundElement.className.trim().split(/\s+/)[0] 
                    : undefined,
                  selector: getSelector(foundElement) || undefined,
                  context: isCSS ? 'Встроенные стили' : 'HTML элемент'
                };
              }
              
              return null;
            }, msg.extract, msg.message);

            if (domInfo) {
              // Пытаемся найти расширенный контекст вокруг extract в DOM
              let expandedExtract = msg.extract;
              let adjustedHiliteStart = msg.hiliteStart;
              let adjustedHiliteLength = msg.hiliteLength;
              
              try {
                const expandedContext = await page.evaluate((extract: string, selector: string) => {
                  if (!selector) return null;
                  
                  try {
                    const element = document.querySelector(selector);
                    if (!element) return null;
                    
                    // Если это style элемент, получаем больше контекста
                    if (element.tagName === 'STYLE' && element.textContent) {
                      const content = element.textContent;
                      const extractIndex = content.indexOf(extract);
                      if (extractIndex >= 0) {
                        const start = Math.max(0, extractIndex - 50);
                        const end = Math.min(content.length, extractIndex + extract.length + 100);
                        return {
                          expandedExtract: content.substring(start, end),
                          extractPosition: extractIndex - start
                        };
                      }
                    }
                    
                    // Если это элемент со style атрибутом
                    const styleAttr = element.getAttribute('style');
                    if (styleAttr) {
                      const extractIndex = styleAttr.indexOf(extract);
                      if (extractIndex >= 0) {
                        const start = Math.max(0, extractIndex - 30);
                        const end = Math.min(styleAttr.length, extractIndex + extract.length + 50);
                        return {
                          expandedExtract: styleAttr.substring(start, end),
                          extractPosition: extractIndex - start
                        };
                      }
                    }
                  } catch (e) {
                    return null;
                  }
                  
                  return null;
                }, msg.extract, domInfo.selector || '');
                
                if (expandedContext && expandedContext.expandedExtract) {
                  expandedExtract = expandedContext.expandedExtract;
                  if (expandedContext.extractPosition >= 0) {
                    // Если выделение не было определено, выделяем сам extract в расширенном контексте
                    adjustedHiliteStart = expandedContext.extractPosition;
                    adjustedHiliteLength = msg.extract.length;
                  }
                }
              } catch (err) {
                // Если не удалось, используем оригинальный extract
              }
              
              return {
                ...msg,
                extract: expandedExtract,
                hiliteStart: adjustedHiliteStart,
                hiliteLength: adjustedHiliteLength,
                selector: domInfo.selector || null,
                elementInfo: {
                  tagName: domInfo.tagName,
                  id: domInfo.id,
                  className: domInfo.className
                },
                context: domInfo.context || 'Динамически сгенерированный контент'
              };
            }
          } catch (err) {
            console.warn('[HTML Validator] Error finding element:', err);
          }
        }
        
        return msg;
      })
    );

    console.log('[HTML Validator] Enrichment completed');
    return enrichedMessages;
  } catch (error) {
    console.error('[HTML Validator] Error enriching messages:', error);
    return messages; // Возвращаем исходные сообщения в случае ошибки
  }
}

// Основная функция валидации с автоматическим выбором метода
export async function validateHTML(html: string): Promise<HTMLValidationResult> {
  try {
    // Пытаемся использовать локальный валидатор
    const { jarPath, javaAvailable } = await initializeVnu();
    
    if (javaAvailable && jarPath) {
      console.log('[HTML Validator] Using local Nu HTML Checker:', jarPath);
      try {
        const result = await validateHTMLLocal(html);
        console.log('[HTML Validator] Local validation completed successfully');
        return result;
      } catch (localError) {
        console.warn('[HTML Validator] Local validator failed, falling back to online:', localError);
        // Продолжаем к онлайн версии
      }
    } else {
      console.log('[HTML Validator] Local validator not available (Java:', javaAvailable, ', JAR:', jarPath, '), using online validator');
    }

    // Fallback на онлайн валидатор
    console.log('[HTML Validator] Using online W3C validator');
    return await validateHTMLOnline(html);
  } catch (error) {
    console.error('[HTML Validator] Error validating HTML:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      errorCount: 0,
      warningCount: 0,
      messages: [],
      validationFailed: true,
      validationError: errorMessage,
    };
  }
}
