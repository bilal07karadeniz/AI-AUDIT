# SolidAudit Backend Server

Backend API server for SolidAudit that securely handles Claude AI API integration.

## Features

- ✅ Secure Claude API integration
- ✅ API key protection (never exposed to frontend)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Request validation
- ✅ Error handling
- ✅ Health check endpoint
- ✅ Request logging

## Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Anthropic API key:
```env
ANTHROPIC_API_KEY=your_actual_api_key_here
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

## Running the Server

### Development Mode (with auto-reload):
```bash
npm run dev
```

### Production Mode:
```bash
# Build TypeScript
npm run build

# Start server
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and uptime.

### Claude API Proxy
```
POST /api/claude/messages
```

**Request Body:**
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
  "content": [
    {
      "text": "Claude's response here"
    }
  ],
  "id": "msg_...",
  "model": "claude-opus-4-1-20250805",
  "role": "assistant",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 100,
    "output_tokens": 200
  }
}
```

## Security Features

1. **API Key Protection**: API key stored securely in environment variables, never exposed to frontend
2. **Rate Limiting**: Default 100 requests per 15 minutes per IP
3. **CORS**: Only configured origins can access the API
4. **Helmet**: Security headers enabled
5. **Request Validation**: All requests validated before processing

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | **Required** |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | localhost:5173,localhost:4173 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Error Handling

The server handles various error scenarios:

- **400**: Invalid request format
- **401**: API authentication failed (check your API key)
- **429**: Rate limit exceeded
- **500**: Internal server error
- **529**: Claude API overloaded

## Monitoring

View server logs for:
- Request timestamps and paths
- Claude API response times
- Errors and warnings
- Rate limit violations

## Development

### Type Checking
```bash
npm run type-check
```

### Building
```bash
npm run build
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Build the TypeScript: `npm run build`
3. Start with a process manager like PM2:
   ```bash
   pm2 start dist/index.js --name solid-audit-api
   ```

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"
- Make sure you created a `.env` file
- Verify the API key is set correctly
- Check there are no quotes around the API key

### "Not allowed by CORS"
- Add your frontend URL to `ALLOWED_ORIGINS` in `.env`
- Multiple origins should be comma-separated

### Rate Limit Issues
- Adjust `RATE_LIMIT_MAX_REQUESTS` if needed
- Consider implementing user-based rate limiting for production

## License

MIT
