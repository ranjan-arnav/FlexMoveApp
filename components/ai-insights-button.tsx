"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIInsightsButtonProps {
  message: string;
  context?: any;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
  onClick: (message: string, context?: any) => void;
}

export function AIInsightsButton({ 
  message, 
  context, 
  variant = "outline", 
  size = "sm",
  className = "",
  onClick 
}: AIInsightsButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-2 ${className} bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 dark:hover:from-blue-800/70 dark:hover:to-blue-700/70 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-200 font-semibold transition-all shadow-sm hover:shadow-md`}
      onClick={() => onClick(message, context)}
    >
      <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <span>Ask Flexify</span>
    </Button>
  );
}
