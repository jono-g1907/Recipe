# Frequently Asked Questions

**Q1. How do I start the server?**  
Run `npm install` once, then `node src/server.js`. Add an npm `start` script to simplify (`npm run start`).

**Q2. Can I change the port from 8080?**  
Currently no; port is hard-coded in `src/server.js`. Swap `app.set('port', 8080)` with `app.set('port', process.env.PORT || 8080)` and document the new environment variable in `docs/CONFIG.md`.

**Q3. Why do HTML forms redirect to `/invalid.html` on bad input?**  
`errorHandler` inspects `ValidationError`s and redirects when the client Accept header includes `text/html`. This keeps the UX friendly while JSON clients receive structured errors.

**Q4. The "Add Inventory" page throws a JavaScript error about read-only assignment. What happened?**  
Within `checkDuplicate`, `const isDup = false;` is later reassigned. Change to `let isDup = false;` (and update docs/tests) to fix duplicate detection.

**Q5. Where is data stored? Do I lose data on restart?**  
Yes. The `store` module keeps data in memory only. Restarting the server reloads seed data. See `docs/ARCHITECTURE.md` for options to add persistence.

**Q6. How do I add new routes?**  
Create a new router file under `src/routes`, mount it in `src/routes/index.js`, then register under `/api` in `src/server.js`. Update `docs/API.md` and add per-file documentation under `docs/line-by-line/`.

**Q7. Why is Bootstrap served locally when we already install it via npm?**  
The current static mount points to the CSS file. Either fix the mount to point at the `dist` directory or link to the CDN. Track this in an issue before refactoring.

**Q8. How can I reset the store during tests?**  
Require `src/store.js`, mutate arrays directly (`store.recipes.length = 0; store.recipes.push(new Recipe(...))`). Long term, expose a helper in the store module to return cloned seeds.

**Q9. Why does `.gitignore` ignore `package.json`?**  
Likely a mistake from the starter project. Update `.gitignore` to stop ignoring essential manifest files.

**Q10. Are there accessibility considerations?**  
Bootstrap provides baseline semantics, but ensure forms include proper labels (already present). Consider adding ARIA roles for alerts and ensuring colour contrast on badges meets WCAG AA.
