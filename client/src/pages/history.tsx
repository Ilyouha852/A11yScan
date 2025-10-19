import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle2, Calendar, ExternalLink, History } from "lucide-react";
import { Link } from "wouter";
import type { AccessibilityCheck } from "@shared/schema";

export default function HistoryPage() {
  const { data: history, isLoading } = useQuery<AccessibilityCheck[]>({
    queryKey: ["/api/history"],
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-home">
                ← Назад
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">История проверок</h1>
              <p className="text-sm text-muted-foreground">Просмотр всех выполненных проверок</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8 md:py-12">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="py-6">
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !history || history.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full bg-muted p-6">
                  <History className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xl font-semibold mb-2">История пуста</p>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Вы еще не выполнили ни одной проверки доступности
                  </p>
                  <Link href="/">
                    <Button data-testid="button-start-checking">Начать проверку</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((check) => (
              <Card key={check.id} className="hover-elevate" data-testid={`history-item-${check.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2">
                        {check.pageTitle || "Без заголовка"}
                      </CardTitle>
                      <CardDescription className="break-all font-mono text-xs mb-3">
                        {check.testedUrl || check.url}
                      </CardDescription>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(check.checkedAt as any)}</span>
                      </div>
                    </div>
                    <a
                      href={check.testedUrl || check.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="outline" size="sm" data-testid="button-visit-checked-site">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Открыть
                      </Button>
                    </a>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Statistics */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Всего нарушений:</span>
                      <Badge variant="outline" data-testid="badge-total-violations">
                        {check.totalViolations}
                      </Badge>
                    </div>

                    {check.criticalCount + check.seriousCount > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">
                          {check.criticalCount + check.seriousCount} критических
                        </span>
                      </div>
                    )}

                    {check.moderateCount + check.minorCount > 0 && (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium text-warning">
                          {check.moderateCount + check.minorCount} предупреждений
                        </span>
                      </div>
                    )}

                    {check.passedCount > 0 && (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">
                          {check.passedCount} пройдено
                        </span>
                      </div>
                    )}

                    {check.totalViolations === 0 && (
                      <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Без нарушений
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
