<?php
/**
 * Plugin Name: PitVa — Ryhmien aikataulu
 * Description: Serves the Ryhmät page's own text as a FullCalendar feed, so the weekly timetable never drifts from the group descriptions below it.
 * Version:     1.0.0
 * Author:      Pitkäjärven Vaeltajat ry
 *
 * ---------------------------------------------------------------------------
 * Why this exists
 *
 * The timetable at the top of /toiminta/ryhmat/ used to be a hand-written
 * FullCalendar events array inside wp-content/ryhmat/ryhmat_s26.html. Every
 * time a group changed night, or a placeholder like "Uudet poikaseikkailijat"
 * became "Muskettisopulit", someone had to remember to edit that file too.
 * Nobody did, so the grid sat there for months naming groups that no longer
 * existed while the text three inches below it was correct.
 *
 * This removes the second copy. The page text is the only place the schedule is
 * written; this endpoint parses it and hands FullCalendar the same data. Edit
 * the page, the grid follows.
 *
 * Parsing rules, all taken from how the page is already written:
 *   <h2>  = age group (Sudenpennut / Seikkailijat / ...) — decides the colour
 *   <h3>  = the group itself (Revontulet, Sudet, ...)    — becomes the title
 *   "Kokoontumisaika: Tiistaisin klo 18-19"              — day and time
 *
 * A group whose time is not a weekday-plus-clock — "Sovitaan erikseen", for
 * instance — is skipped rather than guessed at, which is why Samoajavartio has
 * no block on the grid.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'PITVA_RYHMAT_SLUG' ) ) {
	define( 'PITVA_RYHMAT_SLUG', 'ryhmat' );
}
const PITVA_RYHMAT_CACHE = 'pitva_ryhmat_aikataulu';

if ( ! function_exists( 'pitva_ryhmat_colours' ) ) :
/**
 * Age group -> [background, text]. Filterable so a new age group does not need
 * this file edited; anything unlisted falls back to a neutral grey, which is
 * visible enough on the grid to prompt someone to add it.
 */
function pitva_ryhmat_colours(): array {
	return apply_filters( 'pitva_ryhmat_colours', array(
		'Sudenpennut'  => array( '#f5ea2e', null ),
		'Seikkailijat' => array( '#d4791e', null ),
		'Tarpojat'     => array( '#5e0f75', '#ffffff' ),
		'Samoajat'     => array( '#1e6fd4', '#ffffff' ),
		'Vaeltajat'    => array( '#2e7d32', '#ffffff' ),
	) );
}

/**
 * Turn the page's HTML into FullCalendar recurring-event objects.
 *
 * @param string $content Raw post_content.
 * @return array<int,array<string,mixed>>
 */
function pitva_ryhmat_parse( string $content ): array {
	$days = array(
		'maanantai'   => 1,
		'tiistai'     => 2,
		'keskiviikko' => 3,
		'torstai'     => 4,
		'perjantai'   => 5,
		'lauantai'    => 6,
		'sunnuntai'   => 0,
	);
	$colours = pitva_ryhmat_colours();

	// Split on h2/h3 while keeping the delimiters, so each group carries the age
	// group heading that preceded it.
	$parts = preg_split(
		'#<(h2|h3)[^>]*>(.*?)</\1>#is',
		$content,
		-1,
		PREG_SPLIT_DELIM_CAPTURE
	);

	$age    = '';
	$events = array();

	for ( $i = 1; $i < count( $parts ) - 1; $i += 3 ) {
		$tag  = strtolower( $parts[ $i ] );
		$name = trim( html_entity_decode( wp_strip_all_tags( $parts[ $i + 1 ] ), ENT_QUOTES, 'UTF-8' ) );
		$rest = $parts[ $i + 2 ] ?? '';

		if ( 'h2' === $tag ) {
			$age = $name;
			continue;
		}
		if ( '' === $name ) {
			continue;
		}

		// Tags become pipes so "Kokoontumisaika:" and its value cannot be run
		// together with whatever markup follows.
		$text = html_entity_decode( preg_replace( '/\s+/u', ' ', preg_replace( '#<[^>]+>#', '|', $rest ) ), ENT_QUOTES, 'UTF-8' );

		if ( ! preg_match( '/Kokoontumisaika:\s*\|*\s*([^|]+)/ui', $text, $m ) ) {
			continue;
		}
		$when = $m[1];

		if ( ! preg_match( '/(maanantai|tiistai|keskiviikko|torstai|perjantai|lauantai|sunnuntai)/ui', $when, $d ) ) {
			continue; // "Sovitaan erikseen" and friends: no fixed slot to draw.
		}
		if ( ! preg_match( '/klo\s*(\d{1,2})(?:[.:](\d{2}))?\s*[-–—]\s*(\d{1,2})(?:[.:](\d{2}))?/ui', $when, $t ) ) {
			continue;
		}

		$day  = $days[ strtolower( $d[1] ) ];
		list( $bg, $fg ) = $colours[ $age ] ?? array( '#777777', '#ffffff' );

		$event = array(
			'title'      => $name,
			'daysOfWeek' => array( (string) $day ),
			'startTime'  => sprintf( '%02d:%s:00', (int) $t[1], $t[2] ?: '00' ),
			'endTime'    => sprintf( '%02d:%s:00', (int) $t[3], $t[4] ?: '00' ),
			'color'      => $bg,
		);
		if ( $fg ) {
			$event['textColor'] = $fg;
		}
		$events[] = $event;
	}

	return $events;
}

/**
 * REST handler. Public on purpose: it exposes exactly what the public page
 * already prints, and the grid is loaded by anonymous visitors.
 */
function pitva_ryhmat_feed(): WP_REST_Response {
	$cached = get_transient( PITVA_RYHMAT_CACHE );
	if ( is_array( $cached ) ) {
		return new WP_REST_Response( $cached );
	}

	$page = get_page_by_path( PITVA_RYHMAT_SLUG );
	if ( ! $page instanceof WP_Post ) {
		return new WP_REST_Response( array() );
	}

	$events = pitva_ryhmat_parse( $page->post_content );

	// Twelve hours is only a backstop; the save_post hook below clears this the
	// moment the page is edited, so an edit shows up immediately.
	set_transient( PITVA_RYHMAT_CACHE, $events, 12 * HOUR_IN_SECONDS );

	return new WP_REST_Response( $events );
}

function pitva_ryhmat_routes(): void {
	register_rest_route( 'pitva/v1', '/ryhmat-aikataulu', array(
		'methods'             => 'GET',
		'callback'            => 'pitva_ryhmat_feed',
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'pitva_ryhmat_routes' );

/** Any edit to the page invalidates the feed. */
function pitva_ryhmat_flush( $post_id ): void {
	$post = get_post( $post_id );
	if ( $post instanceof WP_Post && PITVA_RYHMAT_SLUG === $post->post_name ) {
		delete_transient( PITVA_RYHMAT_CACHE );
	}
}
add_action( 'save_post', 'pitva_ryhmat_flush' );
add_action( 'deleted_post', 'pitva_ryhmat_flush' );

endif;
