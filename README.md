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
| Kuvat             | https://kuvat.pitva.fi      | none — public   |
| Kululaskut        | https://pitva.kululaskut.fi | none — public   |
| Nettisivut        | https://pitva.fi            | its own login   |

The last three are not ours. `kuvat.pitva.fi` is a CNAME to `pitva.kuvat.fi`,
Kululaskut is a tenant on kululaskut.fi, and the WordPress site is on
pitkajarvenvaeltajat.fi — none of them knows anything about the session this app
issues, and the cookie could not reach the last one in any case. The gallery and
the expense form are both open to anyone with the link, which is why their tiles
can carry unedited screenshots.

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

### The favicon

`public/favicon.ico` and friends, generated from `public/icons/atk-mark.svg`.

It is **not** the association's emblem, and that is deliberate. The emblem is
outline art — `app/pitva-mark.tsx` says so itself — and at 16px its strokes and
the gaps between them both fall under a device pixel. Traced solid it fares no
better: the four arrows merge into one blob, and stroking the gaps wider does
not rescue it. Rendered and inspected at 16px before shipping; it failed.

So the favicon keeps the emblem's *idea* — four arrows pointing out from a
centre, which is what a front door that dispatches you to nine services does —
and drops everything that cannot survive the size: four solid triangles, white
on the navy brand square, with gaps wide enough to read at 16px.

The previous icons were Klapi's axe-in-a-stump, copied wholesale when this app
was scaffolded and never swapped.

### The tile previews

`app/previews.tsx`, and they split the same way the page does.

**The association's six are real screenshots**, in `public/previews/`, captured
signed in and scaled to 640px — roughly twice the width a tile ever paints them
at, which is enough for the layout to read and not enough for body text to.

They are **public assets**. The tiles render for signed-out visitors, so
anything legible in these files is legible to anyone who loads the page, and to
anything that caches or indexes it. Two of them are therefore not what the
camera saw:

- **Budu** — the four headline totals, the two Yleiskuva amounts and the
  signed-in address are gaussian-blurred before the file ships. They survived
  the downscale perfectly readably; the account rows below them did not, and are
  left alone. `scratchpad/blur.py`-style region blurring, coordinates in the
  1512x805 capture.
- **Tapahtumamanageri** — deliberately its empty *Lisää tapahtuma* form, cropped
  to the form itself. The event list one tab over carries members' names, an
  email address and a phone number, and must not be used.

Klapi's catalogue (item names, thumbnails), the public photo gallery, the empty
expense-claim form and the public WordPress front page carry nothing sensitive
and are as captured, the last with the WordPress admin bar cropped off the top.

**Re-capturing any of these means re-checking that.** A screenshot of a
signed-in internal service is the one asset on this site that can leak.

**All four Google tiles are the real products.** They were captured on the
association's Workspace account with the redaction applied *in the page before
the shutter* — an injected stylesheet blurring every file name, event chip,
console card, search field and the account button — so no readable content was
ever written to a file. What survives is Google's own chrome. Gmail's inbox was
empty at the time, which is why its list is unblurred; the admin console's
header is left crisp because the organisation named there is the association.

Do it that way if you re-capture them. Blurring afterwards means the unredacted
frame existed on disk first. The admin console additionally refuses to load
without a fresh sign-in challenge, so that one has to be signed in by hand in
the browser before it can be captured at all.

### Editing the copy

`app/services.json`. Every tile's name, host, label and description lives there,
in page order, so the wording can be changed without opening a `.tsx` file. The
`id` field is not copy — it selects the tile's image in `app/previews.tsx`, so a
new service needs a row in both plus a 640px-wide file in `public/previews/`.

Each tile also prints its host under its name. Two of these are called "Budu"
and "Klapi", names that mean nothing outside the committee, and the address is
the part people recognise — so it is on the card rather than left to a status
bar, which a phone does not have.

The palette is copied verbatim from Klapi's `styles/globals.css` and Budu's
`app/globals.css` (navy `#221E5D` topbar, light-blue `#BBD1FB` call to action,
`#ECF2FE` page wash, white cards with a warm-gray border) so that arriving here
reads as the same product as the services it links to. If the brand tokens move
in those two, move them here as well.

## Backlinks from the services

Each service links back here, beside its own wordmark, so the front door is one
click away rather than a URL to remember. They stay visible signed out, which is
when they matter most — this is where the sign-in that covers all of them
happens.

| Where | How |
| ----- | --- |
| Klapi | `components/TopBar.tsx`, beside the wordmark and in the mobile drawer |
| Budu | `app/page.tsx` and `app/admin/page.tsx`, in a `.brand-group` wrapper |
| Tapahtumamanageri | `client/src/components/Layout.tsx`, same wrapper pattern |
| WordPress | `wordpress/pitva-atk-backlink.php` → the site's `wp-content/mu-plugins/` |

**Klapi's kiosk is the exception.** That screen is bolted to the store room wall
and the point of it is that it goes nowhere: a link out to a signed-in front
door would hand the next person in the queue somebody else's session. The test
has to be `group === 'KIOSK' || (group === 'ADMIN' && adminExpiry)`, because
`group` flips to `ADMIN` for the minutes an admin is elevated and checking it
alone would put the link back exactly then.

The WordPress one is a must-use plugin rather than a theme edit, so a theme
change cannot take it away. It hangs off the admin bar and the dashboard menu,
not the site navigation: pitkajarvenvaeltajat.fi is public, and the other three
backlinks are only ever seen by people already inside an internal app. Putting
atk.pitva.fi in the public menu would be a different decision — there is a
commented-out filter at the foot of the file if you want to make it.

## Local preview

    npm install && npm run dev

then open http://localhost:3000. Leave `AUTH_COOKIE_DOMAIN` unset locally.

## Deploying

Pushes to `main` deploy through Vercel. DNS for `atk.pitva.fi` is a CNAME in the
Route 53 hosted zone for `pitva.fi`.
