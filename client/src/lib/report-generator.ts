export function generateTXTReport(checkResult: AccessibilityCheck): string {
  const lines: string[] = [];
  
  // Header
  lines.push("=".repeat(80));
  lines.push("ОТЧЕТ О ПРОВЕРКЕ ДОСТУПНОСТИ САЙТА");
  lines.push("=".repeat(80));
  lines.push("");
  
  // Page Information
  lines.push("ИНФОРМАЦИЯ О СТРАНИЦЕ");
  lines.push("-".repeat(80));
  lines.push(`Заголовок: ${checkResult.pageTitle || "Не указан"}`);
  lines.push(`URL: ${checkResult.url}`);
  if (checkResult.testedUrl && checkResult.testedUrl !== checkResult.url) {
    lines.push(`Финальный URL (после редиректов): ${checkResult.testedUrl}`);
  }
  lines.push(`Дата проверки: ${new Date(checkResult.checkedAt as any).toLocaleString("ru-RU")}`);
  lines.push("");
  
  // Summary Statistics
  lines.push("СТАТИСТИКА");
  lines.push("-".repeat(80));
  lines.push(`Нарушений доступности: ${checkResult.totalViolations}`);
  lines.push(`  - Критические: ${checkResult.criticalCount}`);
  lines.push(`  - Серьезные: ${checkResult.seriousCount}`);
  lines.push(`  - Умеренные: ${checkResult.moderateCount}`);
  lines.push(`  - Незначительные: ${checkResult.minorCount}`);
  lines.push(`Пройдено проверок: ${checkResult.passedCount}`);
  lines.push(`Ошибок HTML валидации: ${checkResult.htmlErrorCount}`);
  lines.push(`Предупреждений HTML валидации: ${checkResult.htmlWarningCount}`);
  lines.push("");
  
  // Violations
  const violations = checkResult.violations as ViolationDetail[] || [];
  if (violations.length > 0) {
    lines.push("НАРУШЕНИЯ ДОСТУПНОСТИ");
    lines.push("=".repeat(80));
    
    // Sort by impact
    const impactPriority = { critical: 0, serious: 1, moderate: 2, minor: 3 };
    const sortedViolations = [...violations].sort((a, b) => 
      impactPriority[a.impact] - impactPriority[b.impact]
    );
    
    sortedViolations.forEach((violation, index) => {
      lines.push("");
      lines.push(`${index + 1}. ${translateViolationHelp(violation.id, violation.help)}`);
      lines.push("-".repeat(80));
      lines.push(`Критичность: ${violation.impact === "critical" ? "Критический" : 
                                  violation.impact === "serious" ? "Серьезный" :
                                  violation.impact === "moderate" ? "Умеренный" : "Незначительный"}`);
      lines.push(`Описание: ${translateViolationDescription(violation.id, violation.description)}`);
      
      if (violation.tags && violation.tags.length > 0) {
        lines.push(`WCAG критерии: ${violation.tags.join(", ")}`);
      }
      
      if (violation.helpUrl) {
        lines.push(`Подробнее: ${violation.helpUrl}`);
      }
      
      if (violation.nodes && violation.nodes.length > 0) {
        lines.push(`Затронуто элементов: ${violation.nodes.length}`);
        lines.push("");
        lines.push("Проблемные элементы:");
        
        violation.nodes.forEach((node, nodeIndex) => {
          lines.push(`  Элемент ${nodeIndex + 1}:`);
          if (node.target && node.target.length > 0) {
            lines.push(`    Селектор: ${node.target.join(" ")}`);
          }
          if (node.html) {
            lines.push(`    HTML: ${node.html}`);
          }
          if (node.failureSummary) {
            lines.push(`    Проблема: ${translateFailureSummary(node.failureSummary)}`);
          }
          lines.push("");
        });
      }
    });
  }
  
  // HTML Validation Errors
  if (checkResult.htmlErrorCount > 0 || (checkResult.htmlValidationMessages && Array.isArray(checkResult.htmlValidationMessages) && checkResult.htmlValidationMessages.length > 0)) {
    lines.push("");
    lines.push("ОШИБКИ ВАЛИДАЦИИ HTML");
    lines.push("=".repeat(80));
    lines.push(`Всего ошибок: ${checkResult.htmlErrorCount}`);
    lines.push(`Всего предупреждений: ${checkResult.htmlWarningCount}`);
    lines.push("");
    lines.push("ПРИМЕЧАНИЕ: HTML-валидатор проверяет итоговый HTML-код страницы после рендеринга.");
    lines.push("Многие ошибки могут быть связаны с встроенными стилями (CSS) или динамически");
    lines.push("генерируемым контентом. Для точного определения источника ошибки рекомендуется:");
    lines.push("  1. Проверить HTML-код страницы в исходниках браузера (View Source)");
    lines.push("  2. Обратить внимание на встроенные стили (<style>) и инлайн-стили");
    lines.push("  3. Некоторые ошибки CSS могут быть ложными срабатываниями для современных");
    lines.push("     CSS-функций, которые валидатор еще не поддерживает");
    lines.push("");
    
    if (checkResult.htmlValidationMessages && Array.isArray(checkResult.htmlValidationMessages)) {
      // Группируем ошибки по типу для лучшей читаемости
      const cssErrors: any[] = [];
      const htmlErrors: any[] = [];
      const otherErrors: any[] = [];
      
      checkResult.htmlValidationMessages.forEach((msg: any) => {
        const message = msg.message || msg.text || "";
        if (message.includes("CSS:") || message.includes("Parse Error")) {
          cssErrors.push(msg);
        } else if (message.includes("element") || message.includes("attribute") || message.includes("tag")) {
          htmlErrors.push(msg);
        } else {
          otherErrors.push(msg);
        }
      });
      
      let globalIndex = 1;
      
      // CSS ошибки
      if (cssErrors.length > 0) {
        lines.push("ОШИБКИ CSS (Встроенные стили)");
        lines.push("-".repeat(80));
        lines.push(`Обнаружено ${cssErrors.length} ошибок, связанных с CSS-кодом.`);
        lines.push("Эти ошибки обычно возникают в следующих местах:");
        lines.push("  - Встроенные стили в тегах <style>");
        lines.push("  - Инлайн-стили в атрибутах style=\"...\"");
        lines.push("  - CSS-переменные (var(--...)), которые валидатор может не понимать");
        lines.push("");
        lines.push("⚠️ ВАЖНО: Многие ошибки типа 'Parse Error' (Ошибка разбора) могут быть");
        lines.push("ложными срабатываниями, особенно если используется современный CSS:");
        lines.push("  - CSS переменные (--variable)");
        lines.push("  - Современные функции (var(), env(), constant(), calc())");
        lines.push("  - Новые CSS свойства");
        lines.push("  В таких случаях код может быть корректен, просто валидатор их не распознаёт.");
        lines.push("");
        
        cssErrors.forEach((msg: any, index: number) => {
          lines.push(`${globalIndex}. ${translateHTMLValidationMessage(msg.message || msg.text || "Ошибка CSS")}`);
          lines.push(`   Тип: ${msg.type === 'error' ? 'Ошибка' : msg.type === 'warning' ? 'Предупреждение' : 'Информация'}`);
          
          // Позиция
          const hasValidPosition = (msg.firstLine !== undefined && msg.firstLine !== null && msg.firstLine > 0) ||
                                   (msg.lastLine !== undefined && msg.lastLine !== null && msg.lastLine > 0);
          
          if (hasValidPosition) {
            if (msg.firstLine === msg.lastLine && msg.firstColumn === msg.lastColumn) {
              lines.push(`   Местоположение: Строка ${msg.firstLine || msg.lastLine || '?'}, столбец ${msg.firstColumn || msg.lastColumn || '?'}`);
            } else {
              lines.push(`   Местоположение: Строки ${msg.firstLine || '?'}-${msg.lastLine || '?'}, столбцы ${msg.firstColumn || '?'}-${msg.lastColumn || '?'}`);
            }
          } else {
            lines.push(`   Местоположение: Встроенные стили или динамически сгенерированный контент`);
            lines.push(`   (Точная позиция недоступна, т.к. ошибка может быть в CSS, а не в HTML)`);
            lines.push(`   `);
            lines.push(`   🔍 КАК БЫЛА НАЙДЕНА ЭТА ОШИБКА?`);
            lines.push(`   Процесс валидации:`);
            lines.push(`     1. Страница загружается в браузер и ожидает выполнения JavaScript (2 секунды)`);
            lines.push(`     2. Извлекается финальный HTML-код страницы (после всех JavaScript-изменений)`);
            lines.push(`     3. Валидатор HTML (Nu HTML Checker) анализирует структуру и синтаксис этого HTML`);
            lines.push(`     4. Валидатор обнаруживает ошибки в структуре разметки`);
            lines.push(`   `);
            lines.push(`   Почему позиция недоступна?`);
            lines.push(`     - Валидатор получает ФИНАЛЬНЫЙ HTML после выполнения JavaScript, а не исходный .html файл`);
            lines.push(`     - JavaScript мог изменить DOM (добавить элементы через innerHTML, изменить структуру)`);
            lines.push(`     - Валидатор находит ошибки в СТРУКТУРЕ разметки (незакрытые теги, неправильная вложенность),`);
            lines.push(`       но не знает, какая строка исходного файла соответствует этому месту`);
            lines.push(`     - Валидатор возвращает фрагмент проблемного кода (extract), но не точную позицию`);
          }
          
          // Фрагмент кода
          if (msg.extract && msg.extract.trim()) {
            const extractPreview = msg.extract.trim().substring(0, 200);
            lines.push(`   Фрагмент кода: ${extractPreview}${msg.extract.length > 200 ? '...' : ''}`);
          }
          
          // Объяснение Parse error
          const message = msg.message || msg.text || "";
          if (message.toLowerCase().includes('parse error')) {
            lines.push(`   ⚠️ ВАЖНО: Это ошибка разбора (Parse Error).`);
            const extractLower = (msg.extract || '').toLowerCase();
            
            if (message.includes("CSS: \"--\"") || extractLower.includes('--')) {
              lines.push(`      Это ошибка разбора CSS переменной (custom property).`);
              lines.push(`      Валидатор может не поддерживать современные CSS переменные.`);
              lines.push(`      Это часто ЛОЖНОЕ СРАБАТЫВАНИЕ - код может быть корректным.`);
            } else if (message.includes('env(') || message.includes('constant(') || extractLower.includes('env(') || extractLower.includes('constant(')) {
              lines.push(`      Это ошибка разбора современной CSS функции (env() или constant()).`);
              lines.push(`      Эти функции поддерживаются браузерами, но старый валидатор их не распознаёт.`);
              lines.push(`      Это ЛОЖНОЕ СРАБАТЫВАНИЕ - код корректен.`);
            } else if (message.includes('CSS:') && (extractLower.includes('-moz-') || extractLower.includes('-webkit-') || extractLower.includes('-ms-'))) {
              lines.push(`      Это ошибка разбора CSS свойства с вендорным префиксом.`);
              lines.push(`      Это может быть ложное срабатывание для устаревших или специфичных свойств.`);
            } else {
              lines.push(`      Ошибка разбора означает, что валидатор не может корректно интерпретировать CSS-код.`);
              lines.push(`      Возможные причины:`);
              lines.push(`      - Использование современных CSS-функций (var(), env(), calc())`);
              lines.push(`      - CSS переменные (custom properties)`);
              lines.push(`      - Синтаксическая ошибка в CSS`);
              lines.push(`      ПРОВЕРЬТЕ: Если используется современный CSS, это может быть ложное срабатывание.`);
            }
          }
          
          // Информация о найденном элементе DOM
          if (msg.selector || msg.elementInfo) {
            lines.push(`   Найденный элемент в DOM:`);
            if (msg.elementInfo) {
              if (msg.elementInfo.tagName) {
                lines.push(`     Тег: <${msg.elementInfo.tagName}>`);
              }
              if (msg.elementInfo.id) {
                lines.push(`     ID: #${msg.elementInfo.id}`);
              }
              if (msg.elementInfo.className) {
                lines.push(`     Класс: .${msg.elementInfo.className.split(' ')[0]}`);
              }
            }
            if (msg.selector) {
              lines.push(`     CSS селектор: ${msg.selector}`);
              lines.push(`     Как найти: Откройте консоль браузера (F12) и выполните:`);
              lines.push(`       document.querySelector('${msg.selector}')`);
            }
            if (msg.elementInfo?.xpath) {
              lines.push(`     XPath: ${msg.elementInfo.xpath}`);
            }
          }
          
          lines.push("");
          globalIndex++;
        });
      }
      
      // HTML ошибки
      if (htmlErrors.length > 0) {
        lines.push("ОШИБКИ HTML (Структура разметки)");
        lines.push("-".repeat(80));
        lines.push(`Обнаружено ${htmlErrors.length} ошибок в HTML-разметке.`);
        lines.push("");
        
        htmlErrors.forEach((msg: any, index: number) => {
          lines.push(`${globalIndex}. ${translateHTMLValidationMessage(msg.message || msg.text || "Ошибка HTML")}`);
          lines.push(`   Тип: ${msg.type === 'error' ? 'Ошибка' : msg.type === 'warning' ? 'Предупреждение' : 'Информация'}`);
          
          // Позиция
          const hasValidPosition = (msg.firstLine !== undefined && msg.firstLine !== null && msg.firstLine > 0) ||
                                   (msg.lastLine !== undefined && msg.lastLine !== null && msg.lastLine > 0);
          
          if (hasValidPosition) {
            if (msg.firstLine === msg.lastLine && msg.firstColumn === msg.lastColumn) {
              lines.push(`   Местоположение: Строка ${msg.firstLine || msg.lastLine || '?'}, столбец ${msg.firstColumn || msg.lastColumn || '?'}`);
            } else {
              lines.push(`   Местоположение: Строки ${msg.firstLine || '?'}-${msg.lastLine || '?'}, столбцы ${msg.firstColumn || '?'}-${msg.lastColumn || '?'}`);
            }
            lines.push(`   Как найти: Откройте исходный код страницы (Ctrl+U) и перейдите к указанной строке`);
          } else {
            lines.push(`   Местоположение: Динамически сгенерированный контент или встроенные скрипты`);
            lines.push(`   (Точная позиция недоступна)`);
            lines.push(`   `);
            lines.push(`   🔍 КАК БЫЛА НАЙДЕНА ЭТА ОШИБКА?`);
            lines.push(`   Процесс валидации:`);
            lines.push(`     1. Страница загружается в браузер и ожидает выполнения JavaScript (2 секунды)`);
            lines.push(`     2. Извлекается финальный HTML-код страницы (после всех JavaScript-изменений)`);
            lines.push(`     3. Валидатор HTML (Nu HTML Checker) анализирует структуру и синтаксис этого HTML`);
            lines.push(`     4. Валидатор обнаруживает ошибки в структуре разметки`);
            lines.push(`   `);
            lines.push(`   Почему позиция недоступна?`);
            lines.push(`     - Валидатор получает ФИНАЛЬНЫЙ HTML после выполнения JavaScript, а не исходный .html файл`);
            lines.push(`     - JavaScript мог изменить DOM (добавить элементы через innerHTML, изменить структуру)`);
            lines.push(`     - Валидатор находит ошибки в СТРУКТУРЕ разметки (незакрытые теги, неправильная вложенность),`);
            lines.push(`       но не знает, какая строка исходного файла соответствует этому месту`);
            lines.push(`     - Валидатор возвращает фрагмент проблемного кода (extract), но не точную позицию`);
            lines.push(`   Используйте инструменты разработчика браузера (F12) для поиска элемента по фрагменту кода выше.`);
          }
          
          // Фрагмент кода
          if (msg.extract && msg.extract.trim()) {
            const extractPreview = msg.extract.trim().substring(0, 200);
            lines.push(`   Фрагмент кода: ${extractPreview}${msg.extract.length > 200 ? '...' : ''}`);
          }
          
          // Информация о найденном элементе DOM
          if (msg.selector || msg.elementInfo) {
            lines.push(`   Найденный элемент в DOM:`);
            if (msg.elementInfo) {
              if (msg.elementInfo.tagName) {
                lines.push(`     Тег: <${msg.elementInfo.tagName}>`);
              }
              if (msg.elementInfo.id) {
                lines.push(`     ID: #${msg.elementInfo.id}`);
              }
              if (msg.elementInfo.className) {
                lines.push(`     Класс: .${msg.elementInfo.className.split(' ')[0]}`);
              }
            }
            if (msg.selector) {
              lines.push(`     CSS селектор: ${msg.selector}`);
              lines.push(`     Как найти: Откройте консоль браузера (F12) и выполните:`);
              lines.push(`       document.querySelector('${msg.selector}')`);
            }
            if (msg.elementInfo?.xpath) {
              lines.push(`     XPath: ${msg.elementInfo.xpath}`);
            }
          }
          
          lines.push("");
          globalIndex++;
        });
      }
      
      // Другие ошибки
      if (otherErrors.length > 0) {
        lines.push("ДРУГИЕ ПРОБЛЕМЫ");
        lines.push("-".repeat(80));
        lines.push("");
        
        otherErrors.forEach((msg: any, index: number) => {
          lines.push(`${globalIndex}. ${translateHTMLValidationMessage(msg.message || msg.text || "Проблема валидации")}`);
          lines.push(`   Тип: ${msg.type === 'error' ? 'Ошибка' : msg.type === 'warning' ? 'Предупреждение' : 'Информация'}`);
          
          // Позиция
          const hasValidPosition = (msg.firstLine !== undefined && msg.firstLine !== null && msg.firstLine > 0) ||
                                   (msg.lastLine !== undefined && msg.lastLine !== null && msg.lastLine > 0);
          
          if (hasValidPosition) {
            if (msg.firstLine === msg.lastLine && msg.firstColumn === msg.lastColumn) {
              lines.push(`   Местоположение: Строка ${msg.firstLine || msg.lastLine || '?'}, столбец ${msg.firstColumn || msg.lastColumn || '?'}`);
            } else {
              lines.push(`   Местоположение: Строки ${msg.firstLine || '?'}-${msg.lastLine || '?'}, столбцы ${msg.firstColumn || '?'}-${msg.lastColumn || '?'}`);
            }
          } else {
            lines.push(`   Местоположение: Требуется дополнительный анализ исходного кода`);
          }
          
          // Фрагмент кода
          if (msg.extract && msg.extract.trim()) {
            const extractPreview = msg.extract.trim().substring(0, 200);
            lines.push(`   Фрагмент кода: ${extractPreview}${msg.extract.length > 200 ? '...' : ''}`);
          }
          
          // Информация о найденном элементе DOM
          if (msg.selector || msg.elementInfo) {
            lines.push(`   Найденный элемент в DOM:`);
            if (msg.elementInfo) {
              if (msg.elementInfo.tagName) {
                lines.push(`     Тег: <${msg.elementInfo.tagName}>`);
              }
              if (msg.elementInfo.id) {
                lines.push(`     ID: #${msg.elementInfo.id}`);
              }
              if (msg.elementInfo.className) {
                lines.push(`     Класс: .${msg.elementInfo.className.split(' ')[0]}`);
              }
            }
            if (msg.selector) {
              lines.push(`     CSS селектор: ${msg.selector}`);
              lines.push(`     Как найти: Откройте консоль браузера (F12) и выполните:`);
              lines.push(`       document.querySelector('${msg.selector}')`);
            }
            if (msg.elementInfo?.xpath) {
              lines.push(`     XPath: ${msg.elementInfo.xpath}`);
            }
          }
          
          lines.push("");
          globalIndex++;
        });
      }
    }
    
    if (checkResult.htmlValidationError) {
      lines.push("");
      lines.push(`Ошибка валидации: ${checkResult.htmlValidationError}`);
    }
    lines.push("");
  }
  
  // Extended Checks
  if (checkResult.extendedChecks) {
    const extended = checkResult.extendedChecks as any;
    lines.push("");
    lines.push("РАСШИРЕННЫЕ ПРОВЕРКИ WCAG");
    lines.push("=".repeat(80));
    
    let hasIssues = false;
    
    if (extended.viewport && extended.viewport.issues.length > 0) {
      hasIssues = true;
      lines.push("");
      lines.push("Viewport и масштабирование:");
      extended.viewport.issues.forEach((issue: string) => {
        lines.push(`  - ${issue}`);
      });
    }
    
    if (extended.autoplayMedia && extended.autoplayMedia.issues.length > 0) {
      hasIssues = true;
      lines.push("");
      lines.push("Автовоспроизведение медиа:");
      extended.autoplayMedia.issues.forEach((issue: string) => {
        lines.push(`  - ${issue}`);
      });
    }
    
    if (extended.tabOrder && extended.tabOrder.issues.length > 0) {
      hasIssues = true;
      lines.push("");
      lines.push("Порядок табуляции:");
      extended.tabOrder.issues.forEach((issue: string) => {
        lines.push(`  - ${issue}`);
      });
    }
    
    if (extended.tabOrder && extended.tabOrder.elementsWithTabindex && extended.tabOrder.elementsWithTabindex.length > 0) {
      hasIssues = true;
      if (!extended.tabOrder.issues || extended.tabOrder.issues.length === 0) {
        lines.push("");
        lines.push("Порядок табуляции:");
      }
      lines.push(`  Элементы с tabindex > 0 (максимум: ${extended.tabOrder.maxTabindex || "N/A"}):`);
      extended.tabOrder.elementsWithTabindex.forEach((el: any) => {
        lines.push(`    - ${el.selector} (tabindex=${el.tabindex})`);
      });
    }
    
    if (extended.focusVisible && extended.focusVisible.issues.length > 0) {
      hasIssues = true;
      lines.push("");
      lines.push("Видимость фокуса:");
      extended.focusVisible.issues.forEach((issue: string) => {
        lines.push(`  - ${issue}`);
      });
    }
    
    if (extended.timing && extended.timing.issues.length > 0) {
      hasIssues = true;
      lines.push("");
      lines.push("Тайминг и автообновление:");
      extended.timing.issues.forEach((issue: string) => {
        lines.push(`  - ${issue}`);
      });
    }
    
    if (!hasIssues) {
      lines.push("");
      lines.push("Расширенные проверки WCAG пройдены успешно.");
      lines.push("Не обнаружено проблем с viewport, автовоспроизведением медиа,");
      lines.push("порядком табуляции, видимостью фокуса и таймингом.");
    }
    
    lines.push("");
  }
  
  // Footer
  lines.push("");
  lines.push("=".repeat(80));
  lines.push("Конец отчета");
  lines.push("=".repeat(80));
  
  return lines.join("\n");
}

export function downloadTXTReport(checkResult: AccessibilityCheck) {
  const report = generateTXTReport(checkResult);
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  
  // Generate filename from URL and date
  const urlName = checkResult.url
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]/gi, "_")
    .substring(0, 50);
  const dateStr = new Date(checkResult.checkedAt as any).toISOString().split("T")[0];
  link.download = `accessibility_report_${urlName}_${dateStr}.txt`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

