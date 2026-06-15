import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PRODUCT } from "../constants/product";
import { getAuthenticatedUser } from "../lib/auth";

const themeScript = `
  (() => {
    try {
      const savedTheme = localStorage.getItem("olf-theme");
      const systemTheme = matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      const theme = savedTheme === "dark" || savedTheme === "light"
        ? savedTheme
        : systemTheme;

      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch {
      document.documentElement.dataset.theme = "light";
    }
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
