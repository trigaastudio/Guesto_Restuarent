# Guest-O Server Deployment Guide (Render)

This step-by-step guide will walk you through deploying your Node.js/Express backend (server-side) to [Render](https://render.com/).

## 1. Prerequisites

Before deploying, ensure your latest code is pushed to your remote repository (GitHub, GitLab, or Bitbucket) on the branch you want to deploy (usually `main` or `develop`).

## 2. Create a Web Service on Render

1. Go to your [Render Dashboard](https://dashboard.render.com/) and log in.
2. Click the **New** button and select **Web Service**.
3. Connect your Git repository provider (e.g., GitHub) if you haven't already.
4. Select the repository containing your `Guest-O Project`.

## 3. Configure the Web Service

Fill in the settings for your new Web Service as follows:

- **Name**: `guest-o-backend` (or any name you prefer)
- **Region**: Select the region closest to your primary user base or database.
- **Branch**: `main` (or whichever branch you want to deploy from)
- **Root Directory**: `server`
  > [!IMPORTANT]
  > Since your backend code is inside a folder named `server`, setting the Root Directory is critical. Render will look for the `package.json` and install dependencies inside this folder.
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: **Free** (or a paid plan if you need more resources and no sleep time)

## 4. Set Environment Variables

Your server needs several environment variables to connect to MongoDB, Cloudinary, Razorpay, etc. 
1. Scroll down and click on **Advanced**.
2. Click **Add Environment Variable** for each of the keys listed below. 

Here is the list of variables based on your `server/.env.example`:

| Key | Value | Description |
| :--- | :--- | :--- |
| `PORT` | `10000` | (Render defaults to port 10000, so it's good practice to set it here) |
| `MONGODB_URI` | *Your MongoDB Atlas connection string* | Ensure you whitelist all IPs (`0.0.0.0/0`) in MongoDB Atlas. |
| `JWT_SECRET` | *Your strong secret string* | Used for authentication tokens. |
| `GOOGLE_CLIENT_ID` | *Your Google OAuth Client ID* | |
| `GOOGLE_CLIENT_SECRET` | *Your Google OAuth Client Secret* | |
| `EMAIL_USER` | *Your email* | |
| `EMAIL_PASS` | *Your email app password* | |
| `NODEMAILER_EMAIL` | *Your Nodemailer email* | |
| `NODEMAILER_PASSWORD`| *Your Nodemailer password* | |
| `CLOUDINARY_CLOUD_NAME`| *Your Cloudinary cloud name* | |
| `CLOUDINARY_API_KEY` | *Your Cloudinary API key* | |
| `CLOUDINARY_API_SECRET`| *Your Cloudinary API secret* | |
| `RAZORPAY_KEY_ID` | *Your Razorpay Key ID* | |
| `RAZORPAY_KEY_SECRET`| *Your Razorpay Key Secret* | |

> [!TIP]
> **Secret Files**: If you have your `.env` file with all the values ready, you can also use the **Secret Files** section (under Advanced) to upload or paste your `.env` file instead of manually typing each key-value pair. Ensure the filename is exactly `.env`.

## 5. Deploy

1. Once the environment variables are added, scroll down and click **Create Web Service**.
2. Render will automatically pull your code, navigate to the `server` folder, run `npm install`, and start your app using `npm start`.
3. Monitor the deployment logs in the dashboard to ensure there are no errors. Once you see "Your service is live", the backend is up and running!

## 6. Post-Deployment Checks

1. **Verify Live URL**: Render will provide a URL at the top left like `https://guest-o-backend.onrender.com`. Try hitting a public endpoint (e.g., your health check or login route) to ensure the server responds correctly.
2. **Update Frontend**: Update your React frontend's base API URL to point to this new Render URL instead of `http://localhost:5000`.
3. **MongoDB Whitelist**: Double-check that your MongoDB Atlas Network Access is set to allow connections from anywhere (`0.0.0.0/0`), because Render's IP addresses change dynamically.
4. **Google Console Callback URL**: Since you use Google Auth, remember to add your new Render URL to your Authorized redirect URIs in the Google Cloud Console.
