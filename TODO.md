# TODO - Auth security hardening (HTTP-only cookies + rotating refresh tokens)

- [x] Add refresh token schema (Drizzle) (Migration generated and applied successfully)
- [x] Implement refresh token service/repository
- [x] Update auth.service.js to issue access + refresh tokens and set cookies
- [x] Update auth.controller.js (login/register/logout/me/refresh)
- [x] Update auth.middleware.js to read access token from httpOnly cookie
- [x] Update auth.routes.js to include /refresh
- [x] Update server/src/app.js to add cookie-parser and cookie settings
- [x] Update client api.js to remove Authorization header, localStorage token usage, and add silent refresh interceptor
- [x] Update client useAuthGuard.js to rely on /me
- [x] Update client Auth/Auth.jsx and Navbar logout behavior
- [ ] Run lint/build/dev smoke checks

