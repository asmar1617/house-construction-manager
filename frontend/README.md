# Construction Expense Management Frontend

This is the frontend (React) for the Construction Expense Management app.

## Features
- Admin login
- Dashboard/homepage (budget, category sections, stats)
- Expense/category management UI
- Mobile-friendly, minimal design
- CSV export, search/filter, soft delete/undo, notes/comments

## Setup Instructions

### 1. Install dependencies
```
npm install
```

### 2. Configure backend API URL
- Create a `.env` file in the `frontend` folder:
```
REACT_APP_API_URL=http://localhost:5000/api
```
- Change the URL if your backend is hosted elsewhere.

### 3. Run the app
```
npm start
```

The app will start on `http://localhost:3000` by default. 