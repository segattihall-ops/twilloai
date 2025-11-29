# MasseurMatch Realtime API Server

This WebSocket server bridges Twilio Media Streams with OpenAI's Realtime API, using the stored prompt ID: `pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255`

## Features

- 🎤 **Real-time voice conversations** with 50-150ms latency
- 🤖 **OpenAI Realtime API** integration with stored prompt reference
- 📞 **Twilio Media Streams** for audio streaming
- 💾 **Automatic Supabase** waitlist saving via function calling
- 🔄 **Bidirectional audio** streaming (Twilio ↔ OpenAI)

## Architecture

```
Caller → Twilio Phone Number
          ↓
      Media Stream (WebSocket)
          ↓
      This Server (Node.js + WebSocket)
          ↓
      OpenAI Realtime API
          ↓
      Response with prompt: pmpt_692a9f2f6e148195850e91132c55366005098e88b3968255
          ↓
      Auto-save to Supabase
```

## Deployment Options

### Option 1: Railway (Recommended)

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Initialize project**:
   ```bash
   cd server
   railway init
   ```

3. **Set environment variables**:
   ```bash
   railway variables set OPENAI_API_KEY=sk-proj-...
   railway variables set NEXT_PUBLIC_SUPABASE_URL=https://...
   railway variables set SUPABASE_SERVICE_ROLE_KEY=...
   ```

4. **Deploy**:
   ```bash
   railway up
   ```

5. **Get WebSocket URL**:
   ```bash
   railway domain
   # Example: wss://masseurmatch-realtime.up.railway.app
   ```

### Option 2: Render

1. **Connect GitHub repo** at https://render.com

2. **Create New Web Service**:
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`

3. **Add environment variables** in Render dashboard

4. **Deploy** and get WebSocket URL

### Option 3: Fly.io

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   fly auth login
   ```

2. **Create app**:
   ```bash
   cd server
   fly launch --no-deploy
   ```

3. **Set secrets**:
   ```bash
   fly secrets set OPENAI_API_KEY=sk-proj-...
   fly secrets set NEXT_PUBLIC_SUPABASE_URL=https://...
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=...
   ```

4. **Deploy**:
   ```bash
   fly deploy
   ```

### Option 4: Docker (Self-Hosted)

```bash
cd server
docker build -t masseurmatch-realtime .
docker run -p 8080:8080 \
  -e OPENAI_API_KEY=sk-proj-... \
  -e NEXT_PUBLIC_SUPABASE_URL=https://... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  masseurmatch-realtime
```

## Local Development

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Create `.env` file**:
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Run server**:
   ```bash
   npm start
   ```

4. **Test with ngrok**:
   ```bash
   ngrok http 8080
   # Use the WebSocket URL in Twilio
   ```

## Connecting Twilio

After deploying the server, update your Twilio webhook:

### Update Voice Route

In your Next.js app, create a new route that starts a Media Stream:

```typescript
// app/api/voice/realtime/route.ts
import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST() {
  const twiml = new twilio.twiml.VoiceResponse();

  const connect = twiml.connect();
  connect.stream({
    url: 'wss://your-server.railway.app' // Your deployed WebSocket URL
  });

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}
```

### Update Menu Handler

```typescript
case "1":
  // AI Waitlist Assistant (Realtime API)
  twiml.say("Welcome! Let me connect you to our AI assistant.");
  twiml.redirect("/api/voice/realtime");
  break;
```

## Environment Variables

Required environment variables:

```env
# OpenAI Realtime API
OPENAI_API_KEY=sk-proj-your-openai-api-key

# Supabase (for waitlist storage)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Port (optional, defaults to 8080)
PORT=8080
```

## Monitoring

### Health Check

The server exposes a health check endpoint:

```bash
curl http://your-server:8081/health
```

Response:
```json
{
  "status": "healthy",
  "sessions": 2
}
```

### Logs

The server logs important events:
- 📞 New connections
- 🎬 Stream start/stop
- ✅ OpenAI connection status
- 💾 Waitlist saves
- 🔌 Disconnections
- ❌ Errors

## Troubleshooting

### Connection Issues

1. **Check WebSocket URL**: Ensure it starts with `wss://` (secure WebSocket)
2. **Verify environment variables**: All three required vars must be set
3. **Check OpenAI API key**: Must have Realtime API access
4. **Review logs**: Check deployment platform logs for errors

### Audio Issues

1. **Check Twilio format**: Server uses `g711_ulaw` audio format
2. **Verify OpenAI voice**: Currently set to `alloy`
3. **Test Media Stream**: Ensure Twilio can connect to your WebSocket

### Function Calling Issues

1. **Check Supabase table**: Must have `waitlist` table
2. **Verify RLS policies**: Service role must have INSERT permission
3. **Review function schema**: Must match expected parameters

## Cost Considerations

### OpenAI Realtime API Pricing
- **Input audio**: ~$0.06/minute
- **Output audio**: ~$0.06/minute
- **Average 3-minute signup**: ~$0.36

### Twilio Costs
- **Inbound call**: ~$0.0085/minute
- **Media Streams**: No additional cost
- **Average 3-minute call**: ~$0.03

### Total per signup: ~$0.40

## Benefits vs Chat Completions

| Feature | Chat Completions | Realtime API |
|---------|-----------------|--------------|
| Latency | 200-500ms | 50-150ms |
| Natural flow | Good | Excellent |
| Interruptions | No | Yes |
| Prompt reference | No | ✅ Yes (by ID) |
| Cost per call | ~$0.15 | ~$0.40 |
| Deployment | Serverless | Dedicated server |

## Next Steps

1. ✅ Deploy server to Railway/Render
2. ✅ Get WebSocket URL
3. ✅ Create `/api/voice/realtime` route
4. ✅ Update Twilio menu to use new route
5. ✅ Test end-to-end flow
6. ✅ Monitor logs and sessions

## Support

For issues or questions:
- Check server logs on your deployment platform
- Review Twilio debugger for Media Stream issues
- Verify OpenAI API key has Realtime access
- Test with health check endpoint
