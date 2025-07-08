import { AlertCircle, Wifi, WifiOff } from "lucide-react";
import { LoadingSpinner } from "./loading-spinner";
import { Button } from "./button";
import { Card } from "./card";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "Algo deu errado", 
  description = "Tente novamente em alguns instantes",
  onRetry 
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

interface NetworkStateProps {
  isOnline: boolean;
  onRetry?: () => void;
}

export function NetworkState({ isOnline, onRetry }: NetworkStateProps) {
  if (isOnline) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-destructive text-destructive-foreground z-50">
      <div className="flex items-center gap-3">
        <WifiOff className="h-5 w-5" />
        <div className="flex-1">
          <p className="font-medium">Sem conexão</p>
          <p className="text-sm opacity-90">Verifique sua internet</p>
        </div>
        {onRetry && (
          <Button size="sm" variant="secondary" onClick={onRetry}>
            Reconectar
          </Button>
        )}
      </div>
    </Card>
  );
}

interface LoadingStateProps {
  isLoading: boolean;
  isEmpty?: boolean;
  hasError?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRetry?: () => void;
}

export function LoadingState({
  isLoading,
  isEmpty,
  hasError,
  children,
  loadingComponent,
  emptyComponent,
  errorComponent,
  onRetry
}: LoadingStateProps) {
  if (isLoading) {
    return loadingComponent || <LoadingSpinner size="lg" />;
  }

  if (hasError) {
    return errorComponent || <ErrorState onRetry={onRetry} />;
  }

  if (isEmpty) {
    return emptyComponent || <EmptyState title="Nenhum item encontrado" />;
  }

  return <>{children}</>;
}