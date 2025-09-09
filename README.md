# Village Security Project

A full-stack application for managing a village security system, built with a modern tech stack.

## Technologies Used

### Backend

- **Framework:** [ElysiaJS](https://elysiajs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Database:** [PostgreSQL](https://www.postgresql.org/)
- **Runtime:** [Bun](https://bun.sh/)
- **Authentication:** JWT with secure cookies

### Frontend

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **UI:** [React](https://react.dev/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Components:** [shadcn/ui](https://ui.shadcn.com/)

## Project Structure

The repository is a monorepo with two main packages:

- `backend/`: The ElysiaJS server that handles the API and database interactions.
- `frontend/`: The Next.js application for the user interface.

Each package has its own `package.json` file for managing dependencies and scripts.

## Setup and Installation

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/)
- [Docker](https://www.docker.com/) (for running a local PostgreSQL instance)

### 2. Environment Variables

Create a `.env` file in the `backend` directory and add the following environment variables:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"
PORT=3001
ALLOWED_ORIGINS="http://localhost:3000"
```

Replace the `DATABASE_URL` with your PostgreSQL connection string.

### 3. Database Setup

You can use a local PostgreSQL instance with Docker. Run the following command in the root directory to start a PostgreSQL container:

```bash
docker-compose up -d
```

### 4. Install Dependencies

Install the dependencies for both the backend and frontend packages:

```bash
# In the backend directory
cd backend
bun install

# In the frontend directory
cd ../frontend
npm install
```

## Running the Application

### 1. Run the Backend Server

From the `backend` directory, run the following command to start the development server:

```bash
bun run dev
```

The backend server will be running at `http://localhost:3001`.

### 2. Run the Frontend Application

From the `frontend` directory, run the following command to start the development server:

```bash
npm run dev
```

The frontend application will be running at `http://localhost:3000`.

## Available Scripts

### Backend (`/backend`)

- `bun run dev`: Starts the development server with hot-reloading.
- `bun run hash-passwords`: A script to hash existing plain text passwords in the database.

### Frontend (`/frontend`)

- `npm run dev`: Starts the development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts the production server.
- `npm run lint`: Runs the linter to check for code quality issues.
