import {
  Button as BaseButton,
  type ButtonProps as BaseButtonProps,
} from "@base-ui/react/button";

import { buttonClassName } from "~/components/ui/button-styles";

type ButtonProps = Omit<BaseButtonProps, "className"> & {
  className?: string;
  variant?: "default" | "primary";
};

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <BaseButton
      className={buttonClassName({ variant, className })}
      {...props}
    />
  );
}
