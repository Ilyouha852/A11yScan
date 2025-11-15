import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle2, ChevronDown } from "lucide-react";

interface PassedCheck {
  id: string;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
}

interface PassedChecksListProps {
  passes: PassedCheck[];
}

export function PassedChecksList({ passes }: PassedChecksListProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!passes || passes.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-100 dark:bg-green-900 p-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Успешно пройденные проверки</CardTitle>
                  <CardDescription>{passes.length} проверок соответствуют стандартам WCAG AA</CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="sm" data-testid="button-toggle-passed">
                <ChevronDown 
                  className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                />
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-3">
              {passes.map((pass, index) => (
                <div 
                  key={`${pass.id}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
                  data-testid={`passed-check-${index}`}
                >
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">
                      {pass.help}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {pass.description}
                    </p>
                    {pass.tags && pass.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {pass.tags.slice(0, 3).map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="text-xs border-green-300 dark:border-green-700 text-green-700 dark:text-green-300"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
