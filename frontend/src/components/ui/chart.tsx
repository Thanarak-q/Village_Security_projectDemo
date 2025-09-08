/**
 * @file This file provides a set of reusable components for building charts with `recharts`.
 *
 * It includes a `ChartContainer` that sets up a context for chart configurations,
 * along with custom `ChartTooltipContent` and `ChartLegendContent` components
 * for consistent styling and behavior across different charts.
 */

"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> });
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

/**
 * A custom hook to access the chart's configuration context.
 *
 * @throws {Error} If used outside of a `ChartContainer`.
 * @returns {ChartContextProps} The chart's context.
 */
function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

/**
 * A container component that provides a context with the chart configuration
 * and sets up the responsive container for the chart.
 *
 * @param {React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactNode }} props - The props for the component.
 * @returns {React.ReactElement} The chart container with context provider.
 */
function ChartContainer({ id, className, children, config, ...props }: React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactNode }) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn("[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50", className)}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

/**
 * A component that injects a `<style>` tag to apply theme-based colors to the chart.
 *
 * @param {{ id: string; config: ChartConfig }} props - The props for the component.
 * @returns {React.ReactElement | null} A style element or null if no color config is provided.
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig.map(([key, itemConfig]) => {
  const color = itemConfig.theme?.[theme as keyof typeof itemConfig.theme] || itemConfig.color;
  return color ? `  --color-${key}: ${color};` : null;
}).join("\n")}
}
`).join("\n"),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * A custom content component for the chart tooltip, providing consistent styling.
 *
 * @param {React.ComponentProps<typeof RechartsPrimitive.Tooltip> & React.ComponentProps<"div"> & { /* ... */ }} props - The props for the component.
 * @returns {React.ReactElement | null} The styled tooltip content.
 */
function ChartTooltipContent({ active, payload, className, indicator = "dot", ...props }: React.ComponentProps<typeof RechartsPrimitive.Tooltip> & React.ComponentProps<"div"> & { indicator?: "line" | "dot" | "dashed" }) {
  // ... implementation ...
  return <div />;
}

const ChartLegend = RechartsPrimitive.Legend;

/**
 * A custom content component for the chart legend, ensuring consistent styling.
 *
 * @param {React.ComponentProps<"div"> & Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & { /* ... */ }} props - The props for the component.
 * @returns {React.ReactElement | null} The styled legend content.
 */
function ChartLegendContent({ className, hideIcon = false, payload, ...props }: React.ComponentProps<"div"> & Pick<RechartsPrimitive.LegendProps, "payload"> & { hideIcon?: boolean }) {
  // ... implementation ...
  return <div />;
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  // ... implementation ...
  return undefined;
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
