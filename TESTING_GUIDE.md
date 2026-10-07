# 🧪 Comprehensive Testing Guide

Complete guide for testing the College Management System with multiple users and various testing methodologies.

---

## Table of Contents

1. [Load Testing](#load-testing) - Testing with large number of concurrent users
2. [Unit Testing](#unit-testing) - Testing individual functions and components
3. [Integration Testing](#integration-testing) - Testing API endpoints and services
4. [End-to-End Testing](#end-to-end-testing) - Testing complete user workflows
5. [Performance Testing](#performance-testing) - Database and API performance
6. [Security Testing](#security-testing) - Testing security measures

---

## Load Testing

### Testing with Artillery

Artillery is a modern load testing toolkit for testing backend services with hundreds or thousands of concurrent users.

#### Installation

```bash
npm install -g artillery@latest
```

#### Basic Load Test Configuration

Create `artillery-config.yml`:

```yaml
config:
  target: "http://localhost:7171"
  phases:
    # Warm-up phase
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    # Ramp up phase
    - duration: 120
      arrivalRate: 10
      rampTo: 50
      name: "Ramp up load"
    # Sustained load phase
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    # Spike test
    - duration: 60
      arrivalRate: 100
      name: "Spike test"
  
  # Plugin for tracking real-time metrics
  plugins:
    expect: {}
    metrics-by-endpoint: {}

  # Default headers
  defaults:
    headers:
      Content-Type: "application/json"

  # Custom variables
  variables:
    emails:
      - "student1@test.com"
      - "student2@test.com"
      - "teacher1@test.com"
    passwords:
      - "password123"

scenarios:
  # Scenario 1: User Authentication Flow
  - name: "Login Flow"
    weight: 30
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "{{ $randomString() }}@test.com"
            password: "{{ passwords[$randomNumber(0, $loopCount)] }}"
          capture:
            - json: "$.token"
              as: "authToken"
          expect:
            - statusCode: [200, 400]
      
      - think: 2 # Wait 2 seconds
      
      - get:
          url: "/api/auth/me"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: [200, 401]

  # Scenario 2: Browse Placements
  - name: "Browse Placements"
    weight: 25
    beforeScenario: "loginAsStudent"
    flow:
      - get:
          url: "/api/placements?page=1&limit=20"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200
            - contentType: json
      
      - get:
          url: "/api/placements/stats?year=2024"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200

  # Scenario 3: Chatbot Interaction
  - name: "Chatbot Query"
    weight: 20
    beforeScenario: "loginAsStudent"
    flow:
      - post:
          url: "/api/chatbot/message"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            message: "What are the placement statistics?"
            sessionId: "{{ $uuid() }}"
          expect:
            - statusCode: 200
            - hasProperty: "message"
      
      - think: 3
      
      - post:
          url: "/api/chatbot/message"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            message: "Tell me about CSE department"
            sessionId: "{{ $uuid() }}"

  # Scenario 4: Quiz Operations
  - name: "Quiz Access"
    weight: 15
    beforeScenario: "loginAsStudent"
    flow:
      - get:
          url: "/api/quizzes/student"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200

  # Scenario 5: Notes Download
  - name: "Notes Download"
    weight: 10
    beforeScenario: "loginAsStudent"
    flow:
      - get:
          url: "/api/notes/student"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200

# Helper functions
functions:
  loginAsStudent: |
    // Login before scenario execution
    const response = await fetch('http://localhost:7171/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@test.com',
        password: 'password123'
      })
    });
    const data = await response.json();
    context.vars.authToken = data.token;
```

#### Run Load Tests

```bash
# Basic test
artillery run artillery-config.yml

# Generate HTML report
artillery run --output report.json artillery-config.yml
artillery report report.json

# Quick test (fewer users, shorter duration)
artillery quick --count 10 --num 50 http://localhost:7171/api/auth/departments

# Real-time monitoring
artillery run --output report.json artillery-config.yml | artillery report --output report.html
```

#### Expected Metrics

**Good Performance Indicators:**
- Response time (median): < 200ms
- Response time (p95): < 500ms
- Response time (p99): < 1000ms
- Error rate: < 1%
- Requests per second: > 100

---

### Testing with k6

k6 is another excellent load testing tool with JavaScript-based test scripts.

#### Installation

```bash
# Windows (using Chocolatey)
choco install k6

# Or download from https://k6.io/docs/getting-started/installation/
```

#### k6 Test Script

Create `load-test.js`:

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const loginSuccess = new Rate('login_success');
const apiResponseTime = new Trend('api_response_time');
const errorCount = new Counter('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Ramp up to 20 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 200 },  // Spike to 200 users
    { duration: '3m', target: 50 },   // Scale down
    { duration: '1m', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'], // 95% under 500ms, 99% under 1s
    'http_req_failed': ['rate<0.01'], // Error rate < 1%
    'login_success': ['rate>0.95'], // 95% login success
  },
};

const BASE_URL = 'http://localhost:7171';

// Test data
const testUsers = [
  { email: 'student1@test.com', password: 'password123', role: 'student' },
  { email: 'student2@test.com', password: 'password123', role: 'student' },
  { email: 'teacher1@test.com', password: 'password123', role: 'teacher' },
];

export function setup() {
  // Setup: Create test data if needed
  console.log('Starting load test...');
  return { timestamp: Date.now() };
}

export default function (data) {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  group('User Authentication', function () {
    // Login
    const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
      email: user.email,
      password: user.password,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });

    const loginOk = check(loginRes, {
      'login status 200': (r) => r.status === 200,
      'has token': (r) => r.json('token') !== undefined,
    });

    loginSuccess.add(loginOk);
    apiResponseTime.add(loginRes.timings.duration);

    if (!loginOk) {
      errorCount.add(1);
      return;
    }

    const token = loginRes.json('token');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    sleep(1);

    // Get user profile
    group('Profile Operations', function () {
      const profileRes = http.get(`${BASE_URL}/api/auth/me`, { headers });
      
      check(profileRes, {
        'profile status 200': (r) => r.status === 200,
        'has user data': (r) => r.json('fullName') !== undefined,
      });

      apiResponseTime.add(profileRes.timings.duration);
    });

    sleep(1);

    // Browse departments
    group('Department Browsing', function () {
      const deptRes = http.get(`${BASE_URL}/api/auth/departments`, { headers });
      
      check(deptRes, {
        'departments status 200': (r) => r.status === 200,
        'has departments': (r) => Array.isArray(r.json()),
      });

      apiResponseTime.add(deptRes.timings.duration);
    });

    sleep(1);

    // Placement statistics
    group('Placement Stats', function () {
      const statsRes = http.get(`${BASE_URL}/api/placements/stats`, { headers });
      
      check(statsRes, {
        'stats status 200': (r) => r.status === 200,
        'has placement data': (r) => r.json('totalPlacements') !== undefined,
      });

      apiResponseTime.add(statsRes.timings.duration);
    });

    sleep(2);

    // Chatbot interaction
    group('Chatbot Query', function () {
      const chatRes = http.post(`${BASE_URL}/api/chatbot/message`, JSON.stringify({
        message: 'Tell me about placement opportunities',
        sessionId: `session-${__VU}-${__ITER}`,
      }), { headers });

      check(chatRes, {
        'chat status 200': (r) => r.status === 200,
        'has response': (r) => r.json('message') !== undefined,
      });

      apiResponseTime.add(chatRes.timings.duration);
    });

    sleep(2);
  });
}

export function teardown(data) {
  console.log(`Test completed. Duration: ${(Date.now() - data.timestamp) / 1000}s`);
}
```

#### Run k6 Tests

```bash
# Run the test
k6 run load-test.js

# Run with custom VUs and duration
k6 run --vus 100 --duration 5m load-test.js

# Output to InfluxDB for real-time monitoring
k6 run --out influxdb=http://localhost:8086/k6 load-test.js

# Generate summary report
k6 run --summary-export=summary.json load-test.js
```

---

## Unit Testing

### Setting Up Jest for Backend

#### Installation

```bash
cd server
npm install --save-dev jest @types/jest supertest mongodb-memory-server
```

#### Jest Configuration

Create `server/jest.config.js`:

```javascript
export default {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    'controllers/**/*.js',
    'utils/**/*.js',
    'middleware/**/*.js',
    '!**/__tests__/**',
  ],
};
```

#### Example Unit Tests

Create `server/__tests__/utils/ragService.test.js`:

```javascript
import { describe, test, expect } from '@jest/globals';
import { retrieveRelevantDocs, generateResponse } from '../../utils/ragService.js';

describe('RAG Service', () => {
  describe('retrieveRelevantDocs', () => {
    test('should retrieve relevant documents for a query', async () => {
      const query = 'What are the placement statistics?';
      const docs = await retrieveRelevantDocs(query, { limit: 5 });
      
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeLessThanOrEqual(5);
    });

    test('should filter by category', async () => {
      const query = 'admission process';
      const docs = await retrieveRelevantDocs(query, { 
        category: 'Admission',
        limit: 3 
      });
      
      docs.forEach(doc => {
        expect(doc.category).toBe('Admission');
      });
    });

    test('should return empty array for irrelevant query', async () => {
      const query = 'xyzabc123 nonsense query';
      const docs = await retrieveRelevantDocs(query, { threshold: 0.9 });
      
      expect(docs.length).toBe(0);
    });
  });

  describe('generateResponse', () => {
    test('should generate response with sources', () => {
      const query = 'Tell me about placements';
      const docs = [
        {
          title: 'Placement Overview',
          content: 'Our college has 85% placement rate',
          category: 'Placement',
          relevanceScore: 0.9,
        },
      ];

      const result = generateResponse(query, docs);

      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('confidence');
      expect(result.sources.length).toBeGreaterThan(0);
    });

    test('should handle empty document array', () => {
      const query = 'Tell me about something';
      const docs = [];

      const result = generateResponse(query, docs);

      expect(result.response).toContain("don't have enough information");
      expect(result.sources.length).toBe(0);
      expect(result.confidence).toBe(0);
    });
  });
});
```

Create `server/__tests__/controllers/placementController.test.js`:

```javascript
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from '../../server.js';
import Placement from '../../models/placementModel.js';
import Department from '../../models/departmentModel.js';

let mongoServer;
let testDepartment;
let authToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test department
  testDepartment = await Department.create({
    name: 'Computer Science',
    code: 'CSE',
    establishedYear: 2000,
  });

  // Login to get auth token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@test.com',
      password: 'password123',
    });
  
  authToken = loginRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Placement Controller', () => {
  test('POST /api/placements - should add placement record', async () => {
    const placementData = {
      studentName: 'John Doe',
      department: testDepartment._id,
      company: 'Google',
      package: 25,
      role: 'Software Engineer',
      year: 2024,
    };

    const res = await request(app)
      .post('/api/placements')
      .set('Authorization', `Bearer ${authToken}`)
      .send(placementData);

    expect(res.status).toBe(201);
    expect(res.body.placement).toHaveProperty('_id');
    expect(res.body.placement.company).toBe('Google');
  });

  test('GET /api/placements/stats - should return statistics', async () => {
    const res = await request(app)
      .get('/api/placements/stats?year=2024')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalPlacements');
    expect(res.body).toHaveProperty('avgPackage');
    expect(res.body).toHaveProperty('maxPackage');
  });

  test('GET /api/placements/trends - should return year-over-year trends', async () => {
    const res = await request(app)
      .get('/api/placements/trends?years=3')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

#### Run Unit Tests

```bash
cd server

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- ragService.test.js

# Watch mode
npm test -- --watch
```

---

## Integration Testing

### API Integration Tests with Supertest

Create `server/__tests__/integration/api.test.js`:

```javascript
import { describe, test, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import app from '../../server.js';

describe('API Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Setup: Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@test.com',
        password: 'password123',
      });

    authToken = loginRes.body.token;
    userId = loginRes.body.user._id;
  });

  describe('Complete User Flow', () => {
    test('User can view departments', async () => {
      const res = await request(app)
        .get('/api/auth/departments');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('User can view placement statistics', async () => {
      const res = await request(app)
        .get('/api/placements/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalPlacements');
    });

    test('User can interact with chatbot', async () => {
      const res = await request(app)
        .post('/api/chatbot/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the admission process?',
          sessionId: 'test-session',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('sources');
    });

    test('User can update profile', async () => {
      const res = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          contact: '9876543210',
          cgpa: 8.5,
        });

      expect(res.status).toBe(200);
      expect(res.body.user.contact).toBe('9876543210');
    });
  });

  describe('Authorization Tests', () => {
    test('Student cannot add placement records', async () => {
      const res = await request(app)
        .post('/api/placements')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studentName: 'Test',
          company: 'Test Corp',
          package: 10,
          role: 'Engineer',
          year: 2024,
        });

      expect(res.status).toBe(403);
    });

    test('Unauthenticated user cannot access protected routes', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });
});
```

---

## End-to-End Testing

### Playwright E2E Tests

#### Installation

```bash
cd client
npm install --save-dev @playwright/test
npx playwright install
```

#### Playwright Configuration

Create `client/playwright.config.js`:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2E Test Examples

Create `client/e2e/student-flow.spec.js`:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Student User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('complete student journey', async ({ page }) => {
    // Login
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');

    // Wait for dashboard
    await expect(page).toHaveURL(/\/student/);
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Navigate to Placements
    await page.click('text=Placements');
    await expect(page.locator('text=Placement Statistics')).toBeVisible();

    // Check placement charts are loaded
    await expect(page.locator('canvas')).toBeVisible();

    // Open chatbot
    await page.click('[aria-label="Open Chatbot"]');
    await page.fill('[placeholder="Ask a question..."]', 'What are the placement stats?');
    await page.press('[placeholder="Ask a question..."]', 'Enter');

    // Wait for chatbot response
    await expect(page.locator('.chatbot-message')).toBeVisible({ timeout: 10000 });

    // Navigate to Quiz
    await page.click('text=Quiz');
    await expect(page.locator('text=Available Quizzes')).toBeVisible();

    // Logout
    await page.click('text=Logout');
    await expect(page).toHaveURL('/login');
  });

  test('placement dashboard loads correctly', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');

    // Navigate to placements
    await page.click('text=Placements');

    // Check all statistics are visible
    await expect(page.locator('text=Total Placements')).toBeVisible();
    await expect(page.locator('text=Average Package')).toBeVisible();
    await expect(page.locator('text=Highest Package')).toBeVisible();

    // Check charts render
    const charts = page.locator('canvas');
    await expect(charts).toHaveCount(3, { timeout: 5000 });

    // Check filters work
    await page.selectOption('select[name="year"]', '2023');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=2023')).toBeVisible();
  });

  test('chatbot interaction', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Login")');

    // Open chatbot
    await page.click('[data-testid="chatbot-button"]');

    // Send message
    const input = page.locator('input[placeholder*="question"]');
    await input.fill('Tell me about CSE department');
    await input.press('Enter');

    // Wait for response
    await page.waitForSelector('.bot-message', { timeout: 10000 });
    
    // Check response contains relevant info
    const response = await page.locator('.bot-message').last().textContent();
    expect(response.toLowerCase()).toContain('computer');
  });
});
```

#### Run E2E Tests

```bash
cd client

# Run all tests
npx playwright test

# Run specific test
npx playwright test student-flow

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Generate HTML report
npx playwright show-report
```

---

## Performance Testing

### Database Performance Testing

Create `server/__tests__/performance/database.test.js`:

```javascript
import { test, expect } from '@jest/globals';
import mongoose from 'mongoose';
import Placement from '../../models/placementModel.js';
import KnowledgeBase from '../../models/knowledgeBaseModel.js';

test('Placement query performance', async () => {
  const startTime = Date.now();
  
  // Query with filters
  const placements = await Placement
    .find({ year: 2024 })
    .populate('department')
    .limit(100)
    .lean();

  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(200); // Should complete in under 200ms
  expect(placements.length).toBeLessThanOrEqual(100);
});

test('Knowledge base search performance', async () => {
  const startTime = Date.now();

  const results = await KnowledgeBase
    .find({ $text: { $search: 'placement admission' } })
    .limit(10)
    .lean();

  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(100); // Should complete in under 100ms
});

test('Aggregation pipeline performance', async () => {
  const startTime = Date.now();

  const stats = await Placement.aggregate([
    { $match: { year: 2024 } },
    {
      $group: {
        _id: '$department',
        avgPackage: { $avg: '$package' },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(300); // Should complete in under 300ms
  expect(Array.isArray(stats)).toBe(true);
});
```

---

## Running All Tests

### Complete Testing Workflow

```bash
# 1. Start services
npm run dev  # Start backend
cd client && npm run dev  # Start frontend

# 2. Run unit tests
cd server
npm test -- --coverage

# 3. Run integration tests
npm test -- integration

# 4. Run E2E tests
cd ../client
npx playwright test

# 5. Run load tests
artillery run ../artillery-config.yml

# 6. Generate combined report
echo "All tests completed!"
```

### CI/CD Pipeline (.github/workflows/tests.yml)

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: cd server && npm ci
      - run: cd server && npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd client && npm ci
      - run: npx playwright install --with-deps
      - run: cd client && npx playwright test

  load-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install -g artillery
      - run: artillery run artillery-config.yml
```

---

## Best Practices

1. **Write tests first** (TDD approach)
2. **Mock external dependencies** (APIs, databases)
3. **Use descriptive test names**
4. **Keep tests independent**
5. **Test edge cases and error conditions**
6. **Monitor test execution time**
7. **Maintain test coverage above 80%**
8. **Run tests in CI/CD pipeline**
9. **Review test failures immediately**
10. **Update tests with code changes**

---

## Troubleshooting

### Common Issues

**Tests timeout:**
```bash
# Increase timeout
jest --testTimeout=10000
playwright test --timeout=30000
```

**Database connection issues:**
```javascript
// Use mongodb-memory-server for tests
import { MongoMemoryServer } from 'mongodb-memory-server';
```

**Port already in use:**
```bash
# Kill process on port
npx kill-port 7171
```

---

**Happy Testing! 🧪✨**
