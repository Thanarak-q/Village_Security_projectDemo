/**
 * @file This file provides components for displaying user avatars.
 *
 * Built on Radix UI's Avatar primitive, these components offer a flexible
 * way to show a user's image with a fallback display for when the image
 * is not available. The components include the main `Avatar` container,
 * the `AvatarImage` for the actual image, and `AvatarFallback`.
 */

"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

/**
 * The main container for an avatar, which includes the image and a fallback.
 *
 * @param {React.ComponentProps<typeof AvatarPrimitive.Root>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The avatar container element.
 */
function Avatar({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Root>): React.ReactElement {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn("relative flex size-8 shrink-0 overflow-hidden rounded-full", className)}
      {...props}
    />
  );
}

/**
 * The image part of the avatar. This component will be displayed if the image loads successfully.
 *
 * @param {React.ComponentProps<typeof AvatarPrimitive.Image>} props - The props for the component, including a `className` and `src`.
 * @returns {React.ReactElement} The avatar image element.
 */
function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>): React.ReactElement {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

/**
 * A fallback that is displayed if the avatar image fails to load.
 * This is typically used to show the user's initials.
 *
 * @param {React.ComponentProps<typeof AvatarPrimitive.Fallback>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The fallback element for the avatar.
 */
function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>): React.ReactElement {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn("bg-muted flex size-full items-center justify-center rounded-full", className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
