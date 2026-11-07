# Coding Conventions
**Analysis Date:** 2026-11-07

## Naming Patterns

### Files
- **React Components:** PascalCase with `.jsx` extension (e.g., `client/src/components/AiTriage/AiTriage.jsx`, `client/src/components/AiTriage/RedFlagEmergencyModal.jsx`, `client/src/pages/VideoCall/VideoCall.jsx`).
- **CSS Modules:** `[ComponentName].module.css` co-located directly with the corresponding component (e.g., `client/src/components/AiTriage/AiTriage.module.css`, `client/src/pages/Auth/Auth.module.css`).
- **Global Stylesheets:** lowercase descriptive names under `client/src/styles/` (`variables.css`, `global.css`).
- **Client Utilities:** camelCase `.js` (e.g., `client/src/utils/api.js`, `client/src/utils/auth.js`, `client/src/utils/notificationService.js`).
- **Server Entry Points:** lowercase `.js` (`server/src/server.js`, `server/src/app.js`).
- **Server Controllers:** camelCase with `Controller.js` or `.controller.js` suffix (e.g., `server/src/controllers/consultationController.js`, `server/src/controllers/analytics.controller.js`, `server/src/controllers/authController.js`).
- **Server Services:** camelCase with `.service.js` suffix (e.g., `server/src/services/consultation.service.js`, `server/src/services/auth.service.js`, `server/src/services/longitudinalIntelligence.service.js`).
- **Server Repositories:** camelCase with `.repository.js` suffix (e.g., `server/src/repositories/consultation.repository.js`, `server/src/repositories/doctorProfile.repository.js`).
- **Server Routes:** camelCase with `Routes.js` suffix (e.g., `server/src/routes/consultationRoutes.js`, `server/src/routes/authRoutes.js`, `server/src/routes/triageRoutes.js`).
- **Server Validators:** camelCase with `.validator.js` suffix (e.g., `server/src/validators/auth.validator.js`, `server/src/validators/consultation.validator.js`).
- **Database Schemas:** camelCase plural names (e.g., `server/src/database/schema/users.js`, `server/src/database/schema/consultations.js`, `server/src/database/schema/patientProfiles.js`).
- **Python ML Modules:** snake_case with `.py` extension (e.g., `ai-model/app.py`, `ai-model/longitudinal_intelligence.py`, `ai-model/tests/test_unified_triage.py`).

### Functions
- **JavaScript/Node:** camelCase for helper functions, route handlers, database operations, and service methods:
  ```javascript
  export const getAvailableDoctors = async (req, res) => { ... };
  export const validate = (schema) => (req, res, next) => { ... };
  const handleControllerError = (res, error, defaultMessage) => { ... };
  ```
- **React Components:** PascalCase for React component definitions:
  ```javascript
  export default function AiTriage({ initialCategory = "fever" }) { ... }
  ```
- **Python:** snake_case for functions and methods:
  ```python
  def normalize_symptom_inputs(raw_symptoms): ...
  def build_category_feature_vector(symptom_dict, feature_names): ...
  def get_category_artifacts(cat_key): ...
  ```

### Variables
- **Local variables & object properties:** camelCase (`consultationId`, `patientName`, `isRefreshing`, `failedQueue`).
- **Global Constants / Enums:** UPPER_SNAKE_CASE for environment keys, status constants, lookup dicts:
  ```javascript
  const TOKEN_KEY = "access_token_local";
  const REFRESH_TOKEN_KEY = "refresh_token_local";
  const CATEGORIES = [ ... ];
  ```
  ```python
  CATEGORY_KEYS = ["fever", "respiratory", "digestive", "skin", "urinary_tract"]
  RED_FLAGS_DATA = { ... }
  ```
- **Unused variables:** Variables intentionally unused must start with an underscore or uppercase letter to satisfy the ESLint rule `varsIgnorePattern: '^[A-Z_]'` (e.g., `_`, `_err`, `_req`).

### Types & Schemas
- **Zod Schemas:** camelCase ending in `Schema`:
  ```javascript
  export const registerSchema = z.object({ ... });
  export const loginSchema = z.object({ ... });
  export const markUserJoinedSchema = z.object({ ... });
  ```
- **Drizzle Table Objects:** camelCase plural table identifiers matching database conventions:
  ```javascript
  export const users = pgTable("users", { ... });
  export const consultations = pgTable("consultations", { ... });
  ```

---

## Code Style

### Formatting
- **JavaScript / JSX:**
  - Standard 2-space indentation.
  - Semicolons used consistently.
  - Double quotes for JS/JSX strings, template literals for interpolation.
  - Trailing commas in multi-line object and array declarations.
- **Python:**
  - 4-space indentation complying with PEP 8.
  - Double quotes for standard string literals and triple double-quotes `"""` for docstrings.

### Linting
- **Client Configuration:** Flat config defined in `client/eslint.config.js` using ESLint 9 (`eslint@^9.39.4`):
  - Extends:
    - `@eslint/js` (`js.configs.recommended`)
    - `eslint-plugin-react-hooks` (`reactHooks.configs.flat.recommended`)
    - `eslint-plugin-react-refresh` (`reactRefresh.configs.vite`)
  - Target files: `**/*.{js,jsx}`
  - Ignored directories: `dist`
  - Language options: `ecmaVersion: 2020`, `sourceType: 'module'`, `globals.browser`
  - Critical rule configuration:
    ```javascript
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    }
    ```
- **Common Lint Gotchas:**
  1. Do not define React components inside the render cycle of another component (e.g., tooltips or row renderers in Recharts must be declared at the module level or memoized outside render).
  2. Avoid calling `setState` synchronously within the body of a `useEffect` hook; encapsulate state logic or synchronize via event handlers.
  3. Ensure all hook dependencies are specified in `useCallback` and `useEffect` dependency arrays.
  4. Avoid empty catch/block statements (`no-empty`). If ignoring errors, comment explicitly or prefix the error with `_`.

---

## Import Organization

### Client Module Imports
Organized in logical blocks from external packages to local scoped assets:
1. **React and Core Frameworks:** `react`, `react-dom`, `react-router-dom`
2. **Third-Party Libraries:** `lucide-react`, `axios`, `react-hot-toast`, `recharts`
3. **CSS Modules:** Scoped stylesheet imports (`import styles from "./AiTriage.module.css"`)
4. **Internal Utilities & API Clients:** `../../utils/api`, `../../utils/auth`
5. **Sub-components & Modals:** `./RedFlagEmergencyModal`, `../Skeletons`

```javascript
// Example from client/src/components/AiTriage/AiTriage.jsx
import React, { useState } from "react";
import styles from "./AiTriage.module.css";
import { apiClient } from "../../utils/api";
import { AiTriageSkeleton } from "../Skeletons";
import toast from "react-hot-toast";
import ShapContributionChart from "./ShapContributionChart";
import RedFlagEmergencyModal from "./RedFlagEmergencyModal";
import { Thermometer, Activity, AlertTriangle } from "lucide-react";
```

### Server Module Imports
Pure ECMAScript Modules (`"type": "module"` in `server/package.json`):
1. **Node Core Modules & Polyfills:** `dotenv`, `path`, `url`
2. **Third-Party Packages:** `express`, `cors`, `cookie-parser`, `zod`, `drizzle-orm`
3. **Internal Routes:** `server/src/routes/*.js`
4. **Internal Services, Repositories, Helpers:** Relative imports with mandatory `.js` extensions.

```javascript
// Example from server/src/app.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";
```

### Path Aliases & Module Rules
- Native relative paths (`./`, `../`, `../../`) are used across both frontend and backend.
- Node backend requires explicit file extensions for ESM resolution (`.js`).
- Client Vite configuration (`client/vite.config.js`) maps `global` to `globalThis` for browser compatibility with WebRTC and socket packages:
  ```javascript
  define: {
    global: "globalThis",
  }
  ```

---

## CSS Module Usage & Design Tokens

### Design System Architecture
The application uses a centralized, clinical design token architecture located in `client/src/styles/variables.css` and imported into `client/src/styles/global.css`.

### Core Token Palette (`client/src/styles/variables.css`)
- **Medical Slate Scale (Neutrals):**
  - `--slate-950`: `#020617` (Deepest base)
  - `--slate-900`: `#0f172a` (Primary dark / text)
  - `--slate-800` to `--slate-600`: Mid-tones for borders and secondary elements
  - `--slate-400` to `--slate-200`: Subtle borders and structural dividing lines
  - `--slate-100` to `--slate-50`: Background surface tints (`#f1f5f9` / `#f8fafc`)
  - `--white`: `#ffffff`
- **Clinical Teal Accent (Primary Brand):**
  - `--accent`: `#0ea5a4` (Clean surgical teal)
  - `--accent-dark`: `#0d9190`
  - `--accent-hover`: `#0b7a79`
  - `--accent-light`: `rgba(14, 165, 164, 0.08)`
  - `--accent-border`: `rgba(14, 165, 164, 0.22)`
  - `--accent-gradient`: `linear-gradient(135deg, #0ea5a4 0%, #0d9488 100%)`
- **Semantic Status Signals:**
  - `--success`: `#10b981` (background `--success-bg: #ecfdf5`, border `--success-border: #a7f3d0`)
  - `--warning`: `#f59e0b` (background `--warning-bg: #fffbeb`, border `--warning-border: #fde68a`)
  - `--danger`: `#ef4444` (background `--danger-bg: #fef2f2`, border `--danger-border: #fecaca`)
  - `--info`: `#3b82f6` (background `--info-bg: #eff6ff`, border `--info-border: #bfdbfe`)
- **Typography & Layout Tokens:**
  - Font stack: `--font: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;`
  - Spacing scale: `--sp-1` (0.25rem) to `--sp-24` (6rem)
  - Radii: `--radius-xs` (3px), `--radius-sm` (6px), `--radius-md` (8px), `--radius-lg` (12px), `--radius-xl` (16px), `--radius-full` (9999px)
  - Layout: `--sidebar-width: 240px`, `--topbar-height: 56px`, `--content-max-width: 1240px`

### CSS Modules Pattern
Every page and UI component encapsulates its styles in a `.module.css` file. Components bind styles via the imported `styles` object:
```jsx
import styles from "./AiTriage.module.css";

export default function AiTriage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Unified AI Triage</h1>
      </header>
    </div>
  );
}
```

In `.module.css`, all colors, dimensions, and transitions reference CSS custom properties:
```css
.container {
  background-color: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--sp-6);
  font-family: var(--font);
}

.title {
  color: var(--text-primary);
  font-size: var(--text-2xl);
  font-weight: 600;
}
```

---

## API Response Formatting

### Standard API Response Contract
All Express backend endpoints return JSON payloads conforming to a standardized shape.

#### Success Response
```json
{
  "success": true,
  "message": "Optional descriptive status message",
  "data": { ... }
}
```
*Note: In collection or lookup endpoints, data keys may be returned at root level alongside `"success": true` (e.g. `{ "success": true, "specialties": [...] }`).*

#### Error Response
```json
{
  "success": false,
  "message": "Human-readable summary of the error",
  "error": "Detailed error string or code"
}
```

#### Validation Error Response (HTTP 400)
Produced automatically by `server/src/validators/validation.middleware.js`:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "email: Invalid email address",
    "password: Password must be at least 6 characters"
  ]
}
```

---

## Error Handling Patterns

### Backend Validation Pattern (Zod Middleware)
The project utilizes **Zod** as its primary type-safe schema validation engine (located in `server/src/validators/`). Schemas validate incoming `body`, `query`, and `params`:

```javascript
// server/src/validators/auth.validator.js
import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().toLowerCase().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(["patient", "doctor"]).optional(),
  }),
});
```

The validation middleware (`server/src/validators/validation.middleware.js`) parses the input, maps schema violations to readable field messages, and protects against Express 5 getter-only property collisions:
```javascript
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (parsed.body !== undefined) req.body = parsed.body;
    return next();
  } catch (error) {
    if (error.errors) {
      const formattedErrors = error.errors.map((err) => {
        const fieldName = err.path.slice(1).join(".") || err.path[0];
        return `${fieldName}: ${err.message}`;
      });
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formattedErrors,
      });
    }
    return next(error);
  }
};
```

### Controller Error Handling Helper
Controllers implement try/catch blocks wrapping asynchronous operations and delegate failures to a localized helper function:
```javascript
// server/src/controllers/consultationController.js
const handleControllerError = (res, error, defaultMessage) => {
  console.error(defaultMessage, error);
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  if (error.code === "22P02") {
    return res.status(400).json({
      success: false,
      message: "Invalid consultation data or status format",
    });
  }
  return res.status(error.status || 500).json({
    success: false,
    message: error.message || defaultMessage,
    error: error.error || error.message,
  });
};
```

### Global Application Error Handling (`server/src/app.js`)
Unhandled exceptions and rejected promises bubble up to Express's 4-parameter error handler:
```javascript
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});
```

### Client-Side Error Handling
1. **Axios Interceptors:** `client/src/utils/api.js` intercepts 401 Unauthorized responses to perform automatic refresh token rotation (`POST /auth/refresh-token`). Failed requests are queued and replayed upon successful renewal.
2. **UI Feedback:** User notifications are rendered using `react-hot-toast` (`toast.error(message)`, `toast.success(message)`).

---

## Logging

### Server Logging Conventions
- Request Logging: Custom middleware prints route and HTTP verb with emoji prefix:
  ```javascript
  app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
  });
  ```
- Domain Alerts & Job Status:
  - `[CORS Blocked] Origin: ...`
  - `[LAZY LOAD] Loading model artifacts for: ...`
  - `[TRIAGE EMERGENCY ALERT] Red flags triggered: ...`
  - `[Cron] Running consultation reminders...`

### Client Logging
- Client avoids dumping verbose logs in production builds. Errors in async handlers are caught and directed to `console.error` and `toast.error`.

---

## Function Design

### Size and Scope
- Functions prioritize single responsibility. Service layers (`server/src/services/`) isolate domain business logic from Express request/response concerns.
- Database access is abstracted into repository classes (`server/src/repositories/`).

### Parameters & Destructuring
- Controller handlers accept `(req, res)` or `(req, res, next)`.
- Services accept explicit object parameters for clarity and extensibility:
  ```javascript
  static async bookAppointment({ patientId, doctorId, slotId, date, reason }) { ... }
  ```

---

## Module Design

### ECMAScript Modules (ESM)
- Pure ESM is enforced across client and server (`"type": "module"` in `package.json`).
- Backend file imports MUST explicitly include the `.js` extension (e.g., `import { db } from "../config/db.js"`).
- CommonJS constructs (`__dirname`, `__filename`) are reconstructed via `fileURLToPath`:
  ```javascript
  import path from "path";
  import { fileURLToPath } from "url";
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  ```

### Exports
- Named exports are preferred for utilities, repositories, services, and validators:
  ```javascript
  export class ConsultationService { ... }
  export const validate = ...;
  ```
- Default exports are reserved for Express application bootstrap (`export default app;`) and primary React page/component definitions (`export default DoctorDashboard;`).

---

*Convention analysis: 2026-11-07*
