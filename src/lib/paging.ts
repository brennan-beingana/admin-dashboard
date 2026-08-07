/**
 * Shared paging constants for the admin list views.
 *
 * The admin API only accepts `limit`/`offset` — there is no status or search
 * filter yet — so views that need to filter (the verification queue, the rider
 * map, live vs. historical rides) pull one large window and filter client-side.
 * Once the backend grows query params these views should switch to real
 * server-side filtering and drop `WINDOW_SIZE`.
 */
export const PAGE_SIZE = 20;
export const WINDOW_SIZE = 200;
