# Fix CORS and 404 Errors on Render

## Problem 1: CORS Errors ❌

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

### Solution - Set Environment Variable on Render Backend

1. Go to your Render dashboard: https://dashboard.render.com/
2. Click on your **backend service** (ed-tech-9uvt)
3. Go to **"Environment"** tab on the left
4. Add this environment variable:
   ```
   Key: CLIENT_URL
   Value: https://ed-tech-1-dz4e.onrender.com
   ```
   ⚠️ **IMPORTANT:** No trailing slash! Use exact URL.

5. Click **"Save Changes"**
6. Backend will automatically redeploy (takes 2-3 minutes)
7. Wait for deployment to complete

### Verify Backend Environment Variables

Make sure ALL these are set in your backend service:
- `CLIENT_URL` = `https://ed-tech-1-dz4e.onrender.com`
- `MONGODB_URI` = Your MongoDB connection string
- `JWT_SECRET` = Your JWT secret
- `NODE_ENV` = `production`
- `EMAIL_USER` = Your email
- `EMAIL_PASS` = Your email password

## Problem 2: Page 404 on Refresh ❌

**Error:** Blank page or "Page not found" when refreshing any route

### Solution - Configure Render for SPA Routing

#### Option A: Using _redirects file (Recommended)

1. The `_redirects` file has been created in your client folder
2. Make sure it's committed to git:
   ```bash
   git add client/_redirects
   git commit -m "Add Render redirects for SPA routing"
   git push
   ```

3. In your Render **frontend service** (ed-tech-1-dz4e):
   - Go to **"Settings"** tab
   - Scroll to **"Build & Deploy"**
   - Make sure **"Publish Directory"** is set to: `dist`
   - The `_redirects` file will be automatically copied to dist during build

4. Redeploy your frontend service

#### Option B: Manual Render Dashboard Configuration

If Option A doesn't work:

1. Go to your frontend service on Render
2. Click **"Redirects/Rewrites"** in the left menu
3. Add a new rule:
   - **Source:** `/*`
   - **Destination:** `/index.html`
   - **Action:** `Rewrite`
4. Save and redeploy

## Problem 3: Frontend Environment Variable

Make sure your **frontend service** has this environment variable set:

1. Go to frontend service (ed-tech-1-dz4e)
2. Go to **"Environment"** tab
3. Add:
   ```
   Key: VITE_BASE_URL
   Value: https://ed-tech-9uvt.onrender.com
   ```
   ⚠️ **IMPORTANT:** No trailing slash!

4. Save and redeploy

## Testing After Fixes

1. Wait for both services to finish deploying
2. Open your frontend URL: https://ed-tech-1-dz4e.onrender.com
3. Open browser console (F12)
4. Try to login/signup
5. Check for CORS errors - should be gone ✅
6. Navigate to different pages and refresh - should work ✅

## Quick Checklist

### Backend (ed-tech-9uvt.onrender.com)
- [ ] `CLIENT_URL` = `https://ed-tech-1-dz4e.onrender.com`
- [ ] All other env variables set
- [ ] Service deployed successfully
- [ ] Check logs for "Server running" message

### Frontend (ed-tech-1-dz4e.onrender.com)
- [ ] `VITE_BASE_URL` = `https://ed-tech-9uvt.onrender.com`
- [ ] `_redirects` file in repo
- [ ] Publish directory = `dist`
- [ ] Service deployed successfully

## Still Having Issues?

### Check Backend Logs
1. Go to backend service
2. Click "Logs" tab
3. Look for:
   - "Server running on port XXXX" ✅
   - "MongoDB connected" ✅
   - Any error messages ❌

### Check Frontend Build Logs
1. Go to frontend service
2. Click "Logs" tab
3. Look for:
   - "Build completed" ✅
   - Any build errors ❌

### Test Backend Directly
Open in browser: `https://ed-tech-9uvt.onrender.com/`
- Should see: "Server is Live ✅"

### Common Mistakes
- ❌ Adding trailing slash to URLs (`https://example.com/`)
- ❌ Using http instead of https
- ❌ Typo in environment variable names
- ❌ Not waiting for deployment to complete
- ❌ Not committing _redirects file to git

## Need to Commit Changes

Run these commands to push the fixes:

```bash
git add .
git commit -m "Fix CORS and SPA routing for Render deployment"
git push origin main
```

Both services will auto-deploy after push.
