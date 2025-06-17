# Food Truck Ratings App

This project contains a simple Express backend and a React frontend created with Vite.

Install dependencies separately for the backend and the frontend and run each app in its own terminal window.

If you have npm v7 or later, you can install both projects at once using workspaces:


Then you can run the backend or frontend with these shortcuts:


## Prerequisites

- Node.js 18 or later

## Backend


The backend runs on port **3001** by default and exposes the following API endpoints:

- `GET /api/health` returns `{ "status": "ok" }`.
- `POST /api/reviews` accepts a `truck` name, `rating`, `comment` and a `photo` upload. The
  uploaded photo is stored in `backend/uploads` and the review is kept in memory.
- `GET /api/reviews` returns all saved reviews along with Michelin-style star progress
  for each food truck.

### ⭐️ Star Rating Rules

- **1 star**: 20 perfect (10/10) reviews  
- **2 stars**: 50 perfect reviews  
- **3 stars**: 100 perfect reviews  
- **4 stars**: 200 perfect reviews  
- **5 stars**: 500 perfect reviews  

Two 1/10 reviews cancel out the progress of one 10/10 review.  
Progress toward the next star is reported as a fraction between `0` and `1`.

## Frontend


The frontend uses Vite and serves the React app on port **5173** by default.  
Open the printed local URL in your browser to view the homepage.
