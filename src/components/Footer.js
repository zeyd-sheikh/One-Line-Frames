import Link from "next/link";
import { PRODUCT, SUPPORT_LINKS } from "../constants/product";
import { ROUTES } from "../constants/routes";
import Icon from "./Icon";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link href={ROUTES.home} className="footer-logo">
            {PRODUCT.shortName}
          </Link>
          <p>
            a quiet place for student-made moments,
            <br />
            built with care at utsc.
          </p>
        </div>

        <div className="footer-column">
          <p className="footer-label">wander</p>
          <Link href={ROUTES.home}>home</Link>
          <Link href={ROUTES.gallery}>gallery</Link>
          <Link href={ROUTES.submit}>send a moment</Link>
          <Link href={ROUTES.about}>about</Link>
        </div>

        <div className="footer-column">
          <p className="footer-label">care</p>
          <Link href={ROUTES.privacy}>privacy</Link>
          <Link href={ROUTES.login}>your account</Link>
          <Link href={ROUTES.contact}>contact</Link>
        </div>

        <div className="footer-support">
          <div className="support-icon">
            <Icon name="sparkle" size={17} />
          </div>
          <div>
            <p>if things feel heavy, you do not have to carry them alone.</p>
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
        </div>
      </div>

      <div className="footer-bottom">
        <span>one photo. one line. one moment.</span>
        <span>toronto, canada</span>
      </div>
    </footer>
  );
}
