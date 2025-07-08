import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface ButtonLoadingProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function ButtonLoading({ 
  loading = false, 
  loadingText, 
  children, 
  disabled, 
  className,
  ...props 
}: ButtonLoadingProps) {
  return (
    <Button 
      disabled={loading || disabled} 
      className={cn(className)}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {loading ? (loadingText || children) : children}
    </Button>
  );
}