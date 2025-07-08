# Construction Expense Management Backend

This is the backend API for the Construction Expense Management app.

## Features
- Expense management (CRUD, soft delete, image upload)
- Category management (CRUD)
- Budget management (add funds, get totals)
- Admin authentication (JWT-based)
- CSV export

## Tech Stack
- Node.js, Express
- MongoDB Atlas
- Cloudinary (for image uploads)
- JWT, bcrypt (for authentication)

## Setup Instructions

### 1. Clone the repository
```
git clone <your-repo-url>
cd backend
```

### 2. Install dependencies
```
npm install
```

### 3. Set up MongoDB Atlas
- Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account.
- Create a new cluster and database.
- Get your connection string and replace `your_mongodb_connection_string` in `.env`.

### 4. Set up Cloudinary
- Go to [Cloudinary](https://cloudinary.com/) and create a free account.
- Get your cloud name, API key, and API secret.
- Add them to your `.env` file.

### 5. Create a `.env` file
Copy `.env.example` to `.env` and fill in your credentials:
```
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=your_jwt_secret
```

### 6. Run the server
```
npm run dev
```

The server will start on `http://localhost:5000` by default. 