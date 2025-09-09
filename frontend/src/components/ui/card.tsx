/**
 * @file This file provides a set of components for building card-based layouts.
 *
 * These components are designed to be composed together to create flexible and
 * consistent card structures. They include `Card` as the main container,
 * along with `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
 * `CardFooter`, and `CardAction` for different sections of the card.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The main container for a card component.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The card container element.
 */
function Card({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="card"
      className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm", className)}
      {...props}
    />
  );
}

/**
 * The header section of a card.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The card header element.
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="card-header"
      className={cn("@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6", className)}
      {...props}
    />
  );
}

/**
 * The title of a card, typically placed within the `CardHeader`.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The card title element.
 */
function CardTitle({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

/**
 * The description for a card, providing additional context.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The card description element.
 */
function CardDescription({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

/**
 * A container for action elements, such as buttons or links, within a card.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The card action container.
 */
function CardAction({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

/**
 * The main content area of a card.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The card content element.
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

/**
 * The footer section of a card.
 *
 * @param {React.ComponentProps<"div">} props - The props for the component, including a `className`.
 * @returns {React.ReactElement} The card footer element.
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
