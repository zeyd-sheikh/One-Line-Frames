import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PRODUCT } from "../constants/product";

export const metadata = {
  title: {
    default: PRODUCT.name,
    template: `%s | ${PRODUCT.name}`,
  },
  description: PRODUCT.description,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <Navbar />
          <div className="site-content">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
