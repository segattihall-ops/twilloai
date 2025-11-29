# MasseurMatch AI Waitlist System - Architecture

## System Overview

The MasseurMatch AI waitlist system uses OpenAI's Realtime API to provide natural, low-latency voice conversations for collecting early access signups via phone calls.

## Architecture Diagram

```
┌─────────────┐
│   Caller    │
└──────┬──────┘
       │ Phone Call
       ▼
┌─────────────────────┐
│   Twilio Voice      │
│  (IVR + Routing)    │
└──────┬──────────────┘
       │ HTTP Webhook
       ▼
┌─────────────────────────────────────┐
│   Vercel (Next.js)                  │
│                                     │
│   Routes:                           │
│   • /api/voice          (IVR menu) │
│   • /api/voice/menu     (routing)  │
│   • /api/voice/realtime (stream)   │
│   • /api/waitlist       (REST)     │
└──────┬──────────────────────────────┘
       │ WebSocket Media Stream
       ▼
┌─────────────────────────────────────┐
│   Render (WebSocket Server)         │
│                                     │
│   server/realtime.js                │
│   • Receives Twilio audio (g711)   │
│   • Forwards to OpenAI Realtime    │
│   • Manages bidirectional stream   │
│   • Handles function calls         │
└──────┬──────────────────────────────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   OpenAI     │  │   Supabase   │  │    Twilio    │
│  Realtime    │  │   Database   │  │  SMS (opt.)  │
│     API      │  │              │  │              │
│              │  │  waitlist    │  │              │
│ Prompt ID:   │  │    table     │  │              │
│ pmpt_692a... │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Component Details

### 1. Twilio Voice
**Purpose**: Telephony infrastructure
**Responsibilities**:
- Receives incoming phone calls
- Routes to Vercel webhooks
- Provides IVR (Interactive Voice Response)
- Streams audio via Media Streams

**Configuration**:
```
Phone Number: +1-XXX-XXX-XXXX
Voice Webhook: https://your-app.vercel.app/api/voice
Method: POST
```

### 2. Vercel Next.js Application
**Purpose**: API routing and business logic
**Hosting**: Vercel (serverless)
**Runtime**: Node.js 18+

**API Routes**:

#### `/api/voice` (Entry Point)
- Plays IVR greeting
- Presents menu options:
  1. Join waitlist (AI assistant)
  2. Speak with team (transfer)
  3. Leave voicemail

#### `/api/voice/menu` (Menu Handler)
- Routes based on digit pressed
- Option 1 → `/api/voice/realtime` (WebSocket)
- Option 2 → `/api/voice/transfer`
- Option 3 → `/api/voice/voicemail`

#### `/api/voice/realtime` (WebSocket Connector)
- Initiates Twilio Media Stream
- Connects to Render WebSocket server
- Falls back to Chat Completions if WebSocket unavailable

#### `/api/waitlist` (REST API)
- Direct waitlist submissions
- Used by function calls from AI
- Validates and saves to Supabase

**Environment Variables**:
```bash
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
OPENAI_API_KEY=sk-proj-xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
REALTIME_WEBSOCKET_URL=wss://masseurmatch-realtime.onrender.com
```

### 3. Render WebSocket Server
**Purpose**: Persistent WebSocket proxy
**File**: `server/realtime.js`
**Hosting**: Render.com
**Runtime**: Node.js 18+

**Responsibilities**:
1. **Receive Twilio Media Streams**: Accept WebSocket connections from Twilio
2. **Connect to OpenAI**: Establish WebSocket with OpenAI Realtime API
3. **Audio Forwarding**: Bidirectional audio streaming (g711_ulaw format)
4. **Function Handling**: Execute `save_waitlist_entry` function calls
5. **Transcript Logging**: Log user and assistant messages for debugging

**Key Implementation**:
```javascript
// Session configuration with prompt reference
const sessionConfig = {
  type: "session.update",
  session: {
    modalities: ["text", "audio"],
    voice: "alloy",
    input_audio_format: "g711_ulaw",
    output_audio_format: "g711_ulaw",
    input_audio_transcription: { model: "whisper-1" },
    turn_detection: {
      type: "server_vad",
      threshold: 0.5,
      silence_duration_ms: 500
    },
    tools: [
      {
        type: "function",
        name: "save_waitlist_entry",
        description: "Save to MasseurMatch waitlist",
        parameters: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            role: { type: "string", enum: ["therapist", "client"] }
          },
          required: ["full_name", "phone", "email", "role"]
        }
      }
    ],
    prompt: {
      id: "pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255",
      version: "1"
    }
  }
};
```

**Dependencies**:
- `ws`: WebSocket client/server
- `@supabase/supabase-js`: Database client
- `node-fetch`: HTTP requests (if needed)

**Environment Variables**:
```bash
OPENAI_API_KEY=sk-proj-xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
PORT=8080
NODE_ENV=production
```

### 4. OpenAI Realtime API
**Purpose**: Conversational AI with voice
**Endpoint**: `wss://api.openai.com/v1/realtime`
**Model**: `gpt-4o-realtime-preview-2024-10-01`

**Prompt Configuration**:
- **Prompt ID**: `pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255`
- **Personality**: Knotty (warm, professional, concierge-like)
- **Purpose**: Collect waitlist signups only
- **Required Fields**: full_name, phone, email, role

**Audio Specifications**:
- **Input Format**: g711_ulaw (8kHz, 8-bit)
- **Output Format**: g711_ulaw (8kHz, 8-bit)
- **Voice**: Alloy
- **Transcription**: Whisper-1

**Turn Detection**:
- **Type**: Server VAD (Voice Activity Detection)
- **Threshold**: 0.5
- **Silence Duration**: 500ms

### 5. Supabase Database
**Purpose**: Persistent storage
**Table**: `waitlist`

**Schema**:
```sql
CREATE TABLE waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('therapist', 'client')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at DESC);
CREATE INDEX idx_waitlist_role ON waitlist(role);
```

**Access**:
- Service role key (write access from server)
- Anon key (read access from client, if needed)

## Data Flow

### Successful Waitlist Signup

1. **User calls Twilio number**
   ```
   Caller → Twilio
   ```

2. **Twilio sends webhook to Vercel**
   ```
   POST /api/voice
   Response: TwiML with IVR menu
   ```

3. **User presses 1 for waitlist**
   ```
   POST /api/voice/menu?Digits=1
   Response: TwiML connecting to Media Stream
   ```

4. **Media Stream connects to Render**
   ```
   WebSocket: Twilio ↔ Render
   Event: 'start' with streamSid and callSid
   ```

5. **Render connects to OpenAI**
   ```
   WebSocket: Render ↔ OpenAI Realtime API
   Send: session.update with prompt ID
   ```

6. **Audio bidirectional streaming**
   ```
   User speaks → Twilio → Render → OpenAI → Transcription
   OpenAI generates response → Audio → Render → Twilio → User
   ```

7. **AI collects information**
   ```
   Conversation turns collecting:
   - Full name
   - Phone number
   - Email address
   - Role (therapist or client)
   ```

8. **Function call triggered**
   ```
   OpenAI: response.function_call_arguments.done
   Function: save_waitlist_entry
   Arguments: { full_name, phone, email, role }
   ```

9. **Save to Supabase**
   ```
   Render → Supabase API
   INSERT INTO waitlist VALUES (...)
   ```

10. **Confirmation to user**
    ```
    OpenAI: "Great! You're all set..."
    Audio → Render → Twilio → User
    ```

11. **Call ends**
    ```
    Event: 'stop'
    Cleanup: Close OpenAI WebSocket, remove session
    ```

## Latency Profile

| Segment | Latency | Notes |
|---------|---------|-------|
| Twilio → Vercel | 50-100ms | Regional edge routing |
| Vercel → Render | 20-50ms | Both in US region |
| Render → OpenAI | 50-150ms | OpenAI Realtime API |
| **Total Round-Trip** | **120-300ms** | Conversational quality |

Compare to Chat Completions API: 200-500ms (text processing overhead)

## Error Handling

### WebSocket Server Unavailable
```
Fallback: Redirect to /api/voice/ai-assistant
Method: Chat Completions API (higher latency but stable)
```

### OpenAI Connection Failed
```
Retry: Attempt reconnection
Fallback: TwiML error message + hangup
Logging: Full error details to Render logs
```

### Supabase Write Failed
```
Action: Return error to OpenAI function
Response: AI apologizes and asks to try again
Logging: Error details for debugging
```

### Invalid Input
```
Validation: AI asks for clarification
Example: Invalid email format → "Could you repeat that email?"
```

## Security

### API Keys
- All keys stored in environment variables
- Never committed to git
- Separate keys for dev/staging/production

### WebSocket Authentication
- OpenAI: Bearer token in WebSocket headers
- Twilio: Validated via signature (if implemented)

### Database Access
- Service role key used server-side only
- Row-level security policies (if needed)

### HTTPS/WSS
- All connections encrypted (TLS 1.2+)
- Vercel: Automatic HTTPS
- Render: Automatic WSS

## Monitoring

### Render Logs
Monitor for:
```
✅ Connected to OpenAI Realtime API
👤 User: [transcript]
🤖 Assistant: [transcript]
💾 Saving to waitlist
✅ Successfully saved to waitlist
❌ Errors (if any)
```

### Vercel Logs
Monitor for:
```
POST /api/voice 200
POST /api/voice/menu 200
POST /api/voice/realtime 200
```

### Supabase Dashboard
- Table row count (waitlist growth)
- Recent inserts
- Query performance

### Twilio Console
- Call volume
- Call duration
- Error rates
- Media stream connections

## Cost Analysis

### Per Call (3-minute average)

| Service | Cost | Details |
|---------|------|---------|
| Twilio Inbound | $0.0085/min | $0.026 per call |
| OpenAI Realtime Input | $0.06/min | $0.18 per call |
| OpenAI Realtime Output | $0.24/min | $0.72 per call |
| Render (Starter) | $7/month | ~$0.002 per call @ 100/day |
| Vercel (Hobby) | Free | Included |
| Supabase (Free) | Free | Included |
| **Total** | **~$0.93** | Per 3-minute call |

### Monthly Estimates

| Volume | Twilio | OpenAI | Render | Total |
|--------|--------|--------|--------|-------|
| 100 calls | $7.80 | $90 | $7 | $104.80 |
| 500 calls | $39 | $450 | $7 | $496 |
| 1000 calls | $78 | $900 | $7 | $985 |

### Optimization Ideas
1. Optimize conversation length (reduce to 2 minutes)
2. Use prompt engineering to reduce output verbosity
3. Implement call abandonment detection
4. Consider hybrid approach (Realtime for initial greeting, Chat for collection)

## Scaling Considerations

### Current Setup (Good for 0-1000 calls/month)
- Render: Starter plan (single instance)
- Vercel: Hobby plan
- Supabase: Free tier

### Medium Scale (1000-10,000 calls/month)
- Render: Professional plan (autoscaling)
- Vercel: Pro plan
- Supabase: Pro tier ($25/month)
- Consider: Load balancing, connection pooling

### High Scale (10,000+ calls/month)
- Multi-region deployment
- Dedicated OpenAI instances
- Database read replicas
- CDN for static assets
- Monitoring: DataDog, New Relic

## Future Enhancements

1. **SMS Confirmation**: Send confirmation text after signup
2. **Email Confirmation**: Send welcome email with details
3. **Admin Dashboard**: View and manage waitlist entries
4. **Analytics**: Call volume, conversion rates, transcript analysis
5. **A/B Testing**: Test different prompts and voices
6. **Multi-language**: Support Spanish, French, etc.
7. **Sentiment Analysis**: Detect user satisfaction
8. **Call Recording**: Save calls for training (with consent)

## Development Workflow

### Local Development
```bash
# Terminal 1: Next.js app
npm run dev

# Terminal 2: WebSocket server
cd server
npm run dev

# Terminal 3: Ngrok for Twilio webhook
ngrok http 3000
```

### Testing
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

### Deployment
```bash
# Push to GitHub
git push origin main

# Vercel deploys automatically
# Render deploys automatically (if configured)

# Verify deployment
curl https://your-app.vercel.app/api/health
wscat -c wss://your-service.onrender.com
```

## Documentation

- [README.md](README.md) - Project overview
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Complete deployment guide
- [server/RENDER_DEPLOY.md](server/RENDER_DEPLOY.md) - Render quick deploy
- [REALTIME_API.md](REALTIME_API.md) - OpenAI Realtime API notes
- [ARCHITECTURE.md](ARCHITECTURE.md) - This file

## Support

For issues or questions:
1. Check logs in Render and Vercel
2. Review Twilio debugger console
3. Test components individually
4. Consult official documentation
