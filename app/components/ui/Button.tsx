import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
};

/**
 * Primitiva base de botón (Radix Slot + tokens SPEC 10).
 * Sin variantes por ahora: los pasos 3–5 la reutilizan para
 * Reveal/Anterior/Siguiente/Comprobar/Limpiar.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ asChild = false, type = "button", ...props }, ref) {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} type={type} data-slot="button" {...props} />;
  },
);
