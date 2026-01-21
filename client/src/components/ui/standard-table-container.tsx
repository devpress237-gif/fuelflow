
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StandardTableContainerProps {
  title?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export function StandardTableContainer({
  title,
  children,
  headerActions,
  className = ""
}: StandardTableContainerProps) {
  return (
    <Card className={`w-full ${className}`}>
      {(title || headerActions) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          {title && <CardTitle>{title}</CardTitle>}
          {headerActions && <div className="flex items-center space-x-2">{headerActions}</div>}
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
