/**
 * @file This file provides accessible and customizable alert dialog components.
 *
 * Built on Radix UI's Alert Dialog primitive, these components are designed for
 * modal confirmation dialogs that interrupt the user's workflow to require a response.
 * They are styled with Tailwind CSS and are fully accessible.
 */

"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

/**
 * The root component for an alert dialog, which manages the open/closed state.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Root>} props - The props for the component.
 * @returns {React.ReactElement} The alert dialog root element.
 */
function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>): React.ReactElement {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}

/**
 * The button that opens the alert dialog.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Trigger>} props - The props for the component.
 * @returns {React.ReactElement} The trigger button for the alert dialog.
 */
function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>): React.ReactElement {
  return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />;
}

/**
 * A portal that renders the alert dialog's content in a new DOM node,
 * typically at the end of the document body, to handle stacking context.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Portal>} props - The props for the component.
 * @returns {React.ReactElement} The portal element for the alert dialog.
 */
function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>): React.ReactElement {
  return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />;
}

/**
 * A semi-transparent overlay that covers the main content when the dialog is open.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Overlay>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The overlay element.
 */
function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  );
}

/**
 * The main content container for the alert dialog.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Content>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The content container of the alert dialog.
 */
function AlertDialogContent({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content>): React.ReactElement {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg", className)}
        {...props}
      />
    </AlertDialogPortal>
  );
}

/**
 * The header section of the alert dialog, typically containing the title and description.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The header element.
 */
function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

/**
 * The footer section of the alert dialog, typically containing the action and cancel buttons.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The footer element.
 */
function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn("flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  );
}

/**
 * The title of the alert dialog. It should be descriptive and concise.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Title>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The title element.
 */
function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}

/**
 * The description of the alert dialog, providing more context or details.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Description>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The description element.
 */
function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/**
 * The action button that confirms the action described in the alert dialog.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Action>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The action button.
 */
function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}

/**
 * The cancel button that closes the alert dialog without taking any action.
 *
 * @param {React.ComponentProps<typeof AlertDialogPrimitive.Cancel>} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The cancel button.
 */
function AlertDialogCancel({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>): React.ReactElement {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
