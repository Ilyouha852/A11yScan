import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Lightbulb, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp,
  Image,
  Palette,
  Keyboard,
  List as ListIcon,
  FileText,
  Code2
} from "lucide-react";
import type { ViolationDetail, ExtendedChecks } from "@shared/schema";

interface ErrorsSummaryProps {
  violations: ViolationDetail[];
  htmlErrorCount: number;
  htmlWarningCount: number;
  extendedChecks?: ExtendedChecks;
}

interface CategoryAnalysis {
  name: string;
  icon: any;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendations: string[];
}

function analyzeViolations(violations: ViolationDetail[]): CategoryAnalysis[] {
  const categories: Record<string, CategoryAnalysis> = {};
  
  const categoryConfig = {
    images: {
      name: "Изображения и альтернативный текст",
      icon: Image,
      keywords: ["image", "alt", "img"],
      recommendations: [
        "Добавьте атрибут alt ко всем изображениям с описанием их содержания",
        "Для декоративных изображений используйте пустой alt=\"\" или role=\"presentation\"",
        "Убедитесь, что текст в alt кратко и точно описывает изображение"
      ]
    },
    contrast: {
      name: "Цветовой контраст",
      icon: Palette,
      keywords: ["color", "contrast"],
      recommendations: [
        "Увеличьте контраст между текстом и фоном до минимум 4.5:1 для обычного текста",
        "Для крупного текста (18pt+ или 14pt+ жирный) требуется контраст минимум 3:1",
        "Используйте инструменты для проверки контраста при выборе цветов"
      ]
    },
    navigation: {
      name: "Навигация и фокус",
      icon: Keyboard,
      keywords: ["focus", "tabindex", "bypass", "keyboard"],
      recommendations: [
        "Обеспечьте видимые индикаторы фокуса для всех интерактивных элементов",
        "Избегайте использования положительных значений tabindex",
        "Добавьте ссылку 'Перейти к содержимому' в начале страницы",
        "Проверьте логический порядок навигации с клавиатуры"
      ]
    },
    semantics: {
      name: "Семантика и структура",
      icon: ListIcon,
      keywords: ["heading", "landmark", "region", "list", "html-has-lang"],
      recommendations: [
        "Используйте правильную иерархию заголовков (h1, h2, h3...)",
        "Добавьте семантические элементы HTML5 (header, main, nav, footer)",
        "Убедитесь, что страница имеет атрибут lang в теге <html>",
        "Используйте списки (<ul>, <ol>) для группировки связанных элементов"
      ]
    },
    forms: {
      name: "Формы и элементы управления",
      icon: FileText,
      keywords: ["label", "form", "input", "button-name", "select"],
      recommendations: [
        "Свяжите каждое поле формы с меткой <label>",
        "Добавьте описательный текст или aria-label для всех кнопок",
        "Используйте placeholder только как подсказку, не заменяйте им метку",
        "Группируйте связанные поля с помощью <fieldset> и <legend>"
      ]
    },
    aria: {
      name: "ARIA атрибуты",
      icon: Code2,
      keywords: ["aria"],
      recommendations: [
        "Используйте нативные HTML элементы вместо ARIA, где возможно",
        "Убедитесь, что ARIA атрибуты применяются корректно",
        "Проверьте, что все обязательные ARIA атрибуты присутствуют",
        "Избегайте конфликтов между ARIA и нативной семантикой HTML"
      ]
    }
  };

  violations.forEach((violation) => {
    for (const [key, config] of Object.entries(categoryConfig)) {
      if (config.keywords.some(keyword => violation.id.includes(keyword))) {
        if (!categories[key]) {
          categories[key] = {
            name: config.name,
            icon: config.icon,
            count: 0,
            severity: 'low',
            recommendations: config.recommendations
          };
        }
        categories[key].count++;
        
        if (violation.impact === 'critical' || violation.impact === 'serious') {
          categories[key].severity = 'critical';
        } else if (violation.impact === 'moderate' && categories[key].severity !== 'critical') {
          categories[key].severity = 'high';
        }
        break;
      }
    }
  });

  return Object.values(categories).sort((a, b) => b.count - a.count);
}

function getOverallRecommendations(
  violations: ViolationDetail[], 
  htmlErrorCount: number,
  extendedChecks?: ExtendedChecks
): string[] {
  const recommendations: string[] = [];
  
  const criticalCount = violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length;
  
  if (criticalCount > 0) {
    recommendations.push("🔴 Приоритет 1: Исправьте критические и серьёзные ошибки - они существенно влияют на доступность сайта");
  }
  
  if (htmlErrorCount > 0) {
    recommendations.push("📝 Исправьте ошибки HTML валидации - невалидный HTML может вызывать проблемы с программами чтения с экрана");
  }
  
  if (extendedChecks?.viewport.blocksZoom) {
    recommendations.push("🔍 Разрешите масштабирование страницы - это критично для пользователей с ограниченным зрением");
  }
  
  if (extendedChecks?.autoplayMedia.hasAutoplayAudio || extendedChecks?.autoplayMedia.hasAutoplayVideo) {
    recommendations.push("🔇 Удалите автовоспроизведение медиа или добавьте элементы управления");
  }
  
  if (violations.length > 20) {
    recommendations.push("⚡ Рассмотрите возможность использования библиотек UI компонентов с встроенной поддержкой доступности");
  }
  
  recommendations.push("✅ После исправления проведите тестирование с программами чтения с экрана (NVDA, JAWS)");
  recommendations.push("👥 Привлеките реальных пользователей с ограниченными возможностями для тестирования");
  
  return recommendations;
}

export function ErrorsSummary({ violations, htmlErrorCount, htmlWarningCount, extendedChecks }: ErrorsSummaryProps) {
  if (violations.length === 0 && htmlErrorCount === 0) {
    return null;
  }

  const categoryAnalysis = analyzeViolations(violations);
  const overallRecommendations = getOverallRecommendations(violations, htmlErrorCount, extendedChecks);
  
  const totalIssues = violations.length + htmlErrorCount;
  const criticalIssues = violations.filter(v => v.impact === 'critical' || v.impact === 'serious').length;

  return (
    <div className="space-y-6 mb-8">
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Общий анализ и рекомендации</CardTitle>
              <CardDescription>
                Автоматический анализ обнаруженных проблем и советы по их устранению
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Status */}
          <Alert className={criticalIssues > 0 ? "border-destructive/50 bg-destructive/5" : "border-warning/50 bg-warning/5"}>
            <AlertCircle className={`h-4 w-4 ${criticalIssues > 0 ? "text-destructive" : "text-warning"}`} />
            <AlertDescription>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">Обнаружено {totalIssues} проблем:</span>
                {criticalIssues > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {criticalIssues} критических
                  </Badge>
                )}
                {violations.length - criticalIssues > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {violations.length - criticalIssues} других нарушений доступности
                  </Badge>
                )}
                {htmlErrorCount > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {htmlErrorCount} ошибок HTML
                  </Badge>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Category Breakdown */}
          {categoryAnalysis.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Проблемы по категориям
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryAnalysis.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={category.name}
                      className="rounded-lg border p-3 bg-muted/30"
                      data-testid={`summary-category-${category.name}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{category.count}</span>
                        <Badge 
                          variant={category.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {category.severity === 'critical' ? 'Высокий' : 'Средний'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed Recommendations by Category */}
          {categoryAnalysis.slice(0, 3).map((category) => (
            <div key={category.name} className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <category.icon className="h-4 w-4" />
                {category.name} ({category.count} проблем)
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {category.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Overall Recommendations */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              Общие рекомендации
            </h3>
            <ul className="space-y-2 text-sm">
              {overallRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Resource Links */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold mb-2">📚 Полезные ресурсы</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• <a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Руководство WCAG 2.1</a></li>
              <li>• <a href="https://webaim.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WebAIM - ресурсы по доступности</a></li>
              <li>• <a href="https://www.nvaccess.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">NVDA - бесплатная программа чтения с экрана</a></li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
