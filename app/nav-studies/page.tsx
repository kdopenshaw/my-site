import type { Metadata } from "next";

import NavStudies from "./nav-studies";

export const metadata: Metadata = {
  title: "Nav studies",
  robots: { index: false, follow: false },
};

export default function NavStudiesPage() {
  return <NavStudies />;
}
