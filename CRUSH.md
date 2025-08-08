# CRUSH.md

Repository guide for agentic coding in this Astro + Preact project.

Commands
- Dev server: npm run dev (http://localhost:3000)
- Build: npm run build → ./dist
- Preview build: npm run preview
- Type check: npx astro check (or npm run astro -- check)
- Lint: none configured; prefer Astro/TypeScript checks and Prettier defaults
- Single test: no test framework configured; only custom test exists → npm run test:ms (Microsoft speech test)

Code style
- Imports: use TypeScript paths ("@/*" → ./src/* per tsconfig). Prefer absolute from src; relative within feature folders. Group: std/libs, internal modules, local files; keep side-effect imports separate.
- Formatting: respect existing .prettierrc. 2-space indent, single quotes where present, trailing commas where allowed. Keep files small and focused.
- Types: enable strict typing. Use explicit types on public APIs, props, and returned values. Prefer interfaces for object shapes, type aliases for unions. Use zod for runtime validation at boundaries.
- Naming: kebab-case for web components (wc-*), PascalCase for components and types, camelCase for functions/vars, UPPER_SNAKE for constants. Filenames mirror exported default where applicable.
- Error handling: never swallow errors. Throw with context or return Result-like objects. Wrap external I/O (fetch/SDKs) with try/catch and narrow errors; log minimal context without secrets.
- React/Preact: function components with explicit props types; keep hooks at top-level; memoize expensive values; avoid inline functions in hot paths.
- Web Components: guard customElements.define with typeof window !== 'undefined'; use shadow DOM; reflect observed attributes to properties; clean up listeners in disconnectedCallback.
- API routes: validate inputs (zod), handle JSON only, respond with appropriate HTTP codes; avoid leaking env vars; stream when APIs support it.
- Assets/audio: load via public/ when static; prefer lazy loading for heavy files; do not block UI thread.
- Env/secrets: require .env; never log keys; check for required vars at startup; use server-only code for secret usage.

Cursor/Copilot rules
- No Cursor or Copilot rules files found (.cursor/rules, .cursorrules, .github/copilot-instructions.md). If added later, mirror their guidance here.

Notes
- Adapter: Vercel (static output). Keep server-only code within API routes. Respect PWA/service worker behavior present in public/.
