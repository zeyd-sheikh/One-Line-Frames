import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PRODUCT } from "../constants/product";
import { getAuthenticatedUser } from "../lib/auth";

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
    <html lang="en">
      <body>
        <div className="site-shell">
          <Navbar isAuthenticated={Boolean(claims)} />
          <div className="site-content">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
