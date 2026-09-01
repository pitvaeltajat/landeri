# landeri

The front door at **atk.pitva.fi**: boxes linking to Pitkäjärven Vaeltajat ry's
internal services, and the sign-in that covers all of them.

This app is the **issuer** of the shared session. Signing in here mints a cookie
pinned to `.pitva.fi`, which klapi.pitva.fi, budu.pitva.fi and
tapahtumat.pitva.fi all read — so those three never ask for a credential of
their own.

### PitVan palvelut

| Box               | Target                      | Session         |
| ----------------- | --------------------------- | --------------- |
| Klapi             | https://klapi.pitva.fi      | shared cookie   |
| Budu              | https://budu.pitva.fi       | shared cookie   |
| Tapahtumamanageri | https://tapahtumat.pitva.fi | shared cookie   |
| Nettisivut        | https://pitva.fi            | its own login   |

### Google Workspace

Google runs its own session, so these are ordinary links — the cookie this app
issues means nothing to them. They are on the page because "where is the
association's mail" is the same question as "where is Klapi", and answering it
in two places is how one of the two answers goes stale.

| Box       | Target                   | Shown to               |
| --------- | ------------------------ | ---------------------- |
| Gmail     | https://mail.google.com  | everyone signed in     |
| Drive     | https://drive.google.com | everyone signed in     |
| Kalenteri | https://calendar.google.com | everyone signed in  |
| Hallinta  | https://admin.google.com | Workspace accounts     |

Each link carries `?authuser=<the signed-in address>`. Most people are signed in
to a personal Google account as well as the association's; without it they land
in whichever one Google saw last, and the association's Drive looks empty. The
address is used rather than the usual `/u/0` index because the accounts sit in a
different order in a different browser.

**The admin console tile is shown to Workspace members, not to administrators.**
Telling those apart means an Admin SDK directory read, which means a second
OAuth scope, a stored refresh token and an API call on every page view — all to
decide whether to draw a box. The tile says who it opens for (*"Aukeaa vain
ylläpitäjille"*) and Google enforces the rest. If that ever needs to be exact,
that is the cost.

### Before signing in

Every tile is locked: it renders as a `<div>`, not a greyed-out `<a>`. An anchor
with an `href` is still followable by keyboard and middle click however it is
painted, and each of these destinations answers a signed-out visitor with a
login screen of its own — which is the detour the front door exists to prevent.
The tiles stay visible, because half the reason to open this page signed out is
to see what the association has.

## The shared session

Three things must agree across all four apps or the cookie silently stops
working, looking exactly like "not signed in":

1. **The secret.** `AUTH_SECRET` here, `AUTH_SECRET` in Budu and
   Tapahtumamanageri, `NEXTAUTH_SECRET` in Klapi — one value.
2. **The cookie name**, `__Secure-authjs.session-token`. Not cosmetic:
   `@auth/core` derives the JWE key with HKDF *salted by the cookie name*, so a
   rename on one side is a key change on both. `__Secure-` and not `__Host-` —
   the `__Host-` prefix forbids the `Domain` attribute this depends on.
3. **`AUTH_COOKIE_DOMAIN=.pitva.fi`.** Unset, every app falls back to a
   host-scoped cookie and behaves exactly as it did before SSO.

Identity is shared; **entitlement is not**. This app asserts who someone is and
records Google's `hd` claim. Each service still applies its own rule on every
request — Klapi checks its own User table and soft deletes, Budu and
Tapahtumamanageri re-check the Workspace domain fence. None of them trusts the
issuer to have done it.

The WordPress site behind the Nettisivut tile is deliberately outside all of
this: its member area redirects to pitkajarvenvaeltajat.fi, a different
registrable domain, which a `.pitva.fi` cookie can never reach.

## Style

Next.js App Router, one page. The palette is copied verbatim from Klapi's
`styles/globals.css` and Budu's `app/globals.css`.

### The emblem

`app/pitva-mark.tsx`, traced from the association's own
`pitvalogo_ilmantaustaa.png` and shared with Budu. It appears twice: at 34px in
the topbar, where it is a navigation affordance sharing a bar with the sign-out
control, and centred above the grid at `clamp(76px, 13vw, 120px)`, where it is
the association putting its name to the page.

One component and not an `<img>`, because it inherits `currentColor` — the same
drawing comes out near-white on the navy bar and navy on the page wash, with no
second asset to keep in sync. The `size` prop sets the width and height
attributes; the hero overrides them from CSS, which works because both are
presentation attributes.

Do not take it below about 32px. The arrows are outlines, and under that the
strokes and the gaps between them both fall inside a device pixel and the mark
turns into a grey smudge.

### The tile previews

`app/previews.tsx`. Not screenshots — everything behind these links sits behind
a login, so nothing here could be captured without baking a signed-in session's
contents into a public asset. They are wireframes, drawn inline as SVG in the
palette variables, so they cost no request and re-tint themselves if the brand
tokens move.

They split the same way the page does. The association's own four apps get a
*screen*: the navy topbar those apps actually wear, with their characteristic
content under it — Klapi's lending rows, Budu's bars under a budget line,
Tapahtumamanageri's month grid, a browser for the public site. The four Google
destinations get a *mark*, because a generic Google screen would tell nobody
which of the four it was. What matters in each is the silhouette, not the
detail.

Each tile also prints its host under its name. Two of these are called "Budu"
and "Klapi", names that mean nothing outside the committee, and the address is
the part people recognise — so it is on the card rather than left to a status
bar, which a phone does not have.

The palette is copied verbatim from Klapi's `styles/globals.css` and Budu's
`app/globals.css` (navy `#221E5D` topbar, light-blue `#BBD1FB` call to action,
`#ECF2FE` page wash, white cards with a warm-gray border) so that arriving here
reads as the same product as the services it links to. If the brand tokens move
in those two, move them here as well.

## Local preview

    npm install && npm run dev

then open http://localhost:3000. Leave `AUTH_COOKIE_DOMAIN` unset locally.

## Deploying

Pushes to `main` deploy through Vercel. DNS for `atk.pitva.fi` is a CNAME in the
Route 53 hosted zone for `pitva.fi`.
