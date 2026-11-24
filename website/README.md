# CodeMorph Marketing & Dashboard Site

A React 18 + Vite + Tailwind CSS frontend for the **CodeMorph** VS Code extension.

> **Project status:** CodeMorph is no longer running. The live site (`www.codemorph.me`) and its hosted API are offline, and the project has been retired. The code is kept as a reference. You can run it locally against a local proxy; see the [root README](../README.md#project-status).

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
- The CodeMorph proxy (`../codemorph-proxy`) running locally. The app reads its URL from `VITE_BACKEND_URL`.

## Setup & Run

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **(Optional) Configure API base URL**

   Create a `.env` file in the `website/` folder that points at your local proxy (the proxy listens on port 3000 by default):

   ```bash
   echo VITE_BACKEND_URL=http://localhost:3000 >> .env
   ```

   If you skip this, the app defaults to `http://localhost:5000` (see `src/api/apiConfig.js`).

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
