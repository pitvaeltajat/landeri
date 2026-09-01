import { auth, signIn, signOut } from '@/lib/auth';
import { PitvaMark } from './pitva-mark';

/**
 * The front door. Signing in here mints the session cookie for the whole of
 * .pitva.fi, so the three services below never ask for a credential of their
 * own — see lib/auth.ts.
 *
 * Rendered per-request: it reads the session, so it must never be cached.
 */
export const dynamic = 'force-dynamic';

/** The services. Each one reads the cookie this app issues. */
const SERVICES = [
  {
    name: 'Klapi',
    href: 'https://klapi.pitva.fi',
    kind: 'Kalustonhallinta',
    description: 'Kaluston lainaus ja palautus: varaukset, lainassa olevat kamat ja kioskinäkymä.',
  },
  {
    name: 'Budu',
    href: 'https://budu.pitva.fi',
    kind: 'Talous',
    description: 'Talousarvion seuranta reaaliajassa: toteuma, jäljellä oleva budjetti ja tositteet.',
  },
  {
    name: 'Tapahtumamanageri',
    href: 'https://tapahtumat.pitva.fi',
    kind: 'Tapahtumat',
    description: 'Tapahtumien ilmoittautumiset ja niiden vienti yhdistyksen kalenteriin.',
  },
];

export default async function Home() {
  const session = await auth();
  const user = session?.user;

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

        {user ? (
          <p className="lede">
            Olet kirjautunut. Palvelut alla tunnistavat sinut suoraan — erillistä kirjautumista ei
            tarvita.
          </p>
        ) : (
          <>
            <p className="lede">
              Kirjaudu kerran yhdistyksen Google-tunnuksella, niin pääset kaikkiin palveluihin.
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

        <ul className="tiles">
          {SERVICES.map((service) => (
            <li key={service.name}>
              <a className="tile" href={service.href}>
                <h2>{service.name}</h2>
                <p>{service.description}</p>
                <span className="kind">{service.kind}</span>
              </a>
            </li>
          ))}
          {/*
            The association's WordPress member area. Deliberately not part of
            the shared session: it lives on pitkajarvenvaeltajat.fi, a different
            registrable domain, so a .pitva.fi cookie can never reach it.
          */}
          <li>
            <a className="tile tile-cta" href="https://pitva.fi/kirjaudu">
              <h2>Jäsensivut</h2>
              <p>Yhdistyksen jäsensivut ja niiden oma kirjautuminen pitva.fi-sivustolla.</p>
              <span className="kind">Erillinen kirjautuminen</span>
            </a>
          </li>
        </ul>

        <footer>
          <p>Pitkäjärven Vaeltajat ry · Espoo</p>
        </footer>
      </main>
    </div>
  );
}
