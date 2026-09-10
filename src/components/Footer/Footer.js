import React from "react";
import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-footer__name">LUMINA</span>
          <p>
            A search interface for the public record, rendered in WebGL. Data from
            the API&nbsp;Ninjas celebrity endpoint.
          </p>
        </div>

        <div className="site-footer__meta">
          <a href="#top" className="site-footer__top">
            Back to top
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path
                d="M12 19V5M6 11l6-6 6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
          <span className="site-footer__copy">
            © {new Date().getFullYear()} — designed &amp; built by Tarique Shaikh
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
