export const axeTranslations: Record<string, { help: string; description: string }> = {
  "color-contrast": {
    help: "Элементы должны иметь достаточный цветовой контраст",
    description: "Убедитесь, что контрастность между текстом переднего плана и фоном соответствует требованиям WCAG AA (минимум 4.5:1 для обычного текста)"
  },
  "image-alt": {
    help: "Изображения должны иметь альтернативный текст",
    description: "Убедитесь, что элементы <img> имеют атрибут alt или role=\"presentation\" для декоративных изображений"
  },
  "label": {
    help: "Элементы форм должны иметь метки",
    description: "Убедитесь, что каждое поле формы имеет связанную метку <label>"
  },
  "button-name": {
    help: "Кнопки должны иметь различимый текст",
    description: "Убедитесь, что элементы <button> имеют текстовое содержимое или aria-label"
  },
  "link-name": {
    help: "Ссылки должны иметь различимый текст",
    description: "Убедитесь, что каждая ссылка имеет текст, описывающий её назначение"
  },
  "heading-order": {
    help: "Уровни заголовков должны увеличиваться последовательно",
    description: "Убедитесь, что порядок заголовков семантически правильный (h1, h2, h3 и т.д.)"
  },
  "html-has-lang": {
    help: "Элемент <html> должен иметь атрибут lang",
    description: "Убедитесь, что в элементе <html> указан атрибут lang с допустимым значением"
  },
  "page-has-heading-one": {
    help: "Страница должна содержать заголовок первого уровня",
    description: "Убедитесь, что страница содержит хотя бы один заголовок <h1>"
  },
  "landmark-one-main": {
    help: "Страница должна содержать один основной элемент-ориентир",
    description: "Убедитесь, что на странице есть один элемент <main> или role=\"main\""
  },
  "region": {
    help: "Весь контент страницы должен находиться в семантических областях",
    description: "Убедитесь, что весь контент страницы находится внутри семантических элементов-ориентиров"
  },
  "bypass": {
    help: "Страница должна иметь возможность пропустить повторяющиеся блоки",
    description: "Убедитесь, что есть ссылка для пропуска повторяющегося контента или правильная структура заголовков"
  },
  "focus-order-semantics": {
    help: "Элементы в порядке фокуса должны иметь соответствующую роль",
    description: "Убедитесь, что элементы, получающие фокус клавиатуры, имеют соответствующую семантическую роль"
  },
  "tabindex": {
    help: "Элементы не должны иметь tabindex больше нуля",
    description: "Убедитесь, что не используется положительное значение tabindex"
  },
  "aria-allowed-attr": {
    help: "Элементы должны использовать только разрешённые ARIA-атрибуты",
    description: "Убедитесь, что ARIA-атрибуты применяются только к элементам, которые их поддерживают"
  },
  "aria-required-attr": {
    help: "Элементы с ARIA-ролями должны иметь обязательные атрибуты",
    description: "Убедитесь, что элементы с ARIA-ролями имеют все обязательные ARIA-атрибуты"
  },
  "aria-valid-attr-value": {
    help: "ARIA-атрибуты должны иметь допустимые значения",
    description: "Убедитесь, что значения ARIA-атрибутов соответствуют требованиям спецификации"
  },
  "aria-roles": {
    help: "ARIA-роли должны быть допустимыми",
    description: "Убедитесь, что используемые значения role соответствуют спецификации ARIA"
  },
  "form-field-multiple-labels": {
    help: "Поля формы не должны иметь несколько меток",
    description: "Убедитесь, что каждое поле формы имеет только одну связанную метку"
  },
  "input-image-alt": {
    help: "Кнопки-изображения должны иметь альтернативный текст",
    description: "Убедитесь, что <input type=\"image\"> имеет атрибут alt"
  },
  "list": {
    help: "Элементы списка должны находиться внутри <ul>, <ol> или <dl>",
    description: "Убедитесь, что <li> используется только внутри <ul>, <ol> или <dl>"
  },
  "listitem": {
    help: "Элементы <li> должны находиться внутри <ul> или <ol>",
    description: "Убедитесь, что <li> используется только внутри <ul> или <ol>"
  },
  "meta-viewport": {
    help: "Масштабирование не должно быть запрещено",
    description: "Убедитесь, что meta viewport не запрещает масштабирование (user-scalable=no)"
  },
  "duplicate-id": {
    help: "Значения id должны быть уникальными",
    description: "Убедитесь, что каждый атрибут id имеет уникальное значение на странице"
  },
  "duplicate-id-active": {
    help: "Значения id активных элементов должны быть уникальными",
    description: "Убедитесь, что id активных/интерактивных элементов уникальны"
  },
  "meta-refresh": {
    help: "Страница не должна автоматически обновляться",
    description: "Убедитесь, что не используется meta refresh для автоматического обновления или перенаправления"
  },
  "select-name": {
    help: "Элементы select должны иметь доступное имя",
    description: "Убедитесь, что элементы <select> имеют связанную метку или aria-label"
  },
  "valid-lang": {
    help: "Атрибут lang должен иметь допустимое значение",
    description: "Убедитесь, что значение атрибута lang соответствует стандарту BCP 47"
  },
  "video-caption": {
    help: "Видео должно иметь субтитры",
    description: "Убедитесь, что <video> элементы имеют субтитры для аудиоконтента"
  },
  "audio-caption": {
    help: "Аудио должно иметь субтитры или текстовую альтернативу",
    description: "Убедитесь, что <audio> элементы имеют субтитры или текстовое описание"
  },
  "document-title": {
    help: "Документ должен иметь заголовок",
    description: "Убедитесь, что страница имеет элемент <title>"
  },
  "empty-heading": {
    help: "Заголовки не должны быть пустыми",
    description: "Убедитесь, что все заголовки содержат текст или доступное имя"
  },
  "frame-title": {
    help: "Фреймы должны иметь заголовок",
    description: "Убедитесь, что элементы <iframe> и <frame> имеют атрибут title"
  },
  "input-button-name": {
    help: "Кнопки ввода должны иметь различимый текст",
    description: "Убедитесь, что <input> кнопки имеют атрибут value или aria-label"
  },
};

export const failureTranslations: Record<string, string> = {
  "Element does not have text that is visible to screen readers": "Элемент не содержит текст, видимый программам чтения с экрана",
  "Element has no title attribute": "Элемент не имеет атрибута title",
  "aria-label attribute does not exist or is empty": "Атрибут aria-label отсутствует или пуст",
  "Element has insufficient color contrast": "Элемент имеет недостаточный цветовой контраст",
  "Fix any of the following": "Исправьте любое из следующего",
  "Fix all of the following": "Исправьте все следующее",
  "Element does not have an alt attribute": "Элемент не имеет атрибута alt",
  "aria-label attribute does not exist": "Атрибут aria-label отсутствует",
  "Form element does not have an implicit (wrapped) <label>": "Элемент формы не имеет неявной метки <label>",
  "Form element does not have an explicit <label>": "Элемент формы не имеет явной метки <label>",
  "aria-labelledby attribute does not exist": "Атрибут aria-labelledby отсутствует",
  "Element has no accessible name": "Элемент не имеет доступного имени",
  "There is hidden content on the page that was not analyzed": "На странице есть скрытый контент, который не был проанализирован",
};

export function translateViolationHelp(id: string, originalHelp: string): string {
  return axeTranslations[id]?.help || originalHelp;
}

export function translateViolationDescription(id: string, originalDescription: string): string {
  return axeTranslations[id]?.description || originalDescription;
}

export function translateFailureSummary(failureSummary: string): string {
  let translated = failureSummary;
  
  Object.entries(failureTranslations).forEach(([english, russian]) => {
    translated = translated.replace(new RegExp(english, 'gi'), russian);
  });
  
  return translated;
}

export const htmlValidationTranslations: Record<string, string> = {
  // Common patterns
  "Bad value": "Недопустимое значение",
  "Stray end tag": "Лишний закрывающий тег",
  "End tag": "Закрывающий тег",
  "Start tag": "Открывающий тег",
  "Element": "Элемент",
  "Attribute": "Атрибут",
  "not allowed": "не разрешён",
  "not allowed on element": "не разрешён для элемента",
  "is missing": "отсутствует",
  "must not be empty": "не должен быть пустым",
  "must not appear": "не должен появляться",
  "No space between attributes": "Нет пробела между атрибутами",
  "Duplicate attribute": "Дублирующийся атрибут",
  "Duplicate ID": "Дублирующийся ID",
  "Consider using": "Рассмотрите использование",
  "for attribute": "для атрибута",
  "in this context": "в этом контексте",
  "at this point": "в этом месте",
  
  // Specific messages
  "element must have an": "элемент должен иметь",
  "attribute is unnecessary": "атрибут не требуется",
  "when expecting an attribute name": "вместо имени атрибута",
  "in attribute name": "в имени атрибута",
  "Self-closing syntax": "Синтаксис самозакрывающегося тега",
  "on a non-void HTML element": "для неодиночного HTML элемента",
  "The element": "Элемент",
  "seen earlier": "встречался ранее",
  
  // Common error types
  "Bad character": "Недопустимый символ",
  "Illegal character": "Запрещённый символ",
  "Bad start tag": "Некорректный открывающий тег",
  "Bad end tag": "Некорректный закрывающий тег",
  "Unclosed element": "Незакрытый элемент",
  "Unexpected end tag": "Неожиданный закрывающий тег",
  "Missing end tag": "Отсутствует закрывающий тег",
  "Misplaced non-space characters": "Неправильно расположенные непробельные символы",
  
  // DOCTYPE and metadata
  "A document must not include both": "Документ не должен содержать одновременно",
  "A document must not include more than one": "Документ не должен содержать более одного",
  "element with": "элемент с",
  "attribute": "атрибут",
};

export function translateHTMLValidationMessage(message: string): string {
  let translated = message;
  
  Object.entries(htmlValidationTranslations).forEach(([english, russian]) => {
    const regex = new RegExp(english.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    translated = translated.replace(regex, russian);
  });
  
  return translated;
}
