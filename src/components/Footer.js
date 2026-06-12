import Link from "next/link";
import { PRODUCT, SUPPORT_LINKS } from "../constants/product";
import { ROUTES } from "../constants/routes";

export default function Footer() {
  return (
    <footer className="footer">
      <p>a quiet place to notice things. built with care at utsc.</p>

      <div className="support">
        <span>if you&apos;re struggling, you&apos;re not alone.</span>

        <div className="footer-links">
          {SUPPORT_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noreferrer"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      <div className="footer-links footer-site-links">
        <Link href={ROUTES.privacy}>privacy</Link>
        <Link href={ROUTES.login}>account</Link>
        <a href={`mailto:${PRODUCT.contactEmail}`}>contact</a>
      </div>
    </footer>
  );
}
