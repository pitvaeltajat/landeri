<?php
/**
 * Plugin Name: PitVa — SSO-käyttäjien rooli
 * Description: Gives users created by Google SSO the Editor role. Does not touch the site-wide default role.
 * Version:     1.0.0
 * Author:      Pitkäjärven Vaeltajat ry
 *
 * ---------------------------------------------------------------------------
 * Why this exists
 *
 * rtCamp's "Login with Google" calls wp_insert_user() without a 'role' key, so
 * an SSO user lands on whatever Settings → General → "New User Default Role"
 * says — today, Subscriber. Raising that option to Editor would work, but it
 * applies to every registration route on the site, not just Google.
 *
 * The plugin fires do_action( 'rtcamp.google_user_created', $uid, $user )
 * immediately after creating the account, so hooking that sets the role for
 * exactly the people who arrived through Google, and nobody else.
 *
 * Only ever runs on creation. Somebody demoted to Subscriber by hand stays
 * demoted; this does not re-promote them on their next login.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** The role SSO arrivals get. */
const PITVA_SSO_ROLE = 'editor';

/**
 * @param int $uid User ID of the account just created by the Google flow.
 */
function pitva_sso_set_role( $uid ): void {
	$user = get_user_by( 'id', (int) $uid );

	// get_role() guards against the role having been removed from the site;
	// set_role() with an unknown role would strip every capability instead.
	if ( ! $user instanceof WP_User || null === get_role( PITVA_SSO_ROLE ) ) {
		return;
	}

	$user->set_role( PITVA_SSO_ROLE );
}
add_action( 'rtcamp.google_user_created', 'pitva_sso_set_role', 10, 1 );
