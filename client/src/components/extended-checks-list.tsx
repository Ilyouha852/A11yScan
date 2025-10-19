import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Info, ZoomIn, PlayCircle, Focus, Clock, List } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { ExtendedChecks } from "@shared/schema";

interface ExtendedChecksListProps {
  checks: ExtendedChecks;
}

export function ExtendedChecksList({ checks }: ExtendedChecksListProps) {
  const totalIssues = 
    checks.viewport.issues.length +
    checks.autoplayMedia.issues.length +
    checks.tabOrder.issues.length +
    checks.focusVisible.issues.length +
    checks.timing.issues.length;

  if (totalIssues === 0 && !hasAnyChecks(checks)) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Расширенные проверки WCAG
              {totalIssues > 0 && (
                <Badge variant="destructive" data-testid="badge-extended-issues">
                  {totalIssues} {totalIssues === 1 ? 'проблема' : 'проблем'}
                </Badge>
              )}
              {totalIssues === 0 && (
                <Badge variant="default" className="bg-success" data-testid="badge-extended-success">
                  Все проверки пройдены
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Дополнительные автоматические проверки соответствия WCAG AA
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Viewport Zoom Check */}
          <AccordionItem value="viewport" data-testid="accordion-viewport">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                <span>Масштабирование (WCAG 1.4.4)</span>
                {checks.viewport.issues.length > 0 ? (
                  <Badge variant="destructive" className="ml-2">
                    {checks.viewport.issues.length}
                  </Badge>
                ) : (
                  <Badge variant="default" className="ml-2 bg-success">
                    <CheckCircle2 className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {checks.viewport.issues.length > 0 ? (
                  checks.viewport.issues.map((issue, idx) => (
                    <Alert key={idx} variant="destructive" data-testid={`alert-viewport-${idx}`}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <Alert data-testid="alert-viewport-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Viewport не блокирует масштабирование. Пользователи могут увеличивать страницу до 200%.
                    </AlertDescription>
                  </Alert>
                )}
                {checks.viewport.maxScale !== null && (
                  <p className="text-sm text-muted-foreground" data-testid="text-viewport-maxscale">
                    Максимальное масштабирование: {checks.viewport.maxScale}
                  </p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Autoplay Media Check */}
          <AccordionItem value="autoplay" data-testid="accordion-autoplay">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                <span>Автовоспроизведение медиа (WCAG 1.4.2, 2.2.2)</span>
                {checks.autoplayMedia.issues.length > 0 ? (
                  <Badge variant="destructive" className="ml-2">
                    {checks.autoplayMedia.issues.length}
                  </Badge>
                ) : (
                  <Badge variant="default" className="ml-2 bg-success">
                    <CheckCircle2 className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {checks.autoplayMedia.issues.length > 0 ? (
                  <>
                    {checks.autoplayMedia.issues.map((issue, idx) => (
                      <Alert key={idx} variant="destructive" data-testid={`alert-autoplay-${idx}`}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                    {checks.autoplayMedia.elements.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-2">Элементы с автовоспроизведением:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {checks.autoplayMedia.elements.map((el, idx) => (
                            <li key={idx} data-testid={`text-autoplay-element-${idx}`}>
                              {el.tag} - {el.hasControls ? 'с элементами управления' : 'без элементов управления'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert data-testid="alert-autoplay-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Автовоспроизведение медиа не обнаружено или правильно реализовано.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Tab Order Check */}
          <AccordionItem value="taborder" data-testid="accordion-taborder">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span>Порядок табуляции (WCAG 2.4.3)</span>
                {checks.tabOrder.issues.length > 0 ? (
                  <Badge variant="destructive" className="ml-2">
                    {checks.tabOrder.issues.length}
                  </Badge>
                ) : (
                  <Badge variant="default" className="ml-2 bg-success">
                    <CheckCircle2 className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {checks.tabOrder.issues.length > 0 ? (
                  <>
                    {checks.tabOrder.issues.map((issue, idx) => (
                      <Alert key={idx} variant="destructive" data-testid={`alert-taborder-${idx}`}>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                    {checks.tabOrder.elementsWithTabindex.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-2">
                          Элементы с положительным tabindex (максимум: {checks.tabOrder.maxTabindex}):
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {checks.tabOrder.elementsWithTabindex.slice(0, 10).map((el, idx) => (
                            <li key={idx} data-testid={`text-tabindex-element-${idx}`}>
                              {el.selector} (tabindex={el.tabindex})
                            </li>
                          ))}
                          {checks.tabOrder.elementsWithTabindex.length > 10 && (
                            <li className="text-muted-foreground">
                              ... и ещё {checks.tabOrder.elementsWithTabindex.length - 10} элементов
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert data-testid="alert-taborder-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Положительные значения tabindex не обнаружены. Порядок навигации следует структуре DOM.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Focus Visibility Check */}
          <AccordionItem value="focus" data-testid="accordion-focus">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Focus className="h-4 w-4" />
                <span>Видимость фокуса (WCAG 2.4.7)</span>
                {checks.focusVisible.issues.length > 0 ? (
                  <Badge variant="destructive" className="ml-2">
                    {checks.focusVisible.issues.length}
                  </Badge>
                ) : (
                  <Badge variant="default" className="ml-2 bg-success">
                    <CheckCircle2 className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {checks.focusVisible.issues.length > 0 ? (
                  checks.focusVisible.issues.map((issue, idx) => (
                    <Alert key={idx} variant="destructive" data-testid={`alert-focus-${idx}`}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <Alert data-testid="alert-focus-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Обнаружены CSS правила для :focus. Фокус должен быть видимым при навигации с клавиатуры.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Timing/Auto-refresh Check */}
          <AccordionItem value="timing" data-testid="accordion-timing">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Временные ограничения (WCAG 2.2.1)</span>
                {checks.timing.issues.length > 0 ? (
                  <Badge variant="destructive" className="ml-2">
                    {checks.timing.issues.length}
                  </Badge>
                ) : (
                  <Badge variant="default" className="ml-2 bg-success">
                    <CheckCircle2 className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 pt-2">
                {checks.timing.issues.length > 0 ? (
                  checks.timing.issues.map((issue, idx) => (
                    <Alert key={idx} variant="destructive" data-testid={`alert-timing-${idx}`}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))
                ) : (
                  <Alert data-testid="alert-timing-success">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Meta refresh не обнаружен. Страница не использует автоматическое обновление или перенаправление.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function hasAnyChecks(checks: ExtendedChecks): boolean {
  return (
    checks.viewport.maxScale !== null ||
    checks.autoplayMedia.elements.length > 0 ||
    checks.tabOrder.elementsWithTabindex.length > 0 ||
    checks.timing.refreshMeta
  );
}
