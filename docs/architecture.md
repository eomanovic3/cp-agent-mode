# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Build the React UI to fetch from the API and render data with explicit loading, empty, success, and error states; keep the accessible text and router layout consistent with the exercise contract.
- Logic tier decision: Keep route logic thin and move validation and business behavior into Express service functions that return deliberate 4xx errors for invalid IDs and payloads instead of uncaught 500s.
- Data tier decision: Enforce required schema fields in Mongoose models and keep seeding idempotent with upserts so demo data persists without wiping unrelated records.
- Activity tracking approach: Accept userId and teamId from the request, validate both ObjectIds, ensure the referenced user and team exist, and create activities with required type, minutes, points, and occurredAt values.
- Team management approach: Require name and mascot on team creation; default members to an empty array and preserve submitted member ids when provided.
- Leaderboard approach: Aggregate activity points by team, sum totals, sort descending, and assign a 1-based rank to each team entry.
- Workout suggestions approach: Match the user’s fitness goal and recent activity pattern to workout focus areas, returning a reason that explains the recommendation and a 404 for unknown emails.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
  - Verifies the Mongoose schemas enforce the required user, team, activity, and workout fields and that seed data remains idempotent.
- API command: `npm run test:api --prefix octofit-tracker/backend`
  - Verifies the Express API returns 4xx errors for invalid payloads, creates and lists valid activities, orders leaderboard totals, and matches workout suggestions to the seeded user activity pattern.
- Frontend command: `npm test --prefix octofit-tracker/frontend`
  - Verifies the React app renders API results and shows loading, empty, and failure states with accessible text.
- Backend build command: `npm run build --prefix octofit-tracker/backend`
  - Confirms the TypeScript backend compiles cleanly.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
  - Confirms the Vite React app builds cleanly for production.

### Baseline results observed

- Data-tier contract initially failed because the models were missing required field validation.
- API contract initially failed because the service layer returned 501 placeholders instead of implementing validation and aggregation logic.
- Frontend contract initially failed because each capability panel still rendered a static “Implementation pending” message rather than fetching and rendering real API data.
