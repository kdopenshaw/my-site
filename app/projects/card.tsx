// shadcn/ui Card composition, with Nova styles mapped to local CSS and theme tokens.
// https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/radix/ui/card.tsx
import type { ComponentProps } from "react";
import styles from "./projects.module.css";

type CardProps = ComponentProps<"div">;

export function Card({ className = "", ...props }: CardProps) {
  return <div data-slot="card" data-size="default" className={`${styles.card} ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: CardProps) {
  return <div data-slot="card-header" className={`${styles.header} ${className}`} {...props} />;
}

export function CardTitle({ className = "", ...props }: CardProps) {
  return <div data-slot="card-title" className={`${styles.title} ${className}`} {...props} />;
}

export function CardDescription({ className = "", ...props }: CardProps) {
  return <div data-slot="card-description" className={`${styles.description} ${className}`} {...props} />;
}

export function CardAction({ className = "", ...props }: CardProps) {
  return <div data-slot="card-action" className={`${styles.action} ${className}`} {...props} />;
}

export function CardFooter({ className = "", ...props }: CardProps) {
  return <div data-slot="card-footer" className={`${styles.footer} ${className}`} {...props} />;
}
