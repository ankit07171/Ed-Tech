# 🚀 Quick Setup Instructions

## Step-by-Step Setup for College Management System

---

## Prerequisites

- ✅ Node.js v18 or higher
- ✅ MongoDB Atlas account (or local MongoDB)
- ✅ Gmail account for email (OTP)
- ✅ Git

---

## 1. Clone and Install

```bash
# Clone repository (if not already done)
git clone <your-repo-url>
cd ed-tech

# Install dependencies
npm install
cd server && npm install
cd ../client && npm install
```

---

## 2. Configure Environment Variables

### Server Environment (.env)

Create `server/.env`:

```env
PORT=7171
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/college-system?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
NODE_ENV=development
CLIENT_URL=http://localhost:5173
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

**Getting Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Generate App Password for "Mail"
4. Copy the 16-character password

### Client Environment (.env)

Create `client/.env`:

```env
VITE_BASE_URL=http://localhost:7171
```

---

## 3. Setup Database with Sample Data

```bash
cd server
node utils/seedDatabase.js
```

**This will create:**
- ✅ 10 Departments (CSE, IT, ECE, etc.)
- ✅ 17+ Knowledge Base entries
- ✅ 500+ Placement records (5 years)

**Expected Output:**
```
🚀 Starting database seeding process...
✅ MongoDB connected successfully
📚 Successfully seeded 10 departments
📖 Successfully seeded 17 knowledge entries
💼 Successfully seeded 527 placement records
✅ Database seeding completed successfully!
```

---

## 4. Start Development Servers

### Terminal 1 - Backend

```bash
cd server
npm run dev
```

**Expected Output:**
```
✅ MongoDB connected
🚀 Server running on port 7171
```

### Terminal 2 - Frontend

```bash
cd client
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## 5. Create Test Accounts

### Option A: Using Signup Flow

1. Open http://localhost:5173
2. Click "Sign Up"
3. Fill form:
   - Email: `student@test.com`
   - Password: `password123`
   - Role: Student
   - Department: Select any (e.g., CSE)
   - Fill other fields
4. Request OTP (check email)
5. Complete signup

### Option B: Direct Database Insert (Quick Testing)

Run this in MongoDB shell or Compass:

```javascript
// Use your database
use college-system

// Hash for "password123"
const hashedPassword = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"

// Get a department ID (CSE)
const cseDept = db.departments.findOne({ code: "CSE" })._id

// Insert test student
db.users.insertOne({
  fullName: "Test Student",
  email: "student@test.com",
  password: hashedPassword,
  gender: "male",
  contact: "9876543210",
  role: "student",
  department: cseDept,
  rollNumber: "2024CSE001",
  batch: 2024,
  semester: 1,
  cgpa: 8.5,
  profilePic: null,
  isActive: true,
  createdAt: new Date()
})

// Insert test teacher
db.users.insertOne({
  fullName: "Test Teacher",
  email: "teacher@test.com",
  password: hashedPassword,
  gender: "female",
  contact: "9876543211",
  role: "teacher",
  department: cseDept,
  employeeId: "EMP001",
  designation: "Assistant Professor",
  specialization: "Artificial Intelligence",
  experience: 5,
  profilePic: null,
  isActive: true,
  createdAt: new Date()
})
```

---

## 6. Test the Application

### Test Student Login
1. Go to http://localhost:5173/login
2. Login with: `student@test.com` / `password123`
3. You should see student dashboard

### Test Features

#### ✅ Department Management
- View departments list
- Filter students/teachers by department

#### ✅ Placement Analytics
- Navigate to Placements section
- View statistics (Total, Average, Highest package)
- Check year-wise trends
- View top recruiters

#### ✅ Chatbot
- Look for chat icon (usually bottom-right)
- Ask: "What are the placement statistics?"
- Ask: "Tell me about CSE department"
- Ask: "What is the admission process?"

#### ✅ Existing Features
- Quiz system
- Notes upload/download
- Attendance tracking
- Video meetings (WebRTC)

---

## 7. API Testing

### Using cURL

```bash
# Get all departments (public)
curl http://localhost:7171/api/auth/departments

# Login
curl -X POST http://localhost:7171/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"password123"}'

# Get placement stats (with token)
curl http://localhost:7171/api/placements/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Chat with bot
curl -X POST http://localhost:7171/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"message":"Tell me about placements","sessionId":"test-123"}'
```

### Using Postman

Import this collection:

```json
{
  "info": {
    "name": "College Management System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/auth/login",
            "body": {
              "mode": "raw",
              "raw": "{\"email\":\"student@test.com\",\"password\":\"password123\"}"
            }
          }
        },
        {
          "name": "Get Departments",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/auth/departments"
          }
        }
      ]
    },
    {
      "name": "Placements",
      "item": [
        {
          "name": "Get Stats",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/api/placements/stats?year=2024",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              }
            ]
          }
        }
      ]
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:7171"
    }
  ]
}
```

---

## 8. Run Tests

### Unit Tests

```bash
cd server
npm test
```

### Load Tests (Optional)

```bash
# Install Artillery
npm install -g artillery

# Run load test (requires server running)
artillery quick --count 10 --num 50 http://localhost:7171/api/auth/departments
```

---

## 9. Common Issues & Solutions

### Issue: "MongoDB connection failed"

**Solution:**
```bash
# Check MONGODB_URI in .env
# Whitelist your IP in MongoDB Atlas
# Or use local MongoDB: mongodb://localhost:27017/college-system
```

### Issue: "OTP not received"

**Solution:**
```bash
# Check EMAIL_USER and EMAIL_PASS in .env
# Ensure Gmail App Password (not regular password)
# Check spam folder
# Enable "Less secure app access" if needed
```

### Issue: "Port 7171 already in use"

**Solution:**
```bash
# Kill process on port
npx kill-port 7171

# Or change PORT in .env to something else (e.g., 8000)
```

### Issue: "Token expired" or "Unauthorized"

**Solution:**
```bash
# Tokens expire after 15 days
# Clear localStorage in browser DevTools
# Login again to get new token
```

### Issue: "Cannot find module"

**Solution:**
```bash
# Re-install dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 10. Production Deployment

### Backend (Render)

```bash
# 1. Create Web Service
# 2. Connect GitHub repo
# 3. Root Directory: server
# 4. Build Command: npm install
# 5. Start Command: node server.js
# 6. Add environment variables (same as local .env)
# 7. Deploy

# After deployment, run seed script ONCE:
# Connect to Render shell and run:
node utils/seedDatabase.js
```

### Frontend (Netlify/Vercel)

```bash
# 1. Create Static Site
# 2. Connect GitHub repo
# 3. Root Directory: client
# 4. Build Command: npm run build
# 5. Publish Directory: dist
# 6. Environment Variable: VITE_BASE_URL=https://your-backend.onrender.com
# 7. Deploy
```

---

## 11. Next Steps

### Backend Complete ✅

All backend features are implemented and tested.

### Frontend Tasks (To Do) ⏳

1. **Update Signup Page**
   - Add department selector
   - Add student/teacher specific fields
   - Remove avatar selection (using null)

2. **Create Placement Dashboard**
   - Statistics cards
   - Charts (use Chart.js or Recharts)
   - Filters (year, department)
   - Add placement form (teachers)

3. **Create Chatbot Component**
   - Floating chat widget
   - Message input/display
   - Show sources
   - Chat history

4. **Create Knowledge Base Admin Panel**
   - For teachers to add/edit knowledge
   - Category management
   - Search functionality

5. **Update Dashboards**
   - Add placement section
   - Add chatbot widget
   - Show department info

---

## 12. Development Tips

### Hot Reload

Both servers support hot reload:
- Backend: `nodemon` watches for changes
- Frontend: Vite HMR

### Debug Mode

```bash
# Backend with debug logs
NODE_ENV=development npm run dev

# Frontend with verbose output
npm run dev -- --debug
```

### Database GUI

Use MongoDB Compass to view/edit data:
```
Connection String: <your-MONGODB_URI>
```

---

## 13. Useful Commands

```bash
# Check if ports are available
netstat -ano | findstr :7171
netstat -ano | findstr :5173

# View logs
cd server && npm run dev > server.log
tail -f server.log

# Reset database (WARNING: Deletes all data)
mongo <connection-string>
use college-system
db.dropDatabase()
# Then run seed script again

# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 14. Support & Documentation

- **Complete System Docs**: [COLLEGE_SYSTEM_README.md](./COLLEGE_SYSTEM_README.md)
- **Testing Guide**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **API Endpoints**: See COLLEGE_SYSTEM_README.md
- **Database Models**: See COLLEGE_SYSTEM_README.md

---

## ✅ Setup Checklist

- [ ] Node.js installed
- [ ] MongoDB connection working
- [ ] Environment variables configured
- [ ] Database seeded successfully
- [ ] Backend server running (port 7171)
- [ ] Frontend server running (port 5173)
- [ ] Test account created
- [ ] Login successful
- [ ] All features accessible
- [ ] No console errors

---

**If you've completed all steps, you're ready to start development! 🎉**

For issues, check the troubleshooting section or review the logs.

**Good luck! 🚀**
