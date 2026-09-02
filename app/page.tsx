import { auth, signIn, signOut } from '@/lib/auth';
import { PitvaMark } from './pitva-mark';
import {
  BuduPreview,
  DrivePreview,
  GmailPreview,
  HallintaPreview,
  KalenteriPreview,
  KlapiPreview,
  KululaskutPreview,
  KuvatPreview,
  NettisivutPreview,
  TapahtumatPreview,
} from './previews';
import content from './services.json';

/**
 * The front door. Signing in here mints the session cookie for the whole of
 * .pitva.fi, so the three services below never ask for a credential of their
 * own — see lib/auth.ts.
 *
 * Rendered per-request: it reads the session, so it must never be cached.
 */
export const dynamic = 'force-dynamic';

/**
 * A tile, as written in `services.json`. The copy lives there so it can be
 * edited without opening a .tsx file; only the picture is code.
 */
type Service = {
  id: string;
  nimi: string;
  linkki: string;
  osoite: string;
  laji: string;
  kuvaus: string;
};

/**
 * The one thing `services.json` cannot hold: which drawing belongs to which
 * tile. Keyed by the `id` in that file, so adding a service means adding a row
 * here and an image under public/previews/ — and a missing key is a build
 * error rather than a blank tile, because `Tile` reads it unconditionally.
 */
const PREVIEWS: Record<string, () => React.ReactElement> = {
  klapi: KlapiPreview,
  budu: BuduPreview,
  tapahtumat: TapahtumatPreview,
  kuvat: KuvatPreview,
  kululaskut: KululaskutPreview,
  nettisivut: NettisivutPreview,
  gmail: GmailPreview,
  drive: DrivePreview,
  kalenteri: KalenteriPreview,
  hallinta: HallintaPreview,
};

/** The association's own. The first three read the cookie this app issues. */
const SERVICES: Service[] = content.palvelut;

/**
 * Google Workspace. Outside the shared session entirely — Google runs its own —
 * so these are plain links that happen to know which account to open. They are
 * here because "where do I find the association's mail" is the same question as
 * "where do I find Klapi", and answering it in two places is how one of the two
 * answers goes stale.
 */
const WORKSPACE: Service[] = content.workspace;

/**
 * Point a Google link at the account that is signed in here.
 *
 * Someone signed in to both a personal and an association account — which is
 * most people — otherwise lands in whichever Google saw last, and the
 * association's Drive looks empty. `authuser` takes the address rather than the
 * usual `/u/0` index, so it survives the accounts being in a different order in
 * a different browser.
 *
 * A hint, not a gate: Google still asks for the account if it is not already
 * signed in, and still refuses if it has no business being there.
 */
function forAccount(href: string, email: string | null | undefined): string {
  if (!email) return href;
  const url = new URL(href);
  url.searchParams.set('authuser', email);
  return url.toString();
}

/**
 * One tile.
 *
 * Locked, it is a `<div>` and not a disabled `<a>`: an anchor with a `href` is
 * followable by keyboard and by middle click whatever it is painted like, and
 * every one of these destinations answers a signed-out visitor with its own
 * login screen — which is the confusing detour the front door exists to
 * prevent. Removing the element is the only way to remove the link.
 */
function Tile({ service, href }: { service: Service; href: string | null }) {
  const { id, nimi, osoite, laji, kuvaus } = service;
  const Preview = PREVIEWS[id];
  const body = (
    <>
      <span className="preview">
        <Preview />
      </span>
      <span className="tile-body">
        <span className="tile-head">
          <h3>{nimi}</h3>
          <span className="domain">{osoite}</span>
        </span>
        <span className="tile-description">{kuvaus}</span>
        <span className="kind">{laji}</span>
      </span>
    </>
  );

  if (!href) {
    return (
      <li>
        <div className="tile tile-locked" aria-disabled="true">
          {body}
        </div>
      </li>
    );
  }
  return (
    <li>
      <a className="tile" href={href}>
        {body}
      </a>
    </li>
  );
}

export default async function Home() {
  const session = await auth();
  const user = session?.user;
  const signedIn = !!user;

  /**
   * Google's verified hosted domain. Present only for a Workspace account, so
   * it is what separates "signed in with the association's account" from
   * "signed in" — and the admin console is worth showing to nobody else.
   *
   * It does not say the account is an *administrator*. Knowing that would mean
   * an Admin SDK call, which means a second OAuth scope, a stored refresh token
   * and a directory read on every page view, all to decide whether to draw a
   * box. The tile says who it opens for, and Google enforces it.
   */
  const workspace = session?.hd ?? null;

  const workspaceTiles = workspace ? WORKSPACE : WORKSPACE.filter((d) => d.id !== 'hallinta');

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <PitvaMark />
          Pitkäjärven Vaeltajat ry
        </a>
        {user ? (
          <div className="user">
            <span title={user.email ?? undefined}>{user.email}</span>
            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/' });
              }}
            >
              <button className="link-button" type="submit">
                Kirjaudu ulos
              </button>
            </form>
          </div>
        ) : (
          <a className="topbar-link" href="https://pitva.fi">
            pitva.fi
          </a>
        )}
      </header>

      <main>
        {/*
          The emblem, centred and at size. The topbar's copy is a 34px
          navigation affordance that has to share a bar with the sign-out
          control; this one is the association putting its name to the page,
          which is a different job and needs the room to do it.

          Same component, not an <img>: it inherits `currentColor`, so the one
          drawing comes out near-white on the navy bar and navy here without a
          second asset to keep in sync.
        */}
        <div className="hero">
          <PitvaMark size={112} className="hero-mark" />

          {/*
            The association's name carries the page now that the headline is
            gone. It keeps the eyebrow's styling — this is a change of element,
            not of design — so that the document still opens on a level-one
            heading instead of jumping straight to the section titles.
          */}
          <h1 className="eyebrow">Pitkäjärven Vaeltajat ry</h1>

          {/* Nothing to say to someone already signed in; the tiles are the page. */}
          {!signedIn && (
            <>
              <p className="lede">
                Kirjaudu kerran PitVan Google-tunnuksella, niin pääset kaikkiin palveluihin. Linkit
                aukeavat kirjautumisen jälkeen.
              </p>
              <form
                className="actions"
                action={async () => {
                  'use server';
                  await signIn('google', { redirectTo: '/' });
                }}
              >
                <button className="button" type="submit">
                  Kirjaudu sisään
                </button>
              </form>
            </>
          )}
        </div>

        <section>
          <h2 className="section-title">PitVan palvelut</h2>
          <ul className="tiles">
            {SERVICES.map((service) => (
              <Tile key={service.id} service={service} href={signedIn ? service.linkki : null} />
            ))}
          </ul>
        </section>

        <section>
          <h2 className="section-title">Google Workspace</h2>
          <ul className="tiles">
            {workspaceTiles.map((service) => (
              <Tile
                key={service.id}
                service={service}
                href={signedIn ? forAccount(service.linkki, user?.email) : null}
              />
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
