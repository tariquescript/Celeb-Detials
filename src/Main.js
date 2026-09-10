import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./Main.css";
import Header from "./components/Header/Header";
import SearchBar from "./components/SearchBar/searchbar";
import Card from "./components/Card/card";
import Scene from "./components/Scene/Scene";
import Footer from "./components/Footer/Footer";
import { titleCase } from "./utils/format";

const MIN_QUERY = 3;
const DEBOUNCE_MS = 550;

const SUGGESTIONS = [
  "Tom Hanks",
  "Rihanna",
  "Cristiano Ronaldo",
  "Taylor Swift",
];

const STEPS = [
  {
    n: "01",
    title: "Type a name",
    body:
      "The field debounces your keystrokes, cancels stale requests in flight and only fires once you've paused — so the archive is never hammered.",
  },
  {
    n: "02",
    title: "The archive answers",
    body:
      "A live REST call returns the public record: craft, origin, stature, estimated worth. Results stream in and animate into place.",
  },
  {
    n: "03",
    title: "Open the dossier",
    body:
      "Every card links straight out to a full web search for that figure, so a shallow match is always one click from the deep story.",
  },
];

const STACK = [
  { label: "React 16", note: "Hooks, no class components" },
  { label: "three.js", note: "Hand-built WebGL scene" },
  { label: "GLSL", note: "Custom vertex + fragment shaders" },
  { label: "REST API", note: "Debounced, abortable fetch" },
  { label: "CSS", note: "Design tokens, zero UI framework" },
  { label: "A11y", note: "Keyboard, labels, reduced motion" },
];

// Turn transport and HTTP failures into something a visitor can act on.
function describeError(err) {
  const status = err && err.status;
  if (status === 401 || status === 403) {
    return "The API key was rejected. Check REACT_APP_RAPIDAPI_KEY in your .env file.";
  }
  if (status === 429) {
    return "Too many searches in a short window. Give it a few seconds and retry.";
  }
  if (status >= 500) {
    return `The archive had a problem on its end (HTTP ${status}). Try again shortly.`;
  }
  if (status) return `The archive replied with HTTP ${status}.`;
  return "Could not reach the archive. Check your connection and try again.";
}

function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card__head">
        <span className="skeleton-line skeleton-line--avatar" />
        <div>
          <span className="skeleton-line skeleton-line--title" />
          <span className="skeleton-line skeleton-line--sub" />
        </div>
      </div>
      <span className="skeleton-line skeleton-line--block" />
      <span className="skeleton-line skeleton-line--row" />
      <span className="skeleton-line skeleton-line--row is-short" />
      <span className="skeleton-line skeleton-line--row" />
    </div>
  );
}

function Main() {
  const [celebs, setCelebs] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ready | empty | error
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0); // bumped by "Try again" to refetch
  const abortRef = useRef(null);

  const query = search.trim();

  useEffect(() => {
    if (query.length < MIN_QUERY) {
      if (abortRef.current) abortRef.current.abort();
      setCelebs([]);
      setStatus("idle");
      setError("");
      return undefined;
    }

    const timer = setTimeout(() => {
      // Cancel whatever is still in flight — the newest keystroke wins.
      if (abortRef.current) abortRef.current.abort();
      const controller =
        typeof AbortController !== "undefined" ? new AbortController() : null;
      abortRef.current = controller;

      setStatus("loading");
      setError("");

      fetch(
        `https://celebrity-by-api-ninjas.p.rapidapi.com/v1/celebrity?name=${encodeURIComponent(
          query
        )}`,
        {
          method: "GET",
          signal: controller ? controller.signal : undefined,
          headers: {
            "X-RapidAPI-Key": process.env.REACT_APP_RAPIDAPI_KEY,
            "X-RapidAPI-Host": "celebrity-by-api-ninjas.p.rapidapi.com",
          },
        }
      )
        .then((res) => {
          if (!res.ok) {
            const httpError = new Error(`HTTP ${res.status}`);
            httpError.status = res.status;
            throw httpError;
          }
          return res.json();
        })
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setCelebs(list);
          setStatus(list.length ? "ready" : "empty");
        })
        .catch((err) => {
          if (err && err.name === "AbortError") return;
          setCelebs([]);
          setStatus("error");
          setError(describeError(err));
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, attempt]);

  useEffect(
    () => () => {
      if (abortRef.current) abortRef.current.abort();
    },
    []
  );

  const searchUpdate = useCallback((e) => setSearch(e.target.value), []);
  const clearSearch = useCallback(() => setSearch(""), []);

  const scrollToResults = useCallback(() => {
    const target = document.getElementById("discover");
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const pickSuggestion = useCallback(
    (name) => {
      setSearch(name);
      scrollToResults();
    },
    [scrollToResults]
  );

  const results = useMemo(
    () =>
      celebs
        .filter((c) => c && c.name)
        .map((c) => ({ ...c, name: titleCase(c.name) })),
    [celebs]
  );

  const hint = {
    loading: "Scanning the archive…",
    ready: `${results.length} match${results.length === 1 ? "" : "es"} below — press Esc to clear.`,
    empty: "No match yet — try a fuller name.",
    error: "The archive didn't answer. Try again in a moment.",
  }[status];

  // Feed the WebGL scene: it breathes harder while a request is in flight.
  const energy =
    status === "loading" ? 1 : results.length ? 0.4 : query.length ? 0.2 : 0;

  return (
    <>
      <Scene energy={energy} />
      <Header />

      <main id="top">
        {/* ------------------------------------------------------------ hero */}
        <section className="hero">
          <div className="shell hero__inner">
            <div className="hero__copy">
            <span className="eyebrow rise">
              <i className="eyebrow__dot" />
              Live celebrity intelligence
            </span>

            <h1 className="hero__title">
              <span className="hero__line rise" style={{ animationDelay: "0.1s" }}>
                Search anyone
              </span>
              <span
                className="hero__line gradient-text rise"
                style={{ animationDelay: "0.22s" }}
              >
                worth knowing.
              </span>
            </h1>

            <p className="hero__lede rise" style={{ animationDelay: "0.34s" }}>
              A rendered, real-time window into the public record. Type a name and
              LUMINA pulls the craft, the origin, the numbers — framed inside a
              scene drawn by your GPU.
            </p>

            <SearchBar
              search={search}
              searchUpdate={searchUpdate}
              onClear={clearSearch}
              onSubmit={scrollToResults}
              loading={status === "loading"}
              hint={hint}
              suggestions={SUGGESTIONS}
              onPick={pickSuggestion}
            />

            <ul className="hero__stats rise" style={{ animationDelay: "0.6s" }}>
              <li>
                <strong>Real-time</strong>
                <span>Debounced live API</span>
              </li>
              <li>
                <strong>WebGL</strong>
                <span>Custom GLSL scene</span>
              </li>
              <li>
                <strong>Responsive</strong>
                <span>320px → ultrawide</span>
              </li>
            </ul>
            </div>

            {/* Reserved stage for the WebGL composition on wide screens. */}
            <div className="hero__stage" aria-hidden="true" />
          </div>

          <a className="scroll-cue" href="#discover" aria-label="Scroll to results">
            <span className="scroll-cue__track">
              <span className="scroll-cue__dot" />
            </span>
          </a>
        </section>

        {/* --------------------------------------------------------- results */}
        <section className="results" id="discover">
          <div className="shell">
            <div className="section-head">
              <div>
                <span className="section-kicker">Results</span>
                <h2 className="section-title">
                  {status === "ready"
                    ? `${results.length} profile${results.length === 1 ? "" : "s"} matched`
                    : "The dossier"}
                </h2>
              </div>

              {query && (
                <span className={`pill pill--${status}`}>
                  {status === "loading" && "Searching"}
                  {status === "ready" && `“${query}”`}
                  {status === "empty" && "No match"}
                  {status === "error" && "Error"}
                  {status === "idle" && "Waiting"}
                </span>
              )}
            </div>

            <div className="results__body" aria-live="polite" aria-busy={status === "loading"}>
              {status === "loading" && (
                <div className="grid">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              )}

              {status === "ready" && (
                <div className="grid">
                  {results.map((celeb, index) => (
                    <Card
                      key={`${celeb.name}-${index}`}
                      index={index}
                      name={celeb.name}
                      dob={celeb.birthday}
                      nationality={celeb.nationality}
                      occupation={celeb.occupation}
                      netWorth={celeb.net_worth}
                      height={celeb.height}
                      age={celeb.age}
                      gender={celeb.gender}
                      isAlive={
                        typeof celeb.is_alive === "boolean" ? celeb.is_alive : undefined
                      }
                    />
                  ))}
                </div>
              )}

              {status === "idle" && (
                <div className="state">
                  <div className="state__glyph" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                  <h3>
                    {query.length
                      ? `Keep going — ${MIN_QUERY - query.length} more character${
                          MIN_QUERY - query.length === 1 ? "" : "s"
                        }`
                      : "Nothing searched yet"}
                  </h3>
                  <p>
                    Start with a name above, or tap one of the suggestions to see the
                    interface fill in.
                  </p>
                </div>
              )}

              {status === "empty" && (
                <div className="state">
                  <div className="state__glyph state__glyph--empty" aria-hidden="true">
                    ∅
                  </div>
                  <h3>No one by that name</h3>
                  <p>
                    The archive has no entry for “{query}”. Check the spelling, or try
                    a fuller name.
                  </p>
                  <button className="btn-solid" onClick={clearSearch}>
                    Clear search
                  </button>
                </div>
              )}

              {status === "error" && (
                <div className="state state--error">
                  <div className="state__glyph state__glyph--error" aria-hidden="true">
                    !
                  </div>
                  <h3>The archive is unreachable</h3>
                  <p>{error}</p>
                  <button
                    className="btn-solid"
                    onClick={() => setAttempt((n) => n + 1)}
                  >
                    Try again
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------- how */}
        <section className="how" id="how">
          <div className="shell">
            <div className="section-head">
              <div>
                <span className="section-kicker">How it works</span>
                <h2 className="section-title">Three moves, no friction</h2>
              </div>
            </div>

            <div className="steps">
              {STEPS.map((step) => (
                <article className="step" key={step.n}>
                  <span className="step__n">{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------- stack */}
        <section className="stack" id="stack">
          <div className="shell">
            <div className="section-head">
              <div>
                <span className="section-kicker">Under the hood</span>
                <h2 className="section-title">Built from scratch</h2>
              </div>
            </div>

            <div className="stack__grid">
              {STACK.map((item) => (
                <div className="stack__item" key={item.label}>
                  <span className="stack__label">{item.label}</span>
                  <span className="stack__note">{item.note}</span>
                </div>
              ))}
            </div>

            <p className="stack__foot">
              The hero scene is a bespoke three.js composition — a simplex-noise
              displaced orb with analytically re-derived normals, a spiral particle
              galaxy, additive energy rings and a parallax starfield. No model files,
              no textures, no post-processing library: every pixel is generated by
              shaders written for this project. It caps its pixel ratio, scales its
              particle budget to the device, and stops rendering whenever the tab is
              hidden.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

export default Main;
