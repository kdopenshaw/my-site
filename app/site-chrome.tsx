"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Pages that render without the site navigation and footer.
 * A path matches itself and any route nested under it.
 */
const CHROMELESS_PATHS = ["/dilemmas/questionnaire"];

function isChromeless(pathname: string) {
  return CHROMELESS_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default function SiteChrome({
  nav,
  footer,
  children,
}: {
  nav: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const chromeless = isChromeless(pathname);

  return (
    <>
      {chromeless ? null : nav}
      <main>{children}</main>
      {chromeless ? null : footer}
    </>
  );
}
