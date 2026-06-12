"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ACCOUNT_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  ROUTES,
} from "../constants/routes";
import { PRODUCT } from "../constants/product";

function isActivePath(pathname, href) {
  if (href === ROUTES.home) {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="navbar" aria-label="Primary navigation">
      <Link href="/" className="logo">
        {PRODUCT.shortName}
      </Link>

      <div className="nav-links">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "active" : ""}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="account-links">
        {ACCOUNT_NAV_ITEMS.map((item) => {
          const isActive = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "active" : ""}
              aria-current={isActive ? "page" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
