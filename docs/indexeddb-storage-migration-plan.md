# IndexedDB Storage Migration Plan

## Goal

Move large, API-backed objects out of `localStorage` and into IndexedDB. Keep small synchronous UI settings in `localStorage` where the current code depends on immediate reads during component setup.

Primary driver: `/talkers2` currently loads `wc-meme-board` and `talkers2` helpers that cache large API payloads in `localStorage`, which makes `/localstorage` hard to read and risks quota/performance issues on iPad Safari.

## Current Findings

`src/pages/talkers2.astro` does not directly call `localStorage`. It mounts these storage users:

- `src/components/wc-meme-board.ts`
  - Key: `get_memes`
  - Source API: `/api/get_memes`
  - Current behavior: reads/writes a full meme sound list with `localStorage.getItem` and `localStorage.setItem`.
- `src/core/talkers2/wc-talkers.helpers.ts`
  - Key: `get_ms_voices`
  - Source API: `/api/polly/list_m`
  - Current behavior: reads/writes filtered Microsoft voice metadata with generated `Face` URLs.

Other large API-backed `localStorage` caches found:

- `src/core/talk/helpers.ts`
  - Key: `get_ms_voices`
  - Source API: `/api/polly/list_m`
- `src/core/talkers/index.ts`
  - Key: `get_voices`
  - Source API: `/api/polly/list`
- `src/core/talkers3/wc-talkers.helpers.ts`
  - Keys: `get_ms_voices`, `get_voices`
  - Source APIs: `/api/polly/list_m`, `/api/polly/list`
- `src/core/tide/getData.ts`
  - Key: full NOAA request URL
  - Source API: `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`
- `src/core/exam/index.ts`
  - Key: `grok_exam`
  - Source API flow: `/api/grok/grok_exam`
  - Current behavior: stores conversation history before submitting API request. This can grow large over time and should move if exam history is meant to persist.
- `src/core/grok/index.ts`
  - Key: `grok_talker`
  - Current code reads this key, but no write was found in the current source tree. Treat as a legacy migration/read cleanup candidate, not an active writer.

Existing IndexedDB code is narrowly scoped to audio recordings:

- `src/hooks/database.tsx`
- `src/hooks/recorderHooks.tsx`
- `src/components/nightNight/Recorder.tsx`
- `src/core/recorderGame/index.tsx`

Do not reuse the existing `audio`/`audioDatabase` stores for JSON API caches. Add a separate cache database/helper to avoid mixing schemas.

## New Shared Helper

Add `src/helpers/indexedDbCache.ts`.

Planned API:

```ts
export type CacheRecord<T> = {
  key: string
  value: T
  updatedAt: number
}

export async function getJsonCache<T>(key: string): Promise<T | null>
export async function setJsonCache<T>(key: string, value: T): Promise<T>
export async function deleteJsonCache(key: string): Promise<void>
export async function clearJsonCache(): Promise<void>
export async function migrateLocalStorageJson<T>(key: string): Promise<T | null>
```

Database design:

- Database: `astro-james-cache`
- Version: `1`
- Object store: `json`
- Key path: `key`
- Record shape: `{ key, value, updatedAt }`

Implementation notes:

- Guard for `typeof window === 'undefined'` and missing `indexedDB`.
- Use promises around `IDBOpenDBRequest`, `IDBRequest`, and transactions.
- `migrateLocalStorageJson` should parse an existing localStorage value, write it to IndexedDB, then remove the old localStorage key only after the IndexedDB write succeeds.
- If IndexedDB fails, callers may still fetch fresh data; do not fail page rendering just because cache access failed.

## Exact Code Changes

### 1. Meme API Cache

File: `src/components/wc-meme-board.ts`

Change:

- Import `getJsonCache`, `setJsonCache`, and `migrateLocalStorageJson`.
- Replace the top-level `localStorage.getItem(SOUNDS)` IIFE with an in-memory-only cache:

```ts
const dog: Partial<Record<typeof SOUNDS, MemeType[]>> = {}
```

- Update `getMemes()` order:
  1. Return `dog[SOUNDS]` if set.
  2. Try `getJsonCache<MemeType[]>(SOUNDS)`.
  3. If empty, try `migrateLocalStorageJson<MemeType[]>(SOUNDS)`.
  4. If still empty, fetch `/api/get_memes`.
  5. Save fetched data with `setJsonCache(SOUNDS, data)`.

Expected outcome:

- The huge `get_memes` list no longer appears in `/localstorage`.
- Existing iPad/local browser data migrates automatically on first visit.

### 2. Talkers2 Microsoft Voice Cache

File: `src/core/talkers2/wc-talkers.helpers.ts`

Change:

- Import IndexedDB cache helpers.
- Replace the top-level `localStorage.getItem(VOICES)` IIFE with in-memory-only `dog`.
- Update `getMicrosoftVoices()` to read `get_ms_voices` from IndexedDB, migrate the old localStorage key, then fetch `/api/polly/list_m` only on cache miss.
- Keep the existing filtering and `Face = makeFace(item.ShortName)` transform before saving fetched data.

Expected outcome:

- `/talkers2` still loads voices before rendering `wc-talker-azure`.
- The large Microsoft voice list moves out of `localStorage`.

### 3. Shared Talk Microsoft Voice Cache

File: `src/core/talk/helpers.ts`

Change:

- Apply the same `get_ms_voices` IndexedDB flow as `talkers2`.
- Keep this file separate from `talkers2` for now because it uses `makeFace(item.LocalName)` instead of `ShortName`.

Expected outcome:

- Routes/components using `src/core/talk/helpers.ts` stop repopulating the old `get_ms_voices` localStorage key.

### 4. Original Talkers Amazon Voice Cache

File: `src/core/talkers/index.ts`

Change:

- Move key `get_voices` from `localStorage` to IndexedDB.
- Preserve filtering to English voices and `Face = makeFace(item.Name || '')`.
- Keep the public `getVoices()` async behavior the same.

Expected outcome:

- The AWS Polly voice list no longer appears in `localStorage`.

### 5. Talkers3 Voice Caches

File: `src/core/talkers3/wc-talkers.helpers.ts`

Change:

- Move both keys to IndexedDB:
  - `get_voices` from `/api/polly/list`
  - `get_ms_voices` from `/api/polly/list_m`
- Remove both top-level `localStorage.getItem` IIFEs.
- Preserve each current transform before writing fetched data to IndexedDB.

Expected outcome:

- `/talkers3` stops using `localStorage` for both voice-list payloads.

### 6. Tide API Cache

File: `src/core/tide/getData.ts`

Change:

- Replace `localStorage.getItem(urlWithParams)` and `localStorage.setItem(urlWithParams, ...)`.
- Use an IndexedDB key with a prefix:

```ts
const cacheKey = `tide:${urlWithParams}`
```

- Cache lookup order:
  1. `getJsonCache<Predictions>(cacheKey)`
  2. `migrateLocalStorageJson<Predictions>(urlWithParams)`
  3. Fetch NOAA API and `setJsonCache(cacheKey, json)`

Migration note:

- The old localStorage key is the raw URL, so migration must read the raw URL key, then store to the prefixed IndexedDB key.
- `migrateLocalStorageJson` may need an optional destination key, or this file can perform the read/write/remove manually.

Expected outcome:

- NOAA prediction payloads no longer create long URL keys in `localStorage`.

### 7. Exam/Grok Conversation History

File: `src/core/exam/index.ts`

Change:

- Move `grok_exam` from top-level synchronous localStorage read to async IndexedDB read during startup.
- Because the module currently computes `past` before `DOMContentLoaded`, restructure so `past` is initialized inside the `DOMContentLoaded` handler:

```ts
let past = (await getJsonCache<PastItem[]>('grok_exam')) ?? []
```

- Migrate the old `grok_exam` localStorage value on first load.
- Replace `localStorage.setItem('grok_exam', JSON.stringify(past))` with `await setJsonCache('grok_exam', past)`.

Decision point:

- This is not a pure API response cache; it is user/session conversation history used as request context. It can grow large, so it is a good IndexedDB candidate, but moving it changes startup timing. Implement after the API-list caches above.

### 8. Legacy Grok Talker Read

File: `src/core/grok/index.ts`

Change:

- No active localStorage writer was found for `grok_talker`.
- Replace the legacy read with an IndexedDB lookup only if this page still needs persisted history.
- If history persistence is not needed, remove the localStorage read and initialize `past` as `[]`.

Decision point:

- Confirm desired behavior before implementing because the current code reads but never writes `grok_talker`.

### 9. Reinstall/Clear Paths

Files:

- `src/components/menu.astro`
- `src/pages/reinstall.astro`
- Optional follow-up: `src/components/AllSettings.tsx`, `src/core/crosswords/CrossWords.ts`

Change:

- Keep `localStorage.clear()` for existing small settings.
- Also clear or delete the new cache database:

```ts
await clearJsonCache()
```

or:

```ts
indexedDB.deleteDatabase('astro-james-cache')
```

Expected outcome:

- "Reinstall app" clears both old localStorage settings and new IndexedDB caches.

## Files Intentionally Left On localStorage

Leave these unchanged in the first migration because they are small, synchronous settings or simple local user data:

- `src/helpers/localStorage.ts`
- `src/helpers/localStorage.js`
- `src/components/Select.tsx`
- `src/components/RangeWithTicks.tsx`
- `src/components/Checkbox.tsx`
- `src/components/SettingItem.tsx`
- `src/data/Calculations.ts`
- `src/data/Calculations2.ts`
- `src/data/State.ts`
- `src/effects/useVoices.ts`
- `src/effects/VoiceMaker.effect.jsx`
- `src/core/voicemaker/index.tsx`
- `src/core/crosswords/CrossWords.ts`
- `src/core/acgame/ACGame.ts`
- `src/core/spin/index.tsx`
- `src/core/timer4/index.tsx`
- `src/core/parental-control/index.ts`
- `src/pages/sro10.astro`
- `src/pages/sro15.astro`
- `src/pages/sro15new.astro`
- `src/pages/sro19.astro`
- `src/pages/temperature.astro`
- `src/core/sro5/index.ts`

Rationale:

- These are not large API response caches.
- Several rely on synchronous reads during initial render or page gate checks.
- Migrating the shared `localStorageWrap` helper would make many callers async and create a much larger refactor.

## Implementation Order

1. Add `src/helpers/indexedDbCache.ts`.
2. Migrate `src/components/wc-meme-board.ts`.
3. Migrate voice-list caches:
   - `src/core/talkers2/wc-talkers.helpers.ts`
   - `src/core/talkers3/wc-talkers.helpers.ts`
   - `src/core/talkers/index.ts`
   - `src/core/talk/helpers.ts`
4. Migrate `src/core/tide/getData.ts`.
5. Decide and then migrate `src/core/exam/index.ts` and `src/core/grok/index.ts`.
6. Update reinstall/clear paths.
7. Run verification.

## Verification Checklist

Run:

```sh
npm run build
```

Browser checks:

- Visit `/talkers2`; confirm voices render and the Sounds dialog still loads memes.
- Reload `/talkers2`; confirm it works from IndexedDB cache without re-adding `get_memes` or `get_ms_voices` to `localStorage`.
- Visit `/talkers3`; confirm Amazon and Microsoft voices load.
- Visit `/talk`; confirm Microsoft voices load.
- Visit `/tide`; confirm tide data loads and reloads from IndexedDB.
- Visit `/localstorage`; confirm large keys are gone:
  - `get_memes`
  - `get_ms_voices`
  - `get_voices`
  - raw NOAA URL keys
  - `grok_exam` if that migration is implemented
- Use "Reinstall app"; confirm localStorage and IndexedDB cache data are cleared.

Manual migration check:

- Before migration, with old localStorage keys present, load the affected page.
- Confirm the page still displays cached data.
- Refresh `/localstorage`.
- Confirm the old key has been removed after successful IndexedDB migration.

## Risks

- IndexedDB APIs are async, so any top-level localStorage cache initialization must move into async functions.
- Some shared keys are used by multiple modules (`get_ms_voices`, `get_voices`). The helper must make the key namespace explicit and consistent so modules share cache intentionally.
- iPad Safari private mode or storage pressure can cause IndexedDB failures. Cache failures should fall back to network fetches rather than breaking pages.
- `localStorage.clear()` will no longer clear the new cache unless reinstall paths are updated.
