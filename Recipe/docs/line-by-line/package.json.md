File: package.json
Purpose: npm manifest describing the Node/Express application, its dependencies, and available scripts.

At a glance: Declares package metadata (`name`, `version`), points to `index.js` as the main entry for consumers, and lists runtime dependencies `express` and `ejs`. Contains a placeholder `test` script.

Imports & dependencies: Not applicable—JSON data file consumed by npm.

Configuration/Constants:
- `name`: `assignment-1` – affects npm packaging; no runtime coupling.
- `version`: `1.0.0` – semantic version placeholder.
- `main`: `index.js` – aligns with the top-level export surface documented in `docs/line-by-line/index.js.md`.
- `scripts.test`: Emits a failure to remind developers tests are missing.
- `dependencies`: pins Express 5.1 and EJS 3.1.10.

Main content (annotated walkthrough):
- The file is standard npm metadata. The absence of `start`/`dev` scripts means developers must run `node src/server.js` manually (covered in `docs/README.md`).

Edge cases & errors:
- Running `npm test` will always exit with status 1 until replaced. Express 5.x is still in RC; monitor compatibility.

Exports & consumers:
- npm, Node runtime, and tooling like editors use this manifest. Linking to docs ensures contributors know no devDependencies/linting are configured yet.

Related files: `package-lock.json` (npm resolution lockfile, reviewed in `docs/COVERAGE_REPORT.md`).
