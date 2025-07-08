import React from "react";
import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "./button";
import { cn } from "@/lib/utils";

interface ButtonLoadingProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

const ButtonLoading = React.forwardRef<HTMLButtonElement, ButtonLoadingProps>(
  ({ 
    loading = false, 
    loadingText, 
    children, 
    disabled, 
    className,
    ...props 
  }, ref) => {
    return (
      <Button 
        ref={ref}
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
);

ButtonLoading.displayName = "ButtonLoading";

export { ButtonLoading };