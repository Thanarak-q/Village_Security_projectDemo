/**
 * @file This file provides a highly customizable and responsive sidebar component.
 *
 * It includes a `SidebarProvider` to manage the state of the sidebar,
 * and a variety of sub-components for building complex sidebar layouts,
 * such as headers, footers, menus, and groups. The sidebar supports
 * different variants, collapsible modes, and is responsive for mobile devices.
 */

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ... (rest of the component definitions)

export {
  Sidebar,
  SidebarProvider,
  // ... other exports
};
