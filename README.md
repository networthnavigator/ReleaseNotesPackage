# ReleaseNotesPackage

Angular library: release-notes panel/drawer component. Consuming apps (e.g. ReleaseNotesEditor, NetWorth Navigator) use the same component and logic; **the visual appearance can differ per app** because the panel is designed to follow the host app’s theme and global styles.

## Consistent look in every app (self-contained theme)

The panel uses **fixed colors and font** (light background, Roboto, blue accent) so it looks the same in every host app. It does **not** follow the host app’s Material theme (no `var(--mat-sys-*)`), so it will look identical in ReleaseNotesEditor and NetWorth Navigator (and any other consumer).

---

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.21.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
