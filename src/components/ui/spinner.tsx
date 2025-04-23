import { LoadingSpinner } from "./loading-spinner";

interface SpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return <LoadingSpinner size={size} className={className} />;
} 