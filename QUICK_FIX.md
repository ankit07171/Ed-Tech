# Quick Fix for Your Render Deployment Issues

## Step 1: Commit and Push Code Changes ✅ (Do this first!)

```bash
git add .
git commit -m "Fix CORS and routing for Render"
git push origin main
```

Wait for both services to auto-deploy (3-5 minutes).

## Step 2: Set Backend Environment Variable 🔧

1. Go to: https://dashboard.render.com/
2. Click your **backend service**: `ed-tech-9uvt`
3. Click **"Environment"** tab (left sidebar)
4. Click **"Add Environment Variable"**
5. Add:
   - **Key:** `CLIENT_URL`
   - **Value:** `https://ed-tech-1-dz4e.onrender.com`
6. Click **"Save Changes"**
7. Wait for auto-redeploy (2-3 minutes)

## Step 3: Verify Frontend Environment Variable 🔧

1. Still in Render dashboard
2. Click your **frontend service**: `ed-tech-1-dz4e`
3. Click **"Environment"** tab
4. Verify this exists:
   - **Key:** `VITE_BASE_URL`
   - **Value:** `https://ed-tech-9uvt.onrender.com`
5. If missing, add it and save

## Step 4: Test Your App 🧪

1. Open: https://ed-tech-1-dz4e.onrender.com
2. Open browser console (F12)
3. Try login/signup
4. Navigate to different pages
5. Refresh the page (should not show 404)

## What Was Fixed?

✅ **CORS Configuration** - Backend now properly allows your frontend domain
✅ **SPA Routing** - Added `_redirects` file so page refresh works
✅ **Environment Variables** - Using proper URLs instead of localhost

## If Still Not Working

Check backend logs:
1. Go to backend service
2. Click "Logs"
3. Should see: "Server running on port XXXX" and "MongoDB connected"

If you see errors, share them and I'll help fix!
