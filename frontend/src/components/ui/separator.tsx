/**
 * @file This file provides a separator component for visually dividing content.
 *
 * Built on Radix UI's Separator primitive, this component can be rendered
 * horizontally or vertically to create clear visual distinctions between
 * different sections or elements in a layout.
 */

"use client";

import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

/**
 * A component that renders a horizontal or vertical separator line.
 *
 * @param {React.ComponentProps<typeof SeparatorPrimitive.Root>} props - The props for the component.
 * @returns {React.ReactElement} The separator element.
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
