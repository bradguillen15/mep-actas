import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-150 ease-out active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primario text-white hover-fino:bg-primario-hover focus-visible:ring-acento",
        acento:
          "bg-acento text-primario hover-fino:bg-acento-suave focus-visible:ring-primario",
        destructive:
          "bg-error text-white hover-fino:bg-error-hover focus-visible:ring-error",
        outline:
          "border border-borde bg-white text-texto hover-fino:bg-superficie focus-visible:ring-primario",
        secondary:
          "bg-superficie text-primario hover-fino:bg-borde focus-visible:ring-primario",
        ghost:
          "text-texto hover-fino:bg-superficie focus-visible:ring-primario",
        link: "text-primario underline-offset-4 hover-fino:underline focus-visible:ring-primario",
      },
      size: {
        sm: "h-9 px-3",
        default: "h-10 px-4",
        md: "h-10 px-4",
        lg: "h-11 px-8 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
