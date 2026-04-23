# RecipeHub

AI-powered smart cooking web app that helps users discover recipes from available ingredients, generate custom AI recipes, plan meals, and manage pantry items.

Built as a college project for the **Career Catalyst** event.

## Tech Stack

- Frontend: Next.js 14, React, Tailwind CSS, Zustand
- Backend: Node.js, Express, TypeScript
- Database: MongoDB (Mongoose)
- AI: Google Gemini APIs

## Monorepo Structure

```text
recipebox/
├── client/   # Next.js frontend
└── server/   # Express + MongoDB API
```

## Local Setup

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Configure environment

Create:

- `server/.env` with MongoDB URI, JWT secret, and Gemini keys
- `client/.env.local` with API URL (for example: `NEXT_PUBLIC_API_URL=http://localhost:5001/api`)

### 3. Run development servers

Backend:

```bash
cd server
npm run dev
```

Frontend:

```bash
cd client
npm run dev
```

## Build

```bash
cd server && npm run build
cd ../client && npm run build
```

## Key Features

- Secure login/signup with validated emails
- Ingredient-based recipe matching
- AI recipe generation from user ingredients
- AI cooking assistant chat
- Pantry/fridge management (including image ingredient extraction)
- Meal planning and shopping list support
- Community recipe feed
- Dark/light theme toggle

## Event Context

This project was built and polished for the **Career Catalyst** college event to showcase practical full-stack development, AI integration, and product-focused UX execution.
