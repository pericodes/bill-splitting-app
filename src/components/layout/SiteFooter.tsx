"use client";

import { usePathname } from "next/navigation";
import { Trans } from "react-i18next";

const GITHUB_URL = "https://github.com/pericodes/bill-splitting-app";
const PERICODES_URL = "https://pericodes.com/";

const linkClass =
  "underline underline-offset-2 decoration-outline/60 hover:text-primary hover:decoration-primary transition-colors";

export default function SiteFooter() {
  const pathname = usePathname() || "";
  const hasBottomNav =
    pathname === "/dashboard" ||
    pathname === "/profile" ||
    /\/account\/[^/]+\/balances\/?$/.test(pathname);

  return (
    <footer
      className={`shrink-0 text-center text-xs text-outline px-4 pt-3 ${
        hasBottomNav ? "pb-24 md:pb-4" : "pb-4"
      }`}
    >
      <p>
        <Trans
          i18nKey="footer.credit"
          components={{
            openSource: (
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              />
            ),
            brand: (
              <a
                href={PERICODES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              />
            ),
          }}
        />
      </p>
    </footer>
  );
}
