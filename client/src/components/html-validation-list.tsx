import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Info, Code } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface HTMLValidationMessage {
  type: 'error' | 'warning' | 'info';
  message: string;
  extract: string;
  firstLine: number;
  lastLine: number;
  firstColumn: number;
  lastColumn: number;
}

interface HTMLValidationListProps {
  messages: HTMLValidationMessage[];
  errorCount: number;
  warningCount: number;
}

export function HTMLValidationList({ messages, errorCount, warningCount }: HTMLValidationListProps) {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Code className="h-5 w-5" />
              HTML-валидация (критерий 4.1.1 WCAG)
            </CardTitle>
            <CardDescription className="mt-2">
              {errorCount === 0 && warningCount === 0 ? (
                "HTML-код соответствует стандартам W3C"
              ) : (
                `Обнаружено ${errorCount} ошибок и ${warningCount} предупреждений в HTML-коде`
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {messages.map((msg, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-start gap-3 text-left w-full pr-4">
                  <div className="mt-1">{getIcon(msg.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getVariant(msg.type)} className="text-xs">
                        {msg.type === 'error' ? 'Ошибка' : msg.type === 'warning' ? 'Предупреждение' : 'Инфо'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Строка {msg.firstLine}:{msg.firstColumn}
                      </span>
                    </div>
                    <p className="text-sm font-medium break-words">{msg.message}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-10 pt-2">
                  {msg.extract && (
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Фрагмент кода:</p>
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-all">
                        <code>{msg.extract}</code>
                      </pre>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>Позиция: строки {msg.firstLine}-{msg.lastLine}, столбцы {msg.firstColumn}-{msg.lastColumn}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
