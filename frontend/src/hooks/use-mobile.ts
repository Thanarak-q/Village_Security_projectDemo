/**
 * @file This file provides a custom React hook for detecting mobile screen sizes.
 *
 * The `useIsMobile` hook allows components to dynamically adapt their layout
 * or functionality based on whether the current screen width is below a defined
 * mobile breakpoint. This is essential for creating responsive user interfaces.
 */

import * as React from "react";

/**
 * The screen width in pixels that serves as the breakpoint for defining a mobile device.
 * @type {number}
 */
const MOBILE_BREAKPOINT = 768;

/**
 * A custom React hook that determines if the current screen width is below the mobile breakpoint.
 * It uses a `matchMedia` query to listen for changes in screen size and updates its state accordingly.
 *
 * @returns {boolean} `true` if the screen width is less than the mobile breakpoint, otherwise `false`.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    // Set the initial value
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
