/**
 * The little pictures on the tiles. Every one is now an image in
 * `public/previews/`, but they come from two very different places.
 *
 * **The association's six** are real screenshots, captured signed in and
 * scaled to 640px — about twice the width a tile ever paints them at, which is
 * enough for the layout to read and not enough for body text to.
 *
 * They are public assets. The tiles render for signed-out visitors, so anything
 * legible in these files is legible to anyone, and to anything that caches or
 * indexes the page. Two of them are therefore not what the camera saw: Budu's
 * headline totals and the signed-in address are blurred, and the
 * Tapahtumamanageri shot is deliberately its empty form rather than the event
 * list, which carries members' names, an address and a phone number.
 * Re-capturing any of these means checking that again — the README has the
 * detail.
 *
 * **All four Google ones** are the real products, captured on the
 * association's own Workspace account and redacted *in the page before the
 * shutter*: a stylesheet was injected that blurs every file name, event chip,
 * console card, search field and the account button, so no readable content was
 * ever written to a file. What is left is Google's own chrome — logos, nav
 * rails, toolbars, the calendar grid. The Gmail inbox happened to be empty,
 * which is why its list needs no blur, and the admin console's own header is
 * left crisp because the organisation's name is the association's own.
 *
 * The admin console will only load behind a fresh sign-in challenge, so
 * re-capturing it means signing in first — in the browser, not from here.
 */

/**
 * Width and height are the files' real pixels so a tile reserves its space
 * before the image arrives and the grid does not jump; the `.preview` wrapper's
 * aspect-ratio and `object-fit: cover` do the framing.
 *
 * `alt=""` on purpose: the tile already names the service, its host and what it
 * does, so announcing the picture as well would only repeat that.
 */
function Shot({ src, height }: { src: string; height: number }) {
  return <img src={src} alt="" width={640} height={height} loading="lazy" decoding="async" />;
}

/* ── The association's own ────────────────────────────────────────────────── */

export function KlapiPreview() {
  return <Shot src="/previews/klapi.jpg" height={340} />;
}
export function BuduPreview() {
  return <Shot src="/previews/budu.jpg" height={340} />;
}
export function TapahtumatPreview() {
  return <Shot src="/previews/tapahtumat.jpg" height={360} />;
}
export function KuvatPreview() {
  return <Shot src="/previews/kuvat.jpg" height={360} />;
}
export function KululaskutPreview() {
  return <Shot src="/previews/kululaskut.jpg" height={360} />;
}
export function NettisivutPreview() {
  return <Shot src="/previews/nettisivut.jpg" height={317} />;
}

/* ── Google Workspace ─────────────────────────────────────────────────────── */

export function GmailPreview() {
  return <Shot src="/previews/gmail.jpg" height={360} />;
}
export function DrivePreview() {
  return <Shot src="/previews/drive.jpg" height={360} />;
}
export function KalenteriPreview() {
  return <Shot src="/previews/kalenteri.jpg" height={360} />;
}
export function HallintaPreview() {
  return <Shot src="/previews/hallinta.jpg" height={360} />;
}
