import React from "react";
import "./Header.css";
import { MainLogo } from "../Celeb";

function Header() {
  return (
    <div>
      <header className="header">
        <a href="/" className="logo">
          <img className="logo-name" src={MainLogo.mainLogo} alt="Logo" />
        </a>

        <ul className="menu">
          <li>
            <a href="#skills">About</a>
          </li>
          <li>
            <a href="#experience">Work Experiences</a>
          </li>

          <li>
            <a href="#achievements">Skills</a>
          </li>

          <li>
            <a href="#contact">Contact Me</a>
          </li>
        </ul>
      </header>
    </div>
  );
}
export default Header;
