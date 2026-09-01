# landeri

The front door at **atk.pitva.fi**: boxes linking to Pitkäjärven Vaeltajat ry's
internal services, and the sign-in that covers all of them.

This app is the **issuer** of the shared session. Signing in here mints a cookie
pinned to `.pitva.fi`, which klapi.pitva.fi, budu.pitva.fi and
tapahtumat.pitva.fi all read — so those three never ask for a credential of
their own.

| Box               | Target                        |
| ----------------- | ----------------------------- |
| Klapi             | https://klapi.pitva.fi        |
| Budu              | https://budu.pitva.fi         |
| Tapahtumamanageri | https://tapahtumat.pitva.fi   |
| Jäsensivut        | https://pitva.fi/kirjaudu     |

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

The WordPress member area at pitva.fi/kirjaudu is deliberately outside all of
this: it redirects to pitkajarvenvaeltajat.fi, a different registrable domain,
which a `.pitva.fi` cookie can never reach.

## Style

Next.js App Router, one page. The palette is copied verbatim from Klapi's
`styles/globals.css` and Budu's `app/globals.css`.

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
