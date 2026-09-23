import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type = "text", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  const usesFieldStyle = type !== "range" && type !== "color";
  return <input type={type} className={cn(usesFieldStyle && "ui-input", className)} {...props} />;
}
