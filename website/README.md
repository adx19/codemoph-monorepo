# CodeMorph Marketing & Dashboard Site

A React 18 + Vite + Tailwind CSS frontend for the **CodeMorph** VS Code extension.

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- React Router DOM
- @tanstack/react-query
- Lucide React icons

## Prerequisites

- **Node.js** 18+ installed
- (Optional) A backend API running at `http://localhost:3001/api` or configure `VITE_API_URL`.

## Setup & Run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **(Optional) Configure API base URL**

   Create a `.env` file in the project root if you have a backend:

   ```bash
   echo VITE_API_URL=http://localhost:3001/api >> .env
   ```

   If you skip this, the app will default to `http://localhost:3001/api`.

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   Vite will print a local URL like `http://localhost:5173`. Open it in your browser.

## Available Scripts

- `npm run dev` – start Vite dev server
- `npm run build` – build for production
- `npm run preview` – preview the production build after running `npm run build`

## Notes

- Tailwind-specific directives like `@tailwind` and `@apply` may show warnings in some editors. This is normal; Vite/Tailwind will compile them correctly.
- Dashboard pages currently use placeholder content; you can integrate real data with the provided `src/api/apiClient.js` and React Query hooks.
