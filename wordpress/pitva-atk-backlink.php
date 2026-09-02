<?php
/**
 * Plugin Name: PitVa — ATK-takaisinlinkki
 * Description: Adds a link back to the association's service front door at atk.pitva.fi, for signed-in users only.
 * Version:     1.2.0
 * Author:      Pitkäjärven Vaeltajat ry
 *
 * Drop this file in wp-content/mu-plugins/. Must-use plugins load automatically
 * and cannot be deactivated from the dashboard, which is the point: this is
 * site furniture, not something a theme switch should take away with it.
 *
 * ---------------------------------------------------------------------------
 * Why the admin bar and not the site menu
 *
 * The other three services (Klapi, Budu, Tapahtumamanageri) are internal apps,
 * so a backlink sitting in their chrome is seen only by people who already
 * belong there. pitkajarvenvaeltajat.fi is the public site. Putting
 * atk.pitva.fi in `wp_nav_menu_items` would advertise the association's
 * internal front door to every visitor, which is a different decision than the
 * one made in those three apps.
 *
 * The admin bar is the honest equivalent: it renders on the front end and in
 * wp-admin, and only for users who are signed in. `is_user_logged_in()` is
 * checked anyway rather than trusting that.
 *
 * If you do want it in the public navigation instead, the filter at the bottom
 * of this file does it — read the note there first.
 */

// Called directly? Nothing to see.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const PITVA_ATK_URL = 'https://atk.pitva.fi';

/**
 * The link, as a node in the admin bar.
 *
 * Priority 100 puts it after WordPress's own items rather than jostling with
 * the site-name menu. `target="_blank"` is deliberate: someone editing a page
 * who clicks this should not lose the editor they were in.
 */
function pitva_atk_admin_bar_link( WP_Admin_Bar $bar ): void {
	if ( ! is_user_logged_in() ) {
		return;
	}

	$bar->add_node(
		array(
			'id'    => 'pitva-atk',
			// Long for an admin-bar node, deliberately: it is the way back to a
			// place people arrive at from, not a label they scan past.
			'title' => 'PitVa -> palaa ATK-näkymään',
			'href'  => PITVA_ATK_URL,
			'meta'  => array(
				'title'  => 'Kaikki PitVan palvelut — atk.pitva.fi',
				'target' => '_blank',
				'rel'    => 'noopener',
			),
		)
	);
}
add_action( 'admin_bar_menu', 'pitva_atk_admin_bar_link', 100 );

/**
 * A matching entry on the dashboard's own menu, so it is reachable when the
 * admin bar is hidden (some screens and mobile widths drop it).
 *
 * 'read' is the capability every registered user has, which matches the admin
 * bar's audience. The dashicon is the generic external-link one.
 */
function pitva_atk_dashboard_menu(): void {
	add_menu_page(
		'PitVa ATK',
		'PitVa ATK',
		'read',
		PITVA_ATK_URL,
		'',
		'dashicons-external',
		81
	);
}
add_action( 'admin_menu', 'pitva_atk_dashboard_menu' );

/*
 * ---------------------------------------------------------------------------
 * OPTIONAL: the link in the site's own navigation menu.
 *
 * Commented out on purpose. Uncomment only if you have decided that
 * atk.pitva.fi should be visible to the public — every visitor to
 * pitkajarvenvaeltajat.fi would see this, signed in or not, because a nav menu
 * is rendered for everyone.
 *
 * The `is_user_logged_in()` guard below limits it to signed-in users, which is
 * the safer version if you want it in the menu at all. Change 'primary' to
 * whatever your theme calls its main menu location — check
 * Ulkoasu → Valikot to see the registered names.
 */
// function pitva_atk_nav_menu_link( string $items, stdClass $args ): string {
// 	if ( 'primary' !== $args->theme_location || ! is_user_logged_in() ) {
// 		return $items;
// 	}
//
// 	return $items . sprintf(
// 		'<li class="menu-item pitva-atk-menu-item"><a href="%s" target="_blank" rel="noopener">%s</a></li>',
// 		esc_url( PITVA_ATK_URL ),
// 		esc_html__( 'ATK-palvelut', 'pitva' )
// 	);
// }
// add_filter( 'wp_nav_menu_items', 'pitva_atk_nav_menu_link', 10, 2 );
