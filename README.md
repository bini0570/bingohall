# Bingo Platform — Starter

This workspace contains a minimal starter scaffold for the Bingo Platform:

- `backend/` — Express API + WebSocket server (auth stubs, users persisted to `users.json`).
- `frontend/` — Vite + React frontend that connects to the backend WebSocket and has i18n (EN/AM).

Run backend:

```bash
cd backend
npm install
npm start
```

Run frontend:

```bash
cd frontend
npm install
npm run dev
```

Notes:
- This is a development scaffold. Replace `users.json` with a proper DB for production.
- `JWT_SECRET` can be provided via environment variables.
