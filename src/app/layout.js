import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PRODUCT } from "../constants/product";
import { getAuthenticatedUser } from "../lib/auth";

const themeScript = `
  (() => {
    const themeEvent = "olf-theme-change";

    function applyTheme(theme) {
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;

      try {
        localStorage.setItem("olf-theme", theme);
      } catch {}
    }

    try {
      const savedTheme = localStorage.getItem("olf-theme");
      const systemTheme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      const theme = savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : systemTheme;

      applyTheme(theme);
    } catch {
      document.documentElement.dataset.theme = "light";
    }

    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;

      if (!target) {
        return;
      }

      const themeButton = target.closest("[data-theme-toggle]");

      if (themeButton && themeButton.dataset.reactReady !== "true") {
        event.preventDefault();
        const currentTheme = document.documentElement.dataset.theme || "light";
        const nextTheme = currentTheme === "dark" ? "light" : "dark";

        applyTheme(nextTheme);
        window.dispatchEvent(new Event(themeEvent));
        return;
      }

      const layoutButton = target.closest("[data-gallery-layout]");
      const actionButton = target.closest("[data-gallery-action]");
      const categoryButton = target.closest("[data-gallery-filter-category]");
      const galleryControl = layoutButton || actionButton || categoryButton;

      if (!galleryControl || event.__olfGalleryHandled) {
        return;
      }

      const galleryRoot = galleryControl.closest("[data-gallery-root]");

      if (!galleryRoot) {
        return;
      }

      const gallery = galleryRoot.querySelector(".gallery");

      if (!gallery) {
        return;
      }

      event.preventDefault();

      if (actionButton?.dataset.galleryAction === "shuffle") {
        [...gallery.children]
          .sort(() => Math.random() - 0.5)
          .forEach((card) => gallery.appendChild(card));
        return;
      }

      if (categoryButton) {
        const category = categoryButton.dataset.galleryFilterCategory || "all";
        const cards = [...gallery.querySelectorAll("[data-gallery-card]")];
        let visibleCount = 0;

        cards.forEach((card) => {
          const isVisible =
            category === "all" || card.dataset.galleryCategory === category;

          card.hidden = !isVisible;

          if (isVisible) {
            visibleCount += 1;
          }
        });

        galleryRoot
          .querySelectorAll("[data-gallery-filter-category]")
          .forEach((button) => {
            const isActive = button.dataset.galleryFilterCategory === category;

            button.classList.toggle("active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
          });

        const resultCount = galleryRoot.querySelector("[data-gallery-count]");

        if (resultCount) {
          resultCount.textContent =
            visibleCount + " " + (visibleCount === 1 ? "moment" : "moments");
        }

        return;
      }

      const layout = layoutButton?.dataset.galleryLayout;

      if (!layout) {
        return;
      }

      gallery.classList.toggle("gallery-gallery", layout === "gallery");
      gallery.classList.toggle("gallery-journal", layout === "journal");
      gallery.classList.remove("gallery-count-one");

      galleryRoot.querySelectorAll("[data-gallery-layout]").forEach((button) => {
        const isActive = button.dataset.galleryLayout === layout;
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      galleryRoot.querySelectorAll(".post-card").forEach((card) => {
        card.classList.toggle("post-card-gallery", layout === "gallery");
        card.classList.toggle("post-card-journal", layout === "journal");
      });
    });
  })();
`;

export const metadata = {
  title: {
    default: PRODUCT.name,
    template: `%s | ${PRODUCT.name}`,
  },
  description: PRODUCT.description,
};

export default async function RootLayout({ children }) {
  const { claims } = await getAuthenticatedUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          skip to main content
        </a>
        <div className="site-shell">
          <Navbar isAuthenticated={Boolean(claims)} />
          <div id="main-content" className="site-content" tabIndex="-1">
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
