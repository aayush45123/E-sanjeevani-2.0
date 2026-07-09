# TODO - Auth security hardening (HTTP-only cookies + rotating refresh tokens)

- [ ] Add refresh token schema (Drizzle)
- [ ] Implement refresh token service/repository
- [ ] Update auth.service.js to issue access + refresh tokens and set cookies
- [ ] Update auth.controller.js (login/register/logout/me/refresh)
- [ ] Update auth.middleware.js to read access token from httpOnly cookie
- [ ] Update auth.routes.js to include /refresh
- [ ] Update server/src/app.js to add cookie-parser and cookie settings
- [ ] Update client api.js to remove Authorization header and localStorage token usage
- [ ] Update client useAuthGuard.js to rely on /me
- [ ] Update client Auth/Auth.jsx and Navbar logout behavior
- [ ] Run lint/build/dev smoke checks

