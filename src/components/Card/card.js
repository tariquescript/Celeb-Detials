import React, { useCallback, useRef } from "react";
import "./card.css";
import {
  accentFor,
  countryName,
  flagFor,
  formatDate,
  formatHeight,
  formatMoney,
  initials,
  titleCase,
  worthRatio,
} from "../../utils/format";

function Card({
  name,
  dob,
  nationality,
  occupation,
  netWorth,
  height,
  age,
  gender,
  isAlive,
  index = 0,
}) {
  const ref = useRef(null);

  /* Pointer-driven tilt + spotlight. Values are written straight to CSS
     custom properties so React never re-renders on mouse move. */
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: none)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
    el.style.setProperty("--rx", `${(0.5 - py) * 9}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 11}deg`);
  }, []);

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "0%");
  }, []);

  const jobs = Array.isArray(occupation)
    ? occupation
    : String(occupation || "")
        .split(",")
        .filter(Boolean);

  const worth = formatMoney(netWorth);
  const country = nationality ? countryName(nationality) : null;
  const flag = flagFor(nationality);
  const stature = formatHeight(height);
  const born = formatDate(dob);
  const [c1, c2] = accentFor(name);

  const facts = [
    { key: "Born", value: born },
    { key: "Age", value: age ? `${age} years` : null },
    { key: "Origin", value: country ? `${flag} ${country}` : null },
    { key: "Height", value: stature },
    { key: "Gender", value: gender ? titleCase(gender) : null },
    {
      key: "Status",
      value:
        typeof isAlive === "boolean" ? (isAlive ? "Living" : "In memoriam") : null,
    },
  ].filter((f) => f.value);

  return (
    <article
      ref={ref}
      className="celeb-card"
      style={{
        "--c1": c1,
        "--c2": c2,
        animationDelay: `${Math.min(index, 11) * 60}ms`,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div className="celeb-card__inner">
        <div className="celeb-card__sheen" aria-hidden="true" />

        <header className="celeb-card__head">
          <div className="avatar" aria-hidden="true">
            <span className="avatar__ring" />
            <span className="avatar__initials">{initials(name)}</span>
            {typeof isAlive === "boolean" && (
              <span
                className={`avatar__status${isAlive ? " is-live" : ""}`}
                title={isAlive ? "Living" : "In memoriam"}
              />
            )}
          </div>

          <div className="celeb-card__id">
            <h3 className="celeb-card__name">{name}</h3>
            <p className="celeb-card__role">
              {jobs.length ? titleCase(jobs.slice(0, 2).join(" · ")) : "Public figure"}
            </p>
          </div>

        </header>

        {worth && (
          <div className="networth">
            <span className="networth__label">Est. net worth</span>
            <span className="networth__value">{worth}</span>
            <span
              className="networth__bar"
              aria-hidden="true"
              title="Relative position on a log scale from $100K to $100B"
            >
              <i style={{ width: `${Math.round(worthRatio(netWorth) * 100)}%` }} />
            </span>
          </div>
        )}

        <dl className="facts">
          {facts.map((fact) => (
            <div className="facts__row" key={fact.key}>
              <dt>{fact.key}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {jobs.length > 0 && (
          <ul className="tags">
            {jobs.slice(0, 4).map((job) => (
              <li key={job}>{titleCase(job)}</li>
            ))}
          </ul>
        )}

        <footer className="celeb-card__foot">
          <a
            className="celeb-card__cta"
            href={`https://www.google.com/search?q=${encodeURIComponent(name)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open full dossier
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path
                d="M5 12h13M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        </footer>
      </div>
    </article>
  );
}

export default Card;
