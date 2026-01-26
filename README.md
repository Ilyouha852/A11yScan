# Введение

**Accessibility Scanner** — это веб-приложение для автоматической проверки веб-сайтов на соответствие стандартам доступности (WCAG 2.1/2.2 уровней A, AA и AAA).

## Цель проекта

Разработать инструмент, позволяющий выявлять проблемы доступности веб-страниц для пользователей с ограниченными возможностями здоровья. Основная задача — помочь разработчикам и владельцам сайтов обнаружить и устранить барьеры, препятствующие полноценному использованию ресурса людьми с инвалидностью.

## Постановка задачи

Необходимо реализовать веб-приложение, которое:

- Проверяет произвольные веб-страницы на соответствие стандартам WCAG
- Выявляет нарушения доступности и классифицирует их по степени критичности
- Предоставляет детальный отчёт с рекомендациями по устранению проблем
- Оценивает общий уровень соответствия WCAG (A, AA, AAA)
- Валидирует HTML-код страницы

## Принципы работы

Пользователь вводит URL-адрес страницы для проверки. Система запускает браузер в headless-режиме, загружает страницу и выполняет анализ с использованием:

- **axe-core** — библиотеки для автоматизированного тестирования доступности
- **Расширенных проверок** — дополнительного набора правил, охватывающих аспекты, не тестируемые axe-core
- **Валидации HTML** — проверки корректности разметки

Результаты группируются по уровням критичности и предоставляются пользователю в удобном формате с возможностью экспорта отчёта.

## Важное уточнение

Инструмент предназначен для помощи разработчикам и не заменяет ручное тестирование с использованием ассистивных технологий (скринридеры, программы увеличения и т.д.).

---

# Архитектура проекта

## Общий обзор

Приложение построено по принципам клиент-серверной архитектуры с чётким разделением ответственности. Backend отвечает за обработку запросов, анализ страниц и хранение результатов. Frontend обеспечивает пользовательский интерфейс и визуализацию результатов.

| Слой | За что отвечает | Примеры компонентов |
|------|------------------|---------------------|
| Presentation layer | Пользовательский интерфейс | React-компоненты, страницы, UI-библиотека |
| Application layer | API-маршруты и бизнес-логика | Express-роуты, контроллеры |
| Domain layer | Анализ доступности | AccessibilityAnalyzer, HTMLValidator |
| Data layer | Хранение данных | Drizzle ORM, SQLite, Storage |

---

## Архитектурный подход

Приложение использует классическую серверную архитектуру с интегрированным frontend.

- Backend реализован на Express.js с серверным рендерингом frontend-приложения
- Frontend построен на React с использованием client-side routing
- Анализ страниц выполняется в браузере (Puppeteer в headless-режиме)
- Результаты проверок сохраняются в SQLite для истории

Такое решение обеспечивает централизованное управление анализом и историей проверок.

---

## Технологический стек

| Компонент | Используемая технология |
|-----------|------------------------|
| Frontend | React 18, TypeScript, Vite |
| Routing | wouter |
| State Management | TanStack React Query |
| UI Components | Radix UI, Tailwind CSS |
| Backend | Express.js, TypeScript |
| Browser Automation | Puppeteer |
| Accessibility Testing | axe-core |
| HTML Validation | Nu HTML Checker (vnu-jar) |
| Database | SQLite, Drizzle ORM |
| Validation | Zod |

---

## Иерархия пакетов

```
├── server/
│   ├── index.ts              # Точка входа, Express-сервер
│   ├── routes.ts             # API-маршруты
│   ├── accessibility-analyzer.ts  # Анализ доступности (axe-core + расширенные проверки)
│   ├── html-validator.ts     # Валидация HTML (W3C Nu HTML Checker)
│   ├── storage.ts            # Работа с базой данных
│   ├── db.ts                 # Подключение к SQLite
│   ├── migrate.ts            # Миграции базы данных
│   └── vite.ts               # Конфигурация Vite для dev-режима
├── client/
│   └── src/
│       ├── App.tsx           # Главный компонент приложения
│       ├── main.tsx          # Точка входа React
│       ├── pages/
│       │   ├── home.tsx      # Главная страница (форма проверки)
│       │   ├── history.tsx   # История проверок
│       │   └── not-found.tsx # Страница 404
│       ├── components/
│       │   ├── ui/           # UI-компоненты (Radix UI + Tailwind)
│       │   ├── violations-list.tsx
│       │   ├── passed-checks-list.tsx
│       │   └── ...
│       ├── lib/
│       │   ├── queryClient.ts    # TanStack Query конфигурация
│       │   ├── report-generator.ts  # Генерация отчётов
│       │   └── translations.ts   # Переводы сообщений
│       └── hooks/
│           ├── use-mobile.tsx
│           └── use-toast.ts
├── shared/
│   └── schema.ts             # Типы данных и схема БД
└── migrations/               # SQLite миграции
```

---

## Поток данных

```
Пользователь вводит URL
│
▼
// API: POST /api/analyze
Frontend → API Request
│
▼
// Backend: analyzeAccessibility(url)
Accessibility Analyzer (Puppeteer + axe-core)
│
├── page.goto(url) → Загрузка страницы
├── axe.run() → WCAG-проверки
├── performExtendedChecks() → Дополнительные проверки
└── validateHTML() → HTML-валидация
│
▼
// Расчёт результатов
AnalysisResult:
├── totalViolations, criticalCount, seriousCount...
├── violations[], passes[], incomplete[]
├── htmlValidationMessages
├── extendedChecks
└── wcagLevel
│
▼
// API Response
Frontend → Отображение результатов
│
▼
// Сохранение в историю
Storage → SQLite (accessibility_checks table)
```

---

## Основные компоненты

### Presentation layer (Frontend)

| Компонент | Назначение |
|-----------|------------|
| Home | Главная страница с формой ввода URL и отображением результатов |
| HistoryPage | Страница истории проверок |
| ViolationsList | Список нарушений доступности, сгруппированных по критичности |
| PassedChecksList | Список успешных проверок |
| HTMLValidationList | Список ошибок валидации HTML |
| ErrorsSummary | Сводка по количеству ошибок каждого уровня |
| ThemeProvider | Управление светлой/тёмной темой |

---

### Application layer (Backend)

| Маршрут | Метод | Назначение |
|---------|-------|------------|
| `/api/analyze` | POST | Запуск анализа доступности URL |
| `/api/checks` | GET | Получение истории проверок |
| `/api/checks/:id` | GET | Получение конкретной проверки |
| `/api/checks/:id` | DELETE | Удаление проверки |
| `/api/export/:id` | GET | Экспорт отчёта в TXT |

---

### Domain layer

#### Accessibility Analyzer

**AccessibilityAnalyzer** — основной компонент анализа доступности.

| Метод | Назначение |
|-------|------------|
| analyzeAccessibility(url) | Запуск полного анализа страницы |
| getChromiumPath() | Определение пути к системному Chromium |
| performExtendedChecks(page) | Выполнение дополнительных WCAG-проверок |
| calculateWCAGLevel(violations) | Расчёт уровня соответствия WCAG |

**performExtendedChecks** включает проверки:
- viewport (масштабирование, блокировка зума)
- autoplayMedia (автовоспроизведение медиа)
- tabOrder (порядок табуляции)
- focusVisible (видимость фокуса)
- timing (автообновление, setTimeout/setInterval)
- language (атрибут lang)
- mediaAccessibility (субтитры, транскрипты)
- iframes (атрибуты title)
- emptyLinks (пустые ссылки)
- placeholderAsLabel (placeholder вместо label)
- tables (заголовки в таблицах)
- redundantAria (избыточные ARIA-атрибуты)

#### HTML Validator

**HTMLValidator** — компонент валидации HTML-разметки.

| Метод | Назначение |
|-------|------------|
| validateHTML(html) | Валидация HTML (автоматический выбор метода) |
| validateHTMLLocal(html) | Локальная валидация через vnu-jar |
| validateHTMLOnline(html) | Онлайн-валидация через W3C API |
| enrichValidationMessagesWithDOM(messages, page) | Обогащение сообщений данными из DOM |

---

### Data layer

#### Схема базы данных (accessibility_checks table)

| Поле | Тип | Описание |
|------|-----|----------|
| id | TEXT (UUID) | Первичный ключ |
| url | TEXT | Проверенный URL |
| checkedAt | TIMESTAMP | Время проверки |
| totalViolations | INTEGER | Общее количество нарушений |
| criticalCount | INTEGER | Критические |
| seriousCount | INTEGER | Серьёзные |
| moderateCount | INTEGER | Умеренные |
| minorCount | INTEGER | Незначительные |
| passedCount | INTEGER | Успешных проверок |
| violations | JSON | Массив нарушений axe-core |
| passes | JSON | Массив успешных проверок |
| incomplete | JSON | Незавершённые проверки |
| pageTitle | TEXT | Заголовок страницы |
| testedUrl | TEXT | Финальный URL (после редиректов) |
| htmlErrorCount | INTEGER | Ошибок валидации HTML |
| htmlWarningCount | INTEGER | Предупреждений HTML |
| htmlValidationMessages | JSON | Сообщения валидации HTML |
| htmlValidationFailed | BOOLEAN | Ошибка валидации HTML |
| htmlValidationError | TEXT | Текст ошибки валидации |
| extendedChecks | JSON | Результаты расширенных проверок |
| wcagLevel | TEXT | Уровень WCAG (A, AA, AAA, fail) |

---

## WCAG Conformance Level

Уровень соответствия определяется на основе нарушений:

| Уровень | Условие |
|---------|---------|
| **AAA** | Нет нарушений уровней A, AA, AAA |
| **AA** | Нет нарушений уровней A и AA, но есть AAA |
| **A** | Нет нарушений уровня A, но есть AA или AAA |
| **fail** | Есть нарушения уровня A |

---

## Классификация нарушений по критичности

| Уровень | Описание | Примеры |
|---------|----------|---------|
| **Critical** | Критические проблемы, требующие немедленного исправления | Отсутствие alt-текста, невалидный HTML |
| **Serious** | Серьёзные проблемы, влияющие на доступность | Низкий контраст, неправильная структура заголовков |
| **Moderate** | Умеренные проблемы | Избыточный alt-текст, непоследовательная навигация |
| **Minor** | Незначительные проблемы | Дублирование ID, неиспользуемые ARIA-атрибуты |

---

## Интеграция компонентов

```typescript
// Типичный запрос на анализ
POST /api/analyze
Body: { url: "https://example.com" }

// Ответ
{
  "url": "https://example.com",
  "testedUrl": "https://example.com",
  "pageTitle": "Example Page",
  "totalViolations": 12,
  "criticalCount": 3,
  "seriousCount": 5,
  "moderateCount": 3,
  "minorCount": 1,
  "passedCount": 45,
  "wcagLevel": "A",
  "htmlErrorCount": 2,
  "htmlWarningCount": 1,
  "violations": [...],
  "extendedChecks": {...}
}
```

---

## Архитектурные принципы

1. **Чёткое разделение ответственности** — каждый компонент решает одну задачу
2. **Типизация** — полное покрытие TypeScript-типами на всех уровнях
3. **Серверный анализ** — тяжёлые операции (Puppeteer, axe-core) выполняются на сервере
4. **Атомарные API-маршруты** — каждый маршрут отвечает за одну операцию
5. **История проверок** — результаты сохраняются для дальнейшего анализа
6. **Fallback-механизмы** — локальный валидатор → онлайн API при недоступности

---

# Спецификация составляющих проекта

## Общая идея

В этом разделе описаны ключевые компоненты приложения, их поля, методы и взаимосвязи. Проект разделён на слои: Presentation (React-компоненты), Application (API-маршруты), Domain (логика анализа) и Data (хранение данных).

---

## Presentation layer — React-компоненты

### Home

Главная страница приложения. Отвечает за ввод URL, запуск анализа и отображение результатов.

| Поле / Состояние | Тип | Назначение |
|-----------------|-----|------------|
| url | string | Введённый пользователем URL |
| currentResult | AccessibilityCheck \| null | Текущий результат анализа |
| analyzeMutation | UseMutation | Мутация для запуска анализа |

| Метод | Назначение |
|-------|------------|
| handleSubmit(e) | Обработка отправки формы |
| downloadTXTReport(result) | Скачивание отчёта в TXT |

### HistoryPage

Страница истории проверок. Отображает список ранее выполненных анализов.

| Поле / Состояние | Тип | Назначение |
|-----------------|-----|------------|
| checks | AccessibilityCheck[] | Список проверок из истории |
| useQuery | UseQuery | Загрузка истории с сервера |

---

## Presentation layer — UI-компоненты

### ViolationsList

Отображает список нарушений доступности, сгруппированных по уровню критичности.

| Пропс | Тип | Назначение |
|-------|-----|------------|
| violations | ViolationDetail[] | Массив нарушений axe-core |

### HTMLValidationList

Отображает ошибки и предупреждения валидации HTML.

| Пропс | Тип | Назначение |
|-------|-----|------------|
| messages | HTMLValidationMessage[] | Массив сообщений валидатора |
| errorCount | number | Количество ошибок |
| warningCount | number | Количество предупреждений |

### ExtendedChecksList

Отображает результаты расширенных WCAG-проверок.

| Пропс | Тип | Назначение |
|-------|-----|------------|
| checks | ExtendedChecks | Результаты дополнительных проверок |

### ErrorsSummary

Сводка по всем ошибкам доступности и валидации HTML.

| Пропс | Тип | Назначение |
|-------|-----|------------|
| violations | ViolationDetail[] | Нарушения axe-core |
| htmlErrorCount | number | Ошибки HTML |
| htmlWarningCount | number | Предупреждения HTML |
| extendedChecks | ExtendedChecks | Расширенные проверки |

### PassedChecksList

Отображает успешно пройденные проверки доступности.

| Пропс | Тип | Назначение |
|-------|-----|------------|
| passes | any[] | Массив успешных проверок |

---

## Presentation layer — утилиты

### queryClient

Конфигурация TanStack React Query.

| Метод | Назначение |
|-------|------------|
| apiRequest(method, url, data) | Выполнение HTTP-запроса к API |
| throwIfResNotOk(res) | Проверка статуса ответа |

### report-generator

Генерация текстовых отчётов.

| Метод | Назначение |
|-------|------------|
| generateTXTReport(checkResult) | Формирование TXT-отчёта |
| downloadTXTReport(checkResult) | Скачивание отчёта |

### translations

Перевод сообщений об ошибках.

| Метод | Назначение |
|-------|------------|
| translateViolationDescription(id, original) | Перевод описания нарушения |
| translateViolationHelp(id, original) | Перевод справки |
| translateFailureSummary(summary) | Перевод сводки ошибок |
| translateHTMLValidationMessage(message) | Перевод сообщения валидации HTML |
| getParseErrorExplanation(message, extract) | Объяснение ошибки парсинга |

---

## Application layer — API-маршруты

### registerRoutes(app)

Регистрация всех API-маршрутов Express.

| Маршрут | Метод | Назначение |
|---------|-------|------------|
| `/api/analyze` | POST | Запуск анализа URL |
| `/api/history` | GET | Получение истории |
| `/api/checks/:id` | GET | Получение конкретной проверки |
| `/api/checks/:id` | DELETE | Удаление проверки |
| `/api/export/:id` | GET | Экспорт отчёта |

---

## Domain layer — анализ доступности

### AccessibilityAnalyzer

Основной компонент анализа доступности. Запускает Puppeteer, axe-core и дополнительные проверки.

| Метод | Назначение |
|-------|------------|
| analyzeAccessibility(url) | Полный анализ страницы |
| getChromiumPath() | Определение пути к системному Chromium |
| performExtendedChecks(page) | Выполнение дополнительных проверок |
| calculateWCAGLevel(violations) | Расчёт уровня соответствия WCAG |

**performExtendedChecks** выполняет проверки:

| Проверка | Описание | WCAG |
|----------|----------|------|
| viewport | Блокировка масштабирования | 1.4.4 |
| autoplayMedia | Автовоспроизведение медиа | 1.4.2, 2.2.2 |
| tabOrder | Порядок табуляции | 2.4.3 |
| focusVisible | Видимость фокуса | 2.4.7 |
| timing | Автообновление страницы | 2.2.1 |
| language | Атрибут lang | 3.1.1 |
| mediaAccessibility | Субтитры и транскрипты | 1.2.1, 1.2.2 |
| iframes | Атрибуты title у iframe | 4.1.2 |
| emptyLinks | Пустые ссылки без текста | 2.4.4 |
| placeholderAsLabel | placeholder вместо label | 3.3.2 |
| tables | Заголовки в таблицах | 1.3.1 |
| redundantAria | Избыточные ARIA-атрибуты | Best Practice |

---

## Domain layer — валидация HTML

### HTMLValidator

Компонент валидации HTML-разметки. Поддерживает локальный (vnu-jar) и онлайн (W3C) валидаторы.

| Метод | Назначение |
|-------|------------|
| validateHTML(html) | Валидация HTML (автоматический выбор) |
| validateHTMLLocal(html) | Локальная валидация через vnu-jar |
| validateHTMLOnline(html) | Онлайн-валидация через W3C API |
| initializeVnu() | Инициализация пути к vnu-jar |
| enrichValidationMessagesWithDOM(messages, page) | Обогащение сообщений DOM-данными |

### Интерфейсы валидации

**HTMLValidationMessage**

| Поле | Тип | Назначение |
|------|-----|------------|
| type | 'error' \| 'warning' \| 'info' | Тип сообщения |
| message | string | Текст сообщения |
| extract | string | Фрагмент кода |
| firstLine | number | Начальная строка |
| lastLine | number | Конечная строка |
| firstColumn | number | Начальный столбец |
| lastColumn | number | Конечный столбец |
| selector | string \| null | CSS-селектор элемента |
| elementInfo | object \| null | Информация об элементе |

**HTMLValidationResult**

| Поле | Тип | Назначение |
|------|-----|------------|
| errorCount | number | Количество ошибок |
| warningCount | number | Количество предупреждений |
| messages | HTMLValidationMessage[] | Массив сообщений |
| validationFailed | boolean | Ошибка валидации |
| validationError | string \| undefined | Текст ошибки |

---

## Data layer — схема данных

### accessibilityChecks (Drizzle table)

Таблица хранения результатов проверок доступности.

| Поле | Тип | Описание |
|------|-----|----------|
| id | TEXT (UUID) | Первичный ключ |
| url | TEXT | Проверенный URL |
| checkedAt | TIMESTAMP | Время проверки |
| totalViolations | INTEGER | Всего нарушений |
| criticalCount | INTEGER | Критические |
| seriousCount | INTEGER | Серьёзные |
| moderateCount | INTEGER | Умеренные |
| minorCount | INTEGER | Незначительные |
| passedCount | INTEGER | Пройдено проверок |
| violations | JSON | Массив нарушений |
| passes | JSON | Массив успешных |
| incomplete | JSON | Незавершённые |
| pageTitle | TEXT | Заголовок страницы |
| testedUrl | TEXT | Финальный URL |
| htmlErrorCount | INTEGER | Ошибки HTML |
| htmlWarningCount | INTEGER | Предупреждения HTML |
| htmlValidationMessages | JSON | Сообщения валидации |
| htmlValidationFailed | INTEGER | Ошибка валидации |
| htmlValidationError | TEXT | Текст ошибки |
| extendedChecks | JSON | Расширенные проверки |
| wcagLevel | TEXT | Уровень WCAG |

---

## Data layer — хранилище

### Storage

Класс работы с базой данных SQLite.

| Метод | Назначение |
|-------|------------|
| getChecks() | Получение всей истории |
| getCheck(id) | Получение конкретной проверки |
| insertCheck(check) | Сохранение результата |
| deleteCheck(id) | Удаление проверки |

---

## Shared — типы данных

### ViolationDetail

Нарушение доступности axe-core.

| Поле | Тип | Назначение |
|------|-----|------------|
| id | string | Идентификатор правила |
| impact | 'critical' \| 'serious' \| 'moderate' \| 'minor' | Критичность |
| description | string | Описание нарушения |
| help | string | Рекомендация по исправлению |
| helpUrl | string | Ссылка на документацию |
| tags | string[] | Теги WCAG |
| nodes | array | Проблемные элементы |

### ExtendedChecks

Результаты расширенных WCAG-проверок.

| Поле | Тип | Назначение |
|------|-----|------------|
| viewport | object | Проверка viewport |
| autoplayMedia | object | Автовоспроизведение |
| tabOrder | object | Порядок табуляции |
| focusVisible | object | Видимость фокуса |
| timing | object | Тайминг страницы |
| language | object | Атрибут lang |
| mediaAccessibility | object | Доступность медиа |
| iframes | object | Iframe без title |
| emptyLinks | object | Пустые ссылки |
| placeholderAsLabel | object | placeholder без label |
| tables | object | Таблицы без заголовков |
| redundantAria | object | Избыточные ARIA |

---

## Взаимодействие компонентов

```
API Request (POST /api/analyze)
↓
AccessibilityAnalyzer
├── Puppeteer.launch() → page.goto(url)
├── page.addScriptTag(axe-core)
├── axe.run() → violations, passes, incomplete
├── performExtendedChecks(page) → extendedChecks
└── validateHTML(html) → htmlValidationMessages
↓
AnalysisResult (JSON)
↓
API Response
↓
Frontend (React)
├── Home → ViolationsList
├── HTMLValidationList
├── ExtendedChecksList
├── ErrorsSummary
└── PassedChecksList
```

---

## Категории нарушений WCAG

| Категория | Правила axe-core |
|-----------|------------------|
| images | image-alt, object-alt, input-image-alt |
| contrast | color-contrast, color-contrast-enhanced |
| navigation | bypass, focus-order-semantics, tabindex, focus-visible |
| semantics | heading-order, landmark-one-main, region, page-has-heading-one |
| forms | label, button-name, form-field-multiple-labels |
| aria | aria-allowed-attr, aria-required-attr, aria-valid-attr-value, aria-roles |

---

## Уровни критичности WCAG

| Уровень | Описание | Требует немедленного исправления |
|---------|----------|----------------------------------|
| **Critical** | Критические проблемы доступности | Да |
| **Serious** | Серьёзные проблемы | Да |
| **Moderate** | Умеренные проблемы | По возможности |
| **Minor** | Незначительные проблемы | По желанию |

---

## Уровни соответствия WCAG

| Уровень | Описание |
|---------|----------|
| **A** | Базовый уровень, минимальные требования |
| **AA** | Рекомендуемый уровень для большинства сайтов |
| **AAA** | Высший уровень, расширенные требования |
| **fail** | Не соответствует базовому уровню A |

