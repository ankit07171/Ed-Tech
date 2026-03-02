# Render Deployment Guide - Complete Steps

## Step 1: Prepare Your Repository

1. Make sure all changes are committed to Git:
   ```bash
   git add .
   git commit -m "Configure for Render deployment"
   git push origin main
   ```

2. Ensure your repository is on GitHub, GitLab, or Bitbucket

## Step 2: Deploy Backend (Node.js Server)

### 2.1 Create Backend Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → Select **"Web Service"**
3. Connect your Git repository
4. Configure the service:
   - **Name**: `your-app-backend` (or any name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: Free (or paid for better performance)

### 2.2 Set Backend Environment Variables
In the "Environment" section, add these variables:
- `MONGODB_URI` = `mongodb+srv://xyz717171717171:edtech2000@cluster0.zefy2n0.mongodb.net/?appName=Cluster0`
- `JWT_SECRET` = `fTEYBwtCZexeM1adewaradhodhichatanaba`
- `NODE_ENV` = `production`
- `EMAIL_USER` = `xyz717171717171@gmail.com`
- `EMAIL_PASS` = `qaqy qwak jbqt gdku`
- `CLIENT_URL` = (Leave blank for now, will add after frontend deployment)

### 2.3 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your backend URL (e.g., `https://your-app-backend.onrender.com`)

## Step 3: Deploy Frontend (React/Vite App)

### 3.1 Create Frontend Service
1. Go back to Render Dashboard
2. Click **"New +"** → Select **"Static Site"**
3. Connect the same Git repository
4. Configure the service:
   - **Name**: `your-app-frontend` (or any name)
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 3.2 Set Frontend Environment Variables
In the "Environment" section, add:
- `VITE_BASE_URL` = Your backend URL from Step 2.3 (e.g., `https://your-app-backend.onrender.com`)

### 3.3 Deploy Frontend
1. Click **"Create Static Site"**
2. Wait for deployment (5-10 minutes)
3. Copy your frontend URL (e.g., `https://your-app-frontend.onrender.com`)

## Step 4: Update Backend with Frontend URL

1. Go back to your backend service in Render
2. Navigate to **"Environment"** tab
3. Add/Update the `CLIENT_URL` variable:
   - `CLIENT_URL` = Your frontend URL from Step 3.3
4. Click **"Save Changes"**
5. Backend will automatically redeploy

## Step 5: Verify Deployment

1. Open your frontend URL in a browser
2. Test the following:
   - ✅ Login/Signup works
   - ✅ API calls are successful
   - ✅ File uploads/downloads work
   - ✅ Socket.io connections work
   - ✅ No CORS errors in console

## Common Issues & Solutions

### Issue: CORS Errors
**Solution**: Make sure `CLIENT_URL` in backend matches your exact frontend URL (no trailing slash)

### Issue: 404 on API Calls
**Solution**: Verify `VITE_BASE_URL` in frontend points to correct backend URL

### Issue: Socket Connection Failed
**Solution**: Check that socket.js uses the correct backend URL from environment variable

### Issue: File Downloads Not Working
**Solution**: Ensure backend serves static files and frontend uses correct base URL

### Issue: Free Tier Sleeps After Inactivity
**Solution**: 
- Upgrade to paid tier, OR
- Use a service like UptimeRobot to ping your backend every 10 minutes

## Files Updated for Deployment

1. **client/.env** - Backend URL placeholder
2. **server/.env** - Production config with CLIENT_URL
3. **server/server.js** - Dynamic CORS configuration
4. **client/src/utils/axiosConfig.js** - Environment-based API URL
5. **client/src/socket/socket.js** - Environment-based socket URL
6. **client/src/pages/student/notes.jsx** - Environment-based file URLs

## Local Development Setup

To run locally after these changes:

**Backend (.env in server folder):**
```env
PORT=7171
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend (.env in client folder):**
```env
VITE_BASE_URL=http://localhost:7171
```

Then run:
```bash
# Terminal 1 - Backend
cd server
npm install
node server.js

# Terminal 2 - Frontend
cd client
npm install
npm run dev
```

## Important Security Notes

- ⚠️ Never commit .env files with sensitive data
- ⚠️ Use Render's environment variables for secrets
- ⚠️ Rotate JWT_SECRET and EMAIL_PASS regularly
- ⚠️ Consider using MongoDB IP whitelist (allow all: 0.0.0.0/0 for Render)

## Monitoring Your App

- Check logs in Render dashboard under "Logs" tab
- Monitor MongoDB Atlas for database connections
- Set up alerts for service downtime

---

**Need Help?** Check Render documentation at https://render.com/docs
