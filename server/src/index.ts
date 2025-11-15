import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Validate required environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ ERROR: ANTHROPIC_API_KEY is not set in environment variables');
  console.error('Please create a .env file with your API key (see .env.example)');
  process.exit(1);
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:5173',
  'http://localhost:4173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Claude API endpoint
app.post('/api/claude/messages', async (req: Request, res: Response) => {
  try {
    const { model, max_tokens, temperature, messages, seed } = req.body;

    // Validate request body
    if (!model || !messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request must include model and messages array'
      });
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return res.status(400).json({
          error: 'Invalid message format',
          message: 'Each message must have role and content'
        });
      }
    }

    console.log(`📤 Sending request to Claude API (model: ${model})`);

    // Call Claude API
    const startTime = Date.now();
    let response;

    try {
      // Build request parameters
      const requestParams: any = {
        model: model || 'claude-opus-4-1-20250805',
        max_tokens: max_tokens || 32000,
        messages: messages,
      };

      // Add optional parameters
      if (temperature !== undefined) {
        requestParams.temperature = temperature;
      }

      // Note: Anthropic SDK doesn't support seed parameter in the same way
      // It's used internally for caching but not exposed in the same API

      response = await anthropic.messages.create(requestParams);

      const duration = Date.now() - startTime;
      console.log(`✅ Claude API response received (${duration}ms)`);

      // Transform response to match frontend expectations
      const transformedResponse = {
        content: response.content.map((block: any) => {
          if (block.type === 'text') {
            return { text: block.text };
          }
          return block;
        }),
        id: response.id,
        model: response.model,
        role: response.role,
        stop_reason: response.stop_reason,
        usage: response.usage
      };

      res.json(transformedResponse);

    } catch (apiError: any) {
      // Handle specific Anthropic API errors
      console.error('❌ Claude API error:', apiError);

      if (apiError.status === 429) {
        // Rate limit error
        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: 'Claude API rate limit reached. Please try again later.',
          retryAfter: apiError.headers?.['retry-after']
        });
      }

      if (apiError.status === 529) {
        // Overloaded error
        return res.status(529).json({
          error: 'Service overloaded',
          message: 'Claude API is currently overloaded. Please try again in a moment.'
        });
      }

      if (apiError.status === 401) {
        // Authentication error
        console.error('❌ Invalid API key');
        return res.status(500).json({
          error: 'Server configuration error',
          message: 'API authentication failed. Please contact support.'
        });
      }

      // Generic API error
      return res.status(apiError.status || 500).json({
        error: 'Claude API error',
        message: apiError.message || 'Failed to process request with Claude API'
      });
    }

  } catch (error: any) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred'
    });
  }
});

// API status and version info
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    name: 'SolidAudit API',
    version: '2.0.0',
    status: 'operational',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      claudeAPI: true,
      rateLimit: true,
      cors: true,
      validation: true
    },
    limits: {
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
      },
      requestBodySize: '10mb'
    }
  });
});

// Quick contract validation endpoint
app.post('/api/validate', (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request must include code as a string'
      });
    }

    // Basic validation checks
    const validation = {
      hasCode: code.length > 0,
      hasPragma: /pragma\s+solidity/.test(code),
      hasContract: /\b(contract|library|interface)\s+\w+/.test(code),
      estimatedSize: code.length,
      withinSizeLimit: code.length < 24576, // 24KB
      lineCount: code.split('\n').length,
      characterCount: code.length
    };

    const issues: string[] = [];
    const warnings: string[] = [];

    if (!validation.hasPragma) {
      warnings.push('No pragma directive found');
    }

    if (!validation.hasContract) {
      issues.push('No contract, library, or interface declaration found');
    }

    if (!validation.withinSizeLimit) {
      issues.push('Contract size exceeds 24KB deployment limit');
    }

    if (validation.lineCount > 1000) {
      warnings.push('Contract is very large (>1000 lines)');
    }

    // Check for common issues
    if (/tx\.origin/.test(code)) {
      warnings.push('Uses tx.origin (consider using msg.sender)');
    }

    if (/\.call\{/.test(code) || /\.delegatecall\{/.test(code)) {
      warnings.push('Uses low-level calls (ensure proper error handling)');
    }

    const result = {
      isValid: issues.length === 0,
      issues,
      warnings,
      metadata: {
        lineCount: validation.lineCount,
        characterCount: validation.characterCount,
        estimatedSize: validation.estimatedSize,
        withinSizeLimit: validation.withinSizeLimit
      }
    };

    res.json(result);

  } catch (error: any) {
    console.error('❌ Validation error:', error);
    res.status(500).json({
      error: 'Validation error',
      message: error.message || 'Failed to validate contract'
    });
  }
});

// System metrics endpoint
app.get('/api/metrics', (req: Request, res: Response) => {
  const memoryUsage = process.memoryUsage();

  res.json({
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(process.uptime()),
      formatted: formatUptime(process.uptime())
    },
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      limit: memoryUsage.rss,
      usedMB: (memoryUsage.heapUsed / 1024 / 1024).toFixed(2),
      totalMB: (memoryUsage.heapTotal / 1024 / 1024).toFixed(2),
      percentage: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2)
    },
    process: {
      pid: process.pid,
      platform: process.platform,
      nodeVersion: process.version,
      arch: process.arch
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// API documentation endpoint
app.get('/api/docs', (req: Request, res: Response) => {
  res.json({
    name: 'SolidAudit API',
    version: '2.0.0',
    description: 'Backend API for SolidAudit contract auditing platform',
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint',
        auth: false,
        rateLimit: false
      },
      status: {
        method: 'GET',
        path: '/api/status',
        description: 'Get API status and version information',
        auth: false,
        rateLimit: true
      },
      validate: {
        method: 'POST',
        path: '/api/validate',
        description: 'Quick contract validation without full audit',
        auth: false,
        rateLimit: true,
        body: {
          code: 'string (required) - Solidity contract code'
        }
      },
      claude: {
        method: 'POST',
        path: '/api/claude/messages',
        description: 'Proxy to Claude API for contract analysis',
        auth: false,
        rateLimit: true,
        body: {
          model: 'string (required) - Claude model name',
          max_tokens: 'number (optional) - Maximum tokens',
          temperature: 'number (optional) - Temperature setting',
          messages: 'array (required) - Messages array',
          seed: 'number (optional) - Random seed for deterministic results'
        }
      },
      metrics: {
        method: 'GET',
        path: '/api/metrics',
        description: 'Get system metrics and performance data',
        auth: false,
        rateLimit: true
      },
      docs: {
        method: 'GET',
        path: '/api/docs',
        description: 'API documentation (this endpoint)',
        auth: false,
        rateLimit: false
      }
    },
    rateLimit: {
      window: '15 minutes',
      maxRequests: 100,
      message: 'Rate limit: 100 requests per 15 minutes'
    },
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins
    }
  });
});

// Helper function to format uptime
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: {
      health: 'GET /health',
      status: 'GET /api/status',
      validate: 'POST /api/validate',
      claude: 'POST /api/claude/messages',
      metrics: 'GET /api/metrics',
      docs: 'GET /api/docs'
    }
  });
});

// Error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 SolidAudit Backend Server');
  console.log('================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ API endpoint: http://localhost:${PORT}/api/claude/messages`);
  console.log(`✅ CORS enabled for: ${allowedOrigins.join(', ')}`);
  console.log('================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
