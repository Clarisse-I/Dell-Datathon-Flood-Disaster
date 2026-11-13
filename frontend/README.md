# CutOff — flood photo questions & suggested alternatives

## Start (Node 24)

From the repository root, in two terminals:

```powershell
npm --prefix backend install
npm --prefix backend start
```

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

Open http://127.0.0.1:5173. Build: `npm --prefix frontend run build`. Preview: `npm --prefix frontend run preview` at http://127.0.0.1:4173. Both Vite modes proxy `/api` to the separate backend on laptop port 8000.

## Model handoff

The backend defaults to the organizer-supplied `http://10.246.100.230/v1`. It discovers the exact served model ID from `/models`, preferring `Qwen/Qwen3-VL-8B-Instruct` or accepting the sole served ID. Multiple unrelated IDs require an explicit `QWEN_MODEL`. Connected is shown only after discovery succeeds; it never implies successful image inference.

Optional configuration: copy `backend/.env.example` to ignored `backend/.env`, then set `QWEN_BASE_URL`, optional `QWEN_MODEL`, and `QWEN_API_KEY` if required. Secrets stay server-side. Laptop localhost refers to the laptop; the private GB10 address requires the event network/VPN and an accessible model server. `frontend/.env.local` can set `API_PROXY_TARGET` to a different app backend. Production hosting needs its own `/api` reverse proxy.

- `POST /api/analyze` retains the existing multipart contract: one `images` file plus optional `human_notes`. Returns `{observations: string[1–2], actions: string[1–3], uncertainty?: string}`.
- `POST /api/question` adds `question` (max 1000 characters) and `history` (JSON array of at most six user/assistant messages, max 2000 characters each). Returns `{answer:string}`. Every request includes the currently selected photo; the UI keeps only the latest three question/answer pairs. Changing photo clears conversation, question, photo marker, and exclusion; origin/destination remain. Changing photo location or context clears previous AI results and conversation. In-flight answers for older evidence are discarded.
- Sharp fully decodes JPEG/PNG/WebP, rejects >40 megapixels and uploads >20 MB, auto-rotates, resizes within 1280×1280 without distortion/upscaling, and encodes JPEG for Qwen. Invalid files fail with a real error. Temperature 0 and 400 output tokens bound inference. Server timeout: 85 seconds; browser: 90 seconds. Photo, context and unsent question survive errors. No demo fallback exists.

The model is pretrained. The organizer dataset is sample/evaluation material; no fine-tuning was performed. Dates and locations remain unknown where metadata is absent. Samples in `public/samples` retain source/license records in `manifest.json` (CC BY-NC 4.0; no per-image photographer credits in the provided dataset README).

## Real road graph routing

Select Start, Destination, Photo location, or Affected area and click the real Leaflet/OpenStreetMap map. Keyboard users can set the selected point with latitude/longitude entry. Map initially shows San Antonio solely as a view, never an inferred sample location.

Mark an exclusion circle (25–1000 m), then explicitly confirm the human observation. Moving the area/changing its radius revokes confirmation. No photo marker excludes roads automatically. Calculate alternative removes every directed road segment intersecting the confirmed circle, including crossings whose endpoints lie outside it. Gray dashed line is the baseline; teal line is the computed alternative. No-route leaves markers/area visible and gives a clear explanation. An unchanged route explicitly says the baseline already avoided the area.

`POST /api/route` JSON: `{origin:[lat,lon],destination:[lat,lon],exclusion?:{center:[lat,lon],radius:meters,confirmed:true}}`.

Backend fetches a small real road graph from OpenStreetMap's map API, filters for driving roads, applies access/private/motor-vehicle exclusions and one-way direction, then runs Dijkstra before/after excluding edges. No routing key is required. Origin/destination must be within 5 km, query extent within 0.0036 square degrees, and pins within 300 m of a road node. Queries include ~550 m latitude/longitude margins; no path means no supported path in that **local graph**, not proof of complete isolation. Start/destination snap gaps are reported and not drawn as drivable connections. Very dense areas may exceed OSM's map node limit: choose closer points.

No live road closure feed is connected. Turn restrictions, vehicle limits, temporary changes and field conditions are not modeled. This is a suggested alternative for verification, not navigation or a safe-route claim. Map data comes from OSM contributors under ODbL; attribution is visible. The API supplies fetched time; snapshot time is unknown, displayed honestly. Map edits are not current closure data.

`OSM_MAP_URL` can configure another compatible map JSON endpoint. Graphs are cached in memory for 30 minutes (max nine bounded areas). For event-scale/public use, use a hosted graph/extract instead of repeated public map downloads. Overpass was tested but failed/was at capacity in this environment, so the finished implementation uses the working OSM map API.

## Verification and limits

Run `node --test backend/integration.test.mjs backend/routing.test.mjs`.

Tests verify two distinct real photos are resized and transmitted with context, follow-up retains image plus bounded history, malformed/offline model errors and invalid uploads, crossing-edge exclusions, alternate paths, no-route, one-way and private access. Model integration tests use a mock endpoint and **do not prove real Qwen inference**.

Real routing was verified through the browser: start `[29.425,-98.493]`, destination `[29.433,-98.488]`; baseline 1353 m. A user-confirmed 100 m exclusion at `[29.4308863,-98.4933884]` yielded a 1378 m alternative, excluding 158 directed edges. A separate 75 m API check excluded 118 directed edges with the same alternative length. These coordinates are a UI/routing test, not attributed to any sample photo.

Real GB10 inference remains blocked: `/models` at the supplied private-network address timed out from the laptop. Browser image requests show an honest timeout; no image-specific output has been verified. Join the private event network/VPN and ensure port 80 and the model server are reachable, then retry AF001 and HC001 and follow-up questions. Verify the actual served model ID and any required API key with the organizer. Health alone is insufficient.

This local prototype keeps app state in memory; reloading resets it. Backend binds loopback and does not log photos/keys. Public deployment requires the team's authentication, rate limiting, HTTPS and service provisioning.

References: [Leaflet](https://leafletjs.com/reference-1.9.4.html), [OSM map API / JSON](https://wiki.openstreetmap.org/wiki/API_v0.6), [Sharp resize](https://sharp.pixelplumbing.com/api-resize/).

Later road-service checks returned HTTP 503 (upstream first-byte timeout). The app surfaces this and preserves map selections for retry; it does not substitute a drawn or canned path. The successful real-graph/browser checks above occurred before that intermittent service failure. Recheck the OSM endpoint if routing is unavailable at handoff.

Browser file-picker automation was restricted by the Chrome extension's file-URL permission; no browser permission settings were changed. The upload multipart path was verified with actual local image files in backend integration tests. Manual file selection remains available in the browser.

## Organizer settings and location search (latest changes)

`backend/.env.example` now supplies `QWEN_MODEL=qwen3-vl-8b-instruct` and a **placeholder** for `QWEN_API_KEY`. Put the real organizer credential only in ignored `backend/.env`, then restart the backend. Never put it in frontend variables. Model discovery now runs even when a model is configured, matches the actual served ID (including qualified-name aliases), and uses that exact returned ID. HTTP 401/403 reports authentication failure separately from network, timeout, ID mismatch, and unreadable output. Logs contain error codes only.

At the current verification point, TCP port 80 at `10.246.100.230` was unreachable from this laptop. No organizer credential slide was available among the chat attachment files; therefore the authenticated event-server checks cannot be claimed. A blank, ignored local .env is configured with the supplied URL/model; the credential still needs to be supplied. No API key was inferred or fabricated. There is no existing authorized GB10 remote connection configured, so the GB10-only `/tmp/datathon/UTSA-flood-images-complete` directory was not inspected from Windows. Existing validated public samples remain in use; unknown dates/locations/photographer credits remain unknown.

The prominent **Where was this photo taken?** field searches real Nominatim results. Search requires explicit submission; no autocomplete requests are made. Choose a result to resolve ambiguity, center the map, and create the distinct photo pin. Drag the blue P pin or select Photo location and click the map to correct it. Separate Start and Destination fields work the same way; **Use photo location as start** copies the selected photo coordinate without declaring a closure. Editing a resolved location clears its coordinates and the old route until a new result/pin is selected. The selected location is sent to Qwen as user-provided context, never inferred GPS.

Nominatim requests have application identification, caching, and an app-wide queue limited to less than one request per second. Set `GEOCODING_URL` to another compatible/self-hosted endpoint if needed. [Provider usage policy](https://operations.osmfoundation.org/policies/nominatim/). Addresses entered in this prototype are submitted to that service only when Search is pressed.

Routes now include estimated minutes using mapped/default road speeds (not traffic), ordered road-distance steps, and server-side verification that no returned segment intersects a confirmed exclusion. Road graph queries with the same extent are coalesced and cached for 30 minutes to reduce public-service requests. The public-service and limited-local-graph caveats above still apply.

Run all checks with `node --test backend/integration.test.mjs backend/routing.test.mjs backend/geocoding.test.mjs`. The model test uses a test-only credential and verifies authenticated discovery, returned-ID selection, both real sample uploads, follow-up context, and distinct authentication errors against a mock server. It is not proof of organizer-server inference.

Before any push, stage intended files only, inspect `git diff --cached`, run `git diff --cached --check`, and run `node backend/audit-staged.mjs`. The audit compares staged content against any actual locally configured key without printing it. Local `frontend/src/images/download*.jpeg` files are user-provided extras with unknown attribution and are intentionally left untouched/untracked; the app uses the attributed dataset assets instead.
