"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Icon from "./Icon";

const THEME_EVENT = "olf-theme-change";

function subscribe(callback) {
  window.addEventListener(THEME_EVENT, callback);
  return () => window.removeEventListener(THEME_EVENT, callback);
}

function getSnapshot() {
  return document.documentElement.dataset.theme || "light";
}

function getServerSnapshot() {
  return "light";
}

export default function ThemeToggle() {
  const buttonRef = useRef(null);
  const theme = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const isDark = theme === "dark";

  const toggleTheme = useCallback(() => {
    if (buttonRef.current) {
      buttonRef.current.dataset.reactReady = "true";
    }

    const currentTheme = document.documentElement.dataset.theme || theme;
    const nextTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.style.colorScheme = nextTheme;
    try {
      window.localStorage.setItem("olf-theme", nextTheme);
    } catch {
      // Theme should still switch even if storage is unavailable.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, [theme]);

  useEffect(() => {
    const button = buttonRef.current;

    if (!button) {
      return undefined;
    }

    button.dataset.reactReady = "true";
    button.addEventListener("click", toggleTheme);

    return () => {
      button.removeEventListener("click", toggleTheme);
      delete button.dataset.reactReady;
    };
  }, [toggleTheme]);

  return (
    <button
      ref={buttonRef}
      type="button"
      className="theme-toggle"
      data-theme-toggle
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      suppressHydrationWarning
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className="theme-icon theme-icon-sun">
          <Icon name="sun" size={13} />
        </span>
        <span className="theme-icon theme-icon-moon">
          <Icon name="moon" size={12} />
        </span>
        <span className="theme-toggle-thumb" />
      </span>
    </button>
  );
}
