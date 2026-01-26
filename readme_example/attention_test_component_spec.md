# Спецификация компонентов проекта

## Общая идея

В этом разделе описаны классы приложения, их поля, методы и то, как они связаны между собой. Проект разделён на три слоя — Presentation, Domain и Data. Каждый слой решает свои задачи и не знает лишнего о деталях реализации остальных.

---

## Presentation layer

### TestViewModel

TestViewModel управляет состоянием теста и связывает пользовательский интерфейс с доменной логикой. Через него UI получает данные и отправляет действия пользователя.

#### Поля

| Поле | Тип | Назначение |
|------|-----|------------|
| testState | TestState | Текущее состояние теста |
| currentStimulus | Stimulus? | Активный стимул |
| reactionEvents | List<ReactionEvent> | Все реакции пользователя |
| result | TestResult? | Итог теста |

#### Методы

| Метод | Назначение |
|------|------------|
| startTest() | Запускает тест и переводит его в рабочее состояние |
| onStimulusShown(stimulus: Stimulus) | Регистрирует показ нового стимула |
| onUserClick() | Обрабатывает нажатие пользователя |
| finishTest() | Завершает тест и формирует результат |

---

## Domain layer — модели

### Stimulus

Описывает стимул, который показывается пользователю во время теста.

| Поле | Тип | Назначение |
|------|-----|------------|
| type | StimulusType | Форма стимула |
| color | Color | Цвет |
| timestamp | Long | Время появления на экране |

### ReactionEvent

Фиксирует реакцию пользователя на конкретный стимул.

| Поле | Тип | Назначение |
|------|-----|------------|
| stimulus | Stimulus | Стимул, на который была реакция |
| reactionTime | Long | Время реакции в миллисекундах |
| isCorrect | Boolean | Была ли реакция корректной |

### TestResult

Собранный результат одного прохождения теста.

| Поле | Тип | Назначение |
|------|-----|------------|
| rtMean | Double | Среднее время реакции |
| rtStd | Double | Стандартное отклонение |
| falsePositives | Int | Ложные реакции |
| falseNegatives | Int | Пропущенные стимулы |
| attentionScore | Double | Итоговая оценка |
| decision | RideDecision | Решение о поездке |

### AttentionScore

Используется для хранения рассчитанного значения внимания с учётом контекста.

| Поле | Тип | Назначение |
|------|-----|------------|
| value | Double | Числовая оценка |
| contextModifier | Double | Контекстный коэффициент |

---

## Domain layer — логика теста

### TestStateMachine

Управляет переходами между состояниями теста и не допускает некорректных переходов.

| Поле | Тип | Назначение |
|------|-----|------------|
| currentState | TestState | Текущее состояние |

| Метод | Назначение |
|------|------------|
| transitionTo(state: TestState) | Выполняет переход в новое состояние |
| canTransitionTo(state: TestState) | Проверяет допустимость перехода |

### StimulusGenerator

Отвечает за генерацию стимулов.

| Метод | Назначение |
|------|------------|
| generateStimulus() | Возвращает новый случайный стимул |
| isTargetStimulus(stimulus: Stimulus) | Проверяет, является ли стимул целевым |

### ReactionTracker

Хранит все реакции пользователя в рамках одного теста.

| Поле | Тип | Назначение |
|------|-----|------------|
| events | MutableList<ReactionEvent> | Реакции пользователя |

| Метод | Назначение |
|------|------------|
| recordStimulusShown(stimulus: Stimulus) | Фиксирует показ стимула |
| recordReaction(stimulus, reactionTime, isCorrect) | Фиксирует реакцию |

---

## Domain layer — метрики

### MetricsCalculator

Считает статистические показатели на основе реакций.

| Метод | Назначение |
|------|------------|
| calculate(events: List<ReactionEvent>) | Возвращает агрегированные метрики |

### ReactionMetrics

Результат расчёта метрик.

| Поле | Тип | Назначение |
|------|-----|------------|
| rtMean | Double | Среднее время реакции |
| rtStd | Double | Стандартное отклонение |
| falsePositives | Int | Ложные реакции |
| falseNegatives | Int | Пропуски |

---

## Domain layer — контекст

### Context

Описывает внешние условия в момент прохождения теста.

| Поле | Тип |
|------|-----|
| dayPeriod | DayPeriod |
| weatherCondition | WeatherCondition |

### ContextResolver

Определяет текущий контекст перед началом теста.

| Метод | Назначение |
|------|------------|
| resolveCurrentContext() | Возвращает актуальный контекст |

### ContextModifier

Преобразует контекст в числовой коэффициент риска.

| Метод | Назначение |
|------|------------|
| getModifier(context: Context) | Возвращает коэффициент |

---

## Domain layer — принятие решения

### DecisionEngine

Использует метрики и контекст для расчёта итогового скоринга и принятия решения.

| Метод | Назначение |
|------|------------|
| calculateScore(metrics, context) | Считает AttentionScore |
| makeDecision(metrics, context) | Возвращает RideDecision |

---

## Data layer

### TestResultEntity

Модель хранения результата в базе данных.

| Поле | Тип |
|------|-----|
| id | Long |
| timestamp | Long |
| rtMean | Double |
| rtStd | Double |
| falsePositives | Int |
| falseNegatives | Int |
| score | Double |
| decision | String |
| dayPeriod | String |
| weather | String |

### TestResultDao

DAO для работы с результатами тестов.

| Метод | Назначение |
|------|------------|
| insert(entity) | Сохраняет результат |
| selectAll() | Возвращает историю тестов |

### TestResultRepository

Прослойка между Domain и Data.

| Метод | Назначение |
|------|------------|
| insert(entity) | Сохраняет результат |
| getAll() | Возвращает историю |

### AppDatabase

Синглтон базы данных Room.

| Метод | Назначение |
|------|------------|
| getInstance(context) | Возвращает экземпляр БД |
| testResultDao() | Возвращает DAO |

---

## Утилиты

### TimeProvider

| Метод | Назначение |
|------|------------|
| getCurrentTime() | Возвращает текущее время |

### LocationProvider

| Метод | Назначение |
|------|------------|
| getCurrentLocation() | Возвращает координаты |

### WeatherService

| Метод | Назначение |
|------|------------|
| getWeather(location) | Возвращает погодные условия |

### NormalizationUtils

| Метод | Назначение |
|------|------------|
| normalize(value, min, max) | Нормализует значение |

---

## Взаимодействие компонентов

```
UI
↓
TestViewModel
↓
TestStateMachine
StimulusGenerator
ReactionTracker
ContextResolver
MetricsCalculator
DecisionEngine
↓
TestResultRepository
```

---

## Перечисления

StimulusType, Color, TestState, DayPeriod, WeatherCondition и RideDecision используются без дополнительной логики и описывают фиксированные наборы значений.

---

### Что изменилось

* Убраны формулировки вроде «центральный координатор» и «детальное описание».
* Сокращены описания до того уровня, который реально нужен разработчику.
* Упрощён язык: меньше абстракций, больше прямых действий.
* Текст стал ближе к тому, что читают при реализации и ревью, а не при защите идеи.

Если хочешь, следующим шагом можем:

* вычистить **диаграммы зависимостей под UML**,
* подготовить **JUnit / unit-test спецификацию по этим классам**,
* или адаптировать документ **под ВКР/диплом с формальным стилем**.

