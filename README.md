# SolidAudit - AI-Powered Smart Contract Security Auditing Platform

<div align="center">

**Professional-grade smart contract security auditing powered by Claude AI**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1-purple)](https://vitejs.dev/)
[![Node](https://img.shields.io/badge/Node-18+-green)](https://nodejs.org/)

Visit us at: **solidaudit.io**

</div>

---

## 🎯 Overview

SolidAudit is a comprehensive smart contract auditing platform that combines AI-powered analysis with professional security assessments. Built with React and Claude AI, it provides detailed vulnerability detection, gas optimization recommendations, and fix verification capabilities.

## ✨ Features

### Core Capabilities
- 🔍 **AI-Powered Analysis** - Deep security auditing using Claude Opus 4.1
- 🛡️ **Vulnerability Detection** - Identifies reentrancy, access control, overflow issues, and more
- ⚡ **Gas Optimization** - Suggests gas-saving improvements with estimated savings
- 📊 **Analytics Dashboard** - Track audit history, trends, and patterns
- 🔄 **Version Management** - Track contract changes across versions
- ✅ **Fix Verification** - Verify that fixes properly address security issues
- 📄 **Report Generation** - Export audits as PDF, JSON, or HTML

### Security Focus Areas
- Reentrancy attacks (CWE-367)
- Integer overflow/underflow (CWE-190/191)
- Access control issues (CWE-284)
- Unchecked external calls (CWE-252)
- Front-running vulnerabilities (CWE-362)
- Timestamp dependency (CWE-829)
- Gas optimization opportunities
- Best practices compliance

## 🏗️ Architecture

```
AI-AUDIT/
├── src/                      # Frontend React application
│   ├── components/          # React components
│   ├── lib/                 # Business logic and utilities
│   ├── config/              # Configuration files
│   └── types/               # TypeScript type definitions
│
├── server/                   # Backend API server
│   ├── src/                 # Server source code
│   │   └── index.ts        # Express server with Claude integration
│   ├── package.json        # Server dependencies
│   └── README.md           # Server documentation
│
├── public/                   # Static assets
└── docs/                    # Generated documentation
    ├── BUG_REPORT.md       # Detailed bug reports and fixes
    ├── CODEBASE_ANALYSIS.md # Complete architecture overview
    └── QUICK_REFERENCE.md   # Quick reference guide
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18 or higher
- **npm** or **yarn**
- **Anthropic API key** ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd AI-AUDIT
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
npm run server:install
```

4. **Configure the backend**
```bash
cd server
cp .env.example .env
```

Edit `server/.env` and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4174
```

5. **Configure the frontend (optional)**
```bash
cd ..
cp .env.example .env
```

Edit `.env` if you need to change the backend URL:
```env
VITE_API_BASE_URL=http://localhost:3001
```

### Running the Application

You'll need **two terminal windows**:

**Terminal 1 - Backend Server:**
```bash
npm run server:dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Then open your browser to:
```
http://localhost:5173
```

## 📖 Usage Guide

### 1. Upload a Contract

- Click **"Upload Contract"** or paste your Solidity code
- The system validates the code syntax
- Detects malicious patterns before analysis

### 2. Run Audit Analysis

- Click **"Analyze Contract"** to start the audit
- AI analyzes the code for security vulnerabilities
- Results are cached for faster subsequent analyses

### 3. Review Results

- **Security Score** (0-100) based on severity and quantity of issues
- **Issues List** - All detected vulnerabilities with:
  - Severity (HIGH, MEDIUM, LOW)
  - Line numbers and function names
  - Impact assessment
  - Fix recommendations
  - CWE references

### 4. Gas Optimizations

- View gas-saving opportunities
- Estimated gas savings for each optimization
- Code examples for optimized implementations

### 5. Fix Verification

- Submit fixed code for verification
- AI analyzes if fixes properly address original issues
- Detects new vulnerabilities introduced by fixes
- Creates new version with updated audit results

### 6. Export Reports

- **PDF** - Professional formatted report
- **JSON** - Structured data for integration
- **HTML** - Interactive web-based report

## 🛠️ Technology Stack

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Recharts** - Analytics visualization
- **jsPDF** - PDF report generation
- **React Dropzone** - File uploads

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **Anthropic SDK** - Claude AI integration
- **CORS** - Cross-origin requests
- **Helmet** - Security headers
- **Rate Limiting** - API protection

## 🔧 Development

### Build Frontend
```bash
npm run build
```

### Build Backend
```bash
npm run server:build
```

### Lint Code
```bash
npm run lint
```

### Type Check
```bash
# Frontend
npm run build

# Backend
cd server && npm run type-check
```

## 🚢 Production Deployment

### Backend Deployment

1. Build the backend:
```bash
cd server
npm run build
```

2. Set production environment variables:
```bash
export ANTHROPIC_API_KEY=your_production_api_key
export PORT=3001
export NODE_ENV=production
export ALLOWED_ORIGINS=https://your-frontend-domain.com
```

3. Start the server:
```bash
npm start
```

Or use PM2 for process management:
```bash
pm2 start dist/index.js --name solid-audit-api
```

### Frontend Deployment

1. Update `.env` with production backend URL:
```env
VITE_API_BASE_URL=https://api.your-domain.com
```

2. Build the frontend:
```bash
npm run build
```

3. Deploy the `dist` folder to your static hosting service:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - GitHub Pages

## 📊 API Endpoints

### Backend API

#### Health Check
```
GET /health
```

Returns server status and uptime.

#### Claude API Proxy
```
POST /api/claude/messages
```

**Request:**
```json
{
  "model": "claude-opus-4-1-20250805",
  "max_tokens": 32000,
  "temperature": 0,
  "messages": [
    {
      "role": "user",
      "content": "Your prompt here"
    }
  ]
}
```

**Response:**
```json
{
  "content": [{ "text": "Claude's response" }],
  "id": "msg_...",
  "model": "claude-opus-4-1-20250805",
  "usage": {
    "input_tokens": 100,
    "output_tokens": 200
  }
}
```

## 🐛 Known Issues & Fixes

For detailed bug reports and fixes, see:
- **[BUG_REPORT.md](./BUG_REPORT.md)** - Comprehensive bug documentation
- **[CODEBASE_ANALYSIS.md](./CODEBASE_ANALYSIS.md)** - Architecture and security analysis

### Recently Fixed Issues ✅

1. ✅ Missing state variables in `AuditResults.tsx`
2. ✅ Broken `FixVerificationEngine.submitFix()` method
3. ✅ No backend API server (created Express server)
4. ✅ API key exposure (moved to backend)
5. ✅ localStorage quota management
6. ✅ Input validation for cached data

## 🔐 Security Considerations

### Best Practices
- ✅ API key stored securely on backend (never exposed to frontend)
- ✅ CORS protection enabled
- ✅ Rate limiting on API endpoints
- ✅ Input validation for all user inputs
- ✅ Helmet security headers
- ✅ localStorage data validation

### Recommendations
- Use HTTPS in production
- Implement user authentication for production deployment
- Set up proper monitoring and logging
- Regular security audits
- Keep dependencies updated

## 📝 Configuration

### Environment Variables

**Frontend (`.env`)**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_ENV=development
```

**Backend (`server/.env`)**
```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **Anthropic** - For the Claude AI API
- **React Team** - For the amazing frontend framework
- **Vite Team** - For the blazing fast build tool
- **Tailwind CSS** - For the utility-first CSS framework

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review the [BUG_REPORT.md](./BUG_REPORT.md) for known issues

---

<div align="center">

**Built with ❤️ for the Ethereum community**

</div>
