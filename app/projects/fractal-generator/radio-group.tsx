"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import type { ComponentProps } from "react";

// shadcn/ui's Radix Radio Group composition, styled by the page's CSS module.
// The full preview/name row is the radio item; Radix supplies roving focus and
// arrow-key selection without putting the expanded constant inputs in a button.
export function RadioGroup(props: ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" {...props} />;
}

export function RadioGroupItem(props: ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return <RadioGroupPrimitive.Item data-slot="radio-group-item" {...props} />;
}
