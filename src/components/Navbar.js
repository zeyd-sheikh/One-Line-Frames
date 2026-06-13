"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { logout } from "../app/auth/actions";
import { PRIMARY_NAV_ITEMS, ROUTES } from "../constants/routes";
import { PRODUCT } from "../constants/product";
import Icon from "./Icon";

function isActivePath(pathname, href) {
  if (href === ROUTES.home) {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function Navbar({ isAuthenticated }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="navbar" aria-label="Primary navigation">
      <Link href="/" className="logo">
        <span className="logo-mark" aria-hidden="true">
          <span />
        </span>
        <span>{PRODUCT.shortName}</span>
      </Link>

      <button
        type="button"
        className="nav-menu-button"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-controls="site-navigation"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
      >
        <Icon name={isOpen ? "close" : "menu"} size={19} />
      </button>

      <div
        id="site-navigation"
        className={`nav-drawer ${isOpen ? "is-open" : ""}`}
      >
        <div className="nav-links">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : ""}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsOpen(false)}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="account-links">
          {isAuthenticated ? (
            <>
              <Link
                href={ROUTES.profile}
                className={
                  isActivePath(pathname, ROUTES.profile) ? "active" : ""
                }
                aria-current={
                  isActivePath(pathname, ROUTES.profile) ? "page" : undefined
                }
                onClick={() => setIsOpen(false)}
              >
                <Icon name="user" size={14} />
                profile
              </Link>
              <form action={logout}>
                <button className="nav-action" type="submit">
                  log out
                </button>
              </form>
            </>
          ) : (
            <Link
              href={ROUTES.login}
              className={isActivePath(pathname, ROUTES.login) ? "active" : ""}
              aria-current={
                isActivePath(pathname, ROUTES.login) ? "page" : undefined
              }
              onClick={() => setIsOpen(false)}
            >
              <Icon name="user" size={14} />
              log in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
