# Waypoint — Intelligent Trip Planning Platform

**Team Name:** Waypoint Wizards
**Team Members:** Li Junyu & Alpha Hong (Team 6761)
**Proposed Level of Achievement:** Apollo

**[Live Demo] (https://waypoint-wizards.vercel.app)**


## Motivation

Planning a trip is a complex and time-consuming process. Travelers often need to search across multiple platforms to gather information about attractions, routes, accommodation, weather, and activities. Even after collecting this information, organizing it into a practical day-by-day itinerary requires significant effort.

Existing travel planning tools either focus on specific aspects of travel (such as booking flights or accommodations) or require users to manually construct their itineraries. This fragmented experience makes trip planning inefficient and difficult to manage, particularly for group travel where coordination between multiple people is required.

We are motivated to build a centralized trip planning platform that simplifies this process by automatically organizing travel information and assisting users in generating optimized itineraries. By combining location data, routing information, and personalized preferences, our system aims to help travelers plan trips more efficiently while reducing manual effort.


## Aim

Waypoint is an intelligent trip planning platform that allows users to easily create, manage, and optimize travel itineraries. The system assists users in discovering attractions, organizing daily travel schedules, and optimizing travel routes between locations. By integrating multiple data sources such as location services, weather forecasts, and routing information, the application provides users with a convenient and intelligent way to plan their trips.

The platform also supports collaborative planning so that multiple users can coordinate and contribute to the same itinerary.


## User Stories

1. As a traveler who wants to plan a trip, I want to be able to search for attractions in a destination so that I can build an itinerary for my trip.
2. As someone who dislikes planning, I want the system to automatically generate a suggested itinerary so that I do not need to manually organize all activities.
3. As a traveler planning a group trip, I want to collaborate with my friends on the same itinerary so that everyone can contribute ideas.
4. As a traveler unfamiliar with the city, I want to be able to interact with maps and plan optimised routes between attractions to minimise travel time.
5. As a planner, I want to be able to plan accommodation and bookings on the app.
6. As a traveler, I want to track finances of the trip and record who paid for each expense (Splitwise-style).


## Features

### Core Features

**Feature 1: Intelligent Itinerary Generator**
The system generates a day-by-day itinerary based on user inputs such as destination, trip duration, interests, and preferred activity types. Attractions are selected and organized into a logical schedule.

**Feature 2: Map-Based Route Optimization**
The system calculates optimal routes between attractions using routing APIs to minimize travel time between activities within the same day.

**Feature 3: Attraction Discovery and Search**
Users can search for attractions, restaurants, and points of interest within a destination. Results include location information, ratings, and categories.

### Extension Features

**Feature 4: Collaborative Trip Planning**
Multiple users will be able to edit and contribute to the same itinerary. Users can add, remove, or rearrange activities while updates are synchronized across collaborators.

**Feature 5: Accommodation and Bookings**
The system will integrate third-party accommodation and event booking platforms into the trip planning workflow.

**Feature 6: Budget Estimation and Tracking**
The application will estimate approximate travel costs and feature a built-in shared ledger where trip expenses can be tracked and split between users (similar to Splitwise).


## Milestone 1 — Technical Proof of Concept

### What We Built

For Milestone 1, we have built an integrated frontend and backend that demonstrates the core system architecture with the following working features:

#### 1. User Authentication (Login / Sign Up)
- Users can register a new account and log in via a JWT-based authentication system.
- Passwords are hashed using `bcrypt` before being stored in the database.
- Auth tokens are stored as `httpOnly` cookies for security.
- Backend API routes: `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
- Frontend pages: `/login`, `/sign-up`

<table>
  <tr>
    <td><img src="./screenshots/login.png" width="400"/></td>
    <td><img src="./screenshots/signup.png" width="400"/></td>
  </tr>
</table>

#### 2. Trip Creation
- Authenticated users can create a new trip by specifying a destination, start date, and end date.
- The trip is saved to the database and linked to the user's account.
- Users are redirected to the trip planning view upon creation.
- Backend API route: `POST /api/new-trip`
  

  <img src="./screenshots/new-trip.png" width="500"/>

#### 3. Attraction Search with Google Places API
- Given a destination, the system geocodes the location and fetches nearby attractions using the Google Places Text Search API.
- Results display each attraction's name, rating, address, and total reviews.
- Backend API routes: `GET /api/geocode`, `GET /api/attractions`


#### 4. Interactive Map
- Attractions are displayed as markers on an interactive Google Map (`@vis.gl/react-google-maps`).
- Clicking a marker on the map scrolls to the corresponding attraction card in the list.
- Selecting an attraction card pans the map to its coordinates.


  ![Interactive Map](./screenshots/map-view.png)

#### 5. Drag-and-Drop Itinerary Builder
- Users can drag attractions from the search results panel and drop them into a day-by-day itinerary sidebar.
- Within each day, attractions can be reordered via drag-and-drop using `@dnd-kit`.
- The itinerary sidebar supports multiple days based on the trip duration.

  ![Itinerary demo](./screenshots/demo.gif)

#### 6. User Dashboard
- Authenticated users have a dashboard displaying their saved trips.
- Backend API route: `GET /api/get-user-trips/[userId]`


  ![Dashboard](./screenshots/dashboard.png)

### System Architecture

The application follows a layered architecture:


<img src="./screenshots/structure.png" width="500"/>

**Key design decisions:**
- Next.js App Router is used for both frontend pages and backend API routes, keeping the codebase unified.
- Prisma ORM abstracts the database layer, making it easy to switch databases if needed.
- Authentication is stateless (JWT) to support future collaborative features.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React, Tailwind CSS |
| Backend | Next.js API Routes (Node.js) |
| Database | PostgreSQL (via Prisma ORM) |
| Auth | JWT, bcrypt |
| Maps | Google Maps API (`@vis.gl/react-google-maps`) |
| Places | Google Places Text Search API |
| Drag & Drop | `@dnd-kit/core`, `@dnd-kit/sortable` |
| Deployment | To be configured (Docker / Railway) |

### Software Engineering Practices

**Modular Architecture**
The codebase is organized by concern: API routes under `src/app/api/`, React components under `src/components/` (further split by feature: `login/`, `map/`, `trip/`, `itinerary/`, `sidebar/`), and pages under `src/app/`.

**Version Control**
We use Git for version control with our repository hosted on GitHub. Feature branches are used to isolate development work.

**Agile Development**
Development follows an iterative process with weekly goals aligned to milestone targets.

**Testing**
Unit and integration testing will be added progressively, with priority on API routes and core business logic.


## Milestone 2 — Prototype

### What We Built

#### 1. Persistent Itinerary Saving
- Users can save their drag-and-drop itinerary to the database at any time via the Save button.
- Saved itineraries are loaded back into the trip editor on each visit.
- Backend API route: `POST /api/itinerary/[itineraryId]/save`

#### 2. Social System (Follow / Unfollow)
- Users can search for other users by name and send follow requests.
- Follow requests must be accepted before a follow relationship is established.
- Users can view their followers and following lists, and unfollow at any time.
- Mutual friendship (bidirectional ACCEPTED follow) is used as a prerequisite for inviting collaborators.
- Backend API routes: `POST /api/users/[userId]/follow`, `POST /api/users/[userId]/follow-request`, `POST /api/users/[userId]/unfollow`, `GET /api/users/[userId]/get-followers`, `GET /api/users/[userId]/is-following`, `GET /api/users/search-user`, `GET /api/users/get-follow-requests`, `GET /api/users/[userId]/mutual-friends`

#### 3. Real-Time Collaborative Editing (LiveBlocks)
- Each itinerary is a LiveBlocks room identified by its `itineraryId`.
- Multiple collaborators can edit the same itinerary simultaneously with changes synced in real time (~100ms).
- Live cursor tracking shows each collaborator's cursor position and name on screen.
- The `liveblocks-auth` endpoint gates room access by checking the `Collaborator` table — only authorized users can connect.
- Itinerary data is stored as a `LiveMap<day, LiveList<LiveObject<AttractionEntry>>>` in LiveBlocks storage.
- Backend API route: `POST /api/liveblocks-auth`

#### 4. Collaborator Management
- The itinerary owner can invite mutual friends as collaborators via the Collaborator Panel.
- Invitees must have a bidirectional ACCEPTED follow relationship with the owner.
- The owner can also remove collaborators (cannot remove themselves as OWNER).
- Optimistic UI updates the collaborator list immediately on invite/remove.
- Backend API route: `POST /api/itinerary/[itineraryId]/collaborators`, `DELETE /api/itinerary/[itineraryId]/collaborators`

#### 5. Profile Management with Photo Upload
- Users can update their name, email, and profile picture from the Account page.
- Profile pictures are uploaded server-side to Supabase Storage using the service role key (bypasses Supabase RLS, compatible with custom JWT auth).
- Backend API route: `POST /api/upload-avatar`

#### 6. Route Directions & Trip Details Panel
- After adding attractions to a day, the app automatically fetches walking, driving, and transit routes between them via the Google Routes API.
- Routes for all days are fetched in parallel and displayed as coloured polylines on the map.
- Transit routes render each segment in the transit line's actual colour, with walking segments shown as dashed grey lines.
- A Trip Details Panel shows per-leg travel time and distance for the selected day and transport mode.
- Backend API route: `POST /api/directions`

#### 7. User Profiles
- Public profile pages at `/users/[id]` show a user's name, avatar, and follow status.

#### 8. Itinerary Rename
- Trip owners can rename their itinerary.
- Backend API route: `PATCH /api/itinerary/[itineraryId]/rename`

### Updated Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes (Node.js) |
| Database | PostgreSQL on Neon (via Prisma ORM) |
| Auth | Custom JWT (jose + bcrypt, HTTP-only cookie) |
| Real-Time | LiveBlocks (collaborative storage + presence/cursors) |
| File Storage | Supabase Storage |
| Maps | Google Maps API (`@vis.gl/react-google-maps`) |
| Directions | Google Routes API (walking, driving, transit) |
| Places | Google Places Text Search API |
| Drag & Drop | `@dnd-kit/core`, `@dnd-kit/sortable` |

### Architecture Notes

**LiveBlocks collaboration**: The itinerary editor is split into a `TripClient` shell (renders `RoomProvider`, seeds `initialStorage` from the database on first visit) and a `TripInner` component (all live hooks: `useStorage`, `useMutation`, `useMyPresence`, `useOthers`). LiveBlocks becomes the source of truth for itinerary state after the first visit; the Save button syncs it back to the database.

**File upload pattern**: Profile pictures are routed through `/api/upload-avatar` (Next.js server) which uses the Supabase service role key. This is necessary because Supabase RLS requires Supabase Auth JWTs, which are incompatible with our custom JWT system. The service role key never reaches the client.

**Mutual friend gating**: Inviting a collaborator requires both `Follow(callerId → invitee, ACCEPTED)` and `Follow(invitee → callerId, ACCEPTED)` to exist in the database.

**Directions**: On every itinerary change, the app fetches walking, driving, and transit routes for each day in parallel from `/api/directions`. Transit routes are rendered as coloured polyline segments matching the transit line colour. Route details (duration, distance per leg) are shown in the `TripDetailsPanel`.


## Testing

### Tools

| Type | Tool | Purpose |
|---|---|---|
| Unit & Integration | Jest + ts-jest | Test pure functions and API route logic |
| Component | @testing-library/react | Test React components in a simulated DOM |
| System (E2E) | Playwright | Automate a real browser to test full user flows |

---

### Unit Tests

Unit tests cover pure functions and service-layer logic with no real database or network calls. External dependencies (Prisma, bcrypt) are mocked so tests run instantly.

**`src/lib/auth/tokens.ts` — JWT Utilities**

| Test | What to verify |
|---|---|
| `signJWT` returns a valid token | Signed token can be decoded by `verifyJWT` with the correct `userId` and `email` |
| `verifyJWT` returns the correct payload | Payload fields match exactly what was passed to `signJWT` |
| `verifyJWT` returns null for an expired token | A token signed with a zero-second expiry is rejected |
| `verifyJWT` returns null for a tampered token | Any character modification to the token string causes rejection |
| `verifyJWT` returns null for an empty string | Passing an empty string does not throw, returns null |
| `verifyJWT` returns null for a malformed string | Non-JWT strings (e.g. `"abc"`) return null gracefully |

**`src/services/userServices.ts` — User Creation & Verification**

| Test | What to verify |
|---|---|
| `createUser` hashes the password | The stored password is not equal to the plain-text input |
| `createUser` normalises email to lowercase | `"User@Example.com"` is stored as `"user@example.com"` |
| `createUser` throws if email already exists | Duplicate email raises `"Email already registered"` |
| `createUser` throws if name already taken | Duplicate name raises `"Name already taken."` |
| `verifyUser` returns a token on correct credentials | Returns an object with a `token` string |
| `verifyUser` throws on wrong password | Raises `"Invalid Credentials"` |
| `verifyUser` throws on non-existent email | Raises `"Invalid Email"` |
| `verifyUser` email lookup is case-insensitive | `"USER@EXAMPLE.COM"` matches a user stored as `"user@example.com"` |

**`src/services/socialsServices.ts` — Follow Logic**

| Test | What to verify |
|---|---|
| `followUser` creates a PENDING follow record | Returns a Follow object with `status: "PENDING"` |
| `unfollowUser` removes the follow record | Subsequent `getFollowStatus` returns `"NONE"` |
| `getFollowStatus` returns `"NONE"` when no record exists | No follow between two users returns `"NONE"` |
| `getFollowStatus` returns `"PENDING"` for a pending request | Returns `"PENDING"` before acceptance |
| `getFollowStatus` returns `"ACCEPTED"` after acceptance | Returns `"ACCEPTED"` once the follow is updated |
| `respondToFollowRequest` with `"ACCEPT"` updates status | Follow record status becomes `"ACCEPTED"` |
| `respondToFollowRequest` with `"REJECT"` deletes the record | Follow record is removed entirely |
| `getFollowers` only returns ACCEPTED follows | PENDING followers are excluded from results |
| `getFollowers` includes `followBackStatus` for each follower | Each returned user has a `followBackStatus` field |
| `searchUsers` returns matching users case-insensitively | Searching `"alice"` matches a user named `"Alice"` |
| `searchUsers` includes `followStatus` for each result | Each returned user has a `followStatus` field |
| `getNumFollowers` counts only ACCEPTED follows | PENDING follows are not counted |
| `getNumFollowing` counts only ACCEPTED follows | PENDING follows are not counted |

**`src/services/tripServices.ts` — Itinerary Creation**

| Test | What to verify |
|---|---|
| `createItinerary` creates the itinerary with correct fields | Title, location, startDate, endDate match input |
| `createItinerary` creates a Collaborator row with role OWNER | Returned `collaborators` array contains one entry with `role: "OWNER"` and the correct `userId` |
| `createItinerary` links the owner to the itinerary | The Collaborator record's `itineraryId` matches the created itinerary's `id` |

**`src/components/trip/TripClient.tsx` — `sortAttractions`**

| Test | What to verify |
|---|---|
| Higher-rated attraction with more reviews ranks first | A 4.8★ / 10,000 reviews attraction ranks above a 3.5★ / 100 reviews attraction |
| Same rating, more reviews ranks higher | Two 4.5★ attractions — the one with more reviews comes first |
| Same rating and same reviews preserves relative order | No crash, stable output |
| Single-element array returns unchanged | Input with one attraction returns that same attraction |
| Empty array returns empty array | No crash on empty input |

---

### Integration Tests

Integration tests call your actual API route handlers against a real test database. They verify that authentication checks, Prisma queries, and HTTP response codes all work correctly together.

**`POST /api/auth/signup`**

| Test | Expected result |
|---|---|
| Valid name, email, and password | 200, success response, user exists in DB |
| Duplicate email | 500, error message about email already registered |
| Duplicate username | 500, error message about name already taken |
| Missing email field | 200 with error (missing field check) |
| Missing password field | 200 with error (missing field check) |

**`POST /api/auth/login`**

| Test | Expected result |
|---|---|
| Correct email and password | 200, `Set-Cookie` header with `token` present |
| Wrong password | 401, `"Invalid Credentials"` |
| Non-existent email | 401, `"Invalid Email"` |
| Email with different casing | 200, login succeeds (case-insensitive lookup) |

**`POST /api/itinerary/[itineraryId]/collaborators`**

| Test | Expected result |
|---|---|
| OWNER invites a mutual friend | 201, Collaborator row created in DB with role EDITOR |
| OWNER invites a non-mutual-friend | 403, `"Invitee is not a mutual friend"` |
| OWNER invites a user with only a one-sided follow | 403, mutual friend check fails |
| EDITOR tries to invite someone | 403, `"Only the OWNER can add collaborators"` |
| Unauthenticated request | 401 |
| Inviting an already-existing collaborator | 201, upsert no-ops without error |

**`DELETE /api/itinerary/[itineraryId]/collaborators`**

| Test | Expected result |
|---|---|
| OWNER removes an EDITOR | 200, Collaborator row deleted from DB |
| OWNER tries to remove themselves (OWNER role) | 400, `"Cannot remove the OWNER"` |
| EDITOR tries to remove someone | 403 |
| Removing a non-existent collaborator | 404 |
| Unauthenticated request | 401 |

**`GET /api/users/[userId]/mutual-friends`**

| Test | Expected result |
|---|---|
| Two users with bidirectional ACCEPTED follows | Both appear in each other's mutual friends list |
| One-sided follow (A→B only) | B does not appear in A's mutual friends |
| Both follows exist but one is PENDING | User not returned (must be ACCEPTED) |
| With `?itineraryId=` param | Users already in that itinerary's collaborators are excluded |
| Requesting as a different userId than the authenticated user | 403 |
| Unauthenticated request | 401 |

---

### System Tests (End-to-End)

System tests automate a real browser using Playwright to verify complete user flows from the UI perspective.

**Flow 1: Authentication**
1. Navigate to `/sign-up`
2. Fill in name, email, and password, then submit
3. Assert redirect to `/dashboard`
4. Log out, navigate to `/login`, log in with the same credentials
5. Assert the dashboard is visible and the user's name appears in the sidebar

**Flow 2: Trip Creation and Itinerary Building**
1. Log in as a test user
2. Click "New Trip", fill in a destination, select start and end dates, then submit
3. Assert redirect to the trip page at `/trip/[id]`
4. Wait for attractions to load in the left panel
5. Drag an attraction card into Day 1 in the itinerary sidebar
6. Assert the attraction appears under Day 1
7. Click Save and assert the confirmation state

**Flow 3: Social Follow Flow**
1. Log in as User A, search for User B by name
2. Send a follow request to User B
3. Log in as User B, navigate to `/socials`
4. Accept the follow request from User A
5. User B sends a follow request back to User A
6. Log in as User A and accept it
7. Assert both users appear in each other's mutual friends list when opening the Collaborator Panel

**Flow 4: Collaborative Editing**
1. Log in as User A (trip owner), open a trip
2. Open the Collaborator Panel and invite User B (mutual friend)
3. In a second browser context, log in as User B and navigate to the same trip URL
4. User A drags an attraction into Day 1
5. Assert User B's itinerary updates without refreshing within 2 seconds
6. Assert User A's cursor label is visible in User B's view

---

### Running Tests

Unit and integration tests: `npx jest`

Unit tests in watch mode: `npx jest --watch`

System tests (requires dev server running on port 3000): `npx playwright test`

View Playwright HTML report after a run: `npx playwright show-report`

---

## Development Plan

### Milestone 3 (27 Jul – 26 Aug) — Extended System

- Weather-based itinerary adjustments
- Budget estimation and shared expense tracking
- Improved UI/UX and performance optimizations
- Cloud deployment
