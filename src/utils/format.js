/* Small presentation helpers shared by the result cards. */

const COMPACT = [
  { limit: 1e12, suffix: "T" },
  { limit: 1e9, suffix: "B" },
  { limit: 1e6, suffix: "M" },
  { limit: 1e3, suffix: "K" },
];

export function formatMoney(value) {
  const n = Number(value);
  if (!value || Number.isNaN(n) || n <= 0) return null;
  for (let i = 0; i < COMPACT.length; i++) {
    const { limit, suffix } = COMPACT[i];
    if (n >= limit) {
      const scaled = n / limit;
      return `$${scaled >= 100 ? Math.round(scaled) : scaled.toFixed(1).replace(/\.0$/, "")}${suffix}`;
    }
  }
  return `$${n}`;
}

/* Position of a net worth on a log scale from $100K to $100B, so the bar
   under the figure compares cards honestly (a billionaire is not 1000x the
   bar length of a millionaire, but is visibly further along). */
export function worthRatio(value) {
  const n = Number(value);
  if (!n || Number.isNaN(n) || n <= 0) return 0;
  const t = (Math.log10(n) - 5) / (11 - 5);
  return Math.min(Math.max(t, 0.04), 1);
}

export function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatHeight(value) {
  const m = Number(value);
  if (!value || Number.isNaN(m) || m <= 0) return null;
  const totalInches = m * 39.3701;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return `${m.toFixed(2)} m · ${feet}'${inches}"`;
}

/* ISO-3166 alpha-2 → regional indicator pair, e.g. "us" → 🇺🇸 */
export function flagFor(code) {
  if (!code || code.length !== 2 || !/^[a-z]{2}$/i.test(code)) return "";
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => 127397 + c.charCodeAt(0))
  );
}

export function countryName(code) {
  if (!code) return null;
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
      const dn = new Intl.DisplayNames(["en"], { type: "region" });
      return dn.of(code.toUpperCase()) || code.toUpperCase();
    }
  } catch (err) {
    /* older engines: fall through to the raw code */
  }
  return code.toUpperCase();
}

export function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/* The API returns snake_case slugs for occupations ("film_producer"), so
   underscores become spaces before casing. */
export function titleCase(value) {
  if (!value) return "";
  return String(value)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^\s]+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

/* Deterministic per-name accent so every card feels individually art-directed
   while the palette stays fixed. */
export function accentFor(name) {
  const palettes = [
    ["#8b5cf6", "#22d3ee"],
    ["#f5c26b", "#ff5d8f"],
    ["#22d3ee", "#6ee7b7"],
    ["#ff5d8f", "#8b5cf6"],
    ["#60a5fa", "#a78bfa"],
    ["#fbbf24", "#22d3ee"],
  ];
  let hash = 0;
  const key = String(name || "");
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return palettes[hash % palettes.length];
}
