import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

type ErrorBoundaryProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", this.props.title ?? "Section", error, info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Card className={this.props.className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {this.props.title ?? "Something went wrong"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {this.props.description ??
              "This section crashed on this device. Tap retry to recover."}
          </p>
          <Button variant="outline" onClick={this.handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          {this.state.error?.message ? (
            <p className="text-xs text-muted-foreground break-words">
              {this.state.error.message}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }
}
