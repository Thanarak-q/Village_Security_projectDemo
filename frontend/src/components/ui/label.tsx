/**
 * @file This file provides a styled label component for form elements.
 *
 * Built on Radix UI's Label primitive, this component is designed to be
 * accessible and to correctly associate with form inputs.
 */

"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/**
 * A styled label component that can be associated with a form input.
 *
 * @param {React.ComponentProps<typeof LabelPrimitive.Root>} props - The props for the component.
 * @returns {React.ReactElement} The styled label element.
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>): React.ReactElement {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn("flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50", className)}
      {...props}
    />
  );
}

export { Label };
