# CutOff

Flood photo questions and suggested alternative routes, built for the Dell Social Impact AI Datathon.

## What it does

- Upload a photo or choose one of three organizer dataset images. Qwen describes visible concerns, suggests next checks, and answers follow-up questions about the selected photo.
- Locate the photo on a real map, choose a start and destination, and mark a confirmed affected area. The backend calculates a road path that excludes segments intersecting that area.

The model is pretrained; no dataset fine-tuning was performed. A photo does not establish current road safety. Routes use a limited local OpenStreetMap graph and user-confirmed exclusions. Live closures, turn restrictions, traffic, and vehicle limits are not modeled. Routes are suggestions requiring field verification.

## Run locally

Requires Node.js 24 and npm. From the repository root:

```sh
npm --prefix backend ci
npm --prefix frontend ci
```

Copy `backend/.env.example` to `backend/.env`. Set `QWEN_API_KEY` to the organizer-supplied credential privately. The default model service is `http://10.246.100.230/v1`, which requires the event network. The backend discovers the actual served model ID. Keep `.env` out of Git.

Start the backend:

```sh
npm --prefix backend start
```

In another terminal, start the frontend:

```sh
npm --prefix frontend run dev
```

Open http://127.0.0.1:5173/. The frontend proxies `/api` to the app backend at `127.0.0.1:8000`. This app backend is separate from the organizer's Qwen API. Laptop localhost refers to the laptop.

## Try the workflow

1. Select a sample photo and press **Analyze photo**. Ask a follow-up question. Both actions require the real model service.
2. Enter where the photo was taken and choose a search result, or place its marker on the map. Unknown sample dates and locations remain unknown.
3. Select start and destination addresses or map pins within 5 km of each other.
4. Select **Affected area**, place it on the map, adjust the radius, and confirm the observation. The photo marker by itself does not exclude any road.
5. Calculate the alternative. Teal shows the computed path; gray dashed shows the baseline. The app can report no supported path within the downloaded local graph.

Changing photo context or location clears old AI answers. Replacing a photo also clears its location, conversation, and affected area. Start/destination selections remain. App state resets on reload.

## Verification and current dependencies

```sh
npm --prefix frontend run build
node --test backend/integration.test.mjs backend/routing.test.mjs backend/geocoding.test.mjs
```

The checks cover real sample-image encoding/transmission to a mock model, image follow-up requests, authentication/error handling, geocoding adapter behavior, and road exclusion/pathfinding regressions. Mock tests do not prove live Qwen inference. The app requires a reachable organizer endpoint and a valid local credential for real analysis. Place searches and map/road data also depend on external OpenStreetMap services.

## Data and implementation

- [Organizer dataset](https://huggingface.co/datasets/jennifer-fowler/UTSA-flood-images). Three images are bundled under `frontend/public/samples/`; source links and the listed CC BY-NC 4.0 license are recorded in `manifest.json`.
- [Organizer starter code](https://github.com/jennifer-fowler/GB10competition).
- Qwen3-VL-8B-Instruct served through an OpenAI-compatible API on the Dell GB10.
- React, TypeScript, Vite, Leaflet, Express, Sharp, and Dijkstra pathfinding over OpenStreetMap road data.

See [frontend/README.md](frontend/README.md) for endpoint contracts, configuration, and the earlier implementation verification log.
