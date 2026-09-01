import { auth, signIn, signOut } from '@/lib/auth';
import { PitvaMark } from './pitva-mark';
import {
  BuduPreview,
  DrivePreview,
  GmailPreview,
  HallintaPreview,
  KalenteriPreview,
  KlapiPreview,
  NettisivutPreview,
  TapahtumatPreview,
} from './previews';

/**
 * The front door. Signing in here mints the session cookie for the whole of
 * .pitva.fi, so the three services below never ask for a credential of their
 * own — see lib/auth.ts.
 *
 * Rendered per-request: it reads the session, so it must never be cached.
 */
export const dynamic = 'force-dynamic';

type Destination = {
  name: string;
  /** Where the tile goes. Google ones get the account pinned on at render. */
  href: string;
  /** Shown on the tile: two services on adjacent tiles are told apart by host, not by name. */
  domain: string;
  kind: string;
  description: string;
  Preview: () => React.ReactElement;
};

/** The association's own apps. The first three read the cookie this app issues. */
const SERVICES: Destination[] = [
  {
    name: 'Klapi',
    href: 'https://klapi.pitva.fi',
    domain: 'klapi.pitva.fi',
    kind: 'Kalustonhallinta',
    description: 'Kaluston lainaus ja palautus: varaukset, lainassa olevat kamat ja kioskinäkymä.',
    Preview: KlapiPreview,
  },
  {
    name: 'Budu',
    href: 'https://budu.pitva.fi',
    domain: 'budu.pitva.fi',
    kind: 'Talous',
    description: 'Talousarvion seuranta reaaliajassa: toteuma, jäljellä oleva budjetti ja tositteet.',
    Preview: BuduPreview,
  },
  {
    name: 'Tapahtumamanageri',
    href: 'https://tapahtumat.pitva.fi',
    domain: 'tapahtumat.pitva.fi',
    kind: 'Tapahtumat',
    description: 'Tapahtumien ilmoittautumiset ja niiden vienti yhdistyksen kalenteriin.',
    Preview: TapahtumatPreview,
  },
  {
    // The association's WordPress site. Deliberately not part of the shared
    // session: it lives on pitkajarvenvaeltajat.fi, a different registrable
    // domain, so a .pitva.fi cookie can never reach it.
    name: 'Nettisivut',
    href: 'https://pitva.fi/kirjaudu',
    domain: 'pitva.fi',
    kind: 'Erillinen kirjautuminen',
    description: 'Yhdistyksen julkiset nettisivut ja jäsenosio, jolla on oma kirjautumisensa.',
    Preview: NettisivutPreview,
  },
];

/**
 * Google Workspace. Outside the shared session entirely — Google runs its own —
 * so these are plain links that happen to know which account to open. They are
 * here because "where do I find the association's mail" is the same question as
 * "where do I find Klapi", and answering it in two places is how one of the two
 * answers goes stale.
 */
const WORKSPACE: Destination[] = [
  {
    name: 'Gmail',
    href: 'https://mail.google.com/mail/',
    domain: 'mail.google.com',
    kind: 'Sähköposti',
    description: 'Yhdistyksen sähköposti ja jaetut osoitteet Google Workspacessa.',
    Preview: GmailPreview,
  },
  {
    name: 'Drive',
    href: 'https://drive.google.com/drive/my-drive',
    domain: 'drive.google.com',
    kind: 'Tiedostot',
    description: 'Yhdistyksen yhteiset tiedostot, jaetut asemat ja pöytäkirjat.',
    Preview: DrivePreview,
  },
  {
    name: 'Kalenteri',
    href: 'https://calendar.google.com/calendar/r',
    domain: 'calendar.google.com',
    kind: 'Kalenteri',
    description: 'Yhdistyksen kalenterit: leirit, kokoukset ja kaluston varaukset.',
    Preview: KalenteriPreview,
  },
  {
    name: 'Hallinta',
    href: 'https://admin.google.com/',
    domain: 'admin.google.com',
    kind: 'Vain ylläpitäjille',
    description: 'Workspace-tilien, ryhmien ja käyttöoikeuksien hallinta. Aukeaa vain ylläpitäjille.',
    Preview: HallintaPreview,
  },
];

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
function Tile({ destination, href }: { destination: Destination; href: string | null }) {
  const { name, domain, kind, description, Preview } = destination;
  const body = (
    <>
      <span className="preview">
        <Preview />
      </span>
      <span className="tile-body">
        <span className="tile-head">
          <h3>{name}</h3>
          <span className="domain">{domain}</span>
        </span>
        <span className="tile-description">{description}</span>
        <span className="kind">{kind}</span>
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

  const workspaceTiles = workspace ? WORKSPACE : WORKSPACE.filter((d) => d.name !== 'Hallinta');

  return (
    <div className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <PitvaMark />
          ATK
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
        <p className="eyebrow">Pitkäjärven Vaeltajat ry</p>
        <h1>Yhdistyksen omat palvelut</h1>

        {signedIn ? (
          <p className="lede">
            Olet kirjautunut. Palvelut alla tunnistavat sinut suoraan — erillistä kirjautumista ei
            tarvita.
          </p>
        ) : (
          <>
            <p className="lede">
              Kirjaudu kerran yhdistyksen Google-tunnuksella, niin pääset kaikkiin palveluihin.
              Linkit aukeavat kirjautumisen jälkeen.
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

        <section>
          <h2 className="section-title">Yhdistyksen palvelut</h2>
          <ul className="tiles">
            {SERVICES.map((destination) => (
              <Tile
                key={destination.name}
                destination={destination}
                href={signedIn ? destination.href : null}
              />
            ))}
          </ul>
        </section>

        <section>
          <h2 className="section-title">Google Workspace</h2>
          <ul className="tiles">
            {workspaceTiles.map((destination) => (
              <Tile
                key={destination.name}
                destination={destination}
                href={signedIn ? forAccount(destination.href, user?.email) : null}
              />
            ))}
          </ul>
        </section>

        <footer>
          <p>Pitkäjärven Vaeltajat ry · Espoo</p>
        </footer>
      </main>
    </div>
  );
}
