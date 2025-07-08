import { cn } from "@/lib/utils";

interface ContentLoaderProps {
  className?: string;
  lines?: number;
  showAvatar?: boolean;
  showImage?: boolean;
}

export function ContentLoader({ className, lines = 3, showAvatar = false, showImage = false }: ContentLoaderProps) {
  return (
    <div className={cn("animate-pulse", className)}>
      {showImage && (
        <div className="bg-muted rounded-lg aspect-[4/5] mb-4"></div>
      )}
      
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="bg-muted rounded-full w-10 h-10"></div>
          <div className="space-y-2 flex-1">
            <div className="bg-muted h-4 rounded w-1/4"></div>
            <div className="bg-muted h-3 rounded w-1/3"></div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-muted h-4 rounded",
              i === lines - 1 ? "w-2/3" : "w-full"
            )}
          ></div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-lg p-4", className)}>
      <ContentLoader showImage lines={4} />
    </div>
  );
}

export function ProductCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="animate-pulse">
        <div className="bg-muted aspect-[4/5]"></div>
        <div className="p-4 space-y-3">
          <div className="bg-muted h-3 rounded w-1/3"></div>
          <div className="bg-muted h-5 rounded w-full"></div>
          <div className="bg-muted h-4 rounded w-2/3"></div>
          <div className="bg-muted h-6 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
}