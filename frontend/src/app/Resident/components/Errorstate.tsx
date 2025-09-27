"use client";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  return (
    <div className="flex flex-col items-center justify-center h-32 gap-2">
      <p className="text-red-500 text-sm text-center">{error}</p>
      <Button onClick={() => window.location.reload()} variant="outline" size="sm">
        ลองใหม่
      </Button>
    </div>
  );
};
