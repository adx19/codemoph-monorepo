# CodeMorph monorepo

CodeMorph converts source code between programming languages with Claude. You rename a file's extension (for example `.py` to `.java`) in VS Code, and the extension rewrites the file in the new language.

> **Status:** the hosted backend has been shut down. The URLs in the code (the Render API URL in `CodeMorph/src/config.ts` and `codemorph.me`) no longer serve the app. To run CodeMorph end to end, run the proxy locally and point the website (and, if you need it, the extension) at it.

## What's in this repo

| Folder | What it is | Stack |
| --- | --- | --- |
| [`CodeMorph/`](CodeMorph/) | VS Code extension. It detects extension renames, calls the API to convert the code, and shows an account sidebar. | TypeScript, VS Code Extension API, esbuild |
| [`codemorph-proxy/`](codemorph-proxy/) | Backend API: auth (email + password, Google and GitHub OAuth), code conversion through Claude, a credit system (free, paid and shared credits), Razorpay payments and webhooks, and admin top-ups. | Node.js 20, Express 5, PostgreSQL (`pg`), Anthropic SDK, Razorpay, Resend, JWT |
| [`website/`](website/) | Marketing site and user dashboard: sign up and log in, credits, pricing and payments, transaction history, shared credits. | React 18, Vite, Tailwind CSS, React Router, TanStack Query, Framer Motion |

## Local setup

Prerequisites: Node.js 20+ and npm. The proxy also needs a PostgreSQL database.

### codemorph-proxy (API)

```bash
cd codemorph-proxy
npm install
# create codemorph-proxy/.env with the variables below
npm run dev      # nodemon
# or
npm start        # node src/app.js
```

`migrations/001_schema.sql` describes the database tables. It is a reference export and may need its tables reordered before it will run.

Environment variables (in `codemorph-proxy/.env`):

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (default `3000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify user JWTs |
| `ADMIN_TOKEN` | Token for the `x-admin-token` header on `/admin` routes |
| `ANTHROPIC_API_KEY` | Claude API key used for conversions |
| `CLAUDE_MODEL` | Claude model ID used for conversions (optional; has a default in `src/utils/claude.js`) |
| `FRONTEND_URL` | Website origin, used for redirects after email verification and OAuth |
| `BACKEND_URL` | Public URL of this API, used in verification email links |
| `RESEND_API_KEY` | Resend API key for verification emails |
| `EMAIL_FROM` | Sender address for verification emails |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_OAUTH_REDIRECT` | Google OAuth redirect URI |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API key secret |
| `RAZORPAY_WEBHOOK_SECRET` | Secret used to verify Razorpay webhook signatures |

### website

```bash
cd website
npm install
# create website/.env with the variable below
npm run dev      # Vite dev server
npm run build    # production build into dist/
```

Environment variables (in `website/.env`):

| Variable | Purpose |
| --- | --- |
| `VITE_BACKEND_URL` | Base URL of the proxy API (default `http://localhost:5000`) |

### CodeMorph (VS Code extension)

```bash
cd CodeMorph
npm install
npm run compile   # or: npm run watch
```

Open the `CodeMorph/` folder in VS Code and press <kbd>F5</kbd> to launch an Extension Development Host.

The extension does not read environment variables. Its API and website URLs are constants in `CodeMorph/src/config.ts`, and they point at the retired hosted backend. To use a local proxy, change those constants in your local copy.
