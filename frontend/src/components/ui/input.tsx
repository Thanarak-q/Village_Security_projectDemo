/**
 * @file This file provides a styled input component for use in forms and other UI elements.
 *
 * The `Input` component is a wrapper around the standard HTML `<input>` element,
 * enhanced with consistent styling using Tailwind CSS. It supports all standard
 * input types and properties.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A styled text input component.
 *
 * @param {React.ComponentProps<"input">} props - The props for the component, including `type`, `className`, etc.
 * @returns {React.ReactElement} The styled input element.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">): React.ReactElement {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

export { Input };
