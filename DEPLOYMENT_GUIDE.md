# Render Deployment Configuration

## Changes Made

All localhost references have been replaced with environment variables for flexible deployment.

## Environment Variables to Set on Render

### Backend Service (server)
Set these in your Render backend service dashboard:
- `PORT` - Will be auto-set by Render
- `MONGODB_URI` - Your MongoDB connection string (already in .env)
- `JWT_SECRET` - Your JWT secret (already in .env)
- `NODE_ENV` - Set to `production`
- `CLIENT_URL` - Your frontend URL (e.g., `https://your-app.onrender.com`)
- `EMAIL_USER` - Your email (already in .env)
- `EMAIL_PASS` - Your email password (already in .env)

### Frontend Service (client)
Set these in your Render frontend service dashboard:
- `VITE_BASE_URL` - Your backend URL (e.g., `https://your-backend.onrender.com`)

## Files Updated

1. **client/.env** - Updated VITE_BASE_URL placeholder
2. **server/.env** - Added CLIENT_URL and changed NODE_ENV to production
3. **server/server.js** - CORS now uses CLIENT_URL environment variable
4. **client/src/utils/axiosConfig.js** - Uses VITE_BASE_URL from env
5. **client/src/socket/socket.js** - Socket connection uses VITE_BASE_URL
6. **client/src/pages/student/notes.jsx** - File downloads use VITE_BASE_URL

## Important Notes

- Don't commit sensitive .env files to git (they're in .gitignore)
- Set environment variables directly in Render dashboard
- Backend URL should NOT have trailing slash
- Frontend URL should NOT have trailing slash
- Make sure to enable CORS for your frontend domain

## Testing Locally

For local development, you can still use:
- Backend: `http://localhost:7171`
- Frontend: `http://localhost:5173`

Just update your local .env files accordingly.
