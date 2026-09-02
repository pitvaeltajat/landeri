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

echo "==> minting a temporary key for $INSTANCE"
aws lightsail get-instance-access-details \
	--profile "$PROFILE" --instance-name "$INSTANCE" \
	--query 'accessDetails.privateKey' --output text > "$KEY"
chmod 600 "$KEY"

IP="$(aws lightsail get-instance-access-details --profile "$PROFILE" \
	--instance-name "$INSTANCE" --query 'accessDetails.ipAddress' --output text)"
USER_NAME="$(aws lightsail get-instance-access-details --profile "$PROFILE" \
	--instance-name "$INSTANCE" --query 'accessDetails.username' --output text)"

SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new
     -o ConnectTimeout=10 "$USER_NAME@$IP")

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
