# landeri

The landing page at **atk.pitva.fi** — a single static page of boxes linking to
Pitkäjärven Vaeltajat ry's internal services.

| Box               | Target                        |
| ----------------- | ----------------------------- |
| Klapi             | https://klapi.pitva.fi        |
| Budu              | https://budu.pitva.fi         |
| Tapahtumamanageri | https://tapahtumat.pitva.fi   |
| Kirjaudu          | https://pitva.fi/kirjaudu     |

## Style

No build step and no framework — `index.html` plus `styles.css`, served as-is.

The palette is copied verbatim from Klapi's `styles/globals.css` and Budu's
`app/globals.css` (navy `#221E5D` topbar, light-blue `#BBD1FB` call to action,
`#ECF2FE` page wash, white cards with a warm-gray border) so that arriving here
reads as the same product as the services it links to. If the brand tokens move
in those two, move them here as well.

## Local preview

    python3 -m http.server 8000

then open http://localhost:8000.

## Deploying

Pushes to `main` deploy through Vercel. DNS for `atk.pitva.fi` is a CNAME in the
Route 53 hosted zone for `pitva.fi`.
