import Link from "next/link";

export default function Navbar({ activePage }) {
  return (
    <nav className="navbar">
      <Link href="/" className="logo">
        one line frames.
      </Link>

      <div className="nav-links">
        <Link href="/" className={activePage === "moments" ? "active" : ""}>
          moments
        </Link>

        <Link
          href="/submit"
          className={activePage === "submit" ? "active" : ""}
        >
          send a moment
        </Link>

        <Link href="/about" className={activePage === "about" ? "active" : ""}>
          about
        </Link>
      </div>
    </nav>
  );
}