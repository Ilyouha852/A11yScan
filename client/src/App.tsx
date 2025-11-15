import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { Link, useLocation } from "wouter";
import Home from "@/pages/home";
import HistoryPage from "@/pages/history";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/history" component={HistoryPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <div className="min-h-screen bg-background">
            {/* Global Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
                <Link href="/">
                  <button className="flex items-center gap-2 hover-elevate rounded-md px-3 py-2 -ml-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="w-6 h-6"
                        >
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <h1 className="text-lg font-bold text-foreground leading-tight">
                          Проверка доступности
                        </h1>
                        <p className="text-xs text-muted-foreground">WCAG AA Аудит</p>
                      </div>
                    </div>
                  </button>
                </Link>

                <div className="flex items-center gap-2">
                  {location !== "/history" && (
                    <Link href="/history">
                      <Button variant="ghost" size="sm" data-testid="button-history">
                        <History className="h-4 w-4 mr-2" />
                        История
                      </Button>
                    </Link>
                  )}
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <Router />
          </div>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
