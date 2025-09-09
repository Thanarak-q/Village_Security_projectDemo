/**
 * @file This file provides a set of components for creating drawers (side panels).
 *
 * Built on top of `vaul`, these components offer a flexible way to create drawers
 * that can slide in from any side of the screen. They are ideal for navigation menus,
 * forms, or other content that needs to be temporarily displayed without covering
 * the entire viewport.
 */

"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

const Drawer = DrawerPrimitive.Root;
const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerPortal = DrawerPrimitive.Portal;
const DrawerClose = DrawerPrimitive.Close;

/**
 * A semi-transparent overlay that covers the main content when the drawer is open.
 *
 * @param {React.ComponentProps<typeof DrawerPrimitive.Overlay>} props - The props for the component.
 * @returns {React.ReactElement} The drawer overlay element.
 */
function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>): React.ReactElement {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn("fixed inset-0 z-50 bg-black/50", className)}
      {...props}
    />
  );
}

/**
 * The main content container for the drawer.
 *
 * @param {React.ComponentProps<typeof DrawerPrimitive.Content>} props - The props for the component.
 * @returns {React.ReactElement} The drawer content container.
 */
function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>): React.ReactElement {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn("group/drawer-content bg-background fixed z-50 flex h-auto flex-col", "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b", "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t", "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm", "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm", className)}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

/**
 * The header section of the drawer.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component.
 * @returns {React.ReactElement} The drawer header element.
 */
function DrawerHeader({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-0.5 p-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left", className)}
      {...props}
    />
  );
}

/**
 * The footer section of the drawer.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component.
 * @returns {React.ReactElement} The drawer footer element.
 */
function DrawerFooter({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

/**
 * The title of the drawer.
 *
 * @param {React.ComponentProps<typeof DrawerPrimitive.Title>} props - The props for the component.
 * @returns {React.ReactElement} The drawer title element.
 */
function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>): React.ReactElement {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}

/**
 * The description of the drawer.
 *
 * @param {React.ComponentProps<typeof DrawerPrimitive.Description>} props - The props for the component.
 * @returns {React.ReactElement} The drawer description element.
 */
function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>): React.ReactElement {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
