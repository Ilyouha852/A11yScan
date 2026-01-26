# Архитектура проекта

## Общий обзор

Приложение построено по принципам Clean Architecture и разделено на три слоя. Каждый слой решает свою задачу и не лезет в чужую ответственность.

| Слой | За что отвечает | Примеры компонентов |
|------|------------------|---------------------|
| Data layer | Работа с локальными данными | AppDatabase, TestResultDao, TestResultEntity |
| Domain layer | Логика теста и правила принятия решений | TestStateMachine, MetricsCalculator, DecisionEngine |
| Presentation layer | Пользовательский интерфейс и взаимодействие | TestViewModel, TestScreen, InstructionScreen |

---

## Архитектурный подход

Архитектура клиентская, без собственного backend.

- Вся логика и вычисления выполняются на устройстве пользователя  
- Интернет нужен только для получения контекста (время и погодные условия)  
- Серверная часть для обработки теста не используется  

Такое решение упрощает интеграцию и снижает требования к инфраструктуре.

---

## Технологический стек

| Компонент | Используемая технология |
|-----------|-------------------------|
| Язык | Kotlin |
| UI | Jetpack Compose |
| Архитектура | Clean Architecture + MVVM |
| Хранилище | SQLite (Room) |
| Геолокация | Fused Location Provider |
| Погода | Open-Meteo API |

---

## Иерархия пакетов

```
com.attentiontest.app
├── ui
│   ├── TestScreen
│   ├── InstructionScreen
│   ├── ResultScreen
│   └── components
│       ├── StimulusView
│       ├── CountdownTimer
│       └── ProgressIndicator
├── viewmodel
│   └── TestViewModel
├── domain
│   ├── model
│   │   ├── Stimulus
│   │   ├── ReactionEvent
│   │   ├── TestResult
│   │   └── AttentionScore
│   ├── test
│   │   ├── TestState
│   │   ├── TestStateMachine
│   │   ├── StimulusGenerator
│   │   └── ReactionTracker
│   ├── metrics
│   │   ├── MetricsCalculator
│   │   └── ReactionMetrics
│   ├── context
│   │   ├── Context
│   │   ├── ContextResolver
│   │   ├── DayPeriod
│   │   └── WeatherCondition
│   └── decision
│       ├── DecisionEngine
│       └── RideDecision
├── data
│   ├── local
│   │   ├── AppDatabase
│   │   ├── TestResultDao
│   │   └── TestResultEntity
│   └── repository
│       └── TestResultRepository
└── util
    ├── TimeProvider
    ├── LocationProvider
    ├── WeatherService
    └── NormalizationUtils
```

---

## Состояния теста

Тест реализован как конечный автомат с фиксированными переходами.

```
┌─────────┐    startTest()     ┌───────────────┐    timeout / finish    ┌──────────┐
│  INIT   │ ─────────────────► │ INSTRUCTION   │ ────────────────────► │ RUNNING  │
└─────────┘                    └───────────────┘                        └────┬─────┘
                                                                               │
                                                                               │ finishTest()
                                                                               ▼
                                                                        ┌───────────┐
                                                                        │ FINISHED  │
                                                                        └─────┬─────┘
                                                                              │
                                                                              ▼
                                                                        ┌──────────┐
                                                                        │  RESULT  │
                                                                        └──────────┘
```

Такой подход упрощает отладку и исключает неявные переходы между экранами.

---

## Поток данных

```
Пользователь запускает тест
│
▼
TestViewModel
│
▼
StimulusGenerator → генерирует стимул
│
▼
ReactionTracker ← фиксирует реакцию пользователя
│
▼
MetricsCalculator → рассчитывает метрики
│
▼
DecisionEngine → принимает решение
│
▼
TestResult → сохраняется через TestResultRepository
```

---

## Основные компоненты

### Presentation layer

UI отвечает только за отображение состояния и передачу пользовательских действий во ViewModel. Бизнес-логики здесь нет.

| Компонент | Назначение |
|-----------|------------|
| TestScreen | Экран прохождения теста |
| InstructionScreen | Экран инструкции |
| ResultScreen | Экран результата |
| StimulusView | Отрисовка стимула |
| CountdownTimer | Таймер |
| ProgressIndicator | Индикатор прогресса |

---

### ViewModel

**TestViewModel** управляет состоянием теста и связывает UI с доменной логикой.

| Поле | Тип | Назначение |
|------|-----|------------|
| testState | StateFlow<TestState> | Текущее состояние теста |
| currentStimulus | StateFlow<Stimulus?> | Активный стимул |
| reactionEvents | StateFlow<List<ReactionEvent>> | Зафиксированные реакции |
| result | StateFlow<TestResult?> | Итог теста |

---

### Domain layer

#### Модели

| Модель | Назначение |
|------|------------|
| Stimulus | Параметры стимула и время появления |
| ReactionEvent | Реакция пользователя |
| TestResult | Итог теста |
| ReactionMetrics | Расчётные метрики |

#### Логика теста

| Компонент | Что делает |
|-----------|-----------|
| TestStateMachine | Управляет состояниями теста |
| StimulusGenerator | Генерирует стимулы |
| ReactionTracker | Фиксирует реакции и задержки |

#### Контекст

| Компонент | Назначение |
|-----------|------------|
| ContextResolver | Определяет внешний контекст |
| ContextModifier | Рассчитывает коэффициент риска |

#### Принятие решения

| Компонент | Назначение |
|-----------|------------|
| DecisionEngine | Считает AttentionScore и возвращает решение |

---

## Контекстная модель

### Период суток

| Период | Значение |
|--------|----------|
| День | DAY |
| Вечер | EVENING |
| Ночь | NIGHT |

### Погода

| Условие | Значение |
|---------|----------|
| Нормальная | NORMAL |
| Дождь | RAIN |
| Снег | SNOW |
| Туман | FOG |

### Модификатор риска

| Условия | Коэффициент |
|--------|-------------|
| День, ясно | 1.00 |
| Вечер | 0.95 |
| Ночь | 0.90 |
| Дождь | 0.90 |
| Ночь + дождь | 0.85 |
| Туман или снег | 0.80 |

---

## Расчёт скоринга

```
BaseScore =
0.5 × norm(RT_mean) +
0.3 × (1 − norm(RT_std)) +
0.2 × (1 − ErrorRate)

AttentionScore = BaseScore × ContextModifier
```

### Пороги

| Условия | Минимальный AttentionScore |
|--------|----------------------------|
| День | 0.70 |
| Вечер | 0.75 |
| Ночь или плохая погода | 0.80 |

### Результат

| Решение | Значение |
|--------|----------|
| Можно ехать | CAN_RIDE |
| Поездку лучше отложить | SHOULD_NOT_RIDE |

---

## Хранилище данных

### Таблица TestResult

| Поле | Тип | Описание |
|------|-----|----------|
| id | Long | Первичный ключ |
| timestamp | Long | Время прохождения теста |
| rtMean | Double | Среднее время реакции |
| rtStd | Double | Стандартное отклонение |
| falsePositives | Int | Ложные реакции |
| falseNegatives | Int | Пропущенные стимулы |
| score | Double | AttentionScore |
| decision | String | Решение |
| dayPeriod | String | Период суток |
| weather | String | Погода |

---

## Интеграция с приложением аренды

```json
{
  "attention_score": 0.78,
  "decision": "CAN_RIDE",
  "context": {
    "day_period": "EVENING",
    "weather": "NORMAL"
  }
}
```

---

## Архитектурные принципы

1. Зависимости направлены от UI и Data к Domain
2. Каждый класс решает одну задачу
3. Состояние хранится в StateFlow
4. UI реагирует на изменения состояния
5. Логика теста оформлена как явный конечный автомат

