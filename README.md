# Food Truck Ratings App

This project contains a simple Express backend and a React frontend created with Vite.

If you have npm v7 or later, you can install both projects at once using workspaces:

```
npm install
```

Then you can run the backend or frontend with these shortcuts:

```
npm run start:backend
npm run dev:frontend
```


## Prerequisites

- Node.js 18 or later

## Backend

```
cd backend
npm install
npm start
```

The backend runs on port **3001** by default and exposes `/api/health` which returns `{ "status": "ok" }`.

## Frontend

```
cd frontend
npm install
npm run dev
```

The frontend uses Vite and serves the React app on port **5173** by default. Open the printed local URL in your browser to view the homepage.
