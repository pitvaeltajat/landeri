import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

// Augmented on `@auth/core/jwt`, not `next-auth/jwt`: the latter is a bare
// re-export that TypeScript refuses to augment. That is the only reason
// `@auth/core` is a direct devDependency — nothing imports it at runtime, and
// it is pinned to the version next-auth depends on. Klapi and Budu carry it
// for the same reason.
declare module '@auth/core/jwt' {
  interface JWT {
    /**
     * Google's verified hosted domain, or null for a personal account.
     *
     * The single most important claim this app writes. Budu and
     * Tapahtumamanageri both fence on it, and neither trusts the issuer to have
     * done the check — a session that reaches them without an `hd` is refused.
     * Klapi records the same claim for the same reason.
     */
    hd?: string | null;
  }
}

/**
 * The parent domain the session cookie is pinned to — `.pitva.fi`.
 *
 * This is the whole point of this app: the cookie issued here is sent to
 * klapi.pitva.fi, budu.pitva.fi and tapahtumat.pitva.fi as well, so signing in
 * at the front door signs you in to all of them.
 *
 * Unset (localhost) the cookie stays host-scoped and this behaves like an
 * ordinary single-app login.
 */
const COOKIE_DOMAIN = process.env.AUTH_COOKIE_DOMAIN?.trim() || undefined;

/**
 * Workspace domains allowed to sign in, comma-separated. Enforced on the `hd`
 * claim Google asserts rather than on the email suffix, which proves nothing on
 * its own — an alias can carry a domain the account does not own.
 *
 * Empty means no fence, which is the right default for a fresh checkout and the
 * wrong one in production. Set it.
 */
const allowedDomains = (process.env.GOOGLE_WORKSPACE_DOMAIN ?? '')
  .split(',')
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);

/** The `hd` request param only narrows Google's account chooser; it is a hint, not a control. */
const hdHint = allowedDomains.length === 1 ? allowedDomains[0] : allowedDomains.length > 1 ? '*' : undefined;

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Must equal Klapi's NEXTAUTH_SECRET and Budu's AUTH_SECRET. If these drift
  // apart the cookie simply stops decrypting on the other side — silently, and
  // looking exactly like "not signed in".
  secret: process.env.AUTH_SECRET,

  // Auth.js trusts the Host header automatically on Vercel and refuses
  // everywhere else (UntrustedHost). Saying so explicitly keeps `next start`
  // and a local container behaving the same as the deploy. It is safe here
  // because the OAuth redirect_uri is pre-registered with Google, so a forged
  // Host cannot redirect a sign-in anywhere Google will honour.
  trustHost: true,

  // Only overridden when a parent domain is configured, so local development
  // keeps the stock host-scoped defaults.
  //
  // The name is load-bearing, not cosmetic: @auth/core derives the JWE key with
  // HKDF salted by it (`lib/actions/session.js`: `const salt =
  // options.cookies.sessionToken.name`), so every app that reads this cookie
  // must spell it identically. `__Secure-` and not `__Host-` — the `__Host-`
  // prefix forbids the Domain attribute this exists to set.
  ...(COOKIE_DOMAIN
    ? {
        cookies: {
          sessionToken: {
            name: '__Secure-authjs.session-token',
            options: {
              httpOnly: true,
              sameSite: 'lax' as const,
              path: '/',
              secure: true,
              domain: COOKIE_DOMAIN,
            },
          },
        },
      }
    : {}),

  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET ?? '',
      authorization: hdHint ? { params: { hd: hdHint } } : undefined,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== 'google') return false;
      if (profile?.email_verified === false) return false;
      if (!allowedDomains.length) return true;
      const hd = typeof profile?.hd === 'string' ? profile.hd.trim().toLowerCase() : null;
      return !!hd && allowedDomains.includes(hd);
    },
    async jwt({ token, account, profile }) {
      // `profile` is populated on the sign-in pass only, so the claim has to be
      // captured here or it is gone for the life of the session.
      if (account?.provider === 'google') {
        token.hd = typeof profile?.hd === 'string' ? profile.hd.trim().toLowerCase() : null;
      }
      return token;
    },
  },
});
