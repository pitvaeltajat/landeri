/**
 * The little pictures on the tiles.
 *
 * Not real screenshots: every service behind these links sits behind a login,
 * so nothing here could be captured without shipping a signed-in session's
 * contents into a public asset. These are wireframes instead — drawn inline as
 * SVG in the brand variables from `globals.css`, so they cost no request, stay
 * crisp at any size and re-tint themselves if the palette ever moves.
 *
 * They divide along the same line the page does. The association's own four
 * apps get a *screen*: the navy topbar those apps actually wear, with their
 * characteristic content under it. The four Google destinations get a *mark*,
 * because a generic Google screen would tell nobody which of the four it was.
 * Distinguishing the tiles at a glance is the whole job, so what matters in
 * each drawing is the silhouette — rows, bars, a grid, an envelope, a triangle
 * — not the detail.
 */

/** Every drawing shares one canvas, so the tiles crop identically. */
const CANVAS = {
  viewBox: '0 0 160 90',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: 'false',
} as const;

/**
 * The chrome our own apps share: white page, navy bar, wordmark. Drawn full
 * bleed and square-cornered — the tile's `.preview` wrapper does the rounding,
 * which is one clip instead of a `clipPath` with a unique id per drawing.
 */
function Screen({ children }: { children: React.ReactNode }) {
  return (
    <svg {...CANVAS}>
      <rect width="160" height="90" fill="var(--card)" />
      <rect width="160" height="14" fill="var(--primary)" />
      <rect x="9" y="5.5" width="24" height="3" rx="1.5" fill="var(--primary-foreground)" opacity="0.85" />
      {children}
    </svg>
  );
}

/** Klapi: the lending list — a row per item, each with its status pill. */
export function KlapiPreview() {
  return (
    <Screen>
      {[24, 43, 62].map((y, i) => (
        <g key={y}>
          <rect x="10" y={y} width="140" height="16" rx="3" fill="var(--muted)" />
          <rect x="16" y={y + 4} width={[54, 42, 48][i]} height="3" rx="1.5" fill="var(--primary)" opacity="0.45" />
          <rect x="16" y={y + 9.5} width={[30, 36, 24][i]} height="2.5" rx="1.25" fill="var(--primary)" opacity="0.2" />
          <rect
            x="128"
            y={y + 5}
            width="16"
            height="6"
            rx="3"
            fill={i === 1 ? 'var(--secondary)' : 'var(--cta)'}
          />
        </g>
      ))}
    </Screen>
  );
}

/** Budu: spend against budget — bars under the dashed line they must stay below. */
export function BuduPreview() {
  const bars = [30, 46, 20, 54, 34];
  return (
    <Screen>
      <rect x="10" y="75" width="140" height="1.5" fill="var(--primary)" opacity="0.25" />
      {bars.map((height, i) => (
        <rect
          key={i}
          x={18 + i * 26}
          y={75 - height}
          width="18"
          height={height}
          rx="2"
          fill={height > 50 ? 'var(--cta)' : 'var(--primary)'}
          opacity={height > 50 ? 1 : 0.35}
        />
      ))}
      <line x1="10" y1="26" x2="150" y2="26" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.4" />
    </Screen>
  );
}

/** Tapahtumamanageri: the month, with the days that have something on them filled. */
export function TapahtumatPreview() {
  const columns = [0, 1, 2, 3, 4, 5, 6];
  const rows = [34, 51, 68];
  const busy = new Set(['0-2', '1-5', '2-1']);
  return (
    <Screen>
      {columns.map((column) => (
        <rect key={column} x={16 + column * 20} y="24" width="8" height="3" rx="1.5" fill="var(--primary)" opacity="0.3" />
      ))}
      {rows.map((y, row) =>
        columns.map((column) => {
          const filled = busy.has(`${row}-${column}`);
          return (
            <rect
              key={`${row}-${column}`}
              x={12 + column * 20}
              y={y}
              width="16"
              height="13"
              rx="2.5"
              fill={filled ? 'var(--cta)' : 'var(--muted)'}
            />
          );
        }),
      )}
    </Screen>
  );
}

/**
 * Nettisivut: a browser rather than our topbar, because pitva.fi is the
 * association's public site and not one of these apps.
 */
export function NettisivutPreview() {
  return (
    <svg {...CANVAS}>
      <rect width="160" height="90" fill="var(--card)" />
      <rect width="160" height="13" fill="var(--muted)" />
      {[9, 17, 25].map((cx) => (
        <circle key={cx} cx={cx} cy="6.5" r="2" fill="var(--primary)" opacity="0.25" />
      ))}
      <rect x="36" y="4" width="76" height="5" rx="2.5" fill="var(--primary)" opacity="0.12" />
      <rect x="10" y="21" width="140" height="28" rx="3" fill="var(--cta)" />
      <rect x="18" y="29" width="58" height="4" rx="2" fill="var(--primary)" opacity="0.5" />
      <rect x="18" y="37" width="38" height="3" rx="1.5" fill="var(--primary)" opacity="0.3" />
      {[10, 60, 110].map((x) => (
        <rect key={x} x={x} y="55" width="40" height="24" rx="3" fill="var(--muted)" />
      ))}
    </svg>
  );
}

/**
 * The Google destinations. A mark on the page wash, sized and weighted to sit
 * at the same visual volume as the four screens above them.
 */
function Mark({ children }: { children: React.ReactNode }) {
  return (
    <svg {...CANVAS}>
      <rect width="160" height="90" fill="var(--muted)" />
      {children}
    </svg>
  );
}

/** Gmail: an envelope, flap open. */
export function GmailPreview() {
  return (
    <Mark>
      <rect x="38" y="24" width="84" height="44" rx="5" fill="var(--card)" stroke="var(--primary)" strokeOpacity="0.3" strokeWidth="2" />
      <path d="M40 28 L80 52 L120 28" fill="none" stroke="var(--primary)" strokeOpacity="0.45" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="120" cy="26" r="7" fill="var(--cta)" />
    </Mark>
  );
}

/** Drive: the three-part triangle. */
export function DrivePreview() {
  return (
    <Mark>
      {/* apex (80,20), base (44,72)–(116,72), cut from each edge's midpoint to the base's */}
      <path d="M80 20 L62 46 L80 72 L98 46 Z" fill="var(--primary)" opacity="0.45" />
      <path d="M62 46 L44 72 L80 72 Z" fill="var(--primary)" opacity="0.2" />
      <path d="M98 46 L116 72 L80 72 Z" fill="var(--cta)" />
    </Mark>
  );
}

/** Kalenteri: a torn-off page with two things booked on it. */
export function KalenteriPreview() {
  return (
    <Mark>
      <rect x="56" y="13" width="4" height="11" rx="2" fill="var(--primary)" opacity="0.45" />
      <rect x="100" y="13" width="4" height="11" rx="2" fill="var(--primary)" opacity="0.45" />
      <rect x="40" y="18" width="80" height="56" rx="6" fill="var(--card)" stroke="var(--primary)" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M40 24 a6 6 0 0 1 6-6 h68 a6 6 0 0 1 6 6 v8 h-80 z" fill="var(--primary)" />
      <rect x="48" y="41" width="64" height="10" rx="3" fill="var(--cta)" />
      <rect x="48" y="56" width="42" height="10" rx="3" fill="var(--muted)" />
    </Mark>
  );
}

/**
 * Hallinta: a shield with a keyhole. The tile is shown to everyone in the
 * Workspace but only opens for an administrator, so the drawing says
 * "locked" rather than "yours".
 */
export function HallintaPreview() {
  return (
    <Mark>
      <path
        d="M80 15 L113 26 V49 c0 15 -15 22 -33 26 c-18 -4 -33 -11 -33 -26 V26 Z"
        fill="var(--card)"
        stroke="var(--primary)"
        strokeOpacity="0.3"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="80" cy="42" r="7" fill="var(--primary)" opacity="0.45" />
      <path d="M76 48 h8 l2.5 12 h-13 z" fill="var(--primary)" opacity="0.45" />
    </Mark>
  );
}
