# CedarMonitoring

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 15.2.1.

## Install Dependencies

`npm install --legacy-peer-deps`

## Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4300/`. The application will automatically reload if you change any of the source files.

## Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running Unit Tests

Run `ng test` to execute the unit tests with Vitest in headless Chromium.

## Running Browser Tests

The browser tests in `../browser` drive the built application in Chromium with Playwright. Run
`ng build` here, then `npm install` and `npm test` in `../browser`.

`accessibility.spec.mjs` scans with axe-core every state the other browser tests open: each surface
scenario at both widths, the log explorer's boards and filters, the pages showing a failed request,
the no-access and store-unavailable pages, and one control of each kind hovered and focused. It fails on any violation of WCAG 2.0, 2.1 or 2.2
at level A or AA, and on any result axe leaves undecided that the spec does not settle by
measurement. A finding that only a visible change can fix is listed in the spec's `EXCEPTIONS` with
the change it needs. An entry whose finding has gone fails, so the fix removes the entry.

`layout-resilience.spec.mjs` runs the design tokens' shared layout checks over the same states:
reflow at 320 CSS px, a 640 by 400 viewport for 200% zoom, WCAG text spacing, and the contrast of
placeholders, field boundaries, icons, focus indicators and selection marks. Its `EXCEPTIONS` follow
the same rule, and `SCROLLS_IN_PLACE` lists the table containers that may scroll sideways at 320 px.
The checks come from `layout-resilience.generated.mjs`. `cedarcli check design-tokens
--sync-surfaces` writes that copy, and it is never edited by hand.

## Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
