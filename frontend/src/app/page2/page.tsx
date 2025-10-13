"use client";

import { ThemeProvider } from "@/components/theme-provider";

export default function PageTwo() {
  return (
    <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
      <main className="min-h-dvh bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-xl w-full text-center space-y-4">
          <h1 className="text-3xl font-bold">Page Two (Dark)</h1>
          <p className="text-muted-foreground">
            This page is forced to dark theme regardless of user/system setting.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-md p-4 bg-card text-card-foreground">card</div>
            <div className="rounded-md p-4 bg-muted text-muted-foreground">muted</div>
            <div className="rounded-md p-4 bg-primary text-primary-foreground">primary</div>
          </div>
        </div>
      </main>
    </ThemeProvider>
  );
}

