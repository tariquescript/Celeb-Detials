import React from "react";
import "./Ticker.css";

/* An endless band of names along the foot of the cover. The list is rendered
   twice and the track slides by exactly one copy, so the loop has no seam.
   Only the first copy is exposed to assistive tech and the tab order. */
function Ticker({ label, names = [], onPick }) {
  const group = (copy) => (
    <ul className="ticker__group" aria-hidden={copy ? true : undefined}>
      {names.map((name) => (
        <li key={name}>
          <button
            type="button"
            className="ticker__name"
            tabIndex={copy ? -1 : undefined}
            onClick={() => onPick && onPick(name)}
          >
            {name}
          </button>
          <span className="ticker__sep" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="ticker" role="region" aria-label={label}>
      <span className="ticker__label" aria-hidden="true">
        {label}
      </span>
      <div className="ticker__viewport">
        <div className="ticker__track">
          {group(false)}
          {group(true)}
        </div>
      </div>
    </div>
  );
}

export default Ticker;
