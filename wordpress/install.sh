#!/usr/bin/env bash
#
# Install the ATK backlink mu-plugin onto the WordPress host.
#
#   bash wordpress/install.sh
#
# Needs a live AWS SSO session:
#   aws sso login --profile AdministratorAccess-306454755163
#
# The instance has no long-lived key in ~/.ssh; Lightsail mints a temporary one
# per call. This script writes that key to a private temp file, uses it, and
# deletes it on the way out — including if it exits early.
#
# Re-running is safe: it overwrites the same file and re-verifies.

set -euo pipefail

PROFILE="${AWS_PROFILE:-AdministratorAccess-306454755163}"
INSTANCE="${INSTANCE:-pitva-debian-1}"
PLUGIN="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/pitva-atk-backlink.php"

[ -f "$PLUGIN" ] || { echo "missing: $PLUGIN" >&2; exit 1; }

KEY="$(mktemp)"
cleanup() { rm -f "$KEY"; }
trap cleanup EXIT INT TERM

DETAILS="$(aws lightsail get-instance-access-details --profile "$PROFILE" \
	--instance-name "$INSTANCE" --output json)"
IP="$(printf '%s' "$DETAILS" | python3 -c 'import json,sys;print(json.load(sys.stdin)["accessDetails"]["ipAddress"])')"
USER_NAME="$(printf '%s' "$DETAILS" | python3 -c 'import json,sys;print(json.load(sys.stdin)["accessDetails"]["username"])')"
printf '%s' "$DETAILS" | python3 -c 'import json,sys;print(json.load(sys.stdin)["accessDetails"]["privateKey"])' > "$KEY"
chmod 600 "$KEY"

# Try your own SSH setup first — config, agent, whatever normally gets you in —
# and fall back to the temporary key Lightsail mints.
#
# The first version of this script did the opposite and *only* used the minted
# key, with IdentitiesOnly=yes, which tells ssh to ignore the agent entirely.
# That key only works while the instance still trusts the LightsailDefaultKeyPair;
# this one has had its authorized_keys replaced since, so it is refused, and the
# script had disabled the one thing that would have worked.
BASE=(-o StrictHostKeyChecking=accept-new -o ConnectTimeout=10)
SSH=()
for candidate_user in "$USER_NAME" admin ubuntu bitnami debian; do
	if ssh "${BASE[@]}" -o BatchMode=yes "$candidate_user@$IP" true 2>/dev/null; then
		SSH=(ssh "${BASE[@]}" "$candidate_user@$IP"); break
	fi
	if ssh "${BASE[@]}" -o BatchMode=yes -i "$KEY" -o IdentitiesOnly=yes \
		"$candidate_user@$IP" true 2>/dev/null; then
		SSH=(ssh "${BASE[@]}" -i "$KEY" -o IdentitiesOnly=yes "$candidate_user@$IP"); break
	fi
done

if [ ${#SSH[@]} -eq 0 ]; then
	cat >&2 <<EOF
No SSH route into $INSTANCE ($IP).

Tried your own keys/agent and the temporary key Lightsail mints, as
admin/ubuntu/bitnami/debian. The instance says it uses LightsailDefaultKeyPair,
but its authorized_keys has evidently been replaced, so that key is refused.

If you know which key gets you in:
  ssh -i <that key> <user>@$IP
and once it works, this script will pick it up through your agent or config.

Otherwise the plugin is already installed and working as an ordinary plugin via
wp-admin; it just cannot be a must-use plugin without filesystem access.
EOF
	exit 1
fi
echo "==> in via: ${SSH[*]}"

echo "==> locating the WordPress root"
# wp-load.php is the marker; check the usual spots plus every vhost directory.
WP_ROOT="$("${SSH[@]}" 'for d in /var/www/html /var/www/*/ /var/www/*/htdocs \
	/opt/bitnami/wordpress /srv/www/*/; do
		[ -f "$d/wp-load.php" ] && { echo "${d%/}"; break; }
	done')"

if [ -z "$WP_ROOT" ]; then
	echo "could not find wp-load.php in the usual places." >&2
	echo "run this to look around, then set WP_ROOT by hand:" >&2
	echo "  ssh -i <key> $USER_NAME@$IP 'sudo find / -name wp-load.php -maxdepth 6 2>/dev/null'" >&2
	exit 1
fi
echo "    $WP_ROOT"

echo "==> copying the plugin into wp-content/mu-plugins/"
# Piped through ssh rather than scp: mu-plugins may not exist yet, and the file
# has to land owned by the web user, so it needs a shell on the far side anyway.
OWNER="$("${SSH[@]}" "stat -c '%U:%G' '$WP_ROOT/wp-content'")"
"${SSH[@]}" "sudo mkdir -p '$WP_ROOT/wp-content/mu-plugins' \
	&& sudo tee '$WP_ROOT/wp-content/mu-plugins/pitva-atk-backlink.php' >/dev/null \
	&& sudo chown '$OWNER' '$WP_ROOT/wp-content/mu-plugins/pitva-atk-backlink.php' \
	&& sudo chmod 644 '$WP_ROOT/wp-content/mu-plugins/pitva-atk-backlink.php'" < "$PLUGIN"

echo "==> checking PHP syntax on the server"
"${SSH[@]}" "php -l '$WP_ROOT/wp-content/mu-plugins/pitva-atk-backlink.php'"

echo "==> asking WordPress what it sees"
# --allow-root because this runs over sudo; wp-cli refuses root without it.
"${SSH[@]}" "cd '$WP_ROOT' && sudo -u '${OWNER%%:*}' wp plugin list --status=must-use 2>/dev/null \
	|| sudo wp --allow-root --path='$WP_ROOT' plugin list --status=must-use" || {
	echo "    (wp-cli not available — the file is in place regardless)"
}

echo
echo "done. Sign in at https://pitkajarvenvaeltajat.fi and look for"
echo "\"ATK-palvelut\" in the admin bar."
