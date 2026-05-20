import { classNames } from "~/lib/classnames";

export function buttonClassName({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "primary";
} = {}) {
  return classNames("button", variant === "primary" && "primary", className);
}
