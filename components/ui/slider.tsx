"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import styles from "./slider.module.css";

function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root className={[styles.root, className].filter(Boolean).join(" ")} {...props}>
      <SliderPrimitive.Track className={styles.track}>
        <SliderPrimitive.Range className={styles.range} />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={styles.thumb} />
    </SliderPrimitive.Root>
  );
}

export { Slider };
