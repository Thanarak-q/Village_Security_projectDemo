/**
 * @file This file provides a skeleton component for loading states.
 *
 * The `Skeleton` component is used to display a placeholder preview of content
 * while the data is loading, improving the user experience by providing a visual
 * indication that content is on its way.
 */

import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * A component that renders a placeholder skeleton.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component.
 * @returns {React.ReactElement} The skeleton placeholder element.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton };
