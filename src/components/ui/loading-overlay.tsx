import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./loading-spinner";

interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  className?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({ isLoading, text, className, children }: LoadingOverlayProps) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="bg-card p-6 rounded-lg shadow-lg border">
            <LoadingSpinner size="lg" text={text} />
          </div>
        </div>
      )}
    </div>
  );
}

export function FullPageLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-8 rounded-xl shadow-xl border">
        <LoadingSpinner size="xl" text={text} />
      </div>
    </div>
  );
}