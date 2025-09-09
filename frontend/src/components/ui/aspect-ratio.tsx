/**
 * @file This file provides a component for maintaining the aspect ratio of a child element.
 *
 * It is a wrapper around the `AspectRatio` primitive from Radix UI, which is useful
 * for displaying images, videos, or other media in a consistent size.
 */

"use client";

import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";

/**
 * A component that constrains its children to a specific aspect ratio.
 *
 * @param {React.ComponentProps<typeof AspectRatioPrimitive.Root>} props - The props for the component, including the desired aspect ratio.
 * @returns {React.ReactElement} The aspect ratio container element.
 */
function AspectRatio({ ...props }: React.ComponentProps<typeof AspectRatioPrimitive.Root>): React.ReactElement {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}

export { AspectRatio };
