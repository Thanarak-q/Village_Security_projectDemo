"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * @file This file provides a Toaster component for displaying notifications.
 *
 * The `Toaster` component is a wrapper around the `sonner` library, which provides
 * a toast notification system. This component is responsible for setting the theme
 * of the toasts based on the current application theme.
 */

/**
 * A component that renders toast notifications.
 *
 * @param {ToasterProps} props - The props for the component.
 * @returns {React.ReactElement} The rendered Toaster component.
 */
const Toaster = ({ ...props }: ToasterProps): React.ReactElement => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
