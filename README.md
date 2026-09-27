# ReleaseCheck 📋

> **Your all-in-one release checklist tool for software development teams.**

ReleaseCheck is a functional, modern single-page web application (SPA) built to streamline release processes for software teams. It allows developers to create releases, track completed checklist steps, compute real-time release status, and maintain release notes.

---

## 🚀 Live Demo & Deployment

- **Frontend (Vercel)**: Hosted single-page application built with React 18, Vite, and Apollo Client.
- **Backend (Render)**: Hosted GraphQL API built with Node.js, Express, Apollo Server v4, and Prisma.
- **Database (Neon PostgreSQL)**: Cloud PostgreSQL database tracking all release records.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Apollo Client v3, React Router v6 |
| **Styling** | Vanilla CSS (Custom design system, Responsive, HSL color scheme) |
| **API Layer** | GraphQL (Apollo Server v4 + Apollo Client) |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL (Hosted on Neon / Local via Docker) |
| **Containerization** | Docker, docker-compose |
| **Testing** | Jest, Vitest, Apollo `executeOperation` integration test suite |

---

## 💡 Design Decisions

1. **Computed Status Property (Not Stored)**
   - Per requirement, release status (`PLANNED`, `ONGOING`, `DONE`) is dynamic:
     - 0 steps completed $\rightarrow$ `PLANNED`
     - All 7 steps completed $\rightarrow$ `DONE`
     - 1 to 6 steps completed $\rightarrow$ `ONGOING`
   - Rather than storing status in the DB (which could get out of sync), it is computed dynamically in the GraphQL field-level resolver `Release.status`.

2. **Simplified Steps Data Model (No Separate Steps Table)**
   - Since steps are standard across releases and do not change per release over time, steps are defined as a shared constant array (`RELEASE_STEPS`).
   - Each `Release` database record simply stores an array of completed step indices (`completedSteps Int[] @default([])`).
   - This keeps database queries light, eliminates unnecessary SQL joins, and avoids complex relational overhead.

3. **Atomic Step Toggling (`toggleStep` Mutation)**
   - Instead of sending full array mutations over network requests, a dedicated `toggleStep(id, stepIndex)` GraphQL mutation handles checking and unchecking steps atomically on the backend.

4. **Single Repository & Clean Monorepo Structure**
   - Clean separation into `client/` and `server/` directories with root orchestration via `docker-compose.yaml`.

---

## 🗄 Database Schema

The application uses PostgreSQL with Prisma ORM.

### `Release` Table

```prisma
model Release {
  id             String   @id @default(uuid())
  name           String
  date           DateTime
  additionalInfo String?
  completedSteps Int[]    @default([])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### Fields Overview

| Field | Type | Attributes | Description |
|---|---|---|---|
| `id` | `UUID` | `@id`, auto-generated | Primary key |
| `name` | `String` | Mandatory | Name of the release (e.g., `Version 1.0.1`) |
| `date` | `DateTime` | Mandatory | Release target / due date |
| `additionalInfo` | `String?` | Optional | Additional remarks or notes for the release |
| `completedSteps` | `Int[]` | Default `[]` | Array of completed step indices `[0, 1, 2, ...]` |
| `createdAt` | `DateTime` | Auto `now()` | Timestamp of creation |
| `updatedAt` | `DateTime` | Auto `@updatedAt` | Timestamp of last update |

---

## 🔌 GraphQL API Layer

The API uses GraphQL schemas served by Apollo Server v4 at `/graphql`.

### Enums & Types

```graphql
enum ReleaseStatus {
  PLANNED
  ONGOING
  DONE
}

type Release {
  id: ID!
  name: String!
  date: String!
  status: ReleaseStatus!
  additionalInfo: String
  completedSteps: [Int!]!
  createdAt: String!
  updatedAt: String!
}
```

### Queries

```graphql
# Fetch all releases ordered by date descending
query GetReleases {
  releases {
    id
    name
    date
    status
    additionalInfo
    completedSteps
  }
}

# Fetch a single release by ID
query GetRelease($id: ID!) {
  release(id: $id) {
    id
    name
    date
    status
    additionalInfo
    completedSteps
  }
}
```

### Mutations

```graphql
# Create a new release
mutation CreateRelease($input: CreateReleaseInput!) {
  createRelease(input: $input) {
    id
    name
    date
    status
    completedSteps
  }
}

# Update an existing release (name, date, additional info)
mutation UpdateRelease($id: ID!, $input: UpdateReleaseInput!) {
  updateRelease(id: $id, input: $input) {
    id
    name
    date
    additionalInfo
  }
}

# Delete a release
mutation DeleteRelease($id: ID!) {
  deleteRelease(id: $id)
}

# Toggle a checklist step on/off
mutation ToggleStep($id: ID!, $stepIndex: Int!) {
  toggleStep(id: $id, stepIndex: $stepIndex) {
    id
    completedSteps
    status
  }
}
```

---

## 🏃 Running Locally

### Option A: Using Docker (Recommended)

Run the entire application (Backend + PostgreSQL database) using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/your-username/cactro_sep_fullstack.git
cd cactro_sep_fullstack

# 2. Start PostgreSQL and Apollo GraphQL Server via Docker Compose
docker-compose up --build
```

- **GraphQL API Server**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`

To run the frontend alongside Docker:

```bash
cd client
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.

---

### Option B: Running Without Docker

#### 1. Setup Backend
```bash
cd server
npm install

# Copy env file and set your PostgreSQL URL
cp .env.example .env

# Run database migrations and generate Prisma client
npx prisma db push
npx prisma db seed   # Optional: populate sample releases from mockup

# Start development server
npm run dev
```

#### 2. Setup Frontend
```bash
cd client
npm install
npm run dev
```

---

## 🧪 Running Automated Tests

The server repository includes a unit and integration test suite testing all GraphQL queries, mutations, input validations, and status computation logic.

```bash
cd server
npm test
```

---

## 🎯 Features Checklist

- [x] View list of all releases with status badges
- [x] Create new release (Name, Date, Optional Info)
- [x] View & Update existing release
- [x] Check / Uncheck release steps (7 fixed release checklist steps)
- [x] Delete a release with user confirmation
- [x] Auto-computed status (`PLANNED` | `ONGOING` | `DONE`)
- [x] Responsive layout matching provided mockups
- [x] PostgreSQL database integration (Prisma ORM)
- [x] GraphQL API layer (Apollo Server + Apollo Client)
- [x] Single Page Application (React SPA with React Router)
- [x] Docker setup (`Dockerfile` + `docker-compose.yaml`)
- [x] Automated test suite
