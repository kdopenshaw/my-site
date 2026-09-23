import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function NavigationMenu({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav className={cn("ui-navigation-menu", className)} {...props} />;
}
