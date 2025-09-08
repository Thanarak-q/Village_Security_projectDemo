/**
 * @file This file provides a set of components for creating pagination controls.
 *
 * These components are designed to be composed together to build a flexible
 * and accessible pagination system, including previous/next buttons, page links,
 * and an ellipsis for truncated page lists.
 */

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";

/**
 * The main container for the pagination navigation.
 *
 * @param {React.ComponentProps<"nav">} props - The props for the component.
 * @returns {React.ReactElement} The pagination navigation container.
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">): React.ReactElement {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

/**
 * A container for the list of pagination items.
 *
 * @param {React.ComponentProps<"ul">} props - The props for the component.
 * @returns {React.ReactElement} The list container for pagination items.
 */
function PaginationContent({ className, ...props }: React.ComponentProps<"ul">): React.ReactElement {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

/**
 * A single item within the pagination list.
 *
 * @param {React.ComponentProps<"li">} props - The props for the component.
 * @returns {React.ReactElement} A list item for the pagination.
 */
function PaginationItem({ ...props }: React.ComponentProps<"li">): React.ReactElement {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = { isActive?: boolean } & Pick<ButtonProps, "size"> & React.ComponentProps<"a">;

/**
 * A link to a specific page within the pagination.
 *
 * @param {PaginationLinkProps} props - The props for the component.
 * @returns {React.ReactElement} A pagination link.
 */
function PaginationLink({ className, isActive, size = "icon", ...props }: PaginationLinkProps): React.ReactElement {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(buttonVariants({ variant: isActive ? "outline" : "ghost", size }), className)}
      {...props}
    />
  );
}

/**
 * A button to navigate to the previous page.
 *
 * @param {React.ComponentProps<typeof PaginationLink>} props - The props for the component.
 * @returns {React.ReactElement} The 'previous page' button.
 */
function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>): React.ReactElement {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}

/**
 * A button to navigate to the next page.
 *
 * @param {React.ComponentProps<typeof PaginationLink>} props - The props for the component.
 * @returns {React.ReactElement} The 'next page' button.
 */
function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>): React.ReactElement {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

/**
 * An ellipsis component used to indicate a truncated list of pages.
 *
 * @param {React.ComponentProps<"span">} props - The props for the component.
 * @returns {React.ReactElement} The ellipsis indicator.
 */
function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">): React.ReactElement {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
