import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/utils";
type Space = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;
type StackProps = ComponentProps<"div"> & {
  gap?: Space;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "between" | "center" | "end";
  wrap?: boolean;
};
function Stack({
  direction,
  gap = 4,
  align,
  justify,
  wrap,
  className,
  style,
  ...props
}: StackProps & { direction: "horizontal" | "vertical" }) {
  return (
    <div
      className={cn("stack", `stack-${direction}`, className)}
      style={
        {
          "--stack-gap": `var(--space-${gap})`,
          alignItems:
            align === "start"
              ? "flex-start"
              : align === "end"
                ? "flex-end"
                : align,
          justifyContent:
            justify === "between"
              ? "space-between"
              : justify === "end"
                ? "flex-end"
                : justify,
          flexWrap: wrap ? "wrap" : undefined,
          ...style,
        } as CSSProperties
      }
      {...props}
    />
  );
}
export function HStack(props: StackProps) {
  return <Stack direction="horizontal" align="center" {...props} />;
}
export function VStack(props: StackProps) {
  return <Stack direction="vertical" {...props} />;
}
export function Grid({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("grid-12", className)} {...props} />;
}
export function GridItem({
  span = 12,
  className,
  style,
  ...props
}: ComponentProps<"div"> & { span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12 }) {
  return (
    <div
      className={cn("grid-item", className)}
      data-span={span}
      style={{ "--col-span": span, ...style } as CSSProperties}
      {...props}
    />
  );
}
