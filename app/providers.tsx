"use client";

import { MantineProvider, createTheme } from "@mantine/core";
import type { ReactNode } from "react";

const theme = createTheme({
  fontFamily: "var(--font-primary)",
  headings: { fontFamily: "var(--font-display)" },
  primaryColor: "blue",
  defaultRadius: "xs",
});

export default function Providers({ children }: { children: ReactNode }) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}
