"use client";

import { useEffect } from "react";

/**
 * Filters out harmless source map warnings from the console
 * These warnings don't affect functionality and are just noise
 */
export default function ConsoleFilter() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== "development") {
      return;
    }

    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;

    // Filter function to check if message should be suppressed
    const shouldSuppress = (args: any[]): boolean => {
      const message = args.join(" ");
      return (
        message.includes("Invalid source map") ||
        message.includes("sourceMapURL could not be parsed") ||
        message.includes("Only conformant source maps")
      );
    };

    // Override console.error
    console.error = (...args: any[]) => {
      if (!shouldSuppress(args)) {
        originalError.apply(console, args);
      }
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      if (!shouldSuppress(args)) {
        originalWarn.apply(console, args);
      }
    };

    // Cleanup on unmount
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}

