/**
 * @file This file provides a set of components for creating breadcrumb navigation.
 *
 * Breadcrumbs are a secondary navigation system that shows a user's location
 * in a site or app. These components are designed to be flexible and accessible,
 * allowing for easy integration into any page layout.
 */

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The main container for the breadcrumb navigation.
 *
 * @param {React.ComponentProps<"nav">} props - The props for the component.
 * @returns {React.ReactElement} The breadcrumb navigation container.
 */
function Breadcrumb({ ...props }: React.ComponentProps<"nav">): React.ReactElement {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

/**
 * An ordered list that contains the breadcrumb items.
 *
 * @param {React.ComponentProps<"ol">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The list of breadcrumb items.
 */
function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">): React.ReactElement {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5", className)}
      {...props}
    />
  );
}

/**
 * A single item within the breadcrumb list.
 *
 * @param {React.ComponentProps<"li">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} A list item for the breadcrumb.
 */
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">): React.ReactElement {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}

/**
 * A link within a breadcrumb item, representing a page in the navigation path.
 *
 * @param {React.ComponentProps<"a"> & { asChild?: boolean }} props - The props for the component, including `asChild` to render a different child component.
 * @returns {React.ReactElement} A link element for the breadcrumb.
 */
function BreadcrumbLink({ asChild, className, ...props }: React.ComponentProps<"a"> & { asChild?: boolean }): React.ReactElement {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  );
}

/**
 * The current page within the breadcrumb trail. This is typically not a link.
 *
 * @param {React.ComponentProps<"span">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} A span element representing the current page.
 */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  );
}

/**
 * The separator displayed between breadcrumb items.
 *
 * @param {React.ComponentProps<"li">} props - The props for the component, including `children` and `className`.
 * @returns {React.ReactElement} The separator element.
 */
function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<"li">): React.ReactElement {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

/**
 * An ellipsis component used to indicate that there are more breadcrumb items
 * that are not currently visible.
 *
 * @param {React.ComponentProps<"span">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The ellipsis indicator.
 */
function BreadcrumbEllipsis({ className, ...props }: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
