import React, { useEffect, useRef, useState } from "react";
import "./searchbar.css";

const ROTATING = [
  "Leonardo DiCaprio",
  "Zendaya",
  "Dwayne Johnson",
  "Emma Watson",
  "Keanu Reeves",
  "Scarlett Johansson",
];

function useTypedPlaceholder(active) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!active) return undefined;
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setText(ROTATING[0]);
      return undefined;
    }

    let word = 0;
    let char = 0;
    let deleting = false;
    let timer = null;

    const tick = () => {
      const current = ROTATING[word];
      char += deleting ? -1 : 1;
      setText(current.slice(0, char));

      let delay = deleting ? 38 : 78;
      if (!deleting && char === current.length) {
        deleting = true;
        delay = 1500;
      } else if (deleting && char === 0) {
        deleting = false;
        word = (word + 1) % ROTATING.length;
        delay = 350;
      }
      timer = window.setTimeout(tick, delay);
    };

    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, [active]);

  return text;
}

function SearchBar({
  search,
  searchUpdate,
  onClear,
  onSubmit,
  loading,
  hint,
  suggestions = [],
  onPick,
}) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const empty = !search;
  const typed = useTypedPlaceholder(empty && !focused);

  // "/" anywhere on the page jumps into the field — a small power-user touch.
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current && inputRef.current.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      e.currentTarget.blur();
      onClear && onClear();
    }
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit && onSubmit();
    }
  };

  return (
    <div className="search">
      <div
        className={`search-shell${focused ? " is-focused" : ""}${
          loading ? " is-loading" : ""
        }`}
      >
        <div className="search-field">
          <span className="search-icon" aria-hidden="true">
            {loading ? (
              <span className="search-spinner" />
            ) : (
              <svg viewBox="0 0 24 24" width="21" height="21">
                <circle
                  cx="10.5"
                  cy="10.5"
                  r="6.6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                />
                <path
                  d="M15.6 15.6 20.5 20.5"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </span>

          <label className="sr-only" htmlFor="celeb-search">
            Search for a celebrity
          </label>
          <input
            id="celeb-search"
            ref={inputRef}
            className="search-input"
            type="search"
            value={search}
            onChange={searchUpdate}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={focused ? "Start typing a name…" : ""}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            aria-describedby="search-hint"
          />

          {empty && !focused && (
            <span className="search-ghost" aria-hidden="true">
              Search&nbsp;
              <span className="search-ghost__typed">
                {typed}
                <i className="search-caret" />
              </span>
            </span>
          )}

          <div className="search-actions">
            {!empty && (
              <button
                type="button"
                className="search-clear"
                onClick={onClear}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" width="15" height="15">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
            <kbd className="search-kbd" aria-hidden="true">
              /
            </kbd>
          </div>
        </div>
      </div>

      <p className="search-hint" id="search-hint">
        {hint || "Type at least 3 letters — results stream in automatically."}
      </p>

      {suggestions.length > 0 && (
        <div className="search-chips">
          <span className="search-chips__label">Try</span>
          {suggestions.map((name, i) => (
            <button
              key={name}
              type="button"
              className="chip"
              style={{ animationDelay: `${0.35 + i * 0.07}s` }}
              onClick={() => onPick && onPick(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
