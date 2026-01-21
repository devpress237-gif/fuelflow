import { ReactNode } from "react";

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export function ResponsiveContainer({ children, className = "" }: ResponsiveContainerProps) {
  return (
    <div className={`w-full min-h-screen bg-background ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </div>
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = 1, 
  gap = "md",
  className = "" 
}: ResponsiveGridProps) {
  const gapClasses = {
    sm: "gap-2 sm:gap-3",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8"
  };

  const colClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
    12: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-12"
  };

  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function ResponsiveCard({ 
  children, 
  className = "",
  padding = "md"
}: ResponsiveCardProps) {
  const paddingClasses = {
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8"
  };

  return (
    <div className={`bg-card text-card-foreground rounded-lg border shadow-sm ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}