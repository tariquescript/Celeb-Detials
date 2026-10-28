import React, { useEffect, useState } from "react";
import "./Header.css";

const LINKS = [
  { href: "#discover", label: "Discover" },
  { href: "#how", label: "How it works" },
  { href: "#stack", label: "Tech stack" },
];

const SOURCE_URL = "https://github.com/tariquescript/Celeb-Detials";

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.4-1.28.74-1.57-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.42.36.79 1.07.79 2.15v3.19c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z"
      />
    </svg>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the drawer on Escape, and lock the page behind it while it is open.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
        <div className="site-header__inner shell">
          <a className="brand" href="#top" onClick={close}>
            <span className="brand__mark" aria-hidden="true">
              <span className="brand__orb" />
            </span>
            <span className="brand__text">
              <span className="brand__name">LUMINA</span>
              <span className="brand__tag">celebrity intelligence</span>
            </span>
          </a>

          <nav className="nav-desktop" aria-label="Primary">
            <ul>
              {LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__actions">
            <a
              className="btn-ghost"
              href={SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source on GitHub"
            >
              <GitHubIcon />
              <span>Source</span>
            </a>

            <button
              className={`burger${open ? " is-open" : ""}`}
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      {/* Rendered outside <header>: once scrolled, the header's backdrop-filter
          would make it the containing block for this fixed overlay and trap
          the menu inside a 74px bar. */}
      <div
        id="mobile-menu"
        className={`nav-mobile${open ? " is-open" : ""}`}
        onClick={close}
        aria-hidden={!open}
      >
        <nav
          className="nav-mobile__panel"
          aria-label="Mobile"
          onClick={(e) => e.stopPropagation()}
        >
          <ul>
            {LINKS.map((link, i) => (
              <li key={link.href} style={{ transitionDelay: `${80 + i * 55}ms` }}>
                <a href={link.href} onClick={close} tabIndex={open ? 0 : -1}>
                  <span className="nav-mobile__index">0{i + 1}</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            className="nav-mobile__cta"
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            tabIndex={open ? 0 : -1}
          >
            View source
          </a>
        </nav>
      </div>
    </>
  );
}

export default Header;
