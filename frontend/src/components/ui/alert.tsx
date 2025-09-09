/**
 * @file This file provides components for displaying alert messages.
 *
 * These components are designed to attract the user's attention to important
 * information without interrupting their workflow. They include variants for
 * default and destructive alerts, and are composed of a main `Alert` container,
 * an `AlertTitle`, and an `AlertDescription`.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Defines the different visual styles for the alert component.
 * @type {Function}
 */
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * The main container for an alert message.
 *
 * @param {React.ComponentProps<"div"> & VariantProps<typeof alertVariants>} props - The props for the component, including `className` and `variant`.
 * @returns {React.ReactElement} The alert container element.
 */
function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>): React.ReactElement {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

/**
 * The title of the alert, which should be a short, descriptive heading.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including `className`.
 * @returns {React.ReactElement} The title element for the alert.
 */
function AlertTitle({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  );
}

/**
 * The description of the alert, providing more details about the message.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including `className`.
 * @returns {React.ReactElement} The description element for the alert.
 */
function AlertDescription({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
