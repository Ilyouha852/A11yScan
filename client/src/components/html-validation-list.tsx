interface HTMLValidationMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  extract: string;
  firstLine: number;
  lastLine: number;
  firstColumn: number;
  lastColumn: number;
  hiliteStart?: number;
  hiliteLength?: number;
  selector?: string | null;
  elementInfo?: {
    tagName?: string;
    id?: string;
    className?: string;
    xpath?: string;
  } | null;
  context?: string | null;
}

interface HTMLValidationListProps {
  messages: HTMLValidationMessage[];
  errorCount: number;
  warningCount: number;
  validationFailed?: boolean;
  validationError?: string;
}

type HTMLFilterType = "all" | "error" | "warning";

export function HTMLValidationList({ messages, errorCount, warningCount, validationFailed, validationError }: HTMLValidationListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<HTMLFilterType>("all");

  // Filter messages based on selected filter
  const filteredMessages = messages.filter((msg) => {
    if (filterType === "all") return true;
    if (filterType === "error") return msg.type === "error";
    if (filterType === "warning") return msg.type === "warning";
    return true;
  });

  // Show validation failure warning
  if (validationFailed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Code className="h-5 w-5" />
            HTML-валидация (критерий 4.1.1 WCAG)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                HTML-валидация не выполнена
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {validationError || "Не удалось подключиться к сервису валидации W3C. Попробуйте позже."}
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2">
                Публичный сервис валидации W3C имеет ограничения по количеству запросов. 
                Рекомендуется использовать локальный валидатор для регулярных проверок.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!messages || messages.length === 0) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getVariant = (type: string): "destructive" | "secondary" | "outline" => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  // Функция для определения понятного местоположения ошибки
  const getLocationDescription = (msg: HTMLValidationMessage): string => {
    // Приоритет 1: Если есть селектор или информация об элементе, используем их
    if (msg.selector) {
      const shortSelector = msg.selector.length > 50 
        ? `${msg.selector.substring(0, 47)}...`
        : msg.selector;
      return `Элемент: ${shortSelector}`;
    }
    
    if (msg.elementInfo) {
      if (msg.elementInfo.id) {
        return `Элемент: #${msg.elementInfo.id}`;
      }
      if (msg.elementInfo.tagName) {
        return `Элемент: <${msg.elementInfo.tagName}>`;
      }
    }
    
    if (msg.context) {
      return msg.context;
    }
    
    // Приоритет 2: Проверяем, есть ли валидная позиция (firstLine должен быть больше 0)
    // Если firstLine = 0, даже если lastLine > 0, это означает что позиция не определена точно
    const hasValidPosition = msg.firstLine > 0;
    
    // Если позиция НЕ валидна (firstLine = 0), не показываем строки/столбцы, а определяем по типу ошибки
    if (!hasValidPosition) {
      // Проверяем тип ошибки по сообщению для более понятного описания
      const message = msg.message.toLowerCase();
      if (message.includes('css:') || message.includes('parse error')) {
        return 'Встроенные стили (CSS)';
      }
      if (message.includes('element') || message.includes('attribute')) {
        return 'Динамический контент';
      }
      return 'Позиция недоступна';
    }
    
    // Приоритет 3: Если позиция валидна (firstLine > 0), показываем её
    if (msg.firstLine === msg.lastLine && msg.firstColumn === msg.lastColumn) {
      return `Строка ${msg.firstLine}, столбец ${msg.firstColumn}`;
    }
    
    if (msg.firstLine === msg.lastLine) {
      return `Строка ${msg.firstLine}, столбцы ${msg.firstColumn}-${msg.lastColumn}`;
    }
    
    return `Строки ${msg.firstLine}-${msg.lastLine}, столбцы ${msg.firstColumn}-${msg.lastColumn}`;
  };

  // Функция для определения типа ошибки
  const getErrorCategory = (msg: HTMLValidationMessage): { label: string; description: string } => {
    const message = msg.message.toLowerCase();
    if (message.includes('css:') || message.includes('parse error')) {
      return {
        label: 'CSS',
        description: 'Ошибка в встроенных стилях'
      };
    }
    if (message.includes('element') || message.includes('tag')) {
      return {
        label: 'HTML',
        description: 'Ошибка в структуре HTML'
      };
    }
    if (message.includes('attribute')) {
      return {
        label: 'Атрибут',
        description: 'Проблема с атрибутом элемента'
      };
    }
    return {
      label: 'Общее',
      description: 'Общая ошибка валидации'
    };
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer group flex-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Code className="h-5 w-5" />
                    <CardTitle className="text-lg">HTML-валидация (критерий 4.1.1 WCAG)</CardTitle>
                  </div>
                  <CardDescription>
                    {errorCount === 0 && warningCount === 0 ? (
                      "HTML-код соответствует стандартам W3C"
                    ) : (
                      `Обнаружено ${errorCount} ошибок и ${warningCount} предупреждений в HTML-коде`
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {errorCount > 0 && (
                    <Badge variant="destructive" className="text-sm">
                      {errorCount} ошибок
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge variant="secondary" className="text-sm">
                      {warningCount} предупреждений
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm" data-testid="button-toggle-html-validation">
                    <ChevronDown 
                      className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                    />
                  </Button>
                </div>
              </div>
            </CollapsibleTrigger>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterType} onValueChange={(value) => setFilterType(value as HTMLFilterType)}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Фильтр" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все сообщения</SelectItem>
                  <SelectItem value="error" data-html-filter="error">Только ошибки</SelectItem>
                  <SelectItem value="warning" data-html-filter="warning">Только предупреждения</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {filteredMessages.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                Нет сообщений, соответствующих выбранному фильтру
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredMessages.map((msg, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-start gap-3 text-left w-full pr-4">
                        <div className="mt-1">{getIcon(msg.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant={getVariant(msg.type)} className="text-xs">
                              {msg.type === 'error' ? 'Ошибка' : msg.type === 'warning' ? 'Предупреждение' : 'Инфо'}
                            </Badge>
                            {(() => {
                              const category = getErrorCategory(msg);
                              return (
                                <Badge variant="outline" className="text-xs">
                                  {category.label}
                                </Badge>
                              );
                            })()}
                            <span className="text-xs text-muted-foreground">
                              {getLocationDescription(msg)}
                            </span>
                          </div>
                          <p className="text-sm font-medium break-words">{translateHTMLValidationMessage(msg.message)}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-10 pt-2 space-y-3">
                        {/* Объяснение Parse error */}
                        {(() => {
                          const parseExplanation = getParseErrorExplanation(msg.message, msg.extract);
                          if (parseExplanation) {
                            return (
                              <div className="p-3 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded">
                                <p className="text-xs font-medium text-orange-900 dark:text-orange-100 mb-1">ℹ️ Что это значит?</p>
                                <p className="text-xs text-orange-800 dark:text-orange-200">{parseExplanation}</p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Подсказка категории для ошибок без валидной позиции */}
                        {(() => {
                          const category = getErrorCategory(msg);
                          if (category.description && msg.firstLine === 0) {
                            return (
                              <div className="p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                                <p className="text-xs text-blue-800 dark:text-blue-200">
                                  {category.description} • Используйте инструменты разработчика для поиска
                                </p>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {msg.extract && (
                          <div className="bg-muted p-3 rounded-md">
                            <div className="flex items-start justify-between mb-2">
                              <p className="text-xs text-muted-foreground font-medium">Фрагмент кода:</p>
                              {msg.extract.length < 50 && (
                                <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                  ⚠️ Фрагмент может быть обрезан
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              {(msg.hiliteStart !== undefined && msg.hiliteStart >= 0 && msg.hiliteLength !== undefined && msg.hiliteLength > 0 && 
                                msg.hiliteStart < msg.extract.length) ? (
                                // Если есть информация о выделении, показываем её
                                <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono bg-background p-2 rounded border">
                                  <code>
                                    {msg.extract.substring(0, msg.hiliteStart)}
                                    <span className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded font-bold">
                                      {msg.extract.substring(msg.hiliteStart, Math.min(msg.hiliteStart + msg.hiliteLength, msg.extract.length))}
                                    </span>
                                    {msg.extract.substring(Math.min(msg.hiliteStart + msg.hiliteLength, msg.extract.length))}
                                  </code>
                                </pre>
                              ) : (
                                <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all font-mono bg-background p-2 rounded border">
                                  <code>{msg.extract}</code>
                                </pre>
                              )}
                            </div>
                            {/* Подсказка о том, что делать с фрагментом */}
                            <p className="text-xs text-muted-foreground mt-2">
                              💡 Используйте этот фрагмент для поиска в исходном коде страницы (Ctrl+U) или в инструментах разработчика (F12 → Elements)
                            </p>
                          </div>
                        )}
                        <div className="mt-2 space-y-2">
                          <div className="text-xs text-muted-foreground">
                            <p className="font-medium mb-1">Местоположение:</p>
                            {(() => {
                              const locationDesc = getLocationDescription(msg);
                              return (
                                <>
                                  <p>{locationDesc}</p>
                                  
                                  {/* Пояснение, как была найдена ошибка, только если местоположение = "Позиция недоступна" */}
                                  {locationDesc === 'Позиция недоступна' && (
                              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded">
                                <p className="font-medium text-amber-900 dark:text-amber-100 mb-2">🔍 Как была найдена эта ошибка?</p>
                                <div className="space-y-2 text-amber-800 dark:text-amber-200">
                                  <p><strong>Процесс валидации:</strong></p>
                                  <ol className="list-decimal list-inside space-y-1 ml-2">
                                    <li>Страница загружается в браузер (Puppeteer) и ждёт выполнения JavaScript (2 секунды)</li>
                                    <li>Извлекается финальный HTML-код страницы (после всех JavaScript-изменений)</li>
                                    <li>Валидатор HTML (Nu HTML Checker) анализирует структуру и синтаксис этого HTML</li>
                                    <li>Валидатор обнаруживает ошибки в структуре разметки, даже если точная строка недоступна</li>
                                  </ol>
                                  <p className="mt-2"><strong>Почему позиция недоступна?</strong></p>
                                  <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Валидатор получает <strong>финальный HTML после выполнения JavaScript</strong>, а не исходный .html файл</li>
                                    <li>JavaScript мог изменить DOM (добавить элементы через innerHTML, изменить структуру и т.д.)</li>
                                    <li>Валидатор находит ошибки в <strong>структуре</strong> разметки (незакрытые теги, неправильная вложенность и т.д.), но не знает, какая строка исходного файла соответствует этому месту</li>
                                    <li>Валидатор возвращает фрагмент проблемного кода (extract), но не точную позицию в исходном файле</li>
                                  </ul>
                                  <p className="mt-2"><strong>Что делать?</strong> Используйте фрагмент кода выше для поиска проблемы в исходном коде страницы (Ctrl+U) или в инструментах разработчика (F12 → Elements).</p>
                                </div>
                              </div>
                                  )}
                                </>
                              );
                            })()}
                            
                            {/* Информация о найденном элементе */}
                            {msg.elementInfo && (
                              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded">
                                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">📍 Найденный элемент:</p>
                                {msg.firstLine === 0 && (
                                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-2 italic">
                                    ✓ Элемент автоматически найден в DOM страницы по фрагменту кода с помощью инструментов разработчика
                                  </p>
                                )}
                                <div className="space-y-1 text-blue-800 dark:text-blue-200">
                                  <p>• Тег: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">&lt;{msg.elementInfo.tagName}&gt;</code></p>
                                  {msg.elementInfo.id && (
                                    <p>• ID: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">#{msg.elementInfo.id}</code></p>
                                  )}
                                  {msg.elementInfo.className && (
                                    <p>• Класс: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.{msg.elementInfo.className.split(' ')[0]}</code></p>
                                  )}
                                  {msg.selector && (
                                    <div className="mt-2 flex items-start gap-2">
                                      <p className="flex-1">
                                        • CSS селектор: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded break-all">{msg.selector}</code>
                                      </p>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => {
                                          navigator.clipboard.writeText(msg.selector || '');
                                          // Можно добавить toast уведомление здесь
                                        }}
                                        title="Копировать селектор"
                                      >
                                        📋
                                      </Button>
                                    </div>
                                  )}
                                  {msg.elementInfo.xpath && (
                                    <p className="mt-1">
                                      • XPath: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded break-all text-[10px]">{msg.elementInfo.xpath}</code>
                                    </p>
                                  )}
                                  {msg.selector && (
                                    <p className="mt-2 text-blue-700 dark:text-blue-300">
                                      💡 Используйте селектор в консоли браузера: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded break-all">{msg.selector.length > 60 ? `document.querySelector('${msg.selector.substring(0, 57)}...')` : `document.querySelector('${msg.selector}')`}</code>
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Предупреждение, если элемент не найден и позиция не валидна */}
                            {!msg.elementInfo && !msg.selector && msg.firstLine === 0 && (
                              <p className="mt-1 text-yellow-600 dark:text-yellow-400">
                                💡 Точная позиция недоступна. Ошибка может быть в встроенных стилях или динамически сгенерированном контенте.
                                Используйте инструменты разработчика браузера (F12) для поиска проблемы по фрагменту кода выше.
                              </p>
                            )}
                            
                            {/* Показываем также исходную позицию, только если она валидна (firstLine > 0) */}
                            {/* НЕ показываем позиции вида "0-22", "0-0" и т.д., так как они не информативны */}
                            {msg.firstLine > 0 && (
                              <p className="mt-1">
                                Позиция в HTML: {msg.firstLine === msg.lastLine 
                                  ? `строка ${msg.firstLine}, столбцы ${msg.firstColumn}-${msg.lastColumn}`
                                  : `строки ${msg.firstLine}-${msg.lastLine}, столбцы ${msg.firstColumn}-${msg.lastColumn}`}
                              </p>
                            )}
                          </div>
                          {(() => {
                            const category = getErrorCategory(msg);
                            if (category.label === 'CSS') {
                              return (
                                <div className="text-xs bg-blue-50 dark:bg-blue-950 p-2 rounded border border-blue-200 dark:border-blue-800">
                                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">ℹ️ Ошибка CSS:</p>
                                  <p className="text-blue-800 dark:text-blue-200">
                                    Эти ошибки обычно возникают в встроенных стилях (&lt;style&gt;) или инлайн-стилях (style="...").
                                    Многие современные CSS-функции (например, var(--переменная)) могут вызывать ложные срабатывания.
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
