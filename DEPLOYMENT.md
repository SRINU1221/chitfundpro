# Deployment Guide for Chit Fund App

This guide will walk you through deploying your MERN stack application using free tier services:
- **Database:** MongoDB Atlas
- **Backend:** Render
- **Frontend:** Vercel

## Prerequisites
- A GitHub account.
- Your project pushed to a GitHub repository (with `backend` and `frontend` folders in the root).

---

## Step 1: Database (MongoDB Atlas)

1.  **Create an Account:** Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up.
2.  **Create a Cluster:** Create a new **Shared (Free)** cluster. Select a region close to you.
3.  **Create a Database User:**
    -   Go to **Database Access** in the sidebar.
    -   Add a new database user (e.g., `admin`).
    -   Generate a secure password and **save it**.
4.  **Network Access:**
    -   Go to **Network Access** in the sidebar.
    -   Add IP Address -> **Allow Access from Anywhere** (`0.0.0.0/0`). This allows Render to connect.
5.  **Get Connection String:**
    -   Go to **Database** -> **Connect**.
    -   Select **Drivers** (Node.js).
    -   Copy the connection string. It looks like: `mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority`
    -   Replace `<password>` with the password you created in step 3.

---

## Step 2: Backend Deployment (Render)

1.  **Sign Up:** Go to [Render](https://render.com/) and sign up with GitHub.
2.  **New Web Service:** Click **New +** -> **Web Service**.
3.  **Connect Repository:** Select your Chit Fund repository.
4.  **Configure Service:**
    -   **Name:** `chitfund-backend` (or similar)
    -   **Root Directory:** `backend` (Important!)
    -   **Runtime:** Node
    -   **Build Command:** `npm install`
    -   **Start Command:** `node index.js`
5.  **Environment Variables:**
    -   Scroll down to **Environment Variables** and add the following:
        -   `NODE_ENV`: `production`
        -   `MONGO_URI`: (Paste your MongoDB connection string from Step 1)
        -   `JWT_SECRET`: (Create a long random string)
        -   `EMAIL_USER`: (Your email for notifications, if used)
        -   `EMAIL_PASS`: (Your email app password, if used)
6.  **Deploy:** Click **Create Web Service**.
7.  **Wait:** Render will build and deploy your backend. Once done, copy the **URL** (e.g., `https://chitfund-backend.onrender.com`).

---

## Step 3: Frontend Deployment (Vercel)

1.  **Sign Up:** Go to [Vercel](https://vercel.com/) and sign up with GitHub.
2.  **Add New Project:** Click **Add New...** -> **Project**.
3.  **Import Repository:** Import your Chit Fund repository.
4.  **Configure Project:**
    -   **Framework Preset:** Vite
    -   **Root Directory:** Click **Edit** and select `frontend`.
5.  **Environment Variables:**
    -   Expand **Environment Variables**.
    -   Add `VITE_API_URL` and set the value to your **Render Backend URL** (from Step 2).
        -   Example: `https://chitfund-backend.onrender.com` (No trailing slash is usually best, but check your code logic. Our code handles it, but cleaner without).
6.  **Deploy:** Click **Deploy**.
7.  **Done:** Vercel will build your React app and give you a live URL (e.g., `https://chitfund-app.vercel.app`).

---

## Step 4: Final Configuration

1.  **Update Backend CORS (Optional but Recommended):**
    -   In your backend code (`index.js`), ensure `cors` is configured to allow requests from your new Vercel frontend URL.
    -   Currently, it might be allowing all (`cors()`), which is fine for testing but less secure.
    -   To restrict: `app.use(cors({ origin: 'https://your-vercel-app.vercel.app' }));`
    -   If you change this, push the code to GitHub, and Render will auto-redeploy.

## Troubleshooting

-   **Build Failures:** Check the logs in Render/Vercel. Common issues are missing dependencies or wrong root directory.
-   **Connection Errors:** Check your `MONGO_URI` in Render. Ensure the password is correct and special characters are URL-encoded if necessary.
-   **API Errors:** Check the Network tab in your browser. If API calls are failing, check if `VITE_API_URL` is set correctly in Vercel.

Enjoy your deployed Chit Fund App! 🚀
