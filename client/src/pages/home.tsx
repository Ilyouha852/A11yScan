import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, Loader2, Search, ExternalLink, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ViolationsList } from "@/components/violations-list";
import { HTMLValidationList } from "@/components/html-validation-list";
import { ExtendedChecksList } from "@/components/extended-checks-list";
import { ErrorsSummary } from "@/components/errors-summary";
import { PassedChecksList } from "@/components/passed-checks-list";
import { downloadTXTReport } from "@/lib/report-generator";
import type { AccessibilityCheck } from "@shared/schema";

export default function Home() {
  const [url, setUrl] = useState("");
  const [currentResult, setCurrentResult] = useState<AccessibilityCheck | null>(null);

  // Mutation for analyzing a URL
  const analyzeMutation = useMutation({
    mutationFn: async (urlToCheck: string) => {
      const response = await apiRequest("POST", "/api/analyze", { url: urlToCheck });
      const result = await response.json();
      return result as AccessibilityCheck;
    },
    onSuccess: (data) => {
      setCurrentResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      analyzeMutation.mutate(url.trim());
    }
  };

  const isAnalyzing = analyzeMutation.isPending;
  const checkResult = currentResult;
  const hasResults = checkResult && !isAnalyzing;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Проверка доступности</h1>
            <p className="text-sm text-muted-foreground">Анализ веб-сайтов на соответствие стандартам WCAG AA и валидация HTML-кода</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {/* URL Input Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Проверить сайт на доступность</CardTitle>
            <CardDescription>
              Введите URL веб-сайта для автоматической проверки соответствия стандартам WCAG AA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isAnalyzing}
                  required
                  className="text-base h-12"
                  data-testid="input-url"
                  aria-label="URL сайта для проверки"
                />
              </div>
              <Button
                type="submit"
                disabled={isAnalyzing || !url.trim()}
                className="h-12 px-8"
                data-testid="button-analyze"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Проверить
                  </>
                )}
              </Button>
            </form>

            {/* Example URLs */}
            <div className="mt-4 text-sm text-muted-foreground">
              <p className="mb-2">Примеры для тестирования:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUrl("https://www.w3.org")}
                  disabled={isAnalyzing}
                  data-testid="button-example-w3"
                >
                  W3C
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUrl("https://www.wikipedia.org")}
                  disabled={isAnalyzing}
                  data-testid="button-example-wikipedia"
                >
                  Wikipedia
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isAnalyzing && (
          <Card className="mb-8">
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="text-center">
                  <p className="text-lg font-semibold mb-2">Анализ веб-сайта...</p>
                  <p className="text-sm text-muted-foreground">
                    Загружаем страницу и проверяем соответствие стандартам WCAG AA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {analyzeMutation.isError && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ошибка при анализе сайта. Проверьте URL и попробуйте снова.
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {hasResults && (
          <>
            {/* WCAG Conformance Level */}
            <div className="mb-8">
              <Card className={`border-2 ${
                checkResult.wcagLevel === 'AAA' ? 'border-green-500 bg-green-50 dark:bg-green-950' :
                checkResult.wcagLevel === 'AA' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' :
                checkResult.wcagLevel === 'A' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' :
                'border-red-500 bg-red-50 dark:bg-red-950'
              }`} data-testid="card-wcag-level">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardDescription className="text-base mb-2">Уровень соответствия WCAG 2.2</CardDescription>
                      <CardTitle className={`text-5xl font-bold ${
                        checkResult.wcagLevel === 'AAA' ? 'text-green-700 dark:text-green-300' :
                        checkResult.wcagLevel === 'AA' ? 'text-blue-700 dark:text-blue-300' :
                        checkResult.wcagLevel === 'A' ? 'text-yellow-700 dark:text-yellow-300' :
                        'text-red-700 dark:text-red-300'
                      }`}>
                        {checkResult.wcagLevel === 'fail' ? 'Не соответствует' : `Уровень ${checkResult.wcagLevel}`}
                      </CardTitle>
                      <p className={`text-sm mt-2 ${
                        checkResult.wcagLevel === 'AAA' ? 'text-green-600 dark:text-green-400' :
                        checkResult.wcagLevel === 'AA' ? 'text-blue-600 dark:text-blue-400' :
                        checkResult.wcagLevel === 'A' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {checkResult.wcagLevel === 'AAA' && 'Отличный результат! Сайт соответствует самому высокому уровню доступности WCAG 2.2 AAA'}
                        {checkResult.wcagLevel === 'AA' && 'Хороший результат! Сайт соответствует уровню WCAG 2.2 AA (рекомендуемый стандарт)'}
                        {checkResult.wcagLevel === 'A' && 'Сайт соответствует базовому уровню WCAG 2.2 A, но есть нарушения уровня AA'}
                        {checkResult.wcagLevel === 'fail' && 'Обнаружены критические нарушения базового уровня WCAG 2.2 A. Требуется исправление'}
                      </p>
                    </div>
                    <div className={`text-8xl font-black opacity-20 ${
                      checkResult.wcagLevel === 'AAA' ? 'text-green-700 dark:text-green-300' :
                      checkResult.wcagLevel === 'AA' ? 'text-blue-700 dark:text-blue-300' :
                      checkResult.wcagLevel === 'A' ? 'text-yellow-700 dark:text-yellow-300' :
                      'text-red-700 dark:text-red-300'
                    }`}>
                      {checkResult.wcagLevel === 'fail' ? '✗' : checkResult.wcagLevel}
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            {/* Summary Statistics - Accessibility */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Статистика доступности</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card data-testid="card-total-violations">
                  <CardHeader className="pb-2">
                    <CardDescription>Всего нарушений доступности</CardDescription>
                    <CardTitle className="text-3xl font-bold text-foreground">
                      {checkResult.totalViolations}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card 
                  data-testid="card-critical-count"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    const element = document.getElementById('accessibility-critical-section');
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription>Критические (доступность)</CardDescription>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-destructive">
                      {checkResult.criticalCount + checkResult.seriousCount}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card 
                  data-testid="card-warnings-count"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    const element = document.getElementById('accessibility-warnings-section');
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription>Предупреждения (доступность)</CardDescription>
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-warning">
                      {checkResult.moderateCount + checkResult.minorCount}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card 
                  data-testid="card-passed-count"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    const element = document.getElementById('passed-section');
                    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription>Пройдено проверок</CardDescription>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-success">
                      {checkResult.passedCount}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Summary Statistics - HTML Validation */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Статистика HTML-валидации</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card data-testid="card-html-total">
                  <CardHeader className="pb-2">
                    <CardDescription>Всего проблем HTML</CardDescription>
                    <CardTitle className="text-3xl font-bold text-foreground">
                      {(checkResult.htmlErrorCount || 0) + (checkResult.htmlWarningCount || 0)}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card 
                  data-testid="card-html-errors"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    const element = document.getElementById('html-validation-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      // Открываем секцию HTML-валидации
                      const collapsibleTrigger = element.querySelector('[data-testid="button-toggle-html-validation"]') as HTMLElement;
                      if (collapsibleTrigger && !collapsibleTrigger.closest('[data-state="open"]')) {
                        setTimeout(() => collapsibleTrigger.click(), 300);
                      }
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription>HTML ошибки</CardDescription>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-destructive">
                      {checkResult.htmlErrorCount || 0}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card 
                  data-testid="card-html-warnings"
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    const element = document.getElementById('html-validation-section');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      // Открываем секцию HTML-валидации
                      const collapsibleTrigger = element.querySelector('[data-testid="button-toggle-html-validation"]') as HTMLElement;
                      if (collapsibleTrigger && !collapsibleTrigger.closest('[data-state="open"]')) {
                        setTimeout(() => collapsibleTrigger.click(), 300);
                      }
                    }
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription>HTML предупреждения</CardDescription>
                      <AlertTriangle className="h-4 w-4 text-warning" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-warning">
                      {checkResult.htmlWarningCount || 0}
                    </CardTitle>
                  </CardHeader>
                </Card>

                <Card data-testid="card-html-valid">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardDescription>HTML валидно</CardDescription>
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <CardTitle className="text-3xl font-bold text-success">
                      {(checkResult.htmlErrorCount || 0) === 0 && (checkResult.htmlWarningCount || 0) === 0 ? 1 : 0}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            </div>

            {/* Download Report Button */}
            {hasResults && (
              <Card className="mb-8">
                <CardContent className="pt-6">
                  <Button
                    onClick={() => downloadTXTReport(checkResult)}
                    variant="outline"
                    className="w-full"
                    data-testid="button-download-report"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Скачать отчет в формате TXT
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Page Info */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg mb-2">
                      {checkResult.pageTitle || "Без заголовка"}
                    </CardTitle>
                    <CardDescription className="break-all font-mono text-xs">
                      {checkResult.testedUrl || checkResult.url}
                    </CardDescription>
                  </div>
                  <a
                    href={checkResult.testedUrl || checkResult.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0"
                  >
                    <Button variant="outline" size="sm" data-testid="button-visit-site">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Открыть
                    </Button>
                  </a>
                </div>
              </CardHeader>
            </Card>

            {/* Errors Summary */}
            {(checkResult.totalViolations > 0 || checkResult.htmlErrorCount > 0) && (
              <ErrorsSummary 
                violations={checkResult.violations as any}
                htmlErrorCount={checkResult.htmlErrorCount || 0}
                htmlWarningCount={checkResult.htmlWarningCount || 0}
                extendedChecks={checkResult.extendedChecks as any}
              />
            )}

            {/* Violations List */}
            <div id="accessibility-critical-section" className="scroll-mt-4">
              {checkResult.totalViolations > 0 ? (
                <ViolationsList violations={checkResult.violations as any} />
              ) : (
                <Card className="mb-8">
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <CheckCircle2 className="h-16 w-16 text-success" />
                      <div className="text-center">
                        <p className="text-xl font-semibold mb-2">Отличная работа!</p>
                        <p className="text-muted-foreground">
                          Не обнаружено нарушений стандартов доступности WCAG AA
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* HTML Validation Results */}
            <div id="html-validation-section" className="scroll-mt-4 mb-8">
              {((checkResult.htmlValidationMessages && Array.isArray(checkResult.htmlValidationMessages) && checkResult.htmlValidationMessages.length > 0) || checkResult.htmlValidationFailed) && (
                <HTMLValidationList 
                  messages={checkResult.htmlValidationMessages as any}
                  errorCount={checkResult.htmlErrorCount || 0}
                  warningCount={checkResult.htmlWarningCount || 0}
                  validationFailed={!!checkResult.htmlValidationFailed}
                  validationError={checkResult.htmlValidationError || undefined}
                />
              )}
            </div>

            {/* Extended Checks - can also be warnings */}
            {checkResult.extendedChecks && (
              <div id="accessibility-warnings-section" className="scroll-mt-4 mb-8">
                <ExtendedChecksList checks={checkResult.extendedChecks as any} />
              </div>
            )}

            {/* Passed Checks */}
            {checkResult.passes && Array.isArray(checkResult.passes) && checkResult.passes.length > 0 && (
              <div id="passed-section" className="scroll-mt-4">
                <PassedChecksList passes={checkResult.passes as any} />
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!hasResults && !isAnalyzing && !analyzeMutation.isError && (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-muted p-6">
                  <Search className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-semibold mb-2">Начните проверку</p>
                  <p className="text-muted-foreground max-w-md">
                    Введите URL веб-сайта выше, чтобы проверить его на соответствие стандартам доступности WCAG AA
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
