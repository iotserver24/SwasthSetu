# Setup & Installation Guide

This guide walks you through setting up the SwasthyaSetu project locally for development.

## Prerequisites
- **Node.js**: v18 or newer
- **MongoDB**: A running local MongoDB server or a MongoDB Atlas connection string.
- **pnpm / npm**: Package manager (the project uses pnpm/npm).

## 1. Backend Setup

The backend handles the REST API, database connections, and AI integrations.

```bash
cd backend
npm install
```

### Environment Variables
Create a `.env` file in the `backend/` directory with the following variables:

```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/swasthyasetu
JWT_SECRET=your_super_secret_jwt_key_here

# AI Configuration (Pollinations endpoint)
AI_BASE_URL=https://gen.pollinations.ai/v1
AI_MODEL_ID=openai
AI_API_KEY=your_api_key_here
```

### Running the Backend
Start the development server:

```bash
npm run dev
# Expected output:
# ✅ Connected to MongoDB
# 🚀 Server running on port 5001
```

## 2. Frontend Setup

The frontend is a Next.js application.

```bash
cd frontend
npm install
```

### Environment Variables
Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

### Running the Frontend
Start the Next.js development server:

```bash
npm run dev
# Expected output:
# ready - started server on 0.0.0.0:3001, url: http://localhost:3001
```

## 3. First-Time Usage

Once both servers are running:
1. Open your browser and navigate to `http://localhost:3001`.
2. Click **Register** to create your first administrative or doctor account.
3. Upon registration, you will be automatically logged in and redirected to the appropriate dashboard.
4. From the Dashboard, use **Register Patient** to start testing the flow.
