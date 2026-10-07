# 🚀 Render Deployment Guide

## Complete guide for deploying to Render with proper SPA routing

---

## Deployment Architecture

You have **TWO services** on Render:
1. **Backend** (Web Service) - Node.js API server
2. **Frontend** (Static Site) - React SPA

---

## Option 1: Deploy Using render.yaml (Recommended)

The `render.yaml` file in the root configures both services automatically.

### Steps:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Render configuration"
   git push origin main
   ```

2. **Create Blueprint on Render**
   - Go to https://dashboard.render.com
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will detect `render.yaml` and create both services
   - Click "Apply"

3. **Set Environment Variables** (for backend service)
   After deployment, add these in the backend service settings:
   ```
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<random-32-char-string>
   EMAIL_USER=<your-gmail>
   EMAIL_PASS=<gmail-app-password>
   CLIENT_URL=<your-frontend-render-url>
   ```

4. **Verify Deployment**
   - Backend: `https://ed-tech-backend.onrender.com`
   - Frontend: `https://ed-tech-frontend.onrender.com`

---

## Option 2: Manual Deployment (Two Separate Services)

### Backend Service

1. **Create Web Service**
   - Go to Render Dashboard
   - New → Web Service
   - Connect GitHub repo
   - Configure:
     ```
     Name: ed-tech-backend
     Region: Oregon (or closest)
     Branch: main
     Root Directory: server
     Runtime: Node
     Build Command: npm install
     Start Command: node server.js
     Instance Type: Free
     ```

2. **Add Environment Variables**
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-secret-key
   NODE_ENV=production
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   CLIENT_URL=https://your-frontend.onrender.com
   PORT=7171
   ```

3. **Deploy**
   - Click "Create Web Service"
   - Wait for build (5-10 minutes)
   - Copy your backend URL (e.g., `https://ed-tech-backend-abc.onrender.com`)

### Frontend Static Site

1. **Create Static Site**
   - Go to Render Dashboard
   - New → Static Site
   - Connect GitHub repo
   - Configure:
     ```
     Name: ed-tech-frontend
     Region: Oregon (or closest)
     Branch: main
     Root Directory: client
     Build Command: npm install && npm run build
     Publish Directory: dist
     ```

2. **Add Environment Variable**
   ```
   VITE_BASE_URL=https://your-backend.onrender.com
   ```

3. **Configure Redirects** (IMPORTANT for SPA routing!)
   Render will automatically use `client/public/_redirects` file:
   ```
   /*    /index.html   200
   ```
   This ensures that routes like `/student` and `/teacher` work on refresh.

4. **Deploy**
   - Click "Create Static Site"
   - Wait for build (3-5 minutes)
   - Copy your frontend URL

5. **Update Backend CLIENT_URL**
   - Go back to backend service
   - Environment → Add `CLIENT_URL` with your frontend URL
   - Save (triggers automatic redeploy)

---

## Fix for "Page Not Found" on Refresh

This issue happens when you refresh on routes like `/student` or `/teacher`. Here's why and how we fix it:

### The Problem
- React Router handles routes on the **client-side**
- When you refresh, browser requests `/student` from the **server**
- Server doesn't have this route → 404 error

### The Solution
The `_redirects` file tells Render to serve `index.html` for ALL routes:
```
/*    /index.html   200
```

### Verify _redirects is Working

1. **Check file exists:**
   ```
   client/public/_redirects
   ```

2. **Check it's in build output:**
   ```bash
   cd client
   npm run build
   ls dist/_redirects  # Should exist
   ```

3. **Test locally:**
   ```bash
   npm run preview  # Vite preview server
   # Navigate to http://localhost:4173/student
   # Refresh - should work
   ```

4. **On Render:**
   - Check build logs for: "Copied _redirects"
   - Test: Visit `https://your-site.onrender.com/student`
   - Refresh - should work now

---

## Troubleshooting

### Issue: Still getting 404 on refresh

**Solution 1: Verify _redirects in dist folder**
```bash
cd client
npm run build
cat dist/_redirects  # Should show: /*    /index.html   200
```

**Solution 2: Clear Render cache**
- Go to Render Dashboard → Your Static Site
- Settings → Build & Deploy
- Click "Clear build cache"
- Manual Deploy → "Clear build cache & deploy"

**Solution 3: Verify vite.config.js**
Make sure `publicDir: 'public'` is set:
```javascript
export default defineConfig({
  plugins: [react(), tailwindcss()],
  publicDir: 'public',  // This copies _redirects to dist
  build: {
    outDir: 'dist',
  },
})
```

**Solution 4: Use Render's redirect configuration**
In Render Dashboard → Static Site → Redirects/Rewrites:
- Add rule:
  - Source: `/*`
  - Destination: `/index.html`
  - Type: `Rewrite`

### Issue: CORS errors

**Solution:**
Update backend `CLIENT_URL` environment variable with exact frontend URL (no trailing slash).

### Issue: Backend "Cannot GET /"

**Solution:**
This is normal. Backend is an API server. Test with:
```bash
curl https://your-backend.onrender.com/api/auth/departments
```

### Issue: 502 Bad Gateway

**Solution:**
Backend is probably sleeping (free tier sleeps after 15 min inactivity).
- Wait 30-60 seconds for it to wake up
- Or upgrade to paid tier

---

## Local Testing (Before Deployment)

### Test SPA routing locally:

```bash
# Build and preview
cd client
npm run build
npm run preview

# Visit http://localhost:4173
# Navigate to /student or /teacher
# Refresh - should work
```

---

## Production Checklist

Before deploying:

- [ ] `_redirects` file exists in `client/public/`
- [ ] `vite.config.js` has `publicDir: 'public'`
- [ ] Backend environment variables set
- [ ] Frontend `VITE_BASE_URL` set to backend URL
- [ ] Backend `CLIENT_URL` set to frontend URL
- [ ] MongoDB Atlas IP whitelist: `0.0.0.0/0` (allow all)
- [ ] Tested locally with `npm run preview`

After deploying:

- [ ] Test login/logout
- [ ] Test all routes (refresh on each)
- [ ] Check browser console for errors
- [ ] Test API calls
- [ ] Verify CORS working

---

## Render-Specific Notes

1. **Free Tier Limitations:**
   - Services sleep after 15 minutes of inactivity
   - First request after sleep takes 30-60 seconds
   - 750 hours/month free (enough for 1 service 24/7)

2. **Auto-Deploy:**
   - Enabled by default
   - Pushes to `main` branch trigger automatic deployment
   - Can disable in Settings

3. **Preview Environments:**
   - Pull requests can create preview deployments
   - Useful for testing before merging

4. **Custom Domains:**
   - Can add custom domain in Settings
   - Render provides SSL certificate automatically

---

## Environment Variables Reference

### Backend (.env or Render Environment)
```env
PORT=7171
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-random-32-character-secret-key
NODE_ENV=production
CLIENT_URL=https://ed-tech-frontend.onrender.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

### Frontend (Render Environment)
```env
VITE_BASE_URL=https://ed-tech-backend.onrender.com
```

---

## Quick Deploy Commands

```bash
# 1. Ensure everything is committed
git status

# 2. Commit changes
git add .
git commit -m "Add Render configuration and fix SPA routing"

# 3. Push to GitHub
git push origin main

# 4. Render auto-deploys (if enabled)
# Or manually deploy from Render Dashboard
```

---

## Testing Deployed App

```bash
# Test backend
curl https://your-backend.onrender.com/api/auth/departments

# Test frontend
open https://your-frontend.onrender.com

# Test SPA routing
# 1. Navigate to /student
# 2. Refresh page
# 3. Should stay on /student (not 404)
```

---

## Support Resources

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Community:** https://community.render.com

---

**Your SPA routing issue should now be fixed! 🎉**

The key is the `_redirects` file that tells Render to always serve `index.html` for any route, allowing React Router to handle the routing client-side.
