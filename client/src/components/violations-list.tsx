import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Image,
  Palette,
  Keyboard,
  List,
  FileText,
  Code2,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import type { ViolationDetail } from "@shared/schema";
import { translateViolationHelp, translateViolationDescription, translateFailureSummary } from "@/lib/translations";

interface ViolationsListProps {
  violations: ViolationDetail[];
}

const impactColors = {
  critical: "destructive",
  serious: "destructive",
  moderate: "warning",
  minor: "secondary",
} as const;

const impactIcons = {
  critical: AlertCircle,
  serious: AlertCircle,
  moderate: AlertTriangle,
  minor: Info,
};

const categoryIcons = {
  images: Image,
  contrast: Palette,
  navigation: Keyboard,
  semantics: List,
  forms: FileText,
  aria: Code2,
};

const categoryNames = {
  images: "Изображения",
  contrast: "Контрастность",
  navigation: "Навигация",
  semantics: "Семантика",
  forms: "Формы",
  aria: "ARIA",
};

// Categorize violations
function categorizeViolations(violations: ViolationDetail[]) {
  const categories: Record<string, ViolationDetail[]> = {
    images: [],
    contrast: [],
    navigation: [],
    semantics: [],
    forms: [],
    aria: [],
    other: [],
  };

  violations.forEach((violation) => {
    let categorized = false;
    
    // Check if violation belongs to any category based on tags or id
    if (violation.id.includes("image") || violation.id.includes("alt")) {
      categories.images.push(violation);
      categorized = true;
    } else if (violation.id.includes("color") || violation.id.includes("contrast")) {
      categories.contrast.push(violation);
      categorized = true;
    } else if (
      violation.id.includes("focus") ||
      violation.id.includes("tabindex") ||
      violation.id.includes("bypass") ||
      violation.id.includes("keyboard")
    ) {
      categories.navigation.push(violation);
      categorized = true;
    } else if (
      violation.id.includes("heading") ||
      violation.id.includes("landmark") ||
      violation.id.includes("region") ||
      violation.id.includes("list")
    ) {
      categories.semantics.push(violation);
      categorized = true;
    } else if (
      violation.id.includes("label") ||
      violation.id.includes("form") ||
      violation.id.includes("input") ||
      violation.id.includes("button-name")
    ) {
      categories.forms.push(violation);
      categorized = true;
    } else if (violation.id.includes("aria")) {
      categories.aria.push(violation);
      categorized = true;
    }
    
    if (!categorized) {
      categories.other.push(violation);
    }
  });

  // Remove empty categories
  return Object.entries(categories).filter(([_, items]) => items.length > 0);
}

export function ViolationsList({ violations }: ViolationsListProps) {
  const categorized = categorizeViolations(violations);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Initialize with first category expanded
  useEffect(() => {
    if (categorized.length > 0 && Object.keys(expandedCategories).length === 0) {
      setExpandedCategories({ [categorized[0][0]]: true });
    }
  }, [categorized]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-6 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Найденные нарушения</CardTitle>
          <CardDescription>
            Нарушения сгруппированы по категориям. Нажмите для просмотра деталей.
          </CardDescription>
        </CardHeader>
      </Card>

      {categorized.map(([category, items]) => {
        const Icon = categoryIcons[category as keyof typeof categoryIcons] || Code2;
        const categoryName = categoryNames[category as keyof typeof categoryNames] || "Прочее";
        const isOpen = expandedCategories[category] || false;

        return (
          <Card key={category} data-testid={`category-${category}`}>
            <Collapsible open={isOpen} onOpenChange={() => toggleCategory(category)}>
              <CardHeader>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{categoryName}</CardTitle>
                        <CardDescription>{items.length} нарушений</CardDescription>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" data-testid={`button-toggle-${category}`}>
                      <ChevronDown 
                        className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                      />
                    </Button>
                  </div>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {items.map((violation, index) => {
                      const ImpactIcon = impactIcons[violation.impact];
                      const impactColor = impactColors[violation.impact];

                      return (
                        <AccordionItem
                          key={`${violation.id}-${index}`}
                          value={`${violation.id}-${index}`}
                          data-testid={`violation-${violation.id}-${index}`}
                        >
                          <AccordionTrigger className="hover-elevate rounded-md px-4">
                            <div className="flex items-start gap-3 text-left flex-1">
                              <ImpactIcon className={`h-5 w-5 flex-shrink-0 mt-0.5 text-${impactColor}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <span className="font-semibold">{translateViolationHelp(violation.id, violation.help)}</span>
                                  <Badge
                                    variant={impactColor as any}
                                    className="text-xs"
                                    data-testid={`badge-impact-${violation.impact}`}
                                  >
                                    {violation.impact === "critical" && "Критический"}
                                    {violation.impact === "serious" && "Серьезный"}
                                    {violation.impact === "moderate" && "Умеренный"}
                                    {violation.impact === "minor" && "Незначительный"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {translateViolationDescription(violation.id, violation.description)}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Затронуто элементов: {violation.nodes?.length || 0}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                            <div className="space-y-4 pt-2">
                              {/* WCAG Tags */}
                              <div>
                                <p className="text-sm font-medium mb-2">WCAG критерии:</p>
                                <div className="flex flex-wrap gap-2">
                                  {violation.tags?.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Learn More */}
                              {violation.helpUrl && (
                                <div>
                                  <a
                                    href={violation.helpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sm text-primary hover:underline"
                                    data-testid="link-learn-more"
                                  >
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    Узнать больше об этой проблеме
                                  </a>
                                </div>
                              )}

                              {/* Affected Elements */}
                              {violation.nodes && violation.nodes.length > 0 && (
                                <div>
                                  <p className="text-sm font-medium mb-2">
                                    Проблемные элементы:
                                  </p>
                                  <div className="space-y-3">
                                    {violation.nodes.slice(0, 3).map((node, nodeIndex) => (
                                      <div
                                        key={nodeIndex}
                                        className="rounded-lg bg-muted p-3 space-y-2"
                                        data-testid={`node-${nodeIndex}`}
                                      >
                                        {node.target && node.target.length > 0 && (
                                          <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                              Селектор:
                                            </p>
                                            <code className="text-xs bg-background px-2 py-1 rounded">
                                              {node.target.join(" ")}
                                            </code>
                                          </div>
                                        )}
                                        {node.html && (
                                          <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                              HTML:
                                            </p>
                                            <pre className="text-xs bg-background p-2 rounded overflow-x-auto">
                                              <code>{node.html}</code>
                                            </pre>
                                          </div>
                                        )}
                                        {node.failureSummary && (
                                          <div>
                                            <p className="text-xs font-medium text-muted-foreground mb-1">
                                              Проблема:
                                            </p>
                                            <p className="text-xs text-foreground">
                                              {translateFailureSummary(node.failureSummary)}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                    {violation.nodes.length > 3 && (
                                      <p className="text-xs text-muted-foreground text-center">
                                        ... и еще {violation.nodes.length - 3} элементов
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
