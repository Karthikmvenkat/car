# CarPal UI, spacing, animation and scroll audit

Completed 16 October 2026 in the existing Next.js 14 / React 18 / Tailwind application. GSAP and ScrollTrigger were already installed. The NestJS API, database schema, API routes and credentials were preserved.

## Review coverage

All 37 page routes were reviewed in source and loaded in the browser at 390 × 844, 768 × 1024 and 1440 × 1000 (the admin recheck used 1000px height at tablet). This includes home, listings, both detail routes, configurator, comparison, finance, seller contact, sign-in, registration, password reset, profile, favourites, contact, enquiry, test-drive, FAQ, getting started, how it works, stories, about, legal pages and all admin routes. The pipeline route was checked in its no-vehicle-selected state. A real asset processing job was not started.

The browser initially lost its session while checking admin pages. Those measurements were replaced with authenticated rechecks of all 14 protected routes at all three widths. The report records authenticated=true for those checks. See ui-responsive-audit.json for the 111 route/viewport measurements.

## Actual problems fixed

| Finding | Change |
| --- | --- |
| Registration, Privacy and Terms headings covered by the fixed header | Corrected their own page wrappers to use the shared header offset |
| Header was 80px while pages used several unrelated top offsets | Shared 72px header variable and page-shell offset |
| Sections used 80–112px gaps | Shared responsive 40/48/64px section spacing; corrected large informational-page gaps |
| Tablet listing filters compressed search to an icon-sized field | Full-width search before desktop; filters wrap independently |
| Admin Settings tabs exceeded the mobile viewport | Tabs wrap within their container |
| Admin content had an unnecessary overflow-auto wrapper | Restored document scrolling; retained local table scrolling |
| Filter changes jumped to the top; search discarded existing filters | Filter updates preserve scroll and search retains other query parameters |
| Favourites were hidden until hover, and the button was nested inside a card link | Always-visible 44px save button outside the detail link; full-card link remains keyboard accessible |
| Featured and New badges occupied the same corner | Shared badge position now stacks both labels |
| Home timer rewrote opacity/visibility of arbitrary elements | Removed timer; scoped GSAP contexts control their own elements |
| Gallery used fixed heights and mobile configuration appeared after every information panel | Responsive aspect ratio; mobile order is gallery, configuration, specifications/details |
| Config save failures replaced the whole detail page | Errors stay beside the save action |
| Mobile admin drawer had no focus containment or Escape handling | Focus containment, close control, inert closed drawer/background and focus restoration |
| Configurator tabs lacked keyboard navigation | Roving tab focus, arrows, Home and End |
| Google sign-in used unsupported percentage button width | Supported 250px button size that fits mobile cards |
| Any session verification failure discarded credentials | Only 401/403 clears the session; network/server failures retain existing credentials and all server guards remain active |

## Layout and scroll system

Shared CSS variables define header height, 16/24/40px gutters, 40/48/64px section spacing, card padding and grid spacing. Page wrappers, existing container components and card classes consume these where applicable. Anchor offsets use scroll-padding-top and scroll-margin-top. The skip link targets a focusable main region. Stable scrollbar gutters reduce horizontal shifts.

Photo frames and card aspect ratios reserve space; the home spotlight also reserves its footer before live inventory loads. Comparison and admin tables scroll locally instead of widening the document. Configuration and finance sidebars stick only on viewports tall enough to use them and remain bounded by their grid parents. No document scroll locking, custom wheel handling or scroll hijacking was added.

## Animation

- Hero entrance shortened to 450ms with a small stagger.
- Vehicle cards reveal once as each card enters the viewport, with a bounded 45ms column stagger.
- Section reveals use individual triggers, at most 18px travel, 500ms duration and 150ms delay.
- Removed the editorial parallax effect.
- Added 220ms gallery fades, colour feedback, 180ms mobile menu/dialog entrances and subtle card hover movement.
- GSAP media contexts revert on unmount and when reduced motion is enabled. CSS animation is scoped to no-preference; content is visible by default without animation.

## Verification

- Browser geometry checks: 37 routes × 3 widths; no document horizontal overflow in final measurements.
- Authenticated admin checks: 14 protected routes × 3 widths.
- Exter colour change: Titan Black Matte → Atlas White selected state and photo URL both changed.
- Keyboard: configurator arrow tabs; dialog Escape; mobile navigation Escape; admin drawer focus handling.
- Native scrolling: card reveals became fully visible; configuration panel remained above the footer boundary.
- Mobile comparison: 640px comparison table scrolls inside a 375px document without increasing document width.
- Form layout checks: enquiry, test drive, seller, contact and registration fit mobile; blank test-drive validation blocked submission. No test leads or accounts were created, and no email was sent.
- Route regression script: 37 HTTP routes passed; seven EMI arithmetic/invalid-input cases passed.
- TypeScript and lint passed before the final build. Lint reports existing image-optimisation/hook warnings; no errors. The final production build result is in ui-audit-build.log.
- Reduced-motion guards were reviewed in code; the operating system preference was not changed during this audit.

Screenshots: ui-audit-home-desktop.png, ui-audit-vehicle-desktop.png and ui-audit-listing-mobile.png.

## Remaining service and asset limitations

Some vehicles lack interior views, extra gallery angles, verified detailed specifications or licensed 3D assets. Controls only expose real available assets; a missing colour photo is explicitly identified. Existing saved fuel/transmission values are preserved even where a variant label suggests different equipment. Asset accuracy still depends on the source record.

Password reset and admin Settings/Content persistence remain unconnected as previously documented in their UI. Seller/contact email drafts require the user's mail application. These are existing service limitations, not successful submissions. Existing third-party Google authentication can still emit provider initialisation warnings during development refreshes.

Final result: production build passed (exit 0), including lint and type validation. All 111 browser measurements report zero horizontal document overflow; 42 are explicitly authenticated admin checks. Local development server restored on port 3002.
