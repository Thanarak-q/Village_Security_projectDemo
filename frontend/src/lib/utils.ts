/**
 * @file Provides utility functions for the frontend application.
 * This file includes helper functions that can be used across various components
 * and pages to perform common tasks, such as class name merging.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to conditionally join class names together.
 * It uses `clsx` to handle conditional classes and `tailwind-merge`
 * to intelligently merge Tailwind CSS classes without conflicts.
 *
 * @param {...ClassValue[]} inputs - A list of class values to be merged.
 *   This can include strings, arrays, or objects with boolean keys.
 * @returns {string} The merged and optimized class name string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
