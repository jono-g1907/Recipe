# Contributing Guide

Thanks for helping improve Recipe! Follow these steps to keep the project healthy.

## Workflow
1. **Fork or feature branch** from `main` (e.g., `git checkout -b feature/add-recipe-filter`).
2. Install dependencies: `npm install`.
3. Run the server locally: `node src/server.js` and verify changes manually until automated tests exist.
4. Add/adjust documentation under `/docs` when behaviour changes.
5. Commit using conventional style (`feat:`, `fix:`, `docs:`, `chore:` etc.).
6. Push and open a pull request targeting `main`.

## Coding Standards
- **JavaScript**: Use modern syntax (const/let). Prefer pure functions and model methods for business rules.
- **Formatting**: Align with existing indentation (2 spaces). Until Prettier is added, keep lines < 120 chars.
- **Validation**: Model constructors should remain the single source of truth; avoid duplicating logic in routes.
- **Templates**: Keep inline scripts minimal; favour external JS files for shared behaviours.

## Testing
- Implement Jest + Supertest baseline before merging substantial features (see `docs/TESTING.md`).
- Include regression tests reproducing fixed bugs.

## Documentation Checklist
- Update `docs/API.md` for new/changed endpoints.
- Update `docs/MODELS-and-SCHEMAS.md` when model fields change.
- Add or adjust per-file doc under `docs/line-by-line/`.
- Record undocumented files or deliberate omissions in `docs/COVERAGE_REPORT.md`.

## Commit Message Examples
- `feat: add recipe difficulty filter`
- `fix: prevent duplicate inventory ids in ui`
- `docs: refresh api examples`

## Pull Request Checklist
- [ ] Code compiles (`node src/server.js` boots without errors).
- [ ] Manual smoke tests performed for affected routes.
- [ ] Tests pass (`npm test`) once suite exists.
- [ ] Documentation updated (README, API, per-file as needed).
- [ ] No secrets or large binaries added.

## Code Review Expectations
- Provide context for reviewers (screenshots, cURL commands).
- Highlight risky areas or decisions needing feedback.
- Address review comments promptly; resolve conversations only after verifying fixes.

## Releasing
- Tag releases by bumping `package.json` version and create Git tag (`git tag v1.0.1`).
- Update `docs/README.md` changelog section if introduced.

## Communication
- Use issues to track bugs/enhancements.
- Document open questions in `docs/FAQ.md` to avoid tribal knowledge.
