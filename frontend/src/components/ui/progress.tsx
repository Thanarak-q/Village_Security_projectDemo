/**
 * @file This file provides a customizable progress bar component.
 *
 * Built on Radix UI's Progress primitive, this component is used to display
 * the progress of a task or operation, providing visual feedback to the user.
 */

"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * A progress bar component that visually indicates the completion of a task.
 *
 * @param {React.ComponentProps<typeof ProgressPrimitive.Root>} props - The props for the component, including the `value` of the progress.
 * @returns {React.ReactElement} The styled progress bar component.
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
