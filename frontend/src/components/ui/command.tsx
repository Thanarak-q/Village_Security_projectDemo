/**
 * @file This file provides a set of components for building command palettes.
 *
 * Built on top of `cmdk`, these components offer a powerful and accessible
 * way to create command menus that allow users to search and execute actions.
 * The set includes `Command`, `CommandDialog`, `CommandInput`, `CommandList`,
 * and other related components.
 */

"use client";

import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * The main container for a command menu.
 *
 * @param {React.ComponentProps<typeof CommandPrimitive>} props - The props for the component.
 * @returns {React.ReactElement} The command menu container.
 */
function Command({ className, ...props }: React.ComponentProps<typeof CommandPrimitive>): React.ReactElement {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn("bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md", className)}
      {...props}
    />
  );
}

/**
 * A command menu displayed within a dialog.
 *
 * @param {React.ComponentProps<typeof Dialog> & { title?: string; description?: string; className?: string; showCloseButton?: boolean }} props - The props for the component.
 * @returns {React.ReactElement} The command dialog component.
 */
function CommandDialog({ title = "Command Palette", description = "Search for a command to run...", children, className, showCloseButton = true, ...props }: React.ComponentProps<typeof Dialog> & { title?: string; description?: string; className?: string; showCloseButton?: boolean }): React.ReactElement {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className={cn("overflow-hidden p-0", className)} showCloseButton={showCloseButton}>
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The input field for the command menu, used for searching.
 *
 * @param {React.ComponentProps<typeof CommandPrimitive.Input>} props - The props for the component.
 * @returns {React.ReactElement} The command input field.
 */
function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>): React.ReactElement {
  return (
    <div data-slot="command-input-wrapper" className="flex h-9 items-center gap-2 border-b px-3">
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50", className)}
        {...props}
      />
    </div>
  );
}

/**
 * The list that displays the command items.
 *
 * @param {React.ComponentProps<typeof CommandPrimitive.List>} props - The props for the component.
 * @returns {React.ReactElement} The list of command items.
 */
function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>): React.ReactElement {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto", className)}
      {...props}
    />
  );
}

/**
 * A component to display when there are no results for the current search query.
 *
 * @param {React.ComponentProps<typeof CommandPrimitive.Empty>} props - The props for the component.
 * @returns {React.ReactElement} The empty state component.
 */
function CommandEmpty({ ...props }: React.ComponentProps<typeof CommandPrimitive.Empty>): React.ReactElement {
  return <CommandPrimitive.Empty data-slot="command-empty" className="py-6 text-center text-sm" {...props} />;
}

/**
 * A component to group related command items.
 *
 * @param {React.ComponentProps<typeof CommandPrimitive.Group>} props - The props for the component.
 * @returns {React.ReactElement} The command group component.
 */
function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>): React.ReactElement {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn("text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium", className)}
      {...props}
    />
  );
}

/**
 * A separator to visually divide groups of command items.
 *
 * @param {React.ComponentProps<typeof CommandPrimitive.Separator>} props - The props for the component.
 * @returns {React.ReactElement} The separator element.
 */
function CommandSeparator({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Separator>): React.ReactElement {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  );
}

/**
 * A single item within the command menu.
 *
 * @param {React.ComponentProps<typeof CommandPrimitive.Item>} props - The props for the component.
 * @returns {React.ReactElement} The command item.
 */
function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>): React.ReactElement {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn("data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50", className)}
      {...props}
    />
  );
}

/**
 * A component to display a keyboard shortcut associated with a command item.
 *
 * @param {React.ComponentProps<"span">} props - The props for the component.
 * @returns {React.ReactElement} The command shortcut display.
 */
function CommandShortcut({ className, ...props }: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("text-muted-foreground ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
