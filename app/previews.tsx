/**
 * The little pictures on the tiles.
 *
 * They divide along the same line the page does, and for different reasons.
 *
 * The association's own four are real screenshots, captured signed in and then
 * scaled to 640px — about twice the width a tile ever paints them at, which is
 * enough for the layout to read and not enough for body text to. Everything
 * behind those links is behind a login, and these tiles render for signed-out
 * visitors too, so the images are public assets: Budu's headline totals and the
 * signed-in address are blurred out of its capture before it ships, and the
 * Tapahtumamanageri shot is deliberately its empty "Lisää tapahtuma" form
 * rather than the event list, which carries members' names, an address and a
 * phone number. Re-capturing any of these means checking that again.
 *
 * The four Google destinations get drawn marks instead. There is no signed-out
 * screenshot of somebody's inbox to take, and a real one would publish their
 * mail; a stylised mark in Google's own palette says which product it is
 * without any of that. They are placeholders, not the official logos.
 */

/**
 * A captured service. Width and height are the file's real pixels so the tile
 * reserves its space before the image arrives and the grid does not jump; the
 * `.preview` wrapper's aspect-ratio and `object-fit: cover` do the framing.
 *
 * `alt=""` on purpose: the tile already names the service, its host and what it
 * does, so announcing the picture as well would only repeat that.
 */
function Shot({ src }: { src: string }) {
  return <img src={src} alt="" width={640} height={340} loading="lazy" decoding="async" />;
}

export function KlapiPreview() {
  return <Shot src="/previews/klapi.jpg" />;
}
export function BuduPreview() {
  return <Shot src="/previews/budu.jpg" />;
}
export function TapahtumatPreview() {
  return <Shot src="/previews/tapahtumat.jpg" />;
}
export function NettisivutPreview() {
  return <Shot src="/previews/nettisivut.jpg" />;
}

/* ── The Google placeholders ──────────────────────────────────────────────
 *
 * Google's product palette, so the row reads as Google at a glance and as
 * plainly not-a-screenshot next to the four above it. Simplified silhouettes
 * rather than the real logos — the job is telling four tiles apart.
 */
const BLUE = '#4285F4';
const RED = '#EA4335';
const YELLOW = '#FBBC04';
const GREEN = '#34A853';

const CANVAS = {
  viewBox: '0 0 160 90',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: 'false',
} as const;

/** White ground, not the page wash: these sit under a product mark, not a UI. */
function Mark({ children }: { children: React.ReactNode }) {
  return (
    <svg {...CANVAS}>
      <rect width="160" height="90" fill="#FFFFFF" />
      {children}
    </svg>
  );
}

/** Gmail: the envelope, with the flap that makes its M. */
export function GmailPreview() {
  return (
    <Mark>
      <rect x="38" y="26" width="84" height="42" rx="6" fill="#FFFFFF" stroke={RED} strokeWidth="3" />
      <path d="M41 30 L80 53 L119 30" fill="none" stroke={RED} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </Mark>
  );
}

/** Drive: the tri-colour triangle. */
export function DrivePreview() {
  return (
    <Mark>
      <path d="M80 20 L62 46 L80 72 L98 46 Z" fill={BLUE} />
      <path d="M62 46 L44 72 L80 72 Z" fill={GREEN} />
      <path d="M98 46 L116 72 L80 72 Z" fill={YELLOW} />
    </Mark>
  );
}

/** Kalenteri: the torn-off page, with something booked on it. */
export function KalenteriPreview() {
  return (
    <Mark>
      <rect x="56" y="13" width="4" height="11" rx="2" fill={BLUE} />
      <rect x="100" y="13" width="4" height="11" rx="2" fill={BLUE} />
      <rect x="40" y="18" width="80" height="56" rx="6" fill="#FFFFFF" stroke={BLUE} strokeWidth="3" />
      <path d="M40 24 a6 6 0 0 1 6-6 h68 a6 6 0 0 1 6 6 v8 h-80 z" fill={BLUE} />
      <rect x="48" y="41" width="64" height="10" rx="3" fill={BLUE} opacity="0.35" />
      <rect x="48" y="56" width="42" height="10" rx="3" fill={BLUE} opacity="0.15" />
    </Mark>
  );
}

/**
 * Hallinta: a shield with a keyhole. The tile is shown to everyone in the
 * Workspace but only opens for an administrator, so the drawing says "locked"
 * rather than "yours".
 */
export function HallintaPreview() {
  return (
    <Mark>
      <path
        d="M80 15 L113 26 V49 c0 15 -15 22 -33 26 c-18 -4 -33 -11 -33 -26 V26 Z"
        fill="#FFFFFF"
        stroke={BLUE}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="80" cy="42" r="7" fill={BLUE} />
      <path d="M76 48 h8 l2.5 12 h-13 z" fill={BLUE} />
    </Mark>
  );
}
