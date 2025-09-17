# Security Review

This app targets a coursework environment with no authentication. If deployed publicly, address the items below.

## Trust Boundaries
- **HTTP Requests**: All endpoints accept unauthenticated traffic. Body parsing allows arbitrary JSON/form payloads.
- **In-memory Store**: Mutations occur directly on arrays; no per-user isolation.
- **Client Scripts**: Inline scripts run in browser context; rely on server-supplied HTML without CSP.

## Findings

| Area | Risk | Details | Recommendation |
| --- | --- | --- | --- |
| Authentication | High | No login; anyone can view/modify data via API. | Introduce auth (session or token) before production. |
| CSRF | High for forms | HTML forms accept POSTs without CSRF tokens. | Add CSRF protection (e.g., `csurf` middleware) or move forms to fetch with same-site cookies disabled. |
| Input Validation | Medium | Models enforce many rules but rely on defaulting invalid dates to `new Date()`, potentially masking issues. | Reject invalid dates instead of auto-fixing; log client IPs when validation fails excessively. |
| Rate Limiting | Medium | Unlimited request rate could allow brute-force data deletion. | Apply `express-rate-limit` on `/api` routes. |
| Error Handling | Low | 500 errors return generic message, but stack traces still logged to stdout. | Switch to structured logging with secrets redacted. |
| Static Asset Mount | Low | `/bootstrap` mount misconfigured (points to file); not a security risk but should be corrected to avoid confusion. |
| Content Security Policy | Medium | Inline scripts present; no CSP header -> vulnerable to injection if templates ever echo user input. | Add CSP and move scripts to external files with `nonce`/`sha256`. |

## Transport Security
- HTTPS termination not handled by app; rely on reverse proxy (e.g., Nginx/Cloud provider). Ensure `trust proxy` configured if running behind load balancer before enabling secure cookies.

## Data Protection
- No persistence; data lost on restart. If storing personal data in future, ensure compliance with retention requirements.

## Operational Tips
1. Enable Helmet middleware for sensible default headers (`npm install helmet`).
2. Sanity check Accept header handling; redirecting HTML clients to `/invalid.html` is fine, but API clients adding `text/html` may be redirected unexpectedly.
3. Review `.gitignore`: currently ignores `package.json`/`package-lock.json`. Clean up to prevent leaking dependencies accidentally.

## Incident Response
- No logging/monitoring in place. Add request logs and metrics to detect abuse.
- Document manual rollback procedure: restart server to reset store to seed state.

## Dependency Health
- Express 5.1.0 release candidate; monitor for security advisories and adopt stable release when available.
- Keep Bootstrap copy updated (current version pinned via local file). Replace local copy with npm reference if possible.
