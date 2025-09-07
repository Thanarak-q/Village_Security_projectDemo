/**
 * @file This file provides a set of components for creating resizable panel layouts.
 *
 * Built on top of `react-resizable-panels`, these components allow for flexible
 * and interactive layouts where users can adjust the size of different panels.
 */

"use client";

import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "@/lib/utils";

/**
 * A container for a group of resizable panels.
 *
 * @param {React.ComponentProps<typeof ResizablePrimitive.PanelGroup>} props - The props for the component.
 * @returns {React.ReactElement} The resizable panel group container.
 */
function ResizablePanelGroup({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>): React.ReactElement {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
      {...props}
    />
  );
}

/**
 * A single panel within a resizable panel group.
 *
 * @param {React.ComponentProps<typeof ResizablePrimitive.Panel>} props - The props for the component.
 * @returns {React.ReactElement} The resizable panel.
 */
function ResizablePanel({ ...props }: React.ComponentProps<typeof ResizablePrimitive.Panel>): React.ReactElement {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

/**
 * The handle used to resize the panels.
 *
 * @param {React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & { withHandle?: boolean }} props - The props for the component.
 * @returns {React.ReactElement} The resizable handle.
 */
function ResizableHandle({ withHandle, className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & { withHandle?: boolean }): React.ReactElement {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn("bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2 [&[data-panel-group-direction=vertical]>div]:rotate-90", className)}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
