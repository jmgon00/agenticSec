# Agents Gallery API Documentation

Complete reference for the Agents Gallery API endpoints, parameters, and deployment instructions.

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents with optional filtering |
| GET | `/api/agents/[agent-id]` | Get agent details + user's last session |
| POST | `/api/agents/[agent-id]/run` | Execute agent with user query |
| GET | `/api/agents/[agent-id]/history` | Get user's past sessions for an agent |

---

## Endpoint Specifications

### GET /api/agents
**List all available agents with optional filtering**

**Query Parameters:**
- `category` (optional, string): Filter by agent type
  - Values: `"educativo"`, `"productivo"`, `"all"`
  - Default: `"all"`
- `search` (optional, string): Substring search in agent name and description
  - Example: `?search=vuln` returns agents matching "vulnerability"

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "name": "Analizador de Vulnerabilidades",
      "slug": "vuln-analyzer",
      "description": "Identifica vulnerabilidades en código fuente",
      "category": "educativo",
      "type": "chat",
      "icon": "🔍"
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Invalid category value
- `500 Internal Server Error`: Database or server error

**Example Requests:**
```bash
# Get all agents
curl http://localhost:3000/api/agents

# Get educativo agents only
curl "http://localhost:3000/api/agents?category=educativo"

# Search by name
curl "http://localhost:3000/api/agents?search=vuln"

# Combine filters
curl "http://localhost:3000/api/agents?category=productivo&search=report"
```

---

### GET /api/agents/[agent-id]
**Get agent details + user's last session (if email provided)**

**Path Parameters:**
- `agent-id` (string, required): Agent ID or slug
  - Examples: `cuid...` or `vuln-analyzer`

**Headers:**
- `X-User-Email` (optional, string): User's email to retrieve their last session with this agent

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "agent": {
      "id": "cuid...",
      "name": "Analizador de Vulnerabilidades",
      "slug": "vuln-analyzer",
      "description": "Identifica vulnerabilidades en código fuente",
      "fullDescription": "Agente educativo que enseña sobre vulnerabilidades de seguridad...",
      "category": "educativo",
      "type": "chat",
      "icon": "🔍",
      "instructions": "Eres un experto en seguridad de aplicaciones...",
      "maxTokens": 1500,
      "temperature": 0.7,
      "createdAt": "2026-07-08T00:00:00Z",
      "updatedAt": "2026-07-08T00:00:00Z"
    },
    "userSession": {
      "id": "cuid...",
      "userEmail": "user@example.com",
      "agentId": "cuid...",
      "title": "¿Qué es una inyección SQL?...",
      "messages": [
        {
          "role": "user",
          "content": "¿Qué es una inyección SQL?",
          "timestamp": "2026-07-08T12:00:00Z",
          "tokens": 0
        },
        {
          "role": "assistant",
          "content": "La inyección SQL es una técnica de ataque...",
          "timestamp": "2026-07-08T12:00:05Z",
          "tokens": 342
        }
      ],
      "totalMessages": 2,
      "totalTokens": 342,
      "createdAt": "2026-07-08T12:00:00Z",
      "updatedAt": "2026-07-08T12:00:05Z"
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: Agent not found
- `500 Internal Server Error`: Database or server error

**Example Requests:**
```bash
# Get agent by ID
curl http://localhost:3000/api/agents/cuid123abc

# Get agent by slug
curl http://localhost:3000/api/agents/vuln-analyzer

# Get agent + user's last session
curl -H "X-User-Email: user@example.com" \
  http://localhost:3000/api/agents/vuln-analyzer
```

---

### POST /api/agents/[agent-id]/run
**Execute agent with user query and save conversation history**

**Path Parameters:**
- `agent-id` (string, required): Agent ID or slug

**Headers:**
- `X-User-Email` (optional, string): For logging/tracking
- `Content-Type: application/json` (required)

**Request Body:**
```json
{
  "userEmail": "user@example.com",
  "query": "¿Qué es una inyección SQL?",
  "sessionId": null
}
```

**Body Parameters:**
- `userEmail` (string, required): User's email for conversation tracking
- `query` (string, required): User's question or request
  - Max length: 5000 characters
- `sessionId` (string, optional): Existing session ID to append to conversation
  - If null/omitted: creates new session
  - If provided: appends to existing session

**Response (200 OK):**
```json
{
  "success": true,
  "response": "La inyección SQL es una técnica de ataque donde un atacante inserta código SQL malicioso...",
  "sessionId": "cuid...",
  "tokens": 342,
  "timestamp": "2026-07-08T12:00:05Z"
}
```

**Rate Limiting:**
- Limit: 10 queries per 15 minutes per user (by email)
- Returns 429 when limit exceeded

**Error Responses:**
- `400 Bad Request`:
  - Missing `userEmail` or `query`
  - Query exceeds 5000 characters
  - Invalid session ID format
- `404 Not Found`: Agent not found
- `429 Too Many Requests`: Rate limit exceeded (10/15min per user)
- `500 Internal Server Error`: Claude API error or database error

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/agents/vuln-analyzer/run \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "user@example.com",
    "query": "¿Qué es una inyección SQL y cómo prevenirla?",
    "sessionId": null
  }'
```

**Claude Integration:**
- Model: `claude-3-5-sonnet-20241022`
- Max tokens: Configured per agent (default 1000)
- Temperature: Configured per agent (default 0.7)
- System prompt: Agent's custom instructions
- Context: Conversation history from session

---

### GET /api/agents/[agent-id]/history
**Get user's past sessions for a specific agent**

**Path Parameters:**
- `agent-id` (string, required): Agent ID or slug

**Query Parameters:**
- `userEmail` (string, required): User's email

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "cuid...",
      "title": "¿Qué es una inyección SQL?...",
      "createdAt": "2026-07-08T12:00:00Z",
      "messageCount": 4,
      "lastMessage": "¿Cómo puedo implementar parametrized queries?"
    },
    {
      "id": "cuid...",
      "title": "Buffer overflow en aplicaciones...",
      "createdAt": "2026-07-08T11:30:00Z",
      "messageCount": 2,
      "lastMessage": "Excelente explicación, muchas gracias."
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Missing `userEmail` query parameter
- `500 Internal Server Error`: Database error

**Example Request:**
```bash
curl "http://localhost:3000/api/agents/vuln-analyzer/history?userEmail=user@example.com"
```

---

## Request/Response Bodies

### Common Request Body Structure (POST /api/agents/[id]/run)

```typescript
interface AgentExecutionRequest {
  userEmail: string;      // User identifier, stored in sessions
  query: string;          // User message, max 5000 chars
  sessionId?: string;     // If provided, continues existing conversation
}
```

### Common Response Structure (Success)

```typescript
interface SuccessResponse<T> {
  success: true;
  data?: T;
  response?: string;      // For agent execution
  sessionId?: string;     // For agent execution
  tokens?: number;        // For agent execution
  timestamp?: string;     // ISO 8601, for agent execution
}
```

### Common Response Structure (Error)

```typescript
interface ErrorResponse {
  success: false;
  error: string;          // Human-readable error message
}
```

---

## Environment Variables

### Required for Development

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=file:./prisma/dev.db
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Required for Production (Vercel)

```bash
# Vercel Environment Variables > Settings > Environment Variables
ANTHROPIC_API_KEY=sk-ant-...                    # From console.anthropic.com
DATABASE_URL=postgresql://user:pass@host/db    # Neon PostgreSQL connection string
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

### Optional Configuration

```bash
# Rate limiting (optional, already defaults)
RATE_LIMIT_WINDOW_MS=900000        # 15 minutes
RATE_LIMIT_MAX_REQUESTS=10         # Per window per user

# Security
API_KEY=dev-api-key-...            # For internal use only
```

---

## Testing Locally

### Prerequisites
```bash
# Node 18+ required
node --version

# Install dependencies
npm install

# Set up environment
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
echo "DATABASE_URL=file:./prisma/dev.db" >> .env.local
```

### 1. Start Development Server
```bash
npm run dev
# Server running on http://localhost:3000
```

### 2. Test Gallery Page
```bash
# Open browser: http://localhost:3000/agents
# Expected:
# - Email modal appears
# - Enter valid email address
# - Gallery shows 3 agents (Vulnerability Analyzer, Report Generator, XSS Learner)
# - Filter by category works
# - Search works
```

### 3. Test Agent Detail Page
```bash
# Click on any agent card
# Expected:
# - Page loads with agent details
# - Chat interface visible
# - Message input field ready
```

### 4. Test Agent Execution
```bash
# Send message in chat
# Example: "¿Qué es una inyección SQL?"
# Expected:
# - Message appears in chat (user side)
# - Loading indicator shows
# - Claude response appears (assistant side)
# - Total time < 10 seconds
```

### 5. Test Message Persistence
```bash
# Send 2-3 messages
# Refresh page
# Expected:
# - Messages still visible
# - Session ID same
# - Conversation continues if you send more
```

### 6. Test API Directly with curl

```bash
# List agents
curl http://localhost:3000/api/agents | jq

# Get agent by slug
curl http://localhost:3000/api/agents/vuln-analyzer | jq

# Execute agent
curl -X POST http://localhost:3000/api/agents/vuln-analyzer/run \
  -H "Content-Type: application/json" \
  -d '{
    "userEmail": "test@example.com",
    "query": "¿Qué es XSS?"
  }' | jq

# Check history
curl "http://localhost:3000/api/agents/vuln-analyzer/history?userEmail=test@example.com" | jq
```

### 7. Test Rate Limiting
```bash
# Send 11 queries rapidly from same email
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/agents/vuln-analyzer/run \
    -H "Content-Type: application/json" \
    -d "{\"userEmail\": \"test@example.com\", \"query\": \"Question $i?\"}"
  echo ""
done

# Expected: 11th returns 429 Too Many Requests
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] **Code Quality**
  - [ ] No TypeScript errors: `npx tsc --noEmit`
  - [ ] No console errors: Check browser DevTools
  - [ ] Tests pass (if applicable)

- [ ] **Environment Variables**
  - [ ] `ANTHROPIC_API_KEY` set (get from console.anthropic.com)
  - [ ] `DATABASE_URL` points to Neon PostgreSQL (production)
  - [ ] `NEXT_PUBLIC_SITE_URL` set to production domain

- [ ] **Build**
  - [ ] Production build succeeds: `npm run build`
  - [ ] No build warnings
  - [ ] Start production server: `npm run start`

- [ ] **Database**
  - [ ] Prisma migrations up to date: `npx prisma migrate deploy`
  - [ ] Agent seeds in database: `npx prisma db seed`
  - [ ] Can connect to Neon: `npx prisma studio`

### Deployment Steps

1. **Set Environment Variables in Vercel**
   - Go to Vercel project settings
   - Add `ANTHROPIC_API_KEY` and `DATABASE_URL`
   - Redeploy

2. **Push to GitHub**
   ```bash
   git push origin main
   ```

3. **Vercel Auto-Deploy**
   - Vercel detects push
   - Runs build and deploy
   - Production live in 2-3 minutes

4. **Verify Production**
   - Visit `https://yourdomain.com/agents`
   - Test email modal
   - Test agent gallery
   - Test chat flow
   - Check console for errors

5. **Monitor**
   - Check Vercel logs
   - Monitor API response times
   - Track rate limiting hits
   - Review database usage (Neon)

### Rollback

If issues arise:
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Vercel auto-redeploys previous version
# Usually live in 2-3 minutes
```

---

## Performance Considerations

### Response Times

- **GET /api/agents**: < 100ms (no database query optimization needed)
- **GET /api/agents/[id]**: < 100ms (indexed queries)
- **POST /api/agents/[id]/run**: 5-15s (Claude API latency)
- **GET /api/agents/[id]/history**: < 200ms (indexed queries)

### Optimization Tips

1. **Client-side Caching**
   - Cache agents list (1 hour TTL)
   - Use SWR for real-time updates

2. **Server-side Optimization**
   - Database indexes on `slug`, `category`, `userEmail`, `createdAt` (already set)
   - Consider Redis for rate limiting in high-traffic scenarios

3. **Claude API**
   - Use streaming for longer responses (future enhancement)
   - Consider caching common agent instructions

---

## Troubleshooting

### "ANTHROPIC_API_KEY not set"
- Check `.env.local` has `ANTHROPIC_API_KEY=sk-ant-...`
- Get key from [console.anthropic.com](https://console.anthropic.com)
- Restart dev server after adding key

### "Rate limit exceeded (429)"
- Wait 15 minutes for window to reset
- Different email = different limit bucket

### "Agent not found (404)"
- Verify agent slug exists: `curl http://localhost:3000/api/agents`
- Use slug (kebab-case) not name

### "Database connection failed"
- Check `DATABASE_URL` points to valid database
- For local dev: ensure `prisma/dev.db` accessible
- For production: verify Neon PostgreSQL credentials

### "Claude response times too slow"
- Normal: 5-15 seconds per query
- Check Claude API status: [status.anthropic.com](https://status.anthropic.com)
- Consider streaming responses (v1.1 enhancement)

---

## Future Enhancements (v1.1)

- [ ] Agent streaming responses (for longer outputs)
- [ ] Form-based agents (currently chat-only working)
- [ ] Conversation export (PDF, markdown)
- [ ] Multi-model support (Opus, Haiku variants)
- [ ] Advanced rate limiting with Redis
- [ ] Analytics dashboard (usage, tokens, popular agents)
- [ ] Custom agent creation UI
- [ ] Session sharing/collaboration

---

## API Version & Support

**Current Version:** 1.0  
**Last Updated:** 2026-07-08  
**Status:** Production Ready  
**Support:** Check GitHub issues or contact support  

---
