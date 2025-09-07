/**
 * @file This file provides a set of components for creating collapsible sections of content.
 *
 * Built on Radix UI's Collapsible primitive, these components allow for content
 * to be expanded or collapsed, which is useful for showing and hiding detailed information.
 */

"use client";

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";

/**
 * The root component for a collapsible section, which manages the open/closed state.
 *
 * @param {React.ComponentProps<typeof CollapsiblePrimitive.Root>} props - The props for the component.
 * @returns {React.ReactElement} The collapsible container element.
 */
function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>): React.ReactElement {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}

/**
 * The button that toggles the collapsible section's open and closed states.
 *
 * @param {React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>} props - The props for the component.
 * @returns {React.ReactElement} The trigger button for the collapsible section.
 */
function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>): React.ReactElement {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
}

/**
 * The container for the content that is shown or hidden when the collapsible section is toggled.
 *
 * @param {React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>} props - The props for the component.
 * @returns {React.ReactElement} The content container for the collapsible section.
 */
function CollapsibleContent({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>): React.ReactElement {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  );
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
