/**
 * @file This file provides a set of accessible and customizable accordion components.
 *
 * Built on top of Radix UI's Accordion primitive, these components are designed
 * to be fully accessible and easily stylable with Tailwind CSS. They include
 * the main Accordion container, as well as AccordionItem, AccordionTrigger,
 * and AccordionContent to structure the collapsible sections.
 */

"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The root component for the accordion, which contains all the items.
 *
 * @param {React.ComponentProps<typeof AccordionPrimitive.Root>} props - The props for the component.
 * @returns {React.ReactElement} The accordion root element.
 */
function Accordion({ ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>): React.ReactElement {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

/**
 * A single item within the accordion, containing a trigger and content.
 *
 * @param {React.ComponentProps<typeof AccordionPrimitive.Item>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The accordion item element.
 */
function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>): React.ReactElement {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

/**
 * The button that toggles the accordion item's open and closed states.
 *
 * @param {React.ComponentProps<typeof AccordionPrimitive.Trigger>} props - The props for the component, including `className` and `children`.
 * @returns {React.ReactElement} The accordion trigger button.
 */
function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>): React.ReactElement {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * The container for the content that is revealed when an accordion item is open.
 *
 * @param {React.ComponentProps<typeof AccordionPrimitive.Content>} props - The props for the component, including `className` and `children`.
 * @returns {React.ReactElement} The accordion content container.
 */
function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>): React.ReactElement {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
