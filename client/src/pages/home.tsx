import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, Loader2, Search, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ViolationsList } from "@/components/violations-list";
import type { AccessibilityCheck } from "@shared/schema";

export default function Home() {
  const [url, setUrl] = useState("");
  const [lastCheckId, setLastCheckId] = useState<string | null>(null);

  // Fetch the latest check result
  const { data: checkResult, isLoading: isLoadingResult } = useQuery<AccessibilityCheck>({
    queryKey: ["/api/checks", lastCheckId],
    queryFn: async () => {
      if (!lastCheckId) throw new Error("No check ID");
      const response = await fetch(`/api/checks/${lastCheckId}`);
      if (!response.ok) throw new Error("Failed to fetch check");
      return response.json();
    },
    enabled: !!lastCheckId,
  });

  // Mutation for analyzing a URL
  const analyzeMutation = useMutation({
    mutationFn: async (urlToCheck: string) => {
      const result = await apiRequest<AccessibilityCheck>("POST", "/api/analyze", { url: urlToCheck });
      return result;
    },
    onSuccess: (data) => {
      setLastCheckId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/checks"] });
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
  const hasResults = checkResult && !isAnalyzing;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Проверка доступности</h1>
            <p className="text-sm text-muted-foreground">Аудит соответствия WCAG AA</p>
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
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card data-testid="card-total-violations">
                <CardHeader className="pb-2">
                  <CardDescription>Всего нарушений</CardDescription>
                  <CardTitle className="text-3xl font-bold text-foreground">
                    {checkResult.totalViolations}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card data-testid="card-critical-count">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Критические</CardDescription>
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-destructive">
                    {checkResult.criticalCount + checkResult.seriousCount}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card data-testid="card-warnings-count">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Предупреждения</CardDescription>
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-warning">
                    {checkResult.moderateCount + checkResult.minorCount}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card data-testid="card-passed-count">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription>Пройдено</CardDescription>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-success">
                    {checkResult.passedCount}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

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

            {/* Violations List */}
            {checkResult.totalViolations > 0 ? (
              <ViolationsList violations={checkResult.violations as any} />
            ) : (
              <Card>
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
