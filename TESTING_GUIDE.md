# Testing Guide - SolidAudit

Comprehensive guide for testing the AI-AUDIT (SolidAudit) platform.

## Table of Contents
1. [Quick Start Testing](#quick-start-testing)
2. [Backend Testing](#backend-testing)
3. [Frontend Testing](#frontend-testing)
4. [Integration Testing](#integration-testing)
5. [Error Handling Testing](#error-handling-testing)
6. [Performance Testing](#performance-testing)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start Testing

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] Both frontend and backend dependencies installed
- [ ] Anthropic API key obtained
- [ ] `.env` files configured

### 5-Minute Smoke Test

```bash
# 1. Backend
cd server
npm install
cp .env.example .env
# Edit .env and add ANTHROPIC_API_KEY
npm run dev

# 2. Frontend (new terminal)
npm install
npm run dev

# 3. Open browser to http://localhost:5173
```

**Quick Check**:
- [ ] Backend shows "Server running on port 3001"
- [ ] Frontend loads without errors
- [ ] Backend status indicator shows "Online" (green dot)
- [ ] You can upload a contract file
- [ ] Settings page loads

---

## Backend Testing

### 1. Server Startup Test

```bash
cd server
npm run dev
```

**Expected Output**:
```
🚀 SolidAudit Backend Server
================================
✅ Server running on port 3001
✅ Environment: development
✅ Health check: http://localhost:3001/health
✅ API endpoint: http://localhost:3001/api/claude/messages
✅ CORS enabled for: http://localhost:5173, http://localhost:4173
================================
```

**Test Checklist**:
- [ ] No errors on startup
- [ ] Port 3001 is accessible
- [ ] Environment variables loaded correctly

### 2. Health Endpoint Test

```bash
curl http://localhost:3001/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-15T...",
  "uptime": 10.5,
  "environment": "development"
}
```

### 3. Claude API Integration Test

```bash
curl -X POST http://localhost:3001/api/claude/messages \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4-1-20250805",
    "max_tokens": 100,
    "temperature": 0,
    "messages": [
      {
        "role": "user",
        "content": "Say hello"
      }
    ]
  }'
```

**Expected**:
- [ ] 200 OK response
- [ ] Response contains `content` array
- [ ] Response contains `usage` object with token counts

**Common Issues**:
- **401 Unauthorized**: Invalid API key in `.env`
- **429 Rate Limited**: Too many requests, wait a moment
- **500 Error**: Check backend console for detailed error

### 4. Error Handling Tests

**Test Invalid Request**:
```bash
curl -X POST http://localhost:3001/api/claude/messages \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: 400 Bad Request with error message

**Test CORS**:
```bash
curl -X POST http://localhost:3001/api/claude/messages \
  -H "Origin: http://evil.com" \
  -H "Content-Type: application/json" \
  -d '{"model":"claude-opus-4-1-20250805","max_tokens":100,"messages":[]}'
```

**Expected**: CORS error (request blocked)

### 5. Rate Limiting Test

Send 105 requests in quick succession:

```bash
for i in {1..105}; do
  curl -X POST http://localhost:3001/api/claude/messages \
    -H "Content-Type: application/json" \
    -d '{"model":"claude-opus-4-1-20250805","max_tokens":10,"messages":[{"role":"user","content":"test"}]}'
  echo "Request $i"
done
```

**Expected**: After 100 requests, should receive 429 Too Many Requests

---

## Frontend Testing

### 1. UI Load Test

```bash
npm run dev
```

Open http://localhost:5173

**Test Checklist**:
- [ ] Page loads without errors
- [ ] No console errors (check DevTools)
- [ ] Backend status indicator visible
- [ ] All tabs visible (Audit, Analytics, History, Settings)

### 2. Backend Status Indicator

**Test States**:

1. **Online (Green)**:
   - Backend running
   - Status dot should be green
   - Tooltip: "Backend Online"

2. **Offline (Red)**:
   - Stop backend server
   - Wait 30 seconds or click "Check Now"
   - Status should turn red
   - Troubleshooting tips should appear

3. **Error (Yellow)**:
   - Change backend URL to invalid endpoint
   - Should show yellow warning

### 3. File Upload Test

**Test Valid Contract**:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 public value;

    function setValue(uint256 _value) public {
        value = _value;
    }
}
```

**Steps**:
1. Click "Upload Contract" or drag and drop `.sol` file
2. Click "Analyze Contract"
3. Wait for progress bar

**Expected**:
- [ ] File uploads successfully
- [ ] Analysis progress shown
- [ ] Results display with security score
- [ ] Issues list populated
- [ ] Gas optimizations shown

**Test Invalid Contract**:
```javascript
function hello() { return "Not Solidity"; }
```

**Expected**:
- [ ] Validation error before analysis
- [ ] Clear error message

### 4. Settings Test

**API Key Validation**:
1. Go to Settings tab
2. Try invalid API key: `invalid-key`

**Expected**: Validation error

3. Try valid format: `sk-ant-test-key-here-1234567890`

**Expected**: Accepts (shows as valid format)

### 5. localStorage Test

**Test Quota Management**:

```javascript
// Open browser console
localStorage.clear();

// Check current usage
let total = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    total += localStorage[key].length;
  }
}
console.log('Current usage:', total, 'bytes');
```

**Test Cleanup**:
1. Run multiple audits (5-10)
2. Check localStorage size
3. Verify old versions are cleaned up automatically

---

## Integration Testing

### End-to-End Audit Workflow

**Scenario**: Complete audit from upload to report

1. **Upload Contract**
   ```solidity
   pragma solidity ^0.8.0;

   contract VulnerableContract {
       address public owner;

       function withdraw() public {
           payable(msg.sender).transfer(address(this).balance);
       }
   }
   ```

2. **Run Analysis**
   - Click "Analyze Contract"
   - Verify progress updates
   - Wait for completion

3. **Review Results**
   - [ ] Security score displayed
   - [ ] Reentrancy vulnerability detected
   - [ ] Recommendations provided

4. **Generate Report**
   - Click "Export Report" > "PDF"
   - [ ] PDF downloads successfully
   - [ ] Contains all issue details

5. **Submit Fix**
   - Modify contract with fix
   - Submit for verification
   - [ ] Fix verification completes
   - [ ] New version created

### Version Management Test

1. Upload contract (v1)
2. Run audit
3. Submit fix (creates v2)
4. Submit another fix (creates v3)
5. Go to History tab
6. [ ] All versions visible
7. [ ] Can compare versions
8. [ ] Parent-child relationships correct

---

## Error Handling Testing

### 1. Network Error Simulation

**Disconnect Backend**:
1. Stop backend server
2. Try to analyze contract

**Expected**:
- [ ] User-friendly error message
- [ ] "Unable to connect to server" displayed
- [ ] Backend status shows offline
- [ ] Error logged in console (check DevTools)

### 2. API Error Simulation

**Invalid API Key**:
1. Settings > Enter invalid API key
2. Try to analyze contract

**Expected**:
- [ ] Clear error about API configuration
- [ ] No crash
- [ ] Error logged

**Rate Limit**:
1. Run 100+ audits quickly

**Expected**:
- [ ] "Too many requests" message
- [ ] Suggestion to wait
- [ ] Retry functionality available

### 3. Storage Quota Test

**Fill localStorage**:
```javascript
// Browser console
try {
  const bigData = 'x'.repeat(1024 * 1024); // 1MB
  for (let i = 0; i < 10; i++) {
    localStorage.setItem(`test_${i}`, bigData);
  }
} catch (e) {
  console.log('Quota exceeded:', e);
}
```

**Expected**:
- [ ] Automatic cleanup triggers
- [ ] Old versions removed
- [ ] Clear error message if still full
- [ ] App doesn't crash

### 4. Component Error Test

**Trigger React Error**:
1. Open DevTools
2. Modify a component to throw error (if in dev mode)

**Expected**:
- [ ] Error boundary catches error
- [ ] User-friendly error screen
- [ ] "Try Again" button works
- [ ] "Reload Page" button works

---

## Performance Testing

### 1. Large Contract Test

Create a contract with 500+ lines:
```solidity
// Large contract with many functions
pragma solidity ^0.8.0;

contract LargeContract {
    // Add 50+ functions here
}
```

**Test**:
- Upload and analyze
- [ ] Analysis completes in reasonable time (< 2 minutes)
- [ ] UI remains responsive
- [ ] Progress updates shown

### 2. Multiple Tabs Test

1. Open 5 browser tabs
2. Run audits in each tab simultaneously

**Expected**:
- [ ] No rate limit errors
- [ ] All audits complete
- [ ] No memory leaks (check Task Manager)

### 3. Cache Performance

**First Audit** (no cache):
- Note the time taken

**Second Audit** (cached):
- Upload same contract
- [ ] Results instant (< 1 second)
- [ ] "Retrieved from cache" message

---

## Troubleshooting

### Backend Won't Start

**Error**: `ANTHROPIC_API_KEY is not set`
**Fix**:
```bash
cd server
cp .env.example .env
# Edit .env and add your API key
```

**Error**: `Port 3001 already in use`
**Fix**:
```bash
# Find process using port
lsof -i :3001
# Kill it
kill -9 <PID>
```

### Frontend Can't Connect

**Check**:
1. Backend running? → `curl http://localhost:3001/health`
2. CORS configured? → Check `server/.env` ALLOWED_ORIGINS
3. Correct URL? → Check frontend `.env` VITE_API_BASE_URL

### Analysis Fails

**Check**:
1. Backend logs for errors
2. API key valid?
3. Network DevTools for request details
4. Contract syntax valid?

### localStorage Issues

**Clear Everything**:
```javascript
// Browser console
localStorage.clear();
location.reload();
```

**Check Usage**:
```javascript
let usage = 0;
for (let key in localStorage) {
  usage += localStorage[key].length;
}
console.log('Total:', (usage / 1024).toFixed(2), 'KB');
```

---

## Testing Checklist

### Pre-Release Testing

- [ ] Backend starts without errors
- [ ] Frontend loads successfully
- [ ] Backend status indicator works
- [ ] Can upload and analyze contract
- [ ] Results display correctly
- [ ] Error handling works (network, API, validation)
- [ ] localStorage management functional
- [ ] Reports generate successfully
- [ ] Version management works
- [ ] Analytics dashboard displays
- [ ] Settings save correctly
- [ ] Error boundaries catch errors
- [ ] No console errors in production build
- [ ] Works in Chrome, Firefox, Safari
- [ ] Mobile responsive (basic check)

### Performance Checklist

- [ ] Analysis completes in < 2 minutes
- [ ] Cache retrieval < 1 second
- [ ] UI remains responsive during analysis
- [ ] No memory leaks after 10 audits
- [ ] localStorage usage reasonable (< 5MB)

### Security Checklist

- [ ] API key not visible in network tab
- [ ] API key not in browser console
- [ ] CORS blocks unauthorized origins
- [ ] Rate limiting functional
- [ ] Input validation works
- [ ] No XSS vulnerabilities
- [ ] localStorage data validated on load

---

## Automated Testing (Future)

### Unit Tests
```bash
# TODO: Add Jest/Vitest
npm run test
```

### E2E Tests
```bash
# TODO: Add Playwright
npm run test:e2e
```

### Integration Tests
```bash
# TODO: Add API tests
npm run test:integration
```

---

## Test Data

### Sample Vulnerable Contract

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VulnerableBank {
    mapping(address => uint256) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    // Reentrancy vulnerability
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] -= amount;
    }

    // Access control issue
    function emergencyWithdraw() public {
        payable(msg.sender).transfer(address(this).balance);
    }
}
```

**Expected Issues**:
- Reentrancy in withdraw()
- Missing access control in emergencyWithdraw()
- CEI pattern violation

---

## Support

If tests fail:
1. Check this guide's Troubleshooting section
2. Review console logs (browser and terminal)
3. Check `BUG_REPORT.md` for known issues
4. Verify environment setup (Node version, API key, etc.)

---

**Last Updated**: 2025-11-15
**Version**: 1.0
